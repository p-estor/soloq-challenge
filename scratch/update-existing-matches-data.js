const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dotenvContent = fs.readFileSync(path.resolve('.env'), 'utf8');
const apiKey = dotenvContent.match(/RIOT_API_KEY="([^"]+)"/)[1];

const db = new Database(path.resolve('./dev.db'));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchMatchWithRetry(matchId, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
      headers: {
        'X-Riot-Token': apiKey,
      }
    });

    if (response.status === 200) {
      return await response.json();
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? (parseInt(retryAfter, 10) * 1000 + 1000) : 5000;
      console.warn(`[429] Rate limited on match ${matchId}. Waiting for ${waitTime}ms (Retry ${i + 1}/${retries})...`);
      await delay(waitTime);
      continue;
    }

    throw new Error(`Riot API returned status ${response.status}: ${response.statusText}`);
  }
  throw new Error(`Failed to fetch match ${matchId} after ${retries} retries due to rate limits.`);
}

async function main() {
  console.log("Starting robust retroactive update of match data...");
  const matches = db.prepare("SELECT Match.id, Match.matchId, Player.puuid, Player.gameName FROM Match JOIN Player ON Match.playerId = Player.id").all();
  console.log(`Found ${matches.length} matches to verify.`);

  for (const m of matches) {
    try {
      console.log(`Processing match ${m.matchId} for player ${m.gameName}...`);
      const matchData = await fetchMatchWithRetry(m.matchId);
      const participant = matchData.info.participants.find(p => p.puuid === m.puuid);
      
      if (participant) {
        const pentaKills = participant.pentaKills || 0;
        const objectivesStolen = participant.objectivesStolen || 0;

        db.prepare("UPDATE Match SET pentaKills = ?, objectivesStolen = ? WHERE id = ?")
          .run(pentaKills, objectivesStolen, m.id);

        if (pentaKills > 0 || objectivesStolen > 0) {
          console.log(`[RECORD FOUND] Updated match ${m.matchId}: pentas=${pentaKills}, steals=${objectivesStolen}`);
        }
      } else {
        console.warn(`Participant not found for puuid ${m.puuid} in match ${m.matchId}`);
      }

      await delay(350); // polite delay
    } catch (err) {
      console.error(`Failed to update match ${m.matchId}:`, err.message || err);
      await delay(1000);
    }
  }
  console.log("Migration complete!");
}

main().finally(() => db.close());
