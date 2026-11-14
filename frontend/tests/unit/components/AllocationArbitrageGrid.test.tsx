// 1. Responsabilité : Tests unitaires de la logique d'arbitrage et détection des affectations dégradées
// 2. Dépendances clés : vitest, src/utils/arbitrage, src/types/domain
// 3. Mots-clés métier : arbitrage_tests, degraded_allocations, 2nde_threshold, terminale_threshold

import { describe, it, expect } from 'vitest';
import { isStudentAllocationDegraded } from '@/utils/arbitrage';
import { StudentItem } from '@/types/domain';

const createMockStudent = (
  level: '2NDE' | '1ERE' | 'TERM',
  ranks: (number | null)[]
): StudentItem => ({
  id: 1,
  first_name: 'Jean',
  last_name: 'Dupont',
  level,
  class_name: `${level} 1`,
  email: 'jean.dupont@test.fr',
  token: 'sp-1234567890abcdef1234',
  wishes_count: level === '2NDE' ? 4 : 6,
  wishes_submitted_at: '2026-11-12T08:00:00Z',
  assignments: ranks.map((rank, idx) => ({
    id: idx + 1,
    student_id: 1,
    rotation: idx + 1,
    formation_id: 10 + idx,
    formation_name: `Formation ${idx + 1}`,
    room: `B10${idx}`,
    assignment_type: level === '2NDE' && idx >= 2 ? 'SPECIALTY' : 'FORMATION',
    is_locked: false,
    wish_rank_obtained: rank,
  })),
});

describe('AllocationArbitrageGrid - isStudentAllocationDegraded', () => {
  it('correctly detects normal vs degraded allocations for Seconde (2NDE)', () => {
    // 2NDE student with Voeu 1 and Voeu 2 => Nominal (not degraded)
    const nominal2nde = createMockStudent('2NDE', [1, 2, null, null]);
    expect(isStudentAllocationDegraded(nominal2nde)).toBe(false);

    // 2NDE student pushed to Voeu 3 => Degraded
    const degradedRank3 = createMockStudent('2NDE', [1, 3, null, null]);
    expect(isStudentAllocationDegraded(degradedRank3)).toBe(true);

    // 2NDE student with Hors-vœu (null rank on formation) => Degraded
    const degradedHorsVoeu = createMockStudent('2NDE', [1, null, null, null]);
    expect(isStudentAllocationDegraded(degradedHorsVoeu)).toBe(true);
  });

  it('correctly treats Voeux 3 and 4 as nominal for 1ERE and Terminale (4 formations)', () => {
    // 1ERE student with Voeux [1, 2, 3, 4] => Nominal (not degraded!)
    const nominal1ere = createMockStudent('1ERE', [1, 2, 3, 4]);
    expect(isStudentAllocationDegraded(nominal1ere)).toBe(false);

    // Terminale student with Voeux [1, 2, 3, 4] => Nominal (not degraded!)
    const nominalTerm = createMockStudent('TERM', [1, 2, 3, 4]);
    expect(isStudentAllocationDegraded(nominalTerm)).toBe(false);

    // 1ERE student pushed to Voeu 5 => Degraded
    const degradedVoeu5 = createMockStudent('1ERE', [1, 2, 3, 5]);
    expect(isStudentAllocationDegraded(degradedVoeu5)).toBe(true);

    // Terminale student pushed to Voeu 6 => Degraded
    const degradedVoeu6 = createMockStudent('TERM', [1, 2, 4, 6]);
    expect(isStudentAllocationDegraded(degradedVoeu6)).toBe(true);

    // 1ERE student with a Hors-voeu => Degraded
    const horsVoeu1ere = createMockStudent('1ERE', [1, 2, 3, null]);
    expect(isStudentAllocationDegraded(horsVoeu1ere)).toBe(true);
  });
});
