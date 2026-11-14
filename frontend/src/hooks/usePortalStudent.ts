// 1. Responsabilité : Hooks TanStack Query pour la consultation et soumission des vœux du portail élève
// 2. Dépendances clés : @tanstack/react-query, src/lib/api/portal.api.ts
// 3. Mots-clés métier : use_portal, student_token, wishes_mutation, student_view

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPortalStudent, submitStudentWishes, WishPayloadItem } from '@/lib/api/portal.api';

export function usePortalStudent(token: string) {
  return useQuery({
    queryKey: ['portal', token],
    queryFn: () => fetchPortalStudent(token),
    enabled: !!token,
    staleTime: 30 * 1000,
  });
}

export function usePortalWishesMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishes: WishPayloadItem[]) => submitStudentWishes(token, wishes),
    onSuccess: (data) => {
      queryClient.setQueryData(['portal', token], data);
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });
}
