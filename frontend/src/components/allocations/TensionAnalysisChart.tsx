// 1. Responsabilité : Graphique ECharts en barres comparant Demande totale vs Capacité par formation
// 2. Dépendances clés : react, echarts-for-react, src/types/api.ts
// 3. Mots-clés métier : tension_chart, echarts, demand_vs_capacity, top_formations

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { FormationTensionItem } from '@/types/api';

export interface TensionAnalysisChartProps {
  tensions: FormationTensionItem[];
  limit?: number;
}

export const TensionAnalysisChart: React.FC<TensionAnalysisChartProps> = ({
  tensions,
  limit = 10,
}) => {
  const option = useMemo(() => {
    const topTensions = [...tensions].slice(0, limit).reverse();
    const categories = topTensions.map((t) =>
      t.name.length > 28 ? `${t.name.substring(0, 26)}...` : t.name
    );
    const demandData = topTensions.map((t) => t.wishes_total);
    const capacityData = topTensions.map((t) => t.capacity_total);

    return {
      tooltip: {
        trigger: 'axis',
        confine: true,
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: 0,
        textStyle: { color: '#272154', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          color: '#272154',
          fontSize: 11,
        },
      },
      series: [
        {
          name: 'Vœux formulés (Demande)',
          type: 'bar',
          data: demandData,
          itemStyle: {
            color: '#EB5E57',
            borderRadius: [0, 4, 4, 0],
          },
        },
        {
          name: 'Capacité totale (4 rotations)',
          type: 'bar',
          data: capacityData,
          itemStyle: {
            color: '#312783',
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [tensions, limit]);

  return (
    <div className="w-full h-80 relative z-0 isolate">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
    </div>
  );
};
