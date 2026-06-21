import { prisma } from './db';
import { riot, getGlobalLp } from './riot';

// Helper to delay between API requests to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function syncPlayer(playerId: string): Promise<void> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new Error(`Player with ID ${playerId} not found in database.`);
  }

  console.log(`Syncing player: ${player.gameName}#${player.tagLine}`);

  // 1. Fetch latest Riot Account and Summoner info to update gameName, tagLine and profileIconId
  let summonerId = player.summonerId;
  let profileIconId = player.profileIconId;
  let gameName = player.gameName;
  let tagLine = player.tagLine;

  try {
    const account = await riot.getAccountByPuuid(player.puuid);
    gameName = account.gameName;
    tagLine = account.tagLine;
    await delay(200);
  } catch (err) {
    console.error(`Failed to fetch account info for player ${player.gameName}:`, err);
  }

  try {
    const summoner = await riot.getSummonerByPuuid(player.puuid);
    summonerId = summoner.id || player.summonerId || null;
    profileIconId = summoner.profileIconId;
    await delay(200); // polite delay
  } catch (err) {
    console.error(`Failed to fetch summoner info for player ${player.gameName}:`, err);
  }

  // 2. Fetch current League rank by PUUID
  const leagueEntries = await riot.getLeagueEntries(player.puuid);
  await delay(200);

  const soloQEntry = leagueEntries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');

  let tier = 'UNRANKED';
  let rank = '';
  let lp = 0;
  let wins = 0;
  let losses = 0;

  if (soloQEntry) {
    tier = soloQEntry.tier;
    rank = soloQEntry.rank;
    lp = soloQEntry.leaguePoints;
    wins = soloQEntry.wins;
    losses = soloQEntry.losses;
  }

  const currentGlobalLp = getGlobalLp(tier, rank, lp);

  // If this is the first sync, set starting stats
  let startTier = player.startTier;
  let startRank = player.startRank;
  let startLp = player.startLp;

  if (player.startTier === 'UNRANKED' && tier !== 'UNRANKED') {
    startTier = tier;
    startRank = rank;
    startLp = lp;
  }

  // Sync main account rank if configured
  let mainTier = player.mainTier;
  let mainRank = player.mainRank;
  let mainLp = player.mainLp;

  if (player.mainGameName && player.mainTagLine) {
    try {
      const mainAccount = await riot.getAccountByRiotId(player.mainGameName, player.mainTagLine);
      await delay(200);
      const mainLeagueEntries = await riot.getLeagueEntries(mainAccount.puuid);
      await delay(200);
      const mainSoloQ = mainLeagueEntries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
      if (mainSoloQ) {
        mainTier = mainSoloQ.tier;
        mainRank = mainSoloQ.rank;
        mainLp = mainSoloQ.leaguePoints;
      } else {
        mainTier = 'UNRANKED';
        mainRank = '';
        mainLp = 0;
      }
    } catch (err) {
      console.error(`Failed to sync main account for player ${player.gameName}:`, err);
    }
  }

  // 3. Sync recent matches (last 150 games)
  // If the player already has matches in the DB, we only fetch the last 20 to find new ones.
  // Otherwise, we fetch 150 to populate their initial history.
  const existingMatchesCount = await prisma.match.count({
    where: { playerId: player.id },
  });
  const fetchLimit = existingMatchesCount > 0 ? 20 : 150;
  const matchIds = await riot.getMatchIds(player.puuid, fetchLimit);
  await delay(200);

  // Check which matches we already have saved
  const existingMatches = await prisma.match.findMany({
    where: {
      playerId: player.id,
      matchId: { in: matchIds },
    },
    select: { matchId: true },
  });

  const existingMatchIds = new Set(existingMatches.map(m => m.matchId));
  const newMatchIds = matchIds.filter(id => !existingMatchIds.has(id));

  console.log(`Found ${newMatchIds.length} new matches to fetch for ${player.gameName}`);

  // Fetch and save details for new matches
  for (const matchId of newMatchIds) {
    try {
      const matchData = await riot.getMatchDetails(matchId);
      await delay(250); // rate limiting safety buffer

      const participant = matchData.info.participants.find(
        (p: any) => p.puuid === player.puuid
      );

      if (participant) {
        const queueId = matchData.info.queueId;
        const allowedQueues = [420, 440];
        const minStartDate = new Date('2026-06-07T00:00:00+02:00').getTime();
        const maxEndDate = new Date('2026-07-07T23:59:59+02:00').getTime();
        const gameCreationTime = matchData.info.gameCreation;
        
        if (allowedQueues.includes(queueId) && gameCreationTime >= minStartDate && gameCreationTime <= maxEndDate) {
          const isRemake = !!(participant.gameEndedInEarlySurrender || matchData.info.gameDuration < 240);
          await prisma.match.create({
            data: {
              matchId,
              playerId: player.id,
              championId: participant.championId,
              championName: participant.championName,
              win: participant.win,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
              gameDuration: matchData.info.gameDuration,
              gameCreation: new Date(gameCreationTime),
              queueId,
              isRemake,
              pentaKills: participant.pentaKills || 0,
              objectivesStolen: participant.objectivesStolen || 0,
              enemyJungleMonsterKills: participant.challenges?.enemyJungleMonsterKills || 0,
              visionScore: participant.visionScore || 0,
              wardsKilled: participant.wardsKilled || 0,
            },
          });
        }
      }
    } catch (err) {
      console.error(`Failed to sync match ${matchId} for player ${player.gameName}:`, err);
    }
  }

  // 4. Compute current win/loss streak from actual saved matches (SoloQ queueId = 420 or allowed queues before challenge starts)
  const CHALLENGE_START_DATE = new Date('2026-06-05T00:00:00');
  const hasChallengeStarted = new Date() >= CHALLENGE_START_DATE;
  const recentSavedMatches = await prisma.match.findMany({
    where: { 
      playerId: player.id, 
      queueId: hasChallengeStarted ? 420 : { in: [420, 440] },
      isRemake: false,
    },
    orderBy: { gameCreation: 'desc' },
    take: 10,
  });

  let streak = 0;
  if (recentSavedMatches.length > 0) {
    const firstWin = recentSavedMatches[0].win;
    streak = firstWin ? 1 : -1;
    for (let i = 1; i < recentSavedMatches.length; i++) {
      if (recentSavedMatches[i].win === firstWin) {
        streak += firstWin ? 1 : -1;
      } else {
        break;
      }
    }
  }

  // Count wins/losses from database matches (excluding remakes) for all players
  const challengeMatches = await prisma.match.findMany({
    where: {
      playerId: player.id,
      queueId: hasChallengeStarted ? 420 : { in: [420, 440] },
      isRemake: false,
    }
  });
  wins = challengeMatches.filter(m => m.win).length;
  losses = challengeMatches.filter(m => !m.win).length;

  // 5. Update player record
  await prisma.player.update({
    where: { id: player.id },
    data: {
      gameName,
      tagLine,
      summonerId,
      profileIconId,
      tier,
      rank,
      leaguePoints: lp,
      wins,
      losses,
      streak,
      startTier,
      startRank,
      startLp,
      mainTier,
      mainRank,
      mainLp,
      lastUpdated: new Date(),
    },
  });

  // 6. Record LP Snapshot if changed or if no snapshot exists, or if the last snapshot was > 6 hours ago
  const lastSnapshot = await prisma.lPSnapshot.findFirst({
    where: { playerId: player.id },
    orderBy: { timestamp: 'desc' },
  });

  const shouldCreateSnapshot =
    !lastSnapshot ||
    lastSnapshot.globalLp !== currentGlobalLp ||
    Date.now() - new Date(lastSnapshot.timestamp).getTime() > 6 * 60 * 60 * 1000;

  if (shouldCreateSnapshot) {
    await prisma.lPSnapshot.create({
      data: {
        playerId: player.id,
        tier,
        rank,
        leaguePoints: lp,
        globalLp: currentGlobalLp,
      },
    });
    console.log(`Created LP snapshot for ${player.gameName}: ${tier} ${rank} - ${lp} LP (${currentGlobalLp} Global LP)`);
  }
}

// Sync all players in the database
export async function syncAllPlayers(): Promise<{ success: boolean; count: number; errors: string[] }> {
  const players = await prisma.player.findMany();
  const errors: string[] = [];
  
  console.log(`Starting sync for all ${players.length} players...`);
  
  for (const player of players) {
    try {
      await syncPlayer(player.id);
      // Wait 1 second between players to respect Riot rate limits
      await delay(1000);
    } catch (err: any) {
      console.error(`Error syncing player ${player.gameName}#${player.tagLine}:`, err);
      errors.push(`${player.gameName}#${player.tagLine}: ${err.message || err}`);
    }
  }

  return {
    success: errors.length === 0,
    count: players.length,
    errors,
  };
}
