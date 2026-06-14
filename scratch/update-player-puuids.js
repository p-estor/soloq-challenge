const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const apiKey = 'RGAPI-783b29ee-31ff-402e-801a-1f896228eb52';
  
  // Get all players
  const players = db.prepare("SELECT id, gameName, tagLine, puuid, summonerId FROM Player").all();
  console.log(`Starting PUUID update for ${players.length} players...`);
  
  for (const p of players) {
    console.log(`Updating player: ${p.gameName}#${p.tagLine}...`);
    
    try {
      // 1. Get new PUUID
      const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`;
      let accountRes = await fetch(accountUrl, { headers: { 'X-Riot-Token': apiKey } });
      
      if (accountRes.status === 429) {
        console.log("Rate limit hit, waiting 5 seconds...");
        await delay(5000);
        accountRes = await fetch(accountUrl, { headers: { 'X-Riot-Token': apiKey } });
      }
      
      if (accountRes.status !== 200) {
        console.error(`  Failed to get account for ${p.gameName}#${p.tagLine}: ${accountRes.status} - ${await accountRes.text()}`);
        continue;
      }
      
      const accountData = await accountRes.json();
      const newPuuid = accountData.puuid;
      
      // 2. Get new Summoner ID
      const summonerUrl = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${newPuuid}`;
      let summonerRes = await fetch(summonerUrl, { headers: { 'X-Riot-Token': apiKey } });
      
      if (summonerRes.status === 429) {
        console.log("Rate limit hit, waiting 5 seconds...");
        await delay(5000);
        summonerRes = await fetch(summonerUrl, { headers: { 'X-Riot-Token': apiKey } });
      }
      
      if (summonerRes.status !== 200) {
        console.error(`  Failed to get summoner for ${p.gameName}#${p.tagLine}: ${summonerRes.status} - ${await summonerRes.text()}`);
        continue;
      }
      
      const summonerData = await summonerRes.json();
      const newSummonerId = summonerData.id;
      
      // 3. Update DB
      db.prepare("UPDATE Player SET puuid = ?, summonerId = ? WHERE id = ?").run(newPuuid, newSummonerId, p.id);
      console.log(`  Successfully updated ${p.gameName}#${p.tagLine}:`);
      console.log(`    New PUUID: ${newPuuid.substring(0, 15)}...`);
      console.log(`    New Summoner ID: ${newSummonerId ? newSummonerId.substring(0, 15) : 'null'}...`);
      
      // Gentle delay between players to prevent spamming
      await delay(500);
    } catch (err) {
      console.error(`  Error processing ${p.gameName}#${p.tagLine}:`, err.message);
    }
  }
  
  console.log("Finished PUUID and Summoner ID migration.");
}

main().catch(console.error).finally(() => db.close());
