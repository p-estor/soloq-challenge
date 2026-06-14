const { PrismaClient } = require('./src/generated/prisma');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const dbUrl = 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const playersForStreak = await prisma.player.findMany({
    include: {
      matches: {
        where: { isRemake: false },
        orderBy: { gameCreation: 'asc' },
      }
    }
  });
  console.log("Found players:", playersForStreak.length);
  for (const p of playersForStreak) {
    if (p.alias !== 'Nathan') continue;
    console.log(`Player: ${p.alias || p.gameName}`);
    console.log(`Matches count in Prisma: ${p.matches.length}`);
    let currentStreak = 0;
    let streakAchievedDate = null;
    for (const m of p.matches) {
      console.log(`  Match: ${m.matchId}, win: ${m.win} (${typeof m.win}), isRemake: ${m.isRemake} (${typeof m.isRemake})`);
      if (m.win) {
        currentStreak++;
        if (currentStreak === 10) {
          streakAchievedDate = m.gameCreation;
        }
      } else {
        currentStreak = 0;
      }
    }
    console.log(`  Current Streak: ${currentStreak}, Streak Achieved Date: ${streakAchievedDate}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
