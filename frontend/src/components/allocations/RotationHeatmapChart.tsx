// 1. Responsabilité : Matrice Heatmap ECharts dynamique (R1..RN) avec tri par remplissage et filtres
// 2. Dépendances clés : react, echarts-for-react, lucide-react, src/types/api.ts, src/hooks/useEventConfig
// 3. Mots-clés métier : heatmap_chart, occupancy_matrix, dynamic_rotations, sort_by_occupancy

import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ArrowUpDown, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FormationTensionItem } from '@/types/api';
import { useEventConfig } from '@/hooks/useEventConfig';
import { ROTATION_SCHEDULES } from '@/lib/constants';

export interface RotationHeatmapChartProps {
  tensions: FormationTensionItem[];
  defaultLimit?: number;
}

type SortMode = 'occupancy_desc' | 'occupancy_asc' | 'tension_desc' | 'alpha';
type ScopeFilter = 'all' | 'top15' | 'vacant' | 'full';

export const RotationHeatmapChart: React.FC<RotationHeatmapChartProps> = ({
  tensions,
  defaultLimit = 0,
}) => {
  const { data: config } = useEventConfig();
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(defaultLimit > 0 ? 'top15' : 'all');
  const [sortMode, setSortMode] = useState<SortMode>('occupancy_desc');
  const [searchQuery, setSearchQuery] = useState('');

  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;
  const activeRotations = useMemo(
    () => Array.from({ length: rotationsCount }, (_, i) => i + 1),
    [rotationsCount]
  );

  const processedList = useMemo(() => {
    let list = [...tensions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.domain.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortMode === 'occupancy_desc') return (b.assigned_total || 0) - (a.assigned_total || 0);
      if (sortMode === 'occupancy_asc') return (a.assigned_total || 0) - (b.assigned_total || 0);
      if (sortMode === 'tension_desc') return (b.tension_ratio || 0) - (a.tension_ratio || 0);
      return a.name.localeCompare(b.name, 'fr');
    });

    if (scopeFilter === 'top15') return list.slice(0, 15);
    if (scopeFilter === 'vacant') return list.filter((f) => (f.assigned_total || 0) < (f.capacity_total || 80));
    if (scopeFilter === 'full') return list.filter((f) => (f.assigned_total || 0) >= (f.capacity_total || 80));
    return list;
  }, [tensions, searchQuery, sortMode, scopeFilter]);

  const totalOfferedSeats = tensions.reduce((acc, f) => acc + (f.capacity_total || 80), 0);
  const totalAssignedSeats = tensions.reduce((acc, f) => acc + (f.assigned_total || 0), 0);
  const globalFillRate = totalOfferedSeats > 0 ? Math.round((totalAssignedSeats / totalOfferedSeats) * 100) : 0;
  const fullFormationsCount = tensions.filter((f) => (f.assigned_total || 0) >= (f.capacity_total || 80)).length;
  const vacantFormationsCount = tensions.length - fullFormationsCount;

  const option = useMemo(() => {
    const formationsY = processedList.map((f) =>
      f.name.length > 28 ? `${f.name.substring(0, 26)}...` : f.name
    );
    const rotationsX = activeRotations.map((rot) => {
      const slot = config?.rotations?.find((r) => r.rotation === rot);
      const timeStr = slot ? slot.start_time.replace(':', 'h') : ROTATION_SCHEDULES[rot]?.start.replace(':', 'h') || '';
      return `Rotation ${rot} (${timeStr})`;
    });

    const getOcc = (f: FormationTensionItem, rot: number): number => {
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

    const data: [number, number, number][] = [];
    processedList.forEach((f, yIdx) => {
      activeRotations.forEach((rot, xIdx) => {
        data.push([xIdx, yIdx, getOcc(f, rot)]);
      });
    });

    return {
      tooltip: {
        position: 'top',
        confine: true,
        formatter: (params: { data: [number, number, number] }) => {
          const [x, y, val] = params.data;
          const formation = processedList[y];
          if (!formation) return '';
          const totalAssigned = formation.assigned_total || 0;
          const capacityTotal = formation.capacity_total || 80;
          const percent = Math.round((totalAssigned / capacityTotal) * 100);

          return `
            <div style="font-size: 11px; line-height: 1.5;">
              <strong style="color: #272154;">${formation.code} — ${formation.name}</strong><br/>
              <span style="color: #666;">Domaine : ${formation.domain}</span><br/>
              <hr style="margin: 4px 0; border: none; border-top: 1px solid #eee;"/>
              <b>${rotationsX[x]}</b> : <b>${val} élèves</b><br/>
              <span>Remplissage global atelier : <b>${totalAssigned} / ${capacityTotal}</b> (${percent}%)</span>
            </div>
          `;
        },
      },
      grid: { top: '25px', bottom: '40px', left: '220px', right: '40px' },
      xAxis: {
        type: 'category',
        data: rotationsX,
        splitArea: { show: true },
        position: 'top',
        axisLabel: { fontSize: 11, fontWeight: 600, color: '#272154' },
      },
      yAxis: {
        type: 'category',
        data: formationsY,
        inverse: true,
        splitArea: { show: true },
        axisLabel: { interval: 0, fontSize: 11, color: '#272154' },
      },
      visualMap: {
        min: 0,
        max: 20,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0px',
        inRange: { color: ['#F3F1F0', '#00A68D', '#EB5E57', '#E62154'] },
        text: ['20 (Complet)', '0 (Vide)'],
        textStyle: { color: '#272154', fontSize: 11 },
      },
      series: [
        {
          name: 'Occupants',
          type: 'heatmap',
          data,
          label: {
            show: true,
            formatter: (p: { data: [number, number, number] }) => String(p.data[2]),
            color: '#272154',
            fontWeight: 'bold',
          },
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0, 0, 0, 0.4)' } },
        },
      ],
    };
  }, [processedList, activeRotations, config]);

  const calculatedHeight = Math.max(380, processedList.length * 28 + 90);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F3F1F0]/60 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#312783] w-48"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-300 text-xs">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                scopeFilter === 'all' ? 'bg-[#312783] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Toutes ({tensions.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('top15')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                scopeFilter === 'top15' ? 'bg-[#312783] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Top 15
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('vacant')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                scopeFilter === 'vacant' ? 'bg-[#312783] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Places dispos ({vacantFormationsCount})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('full')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                scopeFilter === 'full' ? 'bg-[#312783] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Complètes ({fullFormationsCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="py-1 px-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#312783]"
            >
              <option value="occupancy_desc">Tri : Remplissage décroissant (plus pleines)</option>
              <option value="occupancy_asc">Tri : Remplissage croissant (places dispos)</option>
              <option value="tension_desc">Tri : Tension des vœux élèves</option>
              <option value="alpha">Tri : Alphabétique (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Taux global : <b>{globalFillRate}%</b></span>
          </span>
          <span>
            <b>{processedList.length}</b> formations affichées
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xs relative z-0 isolate">
        {processedList.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Aucune formation ne correspond à vos filtres.
          </div>
        ) : (
          <div style={{ height: `${calculatedHeight}px`, minWidth: '700px' }}>
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
        )}
      </div>
    </div>
  );
};
