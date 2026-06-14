const apiKey = 'RGAPI-783b29ee-31ff-402e-801a-1f896228eb52';
const puuid = 'wcPzWTFcT1JiIjivjc9PTllru3WqpfTpa9shs61mjaPlSB2ouWEkKvaEReGMfeKd5uRl25VJTfKABg';

async function test() {
  const url = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const res = await fetch(url, { headers: { 'X-Riot-Token': apiKey } });
  const data = await res.json();
  console.log("Summoner data:", data);
}

test().catch(console.error);
