const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

async function test() {
  const apiKey = 'RGAPI-783b29ee-31ff-402e-801a-1f896228eb52';
  
  // Get a real player
  const player = db.prepare("SELECT puuid, gameName, tagLine FROM Player LIMIT 1").get();
  if (!player) {
    console.log("No players in DB");
    return;
  }
  
  console.log(`Testing with player: ${player.gameName}#${player.tagLine} (puuid: ${player.puuid})`);
  
  const endpoints = [
    {
      name: 'Account By Puuid',
      url: `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${player.puuid}`
    },
    {
      name: 'Summoner By Puuid',
      url: `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${player.puuid}`
    },
    {
      name: 'League Entries By Puuid',
      url: `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${player.puuid}`
    },
    {
      name: 'Matches by Puuid',
      url: `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?start=0&count=20`
    }
  ];
  
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        headers: { 'X-Riot-Token': apiKey }
      });
      console.log(`${ep.name}: Status ${res.status} (${res.statusText})`);
      if (res.status !== 200) {
        const text = await res.text();
        console.log(`  Error body:`, text);
      }
    } catch (err) {
      console.error(`${ep.name}: failed:`, err.message);
    }
  }
}

test().catch(console.error).finally(() => db.close());
