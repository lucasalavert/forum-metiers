// 1. Responsabilité : Panier ordonné des vœux formulés avec réordonnancement (monter / descendre) et soumission
// 2. Dépendances clés : react, lucide-react, src/types/domain.ts, src/components/ui/Button
// 3. Mots-clés métier : wish_order, rank_management, priority_list, submit_button

import React from 'react';
import { ArrowUp, ArrowDown, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FormationItem } from '@/types/domain';
import { Button } from '@/components/ui/Button';

export interface WishOrderedListProps {
  wishes: FormationItem[];
  requiredCount: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSaved: boolean;
}

export const WishOrderedList: React.FC<WishOrderedListProps> = ({
  wishes,
  requiredCount,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSubmit,
  isSubmitting,
  isSaved,
}) => {
  const isComplete = wishes.length >= requiredCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-heading font-bold text-base text-[#272154]">Mes Vœux Classés</h3>
            <p className="text-xs text-gray-500">Par ordre strict de préférence (Vœu 1 = préféré)</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {wishes.length} / {requiredCount} vœux
          </span>
        </div>

        {wishes.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">Vous n'avez pas encore sélectionné de formation.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Cliquez sur « Choisir » dans le catalogue à gauche pour ajouter vos formations.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {wishes.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0
                        ? 'bg-[#00A68D] text-white shadow-xs'
                        : idx === 1
                        ? 'bg-[#00B1EB] text-white shadow-xs'
                        : idx === 2
                        ? 'bg-[#312783] text-white shadow-xs'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#272154] truncate">{f.name}</div>
                    <div className="text-[10px] text-gray-500">{f.domain}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveUp(idx)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === wishes.length - 1}
                    onClick={() => onMoveDown(idx)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="p-1 rounded text-gray-400 hover:text-rose-600"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 mt-4 space-y-3">
        {isSaved && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Vos vœux ont bien été enregistrés ! Vous pouvez les modifier jusqu'à la clôture.</span>
          </div>
        )}

        <Button
          type="button"
          onClick={onSubmit}
          disabled={!isComplete || isSubmitting}
          isLoading={isSubmitting}
          variant="primary"
          className="w-full text-sm font-semibold py-3 shadow-md"
        >
          {isComplete
            ? 'Enregistrer mes vœux définitifs'
            : `Sélectionnez encore ${requiredCount - wishes.length} vœu(x)`}
        </Button>
      </div>
    </div>
  );
};
