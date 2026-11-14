// 1. Responsabilité : Table d'arbitrage manuel permettant de modifier en direct les affectations d'élèves (R1..RN)
// 2. Dépendances clés : react, lucide-react, src/types/domain.ts, src/hooks/useEventConfig
// 3. Mots-clés métier : arbitrage_grid, manual_swap, lock_assignment, dynamic_rotations, table

import React, { useState } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { FormationItem, StudentItem } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';
import { useEventConfig } from '@/hooks/useEventConfig';
import { ROTATION_SCHEDULES } from '@/lib/constants';
import { isStudentAllocationDegraded, getWishRankBadgeVariant } from '@/utils/arbitrage';

export interface AllocationArbitrageGridProps {
  students: StudentItem[];
  formations: FormationItem[];
  onUpdateAssignment: (params: {
    studentId: number;
    rotation: number;
    formationId?: number | null;
    assignmentType: 'FORMATION' | 'SPECIALTY';
    isLocked: boolean;
  }) => void;
}

export const AllocationArbitrageGrid: React.FC<AllocationArbitrageGridProps> = ({
  students,
  formations,
  onUpdateAssignment,
}) => {
  const { data: config } = useEventConfig();
  const [filterUnsatisfiedOnly, setFilterUnsatisfiedOnly] = useState(false);
  const [selectedStudentSearch, setSelectedStudentSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;
  const activeRotations = Array.from({ length: rotationsCount }, (_, i) => i + 1);

  const getRotHeader = (rot: number) => {
    const slot = config?.rotations?.find((r) => r.rotation === rot);
    if (slot) {
      return `R${rot} (${slot.start_time.replace(':', 'h')})`;
    }
    return `R${rot} (${ROTATION_SCHEDULES[rot]?.start.replace(':', 'h') || ''})`;
  };

  const allClasses = Array.from(new Set(students.map((s) => s.class_name))).sort();
  const degradedCount = students.filter(isStudentAllocationDegraded).length;

  const filteredStudents = students.filter((s) => {
    if (selectedClass && s.class_name !== selectedClass) return false;
    if (selectedStudentSearch) {
      const match = `${s.first_name} ${s.last_name} ${s.class_name}`
        .toLowerCase()
        .includes(selectedStudentSearch.toLowerCase());
      if (!match) return false;
    }
    if (filterUnsatisfiedOnly) {
      return isStudentAllocationDegraded(s);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F3F1F0]/50 p-4 rounded-xl border border-gray-200/60">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={selectedStudentSearch}
            onChange={(e) => setSelectedStudentSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
          />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#312783]"
          >
            <option value="">Toutes les classes ({allClasses.length})</option>
            {allClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label
            className="flex items-center gap-2 text-xs font-medium text-[#272154] cursor-pointer"
            title="Élèves avec Vœu ≥ 3 en 2nde, Vœu ≥ 5 en 1ère/Term, ou affectation hors-vœu"
          >
            <input
              type="checkbox"
              checked={filterUnsatisfiedOnly}
              onChange={(e) => setFilterUnsatisfiedOnly(e.target.checked)}
              className="rounded text-[#EB5E57] focus:ring-[#EB5E57]"
            />
            <span>Afficher uniquement les affectations dégradées ({degradedCount})</span>
          </label>
        </div>
        <div className="text-xs text-gray-500">
          <b>{filteredStudents.length}</b> élèves affichés
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">Matrice d'arbitrage des affectations par élève</caption>
          <thead className="bg-[#272154] text-white">
            <tr>
              <th className="py-3 px-4 font-semibold">Élève & Classe</th>
              {activeRotations.map((rot) => (
                <th key={rot} className="py-3 px-3 font-semibold">
                  {getRotHeader(rot)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.slice(0, 500).map((student) => (
              <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-[#272154]">
                    {student.last_name} {student.first_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-gray-500 font-medium">{student.class_name}</span>
                    <Badge size="sm" variant={student.level === '2NDE' ? 'success' : 'secondary'}>
                      {student.level}
                    </Badge>
                  </div>
                </td>

                {activeRotations.map((rot) => {
                  const assign = student.assignments.find((a) => a.rotation === rot);
                  const isSpecialty = assign?.assignment_type === 'SPECIALTY';

                  return (
                    <td key={rot} className="py-2.5 px-3 min-w-[200px]">
                      {isSpecialty ? (
                        <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-medium flex items-center justify-between">
                          <span>Présentation Spécialités</span>
                          <span className="text-[10px] bg-purple-200/60 px-1.5 py-0.5 rounded">2nde</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <select
                            value={assign?.formation_id || ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              onUpdateAssignment({
                                studentId: student.id,
                                rotation: rot,
                                formationId: val,
                                assignmentType: 'FORMATION',
                                isLocked: assign?.is_locked ?? true,
                              });
                            }}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#312783]"
                          >
                            <option value="">-- Non affecté --</option>
                            {formations
                              .filter((f) => f.target_levels.includes(student.level))
                              .map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name.length > 25 ? `${f.name.substring(0, 23)}...` : f.name}
                                </option>
                              ))}
                          </select>

                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span>
                              {assign?.wish_rank_obtained ? (
                                <Badge
                                  size="sm"
                                  variant={getWishRankBadgeVariant(assign.wish_rank_obtained, student.level)}
                                >
                                  Vœu {assign.wish_rank_obtained}
                                </Badge>
                              ) : assign?.formation_id ? (
                                <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3" /> Hors-vœu
                                </span>
                              ) : (
                                <span className="text-gray-400">Vide</span>
                              )}
                            </span>

                            {assign?.formation_id && (
                              <button
                                onClick={() =>
                                  onUpdateAssignment({
                                    studentId: student.id,
                                    rotation: rot,
                                    formationId: assign.formation_id,
                                    assignmentType: 'FORMATION',
                                    isLocked: !assign.is_locked,
                                  })
                                }
                                title={assign.is_locked ? 'Affectation verrouillée' : 'Cliquer pour verrouiller'}
                                className={`p-1 rounded transition-colors ${
                                  assign.is_locked
                                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {assign.is_locked ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
