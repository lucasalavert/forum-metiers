// 1. Responsabilité : Tests unitaires des calculs de taux de remplissage et libellés de vœux
// 2. Dépendances clés : vitest, src/lib/utils/satisfaction.ts
// 3. Mots-clés métier : satisfaction_tests, occupancy_calc, tension_status, unit_test

import { describe, it, expect } from 'vitest';
import {
  calculateOccupancyPercent,
  formatWishRankLabel,
  getTensionStatus,
} from '@/lib/utils/satisfaction';

describe('satisfaction & metrics utils', () => {
  it('calculateOccupancyPercent computes accurate percentage capped at 100', () => {
    expect(calculateOccupancyPercent(10, 20)).toBe(50);
    expect(calculateOccupancyPercent(25, 20)).toBe(100);
    expect(calculateOccupancyPercent(0, 20)).toBe(0);
    expect(calculateOccupancyPercent(10, 0)).toBe(0);
  });

  it('getTensionStatus returns correct status according to ratio', () => {
    const high = getTensionStatus(1.5);
    expect(high.color).toBe('#E62154');
    expect(high.label).toContain('Saturé');

    const moderate = getTensionStatus(0.9);
    expect(moderate.color).toBe('#EB5E57');

    const balanced = getTensionStatus(0.5);
    expect(balanced.color).toBe('#00A68D');
  });

  it('formatWishRankLabel labels ranks properly', () => {
    expect(formatWishRankLabel(1, 'FORMATION')).toBe('Vœu 1 (Prioritaire)');
    expect(formatWishRankLabel(2, 'FORMATION')).toBe('Vœu 2');
    expect(formatWishRankLabel(null, 'SPECIALTY')).toBe('Spécialités 2nde');
    expect(formatWishRankLabel(null, 'FORMATION')).toContain('Hors-vœux');
  });
});
