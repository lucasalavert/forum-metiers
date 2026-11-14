// 1. Responsabilité : Tableau récapitulatif des formations avec gestion des 4 états et indicateurs de capacité
// 2. Dépendances clés : react, lucide-react, src/types/domain.ts, src/components/ui/Badge
// 3. Mots-clés métier : formations_table, 4_state_widget, capacity_gauges, room, speaker

import React from 'react';
import { Edit2, Trash2, Users, MapPin, UserCheck, AlertTriangle } from 'lucide-react';
import { FormationItem } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';
import { calculateOccupancyPercent, getTensionStatus } from '@/lib/utils/satisfaction';

export interface FormationsTableWidgetProps {
  formations?: FormationItem[];
  rotationsCount?: number;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const FormationsTableWidget: React.FC<FormationsTableWidgetProps> = ({
  formations,
  rotationsCount = 4,
  isLoading,
  isError,
  error,
  onEdit,
  onDelete,
}) => {
  const activeRotations = Array.from({ length: rotationsCount }, (_, i) => i + 1);

  const getRotOcc = (f: FormationItem, rot: number): number => {
    const map: Record<number, number> = {
      1: f.occupancy_r1 || 0,
      2: f.occupancy_r2 || 0,
      3: f.occupancy_r3 || 0,
      4: f.occupancy_r4 || 0,
      5: f.occupancy_r5 || 0,
      6: f.occupancy_r6 || 0,
    };
    return map[rot] ?? 0;
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500 animate-pulse bg-white rounded-2xl border border-gray-100">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#312783] border-t-transparent mb-4" />
        <p className="text-sm font-medium">Chargement des formations du catalogue...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
        <h3 className="font-semibold text-base">Erreur de chargement</h3>
        <p className="text-xs mt-1 text-rose-600">
          {error instanceof Error ? error.message : 'Impossible de récupérer la liste des formations.'}
        </p>
      </div>
    );
  }

  if (!formations || formations.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-100 rounded-2xl">
        <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-[#272154] text-base">Aucune formation trouvée</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Le catalogue ne contient encore aucune formation. Importez un fichier CSV ou ajoutez une formation manuellement.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <caption className="sr-only">Liste complète des formations et jauges de remplissage</caption>
        <thead className="bg-[#272154] text-white">
          <tr>
            <th className="py-3 px-4 font-semibold">Code & Intitulé</th>
            <th className="py-3 px-3 font-semibold">Domaine & Niveaux</th>
            <th className="py-3 px-3 font-semibold">Intervenant & Salle</th>
            <th className="py-3 px-3 font-semibold text-center">Capacité / Rot.</th>
            <th className="py-3 px-3 font-semibold text-center">Demandes (Vœu 1)</th>
            <th className="py-3 px-3 font-semibold text-center">Remplissage (R1 à R{rotationsCount})</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {formations.map((f) => {
            const totalAssigned = f.assigned_count;
            const totalCap = f.capacity_per_rotation * rotationsCount;
            const occPercent = calculateOccupancyPercent(totalAssigned, totalCap);
            const tension = f.wishes_count_total / Math.max(1, totalCap);
            const tensionStatus = getTensionStatus(tension);

            return (
              <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#312783] bg-[#312783]/10 px-1.5 py-0.5 rounded">
                      {f.code}
                    </span>
                    <span className="font-semibold text-[#272154] text-sm">{f.name}</span>
                  </div>
                  {f.description && (
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{f.description}</p>
                  )}
                </td>

                <td className="py-3 px-3">
                  <div className="font-medium text-gray-700">{f.domain}</div>
                  <div className="flex gap-1 mt-1">
                    {f.target_levels.split(',').map((lvl) => (
                      <Badge key={lvl} size="sm" variant="secondary">
                        {lvl.trim()}
                      </Badge>
                    ))}
                  </div>
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{f.speaker_name || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{f.room || 'Salle standard'}</span>
                  </div>
                </td>

                <td className="py-3 px-3 text-center">
                  <span className="font-bold text-sm text-[#272154]">{f.capacity_per_rotation}</span>
                  <span className="text-[10px] text-gray-400 block">élèves/créneau</span>
                </td>

                <td className="py-3 px-3 text-center">
                  <span className="font-bold text-sm text-[#EB5E57]">{f.wishes_count_rank1}</span>
                  <span className="text-[10px] text-gray-500 block">({f.wishes_count_total} total)</span>
                  <span className={`inline-block text-[9px] px-1.5 rounded mt-0.5 border ${tensionStatus.badgeClass}`}>
                    {tensionStatus.label}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <div className="w-32 mx-auto">
                    <div className="flex justify-between text-[10px] mb-0.5 text-gray-600">
                      <span>{totalAssigned} / {totalCap}</span>
                      <span>{occPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occPercent >= 100
                            ? 'bg-[#E62154]'
                            : occPercent >= 75
                            ? 'bg-[#EB5E57]'
                            : 'bg-[#00A68D]'
                        }`}
                        style={{ width: `${Math.min(100, occPercent)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-1 text-[9px] text-gray-400 mt-1 font-mono">
                      {activeRotations.map((rot) => (
                        <span key={rot}>
                          R{rot}:{getRotOcc(f, rot)}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(f.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#312783] hover:bg-gray-100 transition-colors"
                      title="Modifier la formation"
                      aria-label={`Modifier ${f.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la formation "${f.name}" ?`)) {
                          onDelete(f.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                      aria-label={`Supprimer ${f.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
