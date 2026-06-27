
export const DDRAGON_VERSION = '16.13.1';

// Rate limit helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Region endpoints: Account and Matches use regional routing (europe for EUW)
// Ranks and Summoner use platform routing (euw1 for EUW)
const REGION_ROUTING = 'europe';
const PLATFORM_ROUTING = 'euw1';

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface SummonerData {
  id: string; // summonerId
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
}

// Convert tier, rank and LP into a single numeric global LP for charts and easy sorting
export function getGlobalLp(tier: string, rank: string, lp: number): number {
  const tierBases: Record<string, number> = {
    UNRANKED: 0,
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 2800,
    CHALLENGER: 2800,
  };

  const rankBases: Record<string, number> = {
    IV: 0,
    III: 100,
    II: 200,
    I: 300,
  };

  const normalizedTier = tier.toUpperCase();
  const base = tierBases[normalizedTier] ?? 0;

  // Master, Grandmaster, Challenger don't have divisions
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(normalizedTier)) {
    return base + lp;
  }

  const divisionBase = rankBases[rank.toUpperCase()] ?? 0;
  return base + divisionBase + lp;
}

async function riotRequest<T>(url: string, retries = 3): Promise<T> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    throw new Error('RIOT_API_KEY environment variable is not defined.');
  }

  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': apiKey,
      },
    });

    if (response.status === 200) {
      return (await response.json()) as T;
    }

    if (response.status === 429) {
      // Rate limited: read Retry-After header or wait 2 seconds
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      console.warn(`Riot API Rate Limit hit. Waiting for ${waitTime}ms...`);
      await delay(waitTime);
      continue;
    }

    if (response.status === 404) {
      throw new Error(`Riot API Resource not found (404): ${url}`);
    }

    throw new Error(`Riot API request failed with status ${response.status}: ${response.statusText}`);
  }

  throw new Error(`Riot API request failed after ${retries} retries due to rate limit.`);
}

export const riot = {
  // Fetch account by Riot ID (GameName#TagLine)
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    const url = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      gameName
    )}/${encodeURIComponent(tagLine)}`;
    return await riotRequest<RiotAccount>(url);
  },

  // Fetch account by PUUID
  async getAccountByPuuid(puuid: string): Promise<RiotAccount> {
    const url = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
    return await riotRequest<RiotAccount>(url);
  },

  // Fetch summoner by PUUID
  async getSummonerByPuuid(puuid: string): Promise<SummonerData> {
    const url = `https://${PLATFORM_ROUTING}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return await riotRequest<SummonerData>(url);
  },

  // Fetch league entries (rank) by PUUID
  async getLeagueEntries(puuid: string): Promise<LeagueEntry[]> {
    const url = `https://${PLATFORM_ROUTING}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    return await riotRequest<LeagueEntry[]>(url);
  },

  // Fetch matches for a PUUID (only SoloQ if challenge started, all matches otherwise)
  async getMatchIds(puuid: string, count = 20): Promise<string[]> {
    const CHALLENGE_START_DATE = new Date('2026-06-05T00:00:00');
    const hasChallengeStarted = new Date() >= CHALLENGE_START_DATE;
    const queueParam = hasChallengeStarted ? '&queue=420' : '';
    
    if (count <= 100) {
      const url = `https://${REGION_ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}${queueParam}`;
      return await riotRequest<string[]>(url);
    }

    const allIds: string[] = [];
    let start = 0;
    while (start < count) {
      const currentCount = Math.min(100, count - start);
      const url = `https://${REGION_ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${currentCount}${queueParam}`;
      const ids = await riotRequest<string[]>(url);
      allIds.push(...ids);
      if (ids.length < currentCount) {
        break;
      }
      start += 100;
      await delay(100);
    }
    return allIds;
  },

  // Fetch individual match details
  async getMatchDetails(matchId: string): Promise<any> {
    const url = `https://${REGION_ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    return await riotRequest<any>(url);
  },
};
