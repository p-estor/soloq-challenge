import { describe, it, expect } from 'vitest';
import { calculateFirstToStreak, PlayerForStreak } from './achievements';

describe('calculateFirstToStreak', () => {
  it('debe devolver null si no hay jugadores o ninguno tiene racha de 10', () => {
    const players: PlayerForStreak[] = [
      {
        id: 'p1',
        gameName: 'Syranna',
        alias: 'Syranna',
        matches: [
          { win: true, gameCreation: new Date('2026-06-01T10:00:00Z') },
          { win: false, gameCreation: new Date('2026-06-01T11:00:00Z') },
        ]
      }
    ];

    const result = calculateFirstToStreak(players, 10);
    expect(result.player).toBeNull();
    expect(result.date).toBeNull();
  });

  it('debe identificar correctamente a un jugador con una racha limpia de 10 victorias', () => {
    const matches = Array.from({ length: 10 }, (_, i) => ({
      win: true,
      gameCreation: new Date(`2026-06-01T1${i}:00:00Z`)
    }));

    const players: PlayerForStreak[] = [
      {
        id: 'p1',
        gameName: 'Nathan',
        alias: 'Nathan',
        matches
      }
    ];

    const result = calculateFirstToStreak(players, 10);
    expect(result.player).not.toBeNull();
    expect(result.player?.alias).toBe('Nathan');
    expect(result.date).toEqual(new Date('2026-06-01T19:00:00Z')); // La décima partida
  });

  it('debe reiniciar la racha si hay una derrota', () => {
    // 9 victorias -> 1 derrota -> 10 victorias
    const matches = [
      ...Array.from({ length: 9 }, (_, i) => ({ win: true, gameCreation: new Date(`2026-06-01T10:0${i}:00Z`) })),
      { win: false, gameCreation: new Date('2026-06-01T11:00:00Z') },
      ...Array.from({ length: 10 }, (_, i) => ({ win: true, gameCreation: new Date(`2026-06-01T12:0${i}:00Z`) }))
    ];

    const players: PlayerForStreak[] = [
      {
        id: 'p1',
        gameName: 'Player1',
        alias: 'Player1',
        matches
      }
    ];

    const result = calculateFirstToStreak(players, 10);
    expect(result.player).not.toBeNull();
    expect(result.date).toEqual(new Date('2026-06-01T12:09:00Z')); // La décima de la segunda racha
  });

  it('debe dar el logro al primer jugador cronológico en alcanzar la racha', () => {
    // Player 1 alcanza su racha de 3 el 2 de Junio
    const player1: PlayerForStreak = {
      id: 'p1',
      gameName: 'Player1',
      alias: 'Player1',
      matches: [
        { win: true, gameCreation: new Date('2026-06-02T10:00:00Z') },
        { win: true, gameCreation: new Date('2026-06-02T11:00:00Z') },
        { win: true, gameCreation: new Date('2026-06-02T12:00:00Z') },
      ]
    };

    // Player 2 alcanza su racha de 3 el 1 de Junio
    const player2: PlayerForStreak = {
      id: 'p2',
      gameName: 'Player2',
      alias: 'Player2',
      matches: [
        { win: true, gameCreation: new Date('2026-06-01T10:00:00Z') },
        { win: true, gameCreation: new Date('2026-06-01T11:00:00Z') },
        { win: true, gameCreation: new Date('2026-06-01T12:00:00Z') },
      ]
    };

    const result = calculateFirstToStreak([player1, player2], 3);
    expect(result.player).not.toBeNull();
    expect(result.player?.alias).toBe('Player2'); // Alcanzada el 1 de Junio
    expect(result.date).toEqual(new Date('2026-06-01T12:00:00Z'));
  });
});
