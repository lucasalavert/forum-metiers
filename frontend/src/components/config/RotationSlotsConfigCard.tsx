// 1. Responsabilité : Carte de configuration du nombre de rotations (2 à 6), des spécialités 2nde et des horaires
// 2. Dépendances clés : react, lucide-react, src/components/ui/Card
// 3. Mots-clés métier : rotation_slots_card, rotations_count, seconde_specialty_slots, r1_r6_schedules

import React from 'react';
import { Clock, Info, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export interface RotationTimesState {
  r1Start: string;
  r1End: string;
  r2Start: string;
  r2End: string;
  r3Start: string;
  r3End: string;
  r4Start: string;
  r4End: string;
  r5Start: string;
  r5End: string;
  r6Start: string;
  r6End: string;
}

export interface RotationSlotsConfigCardProps {
  rotationsCount: number;
  secondeSpecialtySlots: number;
  times: RotationTimesState;
  onChangeRotationsCount: (count: number) => void;
  onChangeSecondeSpecialtySlots: (slots: number) => void;
  onChange: (key: keyof RotationTimesState, value: string) => void;
}

export const RotationSlotsConfigCard: React.FC<RotationSlotsConfigCardProps> = ({
  rotationsCount,
  secondeSpecialtySlots,
  times,
  onChangeRotationsCount,
  onChangeSecondeSpecialtySlots,
  onChange,
}) => {
  const allSlots: Array<{
    rot: number;
    title: string;
    desc: string;
    startKey: keyof RotationTimesState;
    endKey: keyof RotationTimesState;
  }> = [
    { rot: 1, title: 'Rotation 1 (R1)', desc: 'Premier créneau', startKey: 'r1Start', endKey: 'r1End' },
    { rot: 2, title: 'Rotation 2 (R2)', desc: 'Deuxième créneau', startKey: 'r2Start', endKey: 'r2End' },
    { rot: 3, title: 'Rotation 3 (R3)', desc: 'Troisième créneau', startKey: 'r3Start', endKey: 'r3End' },
    { rot: 4, title: 'Rotation 4 (R4)', desc: 'Quatrième créneau', startKey: 'r4Start', endKey: 'r4End' },
    { rot: 5, title: 'Rotation 5 (R5)', desc: 'Cinquième créneau', startKey: 'r5Start', endKey: 'r5End' },
    { rot: 6, title: 'Rotation 6 (R6)', desc: 'Sixième créneau', startKey: 'r6Start', endKey: 'r6End' },
  ];

  const activeSlots = allSlots.slice(0, Math.max(2, Math.min(6, rotationsCount)));
  const maxSpecAllowed = Math.min(2, Math.max(0, rotationsCount - 1));

  return (
    <Card className="p-6 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#312783]" />
          <h3 className="font-heading font-bold text-sm text-[#272154]">
            Format des Rotations & Spécialités Secondes
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#312783] bg-[#312783]/10 px-2 py-0.5 rounded-full">
          {rotationsCount} rotations actives
        </span>
      </div>

      {/* Sélecteurs de structure du forum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F3F1F0]/60 border border-gray-200">
        <div>
          <label className="block text-xs font-semibold text-[#272154] mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#312783]" />
            <span>Nombre total de rotations</span>
          </label>
          <select
            value={rotationsCount}
            onChange={(e) => {
              const nextRot = Number(e.target.value);
              onChangeRotationsCount(nextRot);
              if (secondeSpecialtySlots >= nextRot) {
                onChangeSecondeSpecialtySlots(Math.max(0, nextRot - 1));
              }
            }}
            className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-semibold text-[#272154] focus:outline-none focus:ring-2 focus:ring-[#312783]"
          >
            {[2, 3, 4, 5, 6].map((cnt) => (
              <option key={cnt} value={cnt}>
                {cnt} rotations (R1 à R{cnt})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#272154] mb-1">
            Créneaux Spécialités réservés (2ndes)
          </label>
          <select
            value={Math.min(secondeSpecialtySlots, maxSpecAllowed)}
            onChange={(e) => onChangeSecondeSpecialtySlots(Number(e.target.value))}
            className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-semibold text-[#272154] focus:outline-none focus:ring-2 focus:ring-[#312783]"
          >
            <option value={0}>0 — Aucun blocage ({rotationsCount} ateliers)</option>
            {maxSpecAllowed >= 1 && (
              <option value={1}>1 créneau Spécialités ({rotationsCount - 1} atelier(s))</option>
            )}
            {maxSpecAllowed >= 2 && (
              <option value={2}>2 créneaux Spécialités ({rotationsCount - 2} atelier(s))</option>
            )}
          </select>
        </div>
      </div>

      {/* Plages horaires dynamiques R1..RN */}
      <div className="space-y-2.5">
        {activeSlots.map((s, idx) => (
          <React.Fragment key={s.startKey}>
            {idx === 2 && (
              <div className="py-1 px-3 text-[11px] text-gray-500 flex items-center justify-center gap-2 border-y border-dashed border-gray-200">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Pause pédagogique / interclasse</span>
              </div>
            )}
            <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-heading font-bold text-xs text-[#272154]">{s.title}</span>
                <p className="text-[10px] text-gray-500">{s.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  required
                  value={times[s.startKey]}
                  onChange={(e) => onChange(s.startKey, e.target.value)}
                  className="text-xs p-1.5 rounded-lg border border-gray-300 bg-white"
                />
                <span className="text-xs text-gray-400">à</span>
                <input
                  type="time"
                  required
                  value={times[s.endKey]}
                  onChange={(e) => onChange(s.endKey, e.target.value)}
                  className="text-xs p-1.5 rounded-lg border border-gray-300 bg-white"
                />
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Le solveur OR-Tools, la grille d'arbitrage, les plannings élèves et les feuilles d'émargement
          s'adaptent automatiquement au nombre de rotations et de créneaux Spécialités choisis.
        </p>
      </div>
    </Card>
  );
};
