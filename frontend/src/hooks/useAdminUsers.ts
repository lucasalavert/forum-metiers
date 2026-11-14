// 1. Responsabilité : Hooks TanStack Query pour la gestion des comptes utilisateurs administrateurs
// 2. Dépendances clés : @tanstack/react-query, src/lib/api/auth.api.ts
// 3. Mots-clés métier : use_admin_users, multi_accounts, team_management, mutations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '@/lib/api/auth.api';
import { AdminUserCreatePayload, AdminUserUpdatePayload } from '@/types/api';

export function useAdminUsersList() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    staleTime: 30 * 1000,
  });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: AdminUserCreatePayload) => createAdminUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: AdminUserUpdatePayload }) =>
      updateAdminUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
