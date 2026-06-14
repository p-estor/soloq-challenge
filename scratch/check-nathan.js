const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

try {
  const player = db.prepare("SELECT id, alias, gameName FROM Player WHERE alias = 'Nathan'").get();
  if (!player) {
    console.log("Nathan not found!");
    db.close();
    return;
  }

  const matches = db.prepare("SELECT win, isRemake, gameCreation, matchId, queueId FROM Match WHERE playerId = ? ORDER BY gameCreation ASC").all(player.id);
  
  console.log(`Nathan matches count: ${matches.length}`);
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (const m of matches) {
    const isWin = m.win === 1 || m.win === true;
    console.log(`- MatchId: ${m.matchId}, win: ${m.win} (${typeof m.win}) -> resolves to ${isWin}, isRemake: ${m.isRemake} (${typeof m.isRemake}), queueId: ${m.queueId}`);
    
    if (m.isRemake === 1 || m.isRemake === true) {
      console.log(`  (Skipping remake)`);
      continue;
    }
    
    if (isWin) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  console.log(`Final currentStreak: ${currentStreak}`);
  console.log(`Max Streak calculated: ${maxStreak}`);
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
