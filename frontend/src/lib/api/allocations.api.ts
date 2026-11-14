// 1. Responsabilité : Fonctions asynchrones pures pour l'analyse, l'exécution du solveur et l'arbitrage
// 2. Dépendances clés : src/lib/api/client.ts, src/types/api.ts
// 3. Mots-clés métier : allocations_api, solver_run, tension_analysis, arbitrage, manual_override

import { apiClient } from './client';
import { AllocationStatsResponse } from '@/types/api';
import { AssignmentBrief } from '@/types/domain';

export interface AllocationRunPayload {
  auto_fill_missing: boolean;
  respect_locks: boolean;
}

export interface AssignmentManualUpdatePayload {
  student_id: number;
  rotation: number;
  formation_id?: number | null;
  assignment_type: 'FORMATION' | 'SPECIALTY';
  is_locked: boolean;
}

export async function fetchAllocationAnalysis(): Promise<AllocationStatsResponse> {
  const { data } = await apiClient.get<AllocationStatsResponse>('/allocations/analysis');
  return data;
}

export async function runAllocation(payload: AllocationRunPayload): Promise<AllocationStatsResponse> {
  const { data } = await apiClient.post<AllocationStatsResponse>('/allocations/run', payload);
  return data;
}

export async function updateAssignmentManual(payload: AssignmentManualUpdatePayload): Promise<AssignmentBrief> {
  const { data } = await apiClient.put<AssignmentBrief>('/allocations/assignments', payload);
  return data;
}
