// 1. Responsabilité : Hooks TanStack Query pour la gestion asynchrone des formations
// 2. Dépendances clés : @tanstack/react-query, src/lib/api/formations.api.ts
// 3. Mots-clés métier : use_formations, queries, mutations, cache_invalidation

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFormation,
  deleteFormation,
  fetchFormation,
  fetchFormations,
  importFormationsCSV,
  updateFormation,
} from '@/lib/api/formations.api';
import { FormationItem } from '@/types/domain';

export function useFormationsList(level?: string) {
  return useQuery({
    queryKey: ['formations', level],
    queryFn: () => fetchFormations(level),
    staleTime: 60 * 1000,
  });
}

export function useFormationDetail(id: number | null) {
  return useQuery({
    queryKey: ['formation', id],
    queryFn: () => (id ? fetchFormation(id) : null),
    enabled: !!id,
  });
}

export function useFormationMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: Partial<FormationItem>) => createFormation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FormationItem> }) =>
      updateFormation(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['formation', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFormation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: (file: File) => importFormationsCSV(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    importCsvMutation,
  };
}
