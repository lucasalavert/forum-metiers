// 1. Responsabilité : Graphique en donut ECharts montrant la répartition des vœux obtenus
// 2. Dépendances clés : react, echarts-for-react, src/types/api.ts
// 3. Mots-clés métier : satisfaction_donut, echarts, rank_breakdown, visual_report

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { SatisfactionBreakdown } from '@/types/api';

export interface SatisfactionDonutChartProps {
  data?: SatisfactionBreakdown;
}

export const SatisfactionDonutChart: React.FC<SatisfactionDonutChartProps> = ({ data }) => {
  const option = useMemo(() => {
    if (!data) return {};

    const chartData = [
      { value: data.rank_1_count, name: 'Vœu 1 (Prioritaire)', itemStyle: { color: '#00A68D' } },
      { value: data.rank_2_count, name: 'Vœu 2', itemStyle: { color: '#00B1EB' } },
      { value: data.rank_3_count, name: 'Vœu 3', itemStyle: { color: '#312783' } },
      { value: data.rank_4_plus_count, name: 'Vœu 4 à 6', itemStyle: { color: '#EB5E57' } },
      { value: data.unassigned_or_fallback_count, name: 'Hors-vœux', itemStyle: { color: '#E62154' } },
      { value: data.specialty_count, name: 'Spécialités 2nde', itemStyle: { color: '#9E2986' } },
    ].filter((item) => item.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: '{b}: <b>{c}</b> ({d}%)',
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'circle',
        itemGap: 14,
        textStyle: {
          fontSize: 11,
          color: '#272154',
          fontFamily: 'Inter',
        },
      },
      series: [
        {
          name: 'Vœux obtenus',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: chartData,
        },
      ],
    };
  }, [data]);

  return (
    <div className="w-full h-72 relative z-0 isolate">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
    </div>
  );
};
