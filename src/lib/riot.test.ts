import { describe, it, expect } from 'vitest';
import { getGlobalLp } from './riot';

describe('getGlobalLp', () => {
  it('debe calcular correctamente los LP para un rango normal de divisiones (ej. GOLD II, 50 LP)', () => {
    // Oro base = 1200, División II = 200, LP = 50 => Total 1450
    const result = getGlobalLp('GOLD', 'II', 50);
    expect(result).toBe(1450);
  });

  it('debe calcular los LP para el rango mínimo (ej. IRON IV, 0 LP)', () => {
    // Hierro base = 0, División IV = 0, LP = 0 => Total 0
    const result = getGlobalLp('IRON', 'IV', 0);
    expect(result).toBe(0);
  });

  it('debe calcular correctamente los LP para ligas sin divisiones (ej. MASTER, 350 LP)', () => {
    // Master base = 2800, las divisiones se ignoran, LP = 350 => Total 3150
    const result = getGlobalLp('MASTER', '', 350);
    expect(result).toBe(3150);
  });

  it('debe ser tolerante a minúsculas en el Tier (ej. gold IV, 20 LP)', () => {
    // Oro base = 1200, División IV = 0, LP = 20 => Total 1220
    const result = getGlobalLp('gold', 'IV', 20);
    expect(result).toBe(1220);
  });

  it('debe devolver el base + LP si el rango es inválido', () => {
    // Rango inventado => división base = 0, Platino base = 1600, LP = 10 => Total 1610
    const result = getGlobalLp('PLATINUM', 'INVALID_RANK', 10);
    expect(result).toBe(1610);
  });
});
