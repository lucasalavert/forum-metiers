// 1. Responsabilité : Visualisation des résultats par classe et des feuilles d'émargement par formation (R1..RN)
// 2. Dépendances clés : react, src/hooks/*, src/components/*, src/lib/utils/csv
// 3. Mots-clés métier : results_page, schedule_view, attendance_sheet, class_timetable, export_csv

import { useState } from 'react';
import { Download, Users, GraduationCap } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStudentsList } from '@/hooks/useStudents';
import { useFormationsList } from '@/hooks/useFormations';
import { useEventConfig } from '@/hooks/useEventConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ROTATION_SCHEDULES } from '@/lib/constants';
import { downloadCSV } from '@/lib/utils/csv';

export default function ResultsSchedulePage() {
  useDocumentTitle('Plannings & Résultats');
  const [activeTab, setActiveTab] = useState<'class' | 'formation'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedFormationId, setSelectedFormationId] = useState<number | null>(null);

  const { data: studentsData } = useStudentsList({ size: 1000 });
  const { data: formationsData } = useFormationsList();
  const { data: config } = useEventConfig();

  const students = studentsData?.items || [];
  const formations = formationsData?.items || [];
  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;
  const activeRotations = Array.from({ length: rotationsCount }, (_, i) => i + 1);

  const getRotLabel = (rot: number) => {
    const slot = config?.rotations.find((r) => r.rotation === rot);
    return slot ? slot.label : `R${rot} (${ROTATION_SCHEDULES[rot]?.time || ''})`;
  };

  const getRotTime = (rot: number) => {
    const slot = config?.rotations.find((r) => r.rotation === rot);
    return slot
      ? `${slot.start_time.replace(':', 'h')} – ${slot.end_time.replace(':', 'h')}`
      : ROTATION_SCHEDULES[rot]?.time || '';
  };

  const allClasses = Array.from(new Set(students.map((s) => s.class_name))).sort();
  const currentClass = selectedClass || allClasses[0] || '';
  const currentFormation =
    formations.find((f) => f.id === selectedFormationId) || formations[0] || null;
  const studentsInClass = students.filter((s) => s.class_name === currentClass);

  const handleExportClassScheduleCSV = () => {
    const rotHeaders = activeRotations.flatMap((rot) => [getRotLabel(rot), `Salle R${rot}`]);
    const rows = [
      ['Nom', 'Prenom', 'Classe', ...rotHeaders],
      ...studentsInClass.map((s) => {
        const rotCells = activeRotations.flatMap((rot) => {
          const a = s.assignments.find((item) => item.rotation === rot);
          return [a?.formation_name || 'Non attribué', a?.formation_room || ''];
        });
        return [s.last_name, s.first_name, s.class_name, ...rotCells];
      }),
    ];
    downloadCSV(`planning_classe_${currentClass.replace(/\s+/g, '_')}.csv`, rows);
  };

  const handleExportFormationAttendanceCSV = () => {
    if (!currentFormation) return;
    const rows: (string | number)[][] = [['Rotation', 'Horaire', 'Salle', 'Nom', 'Prenom', 'Classe']];
    activeRotations.forEach((rot) => {
      const attendees = students.filter((s) =>
        s.assignments.some((a) => a.rotation === rot && a.formation_id === currentFormation.id)
      );
      attendees.forEach((s) => {
        rows.push([
          `Rotation ${rot}`,
          getRotTime(rot),
          currentFormation.room || 'Salle standard',
          s.last_name,
          s.first_name,
          s.class_name,
        ]);
      });
    });
    downloadCSV(`emargement_${currentFormation.code}_${currentFormation.name.substring(0, 20)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">
            Plannings Générés & Feuilles d'Émargement
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Visualisez et exportez les emplois du temps ({rotationsCount} rotations) pour les classes ou les intervenants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'class' ? (
            <Button variant="primary" size="sm" onClick={handleExportClassScheduleCSV}>
              <Download className="w-4 h-4" />
              <span>Exporter planning classe ({currentClass})</span>
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleExportFormationAttendanceCSV}>
              <Download className="w-4 h-4" />
              <span>Exporter feuille d'émargement ({currentFormation?.code})</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-4">
        {[
          { id: 'class' as const, label: 'Vue par Classe (Emploi du temps élève)', icon: Users },
          { id: 'formation' as const, label: "Vue par Formation & Salle (Feuille d'appel intervenant)", icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#EB5E57] text-[#EB5E57]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'class' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Choisir une classe :</span>
            <div className="flex flex-wrap gap-1.5">
              {allClasses.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                    currentClass === c
                      ? 'bg-[#312783] text-white font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Card className="p-0 overflow-hidden border border-gray-200">
            <div className="p-4 bg-[#272154] text-white flex justify-between items-center">
              <div>
                <h3 className="font-heading font-bold text-base">Classe : {currentClass}</h3>
                <p className="text-xs text-white/70">{studentsInClass.length} élèves inscrits</p>
              </div>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-mono">
                {config?.event_date_label || 'Mercredi 20 janvier 2027'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Élève</th>
                    {activeRotations.map((rot) => (
                      <th key={rot} className="py-2.5 px-3 font-semibold">{getRotLabel(rot)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsInClass.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-4 font-semibold text-[#272154]">
                        {s.last_name} {s.first_name}
                      </td>
                      {activeRotations.map((rot) => {
                        const a = s.assignments.find((item) => item.rotation === rot);
                        const isSpec = a?.assignment_type === 'SPECIALTY';
                        return (
                          <td key={rot} className="py-2.5 px-3">
                            {isSpec ? (
                              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium block">
                                Spécialités 2nde
                              </span>
                            ) : a?.formation_name ? (
                              <div>
                                <span className="font-medium text-[#272154] block truncate max-w-[180px]">
                                  {a.formation_name}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {a.formation_room || 'Salle std'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Non attribué</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Choisir une formation :</span>
            <select
              value={currentFormation?.id || ''}
              onChange={(e) => setSelectedFormationId(Number(e.target.value))}
              className="text-xs p-2 rounded-xl border border-gray-300 bg-white max-w-xl font-medium"
            >
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  [{f.code}] {f.name} — Salle : {f.room || 'Salle std'}
                </option>
              ))}
            </select>
          </div>

          {currentFormation && (
            <Card className="p-6 border border-gray-200 space-y-6">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#312783] bg-[#312783]/10 px-2 py-0.5 rounded">
                      {currentFormation.code}
                    </span>
                    <Badge variant="secondary">{currentFormation.domain}</Badge>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-[#272154] mt-1">
                    {currentFormation.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>Intervenant : <b>{currentFormation.speaker_name || 'Non renseigné'}</b></span>
                    <span>Salle : <b>{currentFormation.room || 'Salle standard'}</b></span>
                    <span>Capacité : <b>{currentFormation.capacity_per_rotation} élèves / créneau</b></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeRotations.map((rot) => {
                  const attendees = students.filter((s) =>
                    s.assignments.some((a) => a.rotation === rot && a.formation_id === currentFormation.id)
                  );
                  return (
                    <div key={rot} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-2">
                        <span className="font-bold text-xs text-[#272154]">Rotation {rot}</span>
                        <span className="text-[11px] font-mono text-gray-500">{getRotTime(rot)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                        <span>Présents ({attendees.length})</span>
                        <span
                          className={
                            attendees.length >= currentFormation.capacity_per_rotation
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }
                        >
                          {attendees.length}/{currentFormation.capacity_per_rotation}
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs max-h-60 overflow-y-auto pr-1">
                        {attendees.map((at, idx) => (
                          <li
                            key={at.id}
                            className="p-1.5 bg-white rounded border border-gray-100 flex items-center justify-between"
                          >
                            <span className="truncate">
                              {idx + 1}. {at.last_name} {at.first_name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium ml-1 shrink-0">
                              {at.class_name}
                            </span>
                          </li>
                        ))}
                        {attendees.length === 0 && (
                          <li className="text-gray-400 italic text-center py-4">Aucun élève</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
