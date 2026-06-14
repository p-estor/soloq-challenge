const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

async function test() {
  const apiKey = 'RGAPI-783b29ee-31ff-402e-801a-1f896228eb52';
  
  // Get a real player
  const player = db.prepare("SELECT gameName, tagLine FROM Player LIMIT 1").get();
  if (!player) {
    console.log("No players in DB");
    return;
  }
  
  console.log(`Resolving new PUUID for: ${player.gameName}#${player.tagLine}`);
  
  try {
    const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`;
    const accountRes = await fetch(accountUrl, {
      headers: { 'X-Riot-Token': apiKey }
    });
    console.log(`Account status: ${accountRes.status} (${accountRes.statusText})`);
    if (accountRes.status === 200) {
      const accountData = await accountRes.json();
      console.log(`New PUUID obtained successfully!`, accountData.puuid);
      
      // Let's test if we can fetch matches and summoner using this new PUUID
      const summonerUrl = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`;
      const summonerRes = await fetch(summonerUrl, {
        headers: { 'X-Riot-Token': apiKey }
      });
      console.log(`Summoner fetch with new PUUID: ${summonerRes.status} (${summonerRes.statusText})`);
      if (summonerRes.status === 200) {
        const summonerData = await summonerRes.json();
        console.log(`Summoner ID obtained:`, summonerData.id);
      }
    } else {
      console.log(`Error body:`, await accountRes.text());
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

test().catch(console.error).finally(() => db.close());
