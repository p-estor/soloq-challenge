export interface MatchDataForStreak {
  win: boolean;
  gameCreation: Date;
}

export interface PlayerForStreak {
  id: string;
  gameName: string;
  alias: string | null;
  matches: MatchDataForStreak[];
}

/**
 * Calculates who is the first player to achieve a win streak of target consecutive wins.
 * Returns the player and the exact date when the streak was achieved.
 */
export function calculateFirstToStreak(
  players: PlayerForStreak[],
  targetStreak: number = 10
): { player: PlayerForStreak | null; date: Date | null } {
  let streakWinner: PlayerForStreak | null = null;
  let streakDate: Date | null = null;

  for (const p of players) {
    let currentStreak = 0;
    let streakAchievedDate: Date | null = null;
    
    // Sort matches chronologically to ensure correct sequence
    const sortedMatches = [...p.matches].sort(
      (a, b) => new Date(a.gameCreation).getTime() - new Date(b.gameCreation).getTime()
    );

    for (const m of sortedMatches) {
      if (m.win) {
        currentStreak++;
        if (currentStreak === targetStreak) {
          // Record the date of the 10th consecutive win
          streakAchievedDate = new Date(m.gameCreation);
        }
      } else {
        currentStreak = 0;
      }
    }
    
    if (streakAchievedDate) {
      // Find the first player who achieved it chronologically
      if (!streakWinner || !streakDate || streakAchievedDate < streakDate) {
        streakWinner = p;
        streakDate = streakAchievedDate;
      }
    }
  }

  return { player: streakWinner, date: streakDate };
}
