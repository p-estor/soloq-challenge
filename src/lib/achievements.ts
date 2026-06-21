export interface MatchDataForStreak {
  win: boolean;
  gameCreation: Date;
  championName: string;
}

export interface PlayerForStreak {
  id: string;
  gameName: string;
  alias: string | null;
  matches: MatchDataForStreak[];
}

export interface StreakWinner {
  player: PlayerForStreak;
  date: Date;
  championName: string;
}

/**
 * Calculates all players who have achieved a win streak of target consecutive wins.
 * Returns a list of winners sorted by the date when the streak was first achieved.
 */
export function calculateStreakWinners(
  players: PlayerForStreak[],
  targetStreak: number = 10
): StreakWinner[] {
  const winners: StreakWinner[] = [];

  for (const p of players) {
    let currentStreak = 0;
    let streakAchievedDate: Date | null = null;
    let streakChampionName = '';
    
    // Sort matches chronologically to ensure correct sequence
    const sortedMatches = [...p.matches].sort(
      (a, b) => new Date(a.gameCreation).getTime() - new Date(b.gameCreation).getTime()
    );

    for (const m of sortedMatches) {
      if (m.win) {
        currentStreak++;
        if (currentStreak === targetStreak) {
          // Record the date and champion of the 10th consecutive win
          streakAchievedDate = new Date(m.gameCreation);
          streakChampionName = m.championName;
        }
      } else {
        currentStreak = 0;
      }
    }
    
    if (streakAchievedDate) {
      winners.push({
        player: p,
        date: streakAchievedDate,
        championName: streakChampionName,
      });
    }
  }

  // Sort chronologically ascending (earliest to achieve it first)
  return winners.sort((a, b) => a.date.getTime() - b.date.getTime());
}
