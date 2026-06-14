const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

try {
  const players = db.prepare("SELECT id, alias, gameName FROM Player").all();
  console.log(`Checking streaks for ${players.length} players...`);
  
  for (const p of players) {
    const matches = db.prepare("SELECT win, isRemake, gameCreation, matchId FROM Match WHERE playerId = ? ORDER BY gameCreation ASC").all(p.id);
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStart = null;
    let streakStart = null;
    let streakEnd = null;
    
    for (const m of matches) {
      if (m.isRemake) continue;
      
      if (m.win === 1 || m.win === true) {
        if (currentStreak === 0) tempStart = m.gameCreation;
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          streakStart = tempStart;
          streakEnd = m.gameCreation;
        }
      } else {
        currentStreak = 0;
      }
    }
    
    console.log(`- ${p.alias || p.gameName}: Max Streak = ${maxStreak} (Wins). Total Matches = ${matches.length}`);
  }
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
