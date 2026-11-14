// 1. Responsabilité : Catalogue des formations autorisées pour le portail élève avec filtres et ajout aux vœux
// 2. Dépendances clés : react, lucide-react, src/types/domain.ts, src/components/ui/Badge
// 3. Mots-clés métier : formation_catalog, student_picker, search_filter, add_wish

import React, { useState } from 'react';
import { Search, Plus, MapPin, User, Check } from 'lucide-react';
import { FormationItem } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';

export interface FormationCatalogSelectorProps {
  formations: FormationItem[];
  selectedFormationIds: number[];
  onAddWish: (formation: FormationItem) => void;
  maxWishesReached: boolean;
}

export const FormationCatalogSelector: React.FC<FormationCatalogSelectorProps> = ({
  formations,
  selectedFormationIds,
  onAddWish,
  maxWishesReached,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const domains = Array.from(new Set(formations.map((f) => f.domain))).sort();

  const filtered = formations.filter((f) => {
    if (selectedDomain !== 'ALL' && f.domain !== selectedDomain) return false;
    if (search) {
      const match = `${f.code} ${f.name} ${f.domain} ${f.speaker_name || ''} ${f.description || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Barre de recherche & filtres domaines */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une formation, un métier, un intervenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#272154] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#312783]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setSelectedDomain('ALL')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
              selectedDomain === 'ALL'
                ? 'bg-[#312783] text-white font-medium'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tous les domaines ({formations.length})
          </button>
          {domains.map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedDomain === dom
                  ? 'bg-[#312783] text-white font-medium'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des cartes de formations */}
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {filtered.map((f) => {
          const isSelected = selectedFormationIds.includes(f.id);

          return (
            <div
              key={f.id}
              className={`p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300'
                  : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#312783] bg-[#312783]/10 px-1.5 py-0.5 rounded">
                      {f.code}
                    </span>
                    <Badge size="sm" variant="secondary">
                      {f.domain}
                    </Badge>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#272154] leading-snug">
                    {f.name}
                  </h4>
                  {f.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{f.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-1">
                    {f.speaker_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {f.speaker_name}
                      </span>
                    )}
                    {f.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {f.room}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddWish(f)}
                  disabled={isSelected || maxWishesReached}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : maxWishesReached
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#EB5E57] hover:bg-[#d94f48] text-white shadow-xs'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Choisi</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Choisir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
