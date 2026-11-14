// 1. Responsabilité : Fonctions pures de calcul des ratios de satisfaction, tension et codes couleur
// 2. Dépendances clés : aucune
// 3. Mots-clés métier : satisfaction_rate, tension_ratio, badge_color, fill_rate, pure_functions

export function calculateOccupancyPercent(count: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((count / capacity) * 100));
}

export function getTensionStatus(ratio: number): { label: string; color: string; badgeClass: string } {
  if (ratio >= 1.2) {
    return {
      label: 'Forte tension (Saturé)',
      color: '#E62154',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }
  if (ratio >= 0.8) {
    return {
      label: 'Tension modérée',
      color: '#EB5E57',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }
  return {
    label: 'Équilibré',
    color: '#00A68D',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
}

export function formatWishRankLabel(rank: number | null | undefined, type: string): string {
  if (type === 'SPECIALTY') return 'Spécialités 2nde';
  if (!rank) return 'Hors-vœux (Attribution libre)';
  if (rank === 1) return 'Vœu 1 (Prioritaire)';
  if (rank === 2) return 'Vœu 2';
  if (rank === 3) return 'Vœu 3';
  return `Vœu ${rank}`;
}
