// 1. Responsabilité : Barre de configuration des créneaux Spécialités pour les classes de Seconde
// 2. Dépendances clés : react, src/types/domain.ts, src/components/ui/Card, src/hooks/useEventConfig
// 3. Mots-clés métier : specialty_rotations, seconde_config, auto_balance, class_settings

import React from 'react';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ClassConfigItem } from '@/types/domain';
import { useEventConfig } from '@/hooks/useEventConfig';

export interface SecondeSpecialtiesBarProps {
  configs: ClassConfigItem[];
  onUpdateSpecialty: (className: string, specialtyRotations: string) => void;
}

export const SecondeSpecialtiesBar: React.FC<SecondeSpecialtiesBarProps> = ({
  configs,
  onUpdateSpecialty,
}) => {
  const { data: eventConfig } = useEventConfig();
  const secondeConfigs = configs.filter((c) => c.level === '2NDE');

  const rotationsCount = eventConfig?.rotations_count ?? eventConfig?.rotations?.length ?? 4;
  const specSlots = eventConfig?.seconde_specialty_slots ?? 2;

  if (secondeConfigs.length === 0 || specSlots <= 0) return null;

  const workshopsCount = Math.max(1, rotationsCount - specSlots);

  const singleSlotOptions = Array.from({ length: rotationsCount }, (_, i) => i + 1).map((r) => ({
    value: String(r),
    label: `Spécialité en R${r}`,
  }));

  const pairSlotOptions: Array<{ value: string; label: string }> = [
    { value: '1,2', label: 'Spécialités en R1 + R2' },
    { value: '3,4', label: 'Spécialités en R3 + R4' },
    { value: '1,3', label: 'Spécialités en R1 + R3' },
    { value: '2,4', label: 'Spécialités en R2 + R4' },
  ].filter((opt) =>
    opt.value.split(',').every((n) => Number(n) <= rotationsCount)
  );

  if (rotationsCount >= 5) {
    pairSlotOptions.push({ value: '4,5', label: 'Spécialités en R4 + R5' });
  }
  if (rotationsCount >= 6) {
    pairSlotOptions.push({ value: '5,6', label: 'Spécialités en R5 + R6' });
  }

  const slotOptions = specSlots === 1 ? singleSlotOptions : pairSlotOptions;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200/60 p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5 shadow-sm">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm text-[#272154]">
              Organisation des Secondes • Présentation des Enseignements de Spécialité
            </h2>
            <span className="text-xs bg-purple-200/80 text-purple-900 font-semibold px-2 py-0.5 rounded-full">
              {specSlots} créneau{specSlots > 1 ? 'x' : ''} réservé{specSlots > 1 ? 's' : ''} / classe
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Les élèves de 2nde participent à <b>{workshopsCount} atelier(s)</b> et assistent à{' '}
            <b>{specSlots} créneau(x)</b> de présentation des spécialités de 1ère. Vous pouvez fixer les créneaux
            par classe, laisser le moteur optimiser en mode "AUTO", ou exempter une classe ("Aucun blocage").
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {secondeConfigs.map((cfg) => (
              <div
                key={cfg.class_name}
                className="bg-white p-3 rounded-xl border border-purple-100 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#272154]">{cfg.class_name}</span>
                  <span className="text-[10px] text-gray-500 font-medium">{cfg.students_count} élèves</span>
                </div>
                <select
                  value={cfg.specialty_rotations}
                  onChange={(e) => onUpdateSpecialty(cfg.class_name, e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg border border-gray-300 bg-white font-medium text-[#272154] focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="AUTO">AUTO (Optimisé)</option>
                  {slotOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="NONE">Aucun blocage (toutes rotations libres)</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
