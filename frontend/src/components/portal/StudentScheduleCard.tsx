// 1. Responsabilité : Affichage visuel du planning de l'élève pour le forum (R1..RN dynamique)
// 2. Dépendances clés : react, lucide-react, src/types/domain.ts, src/lib/constants.ts
// 3. Mots-clés métier : student_schedule, rotations_display, timetable, room_guide

import React from 'react';
import { Clock, MapPin, UserCheck, Calendar } from 'lucide-react';
import { AssignmentBrief } from '@/types/domain';
import { ROTATION_SCHEDULES } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { useEventConfig } from '@/hooks/useEventConfig';

export interface StudentScheduleCardProps {
  assignments: AssignmentBrief[];
  studentName: string;
  className: string;
}

export const StudentScheduleCard: React.FC<StudentScheduleCardProps> = ({
  assignments,
  studentName,
  className,
}) => {
  const { data: config } = useEventConfig();
  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;
  const activeRotations = Array.from({ length: rotationsCount }, (_, i) => i + 1);

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
        <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
        <h4 className="font-heading font-bold text-base text-[#272154]">Planning en cours d'élaboration</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          La répartition automatique des formations n'a pas encore été publiée par l'équipe de direction. Dès que les affectations seront validées, vous retrouverez votre emploi du temps personnalisé ici.
        </p>
      </div>
    );
  }

  const dateDisplay = config?.event_date_label
    ? `${config.event_date_label} • Forum (${rotationsCount} rotations)`
    : 'Mercredi 20 janvier 2027 • 08h30 - 12h00';

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
        <div>
          <span className="text-xs font-semibold text-[#EB5E57] uppercase tracking-wider">
            {dateDisplay}
          </span>
          <h3 className="font-heading font-bold text-lg text-[#272154]">
            Mon Emploi du Temps — {studentName} ({className})
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          Planning Officiel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeRotations.map((rot) => {
          const assign = assignments.find((a) => a.rotation === rot);
          const dynSlot = config?.rotations.find((r) => r.rotation === rot);
          const timeDisplay = dynSlot
            ? `${dynSlot.start_time.replace(':', 'h')} – ${dynSlot.end_time.replace(':', 'h')}`
            : ROTATION_SCHEDULES[rot]?.time || '';
          const labelDisplay = dynSlot ? `Rotation ${rot}` : ROTATION_SCHEDULES[rot]?.label || `Rotation ${rot}`;
          const isSpecialty = assign?.assignment_type === 'SPECIALTY';

          return (
            <div
              key={rot}
              className={`p-4 rounded-xl border transition-all ${
                isSpecialty
                  ? 'bg-purple-50/70 border-purple-200'
                  : 'bg-white border-gray-200/90 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
                <span className="flex items-center gap-1 font-mono text-[#312783]">
                  <Clock className="w-3.5 h-3.5" />
                  {labelDisplay} • {timeDisplay}
                </span>
                {assign?.wish_rank_obtained && (
                  <Badge size="sm" variant={assign.wish_rank_obtained <= 2 ? 'success' : 'secondary'}>
                    Vœu {assign.wish_rank_obtained}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-sm text-[#272154] leading-snug">
                  {assign?.formation_name || 'Non attribué'}
                </h4>

                {assign?.speaker_name && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span>{assign.speaker_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#312783] bg-black/5 px-2.5 py-1 rounded-lg w-fit">
                  <MapPin className="w-3.5 h-3.5 text-[#EB5E57]" />
                  <span>{assign?.formation_room || 'Salle à préciser'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
