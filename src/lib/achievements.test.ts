import { describe, it, expect } from 'vitest';
import { calculateStreakWinners, PlayerForStreak } from './achievements';

describe('calculateStreakWinners', () => {
  it('debe devolver un array vacío si no hay jugadores o ninguno tiene racha de 10', () => {
    const players: PlayerForStreak[] = [
      {
        id: 'p1',
        gameName: 'Syranna',
        alias: 'Syranna',
        matches: [
          { win: true, gameCreation: new Date('2026-06-01T10:00:00Z'), championName: 'Lux' },
          { win: false, gameCreation: new Date('2026-06-01T11:00:00Z'), championName: 'Lulu' },
        ]
      }
    ];

    const result = calculateStreakWinners(players, 10);
    expect(result).toHaveLength(0);
  });

  it('debe identificar correctamente a un jugador con una racha limpia de 10 victorias', () => {
    const matches = Array.from({ length: 10 }, (_, i) => ({
      win: true,
      gameCreation: new Date(`2026-06-01T1${i}:00:00Z`),
      championName: i === 9 ? 'Jinx' : 'Ezreal'
    }));

    const players: PlayerForStreak[] = [
      {
        id: 'p1',
        gameName: 'Nathan',
        alias: 'Nathan',
        matches
      }
    ];

    const result = calculateStreakWinners(players, 10);
    expect(result).toHaveLength(1);
    expect(result[0].player.alias).toBe('Nathan');
    expect(result[0].date).toEqual(new Date('2026-06-01T19:00:00Z')); // La décima partida
    expect(result[0].championName).toBe('Jinx');
  });

  it('debe reiniciar la racha si hay una derrota', () => {
    // 9 victorias -> 1 derrota -> 10 victorias
    const matches = [
      ...Array.from({ length: 9 }, (_, i) => ({ win: true, gameCreation: new Date(`2026-06-01T10:0${i}:00Z`), championName: 'Ezreal' })),
      { win: false, gameCreation: new Date('2026-06-01T11:00:00Z'), championName: 'Lux' },
      ...Array.from({ length: 10 }, (_, i) => ({ win: true, gameCreation: new Date(`2026-06-01T12:0${i}:00Z`), championName: i === 9 ? 'Jinx' : 'Ezreal' }))
    ];

    const players: PlayerForStreak[] = [
      {
        id: 'p1',
        gameName: 'Player1',
        alias: 'Player1',
        matches
      }
    ];

    const result = calculateStreakWinners(players, 10);
    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2026-06-01T12:09:00Z')); // La décima de la segunda racha
    expect(result[0].championName).toBe('Jinx');
  });

  it('debe listar a todos los ganadores ordenados cronológicamente', () => {
    // Player 1 alcanza su racha de 3 el 2 de Junio
    const player1: PlayerForStreak = {
      id: 'p1',
      gameName: 'Player1',
      alias: 'Player1',
      matches: [
        { win: true, gameCreation: new Date('2026-06-02T10:00:00Z'), championName: 'Lux' },
        { win: true, gameCreation: new Date('2026-06-02T11:00:00Z'), championName: 'Lux' },
        { win: true, gameCreation: new Date('2026-06-02T12:00:00Z'), championName: 'Ahri' },
      ]
    };

    // Player 2 alcanza su racha de 3 el 1 de Junio
    const player2: PlayerForStreak = {
      id: 'p2',
      gameName: 'Player2',
      alias: 'Player2',
      matches: [
        { win: true, gameCreation: new Date('2026-06-01T10:00:00Z'), championName: 'Ezreal' },
        { win: true, gameCreation: new Date('2026-06-01T11:00:00Z'), championName: 'Ezreal' },
        { win: true, gameCreation: new Date('2026-06-01T12:00:00Z'), championName: 'Jinx' },
      ]
    };

    const result = calculateStreakWinners([player1, player2], 3);
    expect(result).toHaveLength(2);
    // El primero en lograrlo (Player 2) debe ir primero en la lista
    expect(result[0].player.alias).toBe('Player2');
    expect(result[0].date).toEqual(new Date('2026-06-01T12:00:00Z'));
    expect(result[0].championName).toBe('Jinx');
    // El segundo en lograrlo (Player 1) debe ir segundo
    expect(result[1].player.alias).toBe('Player1');
    expect(result[1].date).toEqual(new Date('2026-06-02T12:00:00Z'));
    expect(result[1].championName).toBe('Ahri');
  });
});
