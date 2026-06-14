const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./dev.db');
console.log(`Opening database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  const info = db.prepare("UPDATE Match SET isRemake = 1 WHERE gameDuration < 240").run();
  console.log(`Successfully updated existing matches. Rows affected: ${info.changes}`);
} catch (err) {
  console.error("Failed to update matches:", err);
} finally {
  db.close();
}
