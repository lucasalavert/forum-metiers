// 1. Responsabilité : Hooks TanStack Query pour l'analyse des tensions, exécution du solveur et arbitrages
// 2. Dépendances clés : @tanstack/react-query, src/lib/api/allocations.api.ts
// 3. Mots-clés métier : use_allocations, solver_run, stats_query, manual_override

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AllocationRunPayload,
  AssignmentManualUpdatePayload,
  fetchAllocationAnalysis,
  runAllocation,
  updateAssignmentManual,
} from '@/lib/api/allocations.api';

export function useAllocationStats() {
  return useQuery({
    queryKey: ['allocations', 'analysis'],
    queryFn: fetchAllocationAnalysis,
    staleTime: 30 * 1000,
  });
}

export function useAllocationMutations() {
  const queryClient = useQueryClient();

  const runMutation = useMutation({
    mutationFn: (payload: AllocationRunPayload) => runAllocation(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['allocations', 'analysis'], data);
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: (payload: AssignmentManualUpdatePayload) => updateAssignmentManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    runMutation,
    overrideMutation,
  };
}
