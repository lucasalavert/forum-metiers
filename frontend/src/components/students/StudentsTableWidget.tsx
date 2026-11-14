// 1. Responsabilité : Tableau des élèves avec copie/régénération de liens uniques, QR code et statuts
// 2. Dépendances clés : react, lucide-react, src/types/domain.ts, src/hooks/useEventConfig, src/utils/clipboard
// 3. Mots-clés métier : students_table, 4_state_widget, unique_link, token_copy, qr_modal, regenerate_token

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Users,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  CalendarCheck2,
  QrCode,
} from 'lucide-react';
import { StudentItem } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';
import { useEventConfig } from '@/hooks/useEventConfig';
import { getStudentShareableUrl, copyTextToClipboard } from '@/utils/clipboard';
import { StudentQrModal } from './StudentQrModal';

export interface StudentsTableWidgetProps {
  students?: StudentItem[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onDeleteStudent: (id: number) => void;
  onRegenerateToken: (id: number) => void;
}

export const StudentsTableWidget: React.FC<StudentsTableWidgetProps> = ({
  students,
  isLoading,
  isError,
  error,
  onDeleteStudent,
  onRegenerateToken,
}) => {
  const { data: config } = useEventConfig();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<StudentItem | null>(null);

  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;
  const secondeSpecSlots = config?.seconde_specialty_slots ?? 2;

  const handleCopyLink = async (token: string) => {
    const fullUrl = getStudentShareableUrl(token);
    await copyTextToClipboard(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500 animate-pulse bg-white rounded-2xl border border-gray-100">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#312783] border-t-transparent mb-4" />
        <p className="text-sm font-medium">Chargement des élèves...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
        <h3 className="font-semibold text-base">Erreur de chargement</h3>
        <p className="text-xs mt-1 text-rose-600">
          {error instanceof Error ? error.message : 'Impossible de récupérer la liste des élèves.'}
        </p>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-100 rounded-2xl">
        <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-[#272154] text-base">Aucun élève trouvé</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Aucun élève ne correspond aux critères. Importez un fichier CSV ou ajoutez un élève manuellement.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <caption className="sr-only">Liste des élèves inscrits au forum et liens uniques d'accès</caption>
        <thead className="bg-[#272154] text-white">
          <tr>
            <th className="py-3 px-4 font-semibold">Nom & Prénom</th>
            <th className="py-3 px-3 font-semibold">Classe & Niveau</th>
            <th className="py-3 px-3 font-semibold">Email</th>
            <th className="py-3 px-3 font-semibold text-center">Vœux exprimés</th>
            <th className="py-3 px-3 font-semibold text-center">Statut Répartition</th>
            <th className="py-3 px-3 font-semibold text-center">Lien d'accès unique</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((s) => {
            const hasWishes = s.wishes_submitted_at !== null;
            const reqFormations =
              s.level === '2NDE' ? Math.max(1, rotationsCount - secondeSpecSlots) : rotationsCount;
            const requiredWishes = reqFormations <= 2 ? 4 : Math.min(6, reqFormations + 2);
            const assignedCount = s.assignments ? s.assignments.length : 0;
            const isPendingAllocation = hasWishes && assignedCount < rotationsCount;
            const isFullyAllocated = assignedCount >= rotationsCount;

            return (
              <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-[#272154] text-sm">
                    {s.last_name} {s.first_name}
                  </div>
                  <span className="font-mono text-[10px] text-gray-400">{s.token}</span>
                </td>

                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{s.class_name}</span>
                    <Badge
                      size="sm"
                      variant={s.level === '2NDE' ? 'success' : s.level === '1ERE' ? 'primary' : 'purple'}
                    >
                      {s.level}
                    </Badge>
                  </div>
                </td>

                <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                  {s.email || <span className="text-gray-300 italic">Non renseigné</span>}
                </td>

                <td className="py-3 px-3 text-center">
                  {hasWishes ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {s.wishes_count} / {requiredWishes} vœux
                    </span>
                  ) : (
                    <span className="text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded-full">
                      En attente
                    </span>
                  )}
                </td>

                <td className="py-3 px-3 text-center">
                  {isPendingAllocation ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Non réparti ({assignedCount}/{rotationsCount})</span>
                    </span>
                  ) : isFullyAllocated ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Complet ({rotationsCount}/{rotationsCount})</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded-full">
                      Sans vœu
                    </span>
                  )}
                </td>

                <td className="py-3 px-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForQr(s)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-[#312783] hover:text-white text-gray-700 transition-colors font-medium shadow-2xs text-xs group"
                      title="Copie du lien : QR Code, copier/coller et lien direct"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#EB5E57] group-hover:text-white transition-colors" />
                      <span>Copie du lien</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(s.token)}
                      className="p-1 rounded-lg text-gray-400 hover:text-[#312783] hover:bg-gray-100 transition-colors"
                      title="Copier directement le lien élève"
                    >
                      {copiedToken === s.token ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={`/v/${s.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg text-gray-400 hover:text-[#312783] hover:bg-gray-100 transition-colors"
                      title="Ouvrir le profil élève dans un nouvel onglet"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Régénérer le lien unique sécurisé pour ${s.first_name} ${s.last_name} ? L'ancien lien ne fonctionnera plus.`
                          )
                        ) {
                          onRegenerateToken(s.id);
                        }
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Régénérer un nouveau jeton d'accès sécurisé"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer l'élève ${s.first_name} ${s.last_name} ?`)) {
                        onDeleteStudent(s.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Supprimer l'élève"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedStudentForQr && (
        <StudentQrModal
          isOpen={true}
          onClose={() => setSelectedStudentForQr(null)}
          studentName={`${selectedStudentForQr.first_name} ${selectedStudentForQr.last_name}`}
          studentClass={selectedStudentForQr.class_name}
          token={selectedStudentForQr.token}
        />
      )}
    </div>
  );
};
