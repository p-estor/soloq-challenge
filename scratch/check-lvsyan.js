const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve('./dev.db'));

try {
  const player = db.prepare("SELECT * FROM Player WHERE alias = 'Lvsyan' OR gameName = 'Lvsyan'").get();
  if (!player) {
    console.log("Lvsyan not found in production!");
  } else {
    console.log("Player profile in production:", player);
    const snapshots = db.prepare("SELECT * FROM LPSnapshot WHERE playerId = ?").all(player.id);
    console.log("Snapshots count in production:", snapshots.length);
    console.log("Snapshots in production:", snapshots);
  }
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
