// 1. Responsabilité : Fonctions pures de calcul des affectations dégradées et styles de badges d'arbitrage
// 2. Dépendances clés : src/types/domain.ts
// 3. Mots-clés métier : arbitrage_utils, degraded_allocations, badge_variants, level_thresholds

import { StudentItem } from '@/types/domain';

/**
 * Détecte si un élève a une affectation dégradée (nécessitant potentiellement un arbitrage manuel) :
 * - En Seconde (2 formations suivies) : Vœu ≥ 3 ou hors-vœu
 * - En Première/Terminale (4 formations suivies) : Vœu ≥ 5 ou hors-vœu
 */
export const isStudentAllocationDegraded = (s: StudentItem): boolean => {
  const formationAssignments = s.assignments?.filter((a) => a.assignment_type === 'FORMATION') || [];
  if (formationAssignments.length === 0) return false;

  return formationAssignments.some((a) => {
    if (!a.formation_id) return true;
    if (!a.wish_rank_obtained) return true;
    if (s.level === '2NDE') {
      return a.wish_rank_obtained >= 3;
    }
    return a.wish_rank_obtained >= 5;
  });
};

/**
 * Détermine la variante visuelle du badge de rang de vœu selon le niveau de l'élève
 */
export const getWishRankBadgeVariant = (
  rank: number,
  level: string
): 'success' | 'secondary' | 'warning' => {
  if (rank <= 2) return 'success';
  if (level !== '2NDE' && (rank === 3 || rank === 4)) return 'secondary';
  return 'warning';
};
