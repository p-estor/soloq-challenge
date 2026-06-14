const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

try {
  const player = db.prepare("SELECT * FROM Player WHERE alias = 'Lvsyan' OR gameName = 'Lvsyan'").get();
  if (!player) {
    console.log("Player not found!");
  } else {
    console.log("Player Record in DB:", {
      alias: player.alias,
      wins: player.wins,
      losses: player.losses,
      tier: player.tier,
      rank: player.rank,
      lp: player.leaguePoints
    });
    
    const matches = db.prepare("SELECT id, matchId, win, isRemake, gameDuration, gameCreation FROM Match WHERE playerId = ? ORDER BY gameCreation DESC").all(player.id);
    console.log(`Matches in DB (Count: ${matches.length}):`);
    matches.forEach(m => {
      console.log(`- MatchId: ${m.matchId}, Win: ${m.win}, isRemake: ${m.isRemake}, gameDuration: ${m.gameDuration}s, Date: ${m.gameCreation}`);
    });
  }
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
