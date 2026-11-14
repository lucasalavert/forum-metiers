// 1. Responsabilité : Hooks React Query pour la consultation et mise à jour de la configuration globale
// 2. Dépendances clés : react, @tanstack/react-query, src/lib/api/config.api, src/hooks/useDocumentTitle
// 3. Mots-clés métier : use_event_config, query, mutation, reactive_settings, theme_sync

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEventConfig, updateEventConfig } from '@/lib/api/config.api';
import { syncDocumentThemeColors } from '@/hooks/useDocumentTitle';
import { EventConfigUpdatePayload } from '@/types/api';

export const EVENT_CONFIG_QUERY_KEY = ['eventConfig'] as const;

export function useEventConfig() {
  const query = useQuery({
    queryKey: EVENT_CONFIG_QUERY_KEY,
    queryFn: getEventConfig,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      syncDocumentThemeColors(
        query.data.theme_primary_color,
        query.data.theme_secondary_color,
        query.data.theme_accent_color
      );
    }
  }, [
    query.data?.theme_primary_color,
    query.data?.theme_secondary_color,
    query.data?.theme_accent_color,
  ]);

  return query;
}

export function useUpdateEventConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventConfigUpdatePayload) => updateEventConfig(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(EVENT_CONFIG_QUERY_KEY, data);
      syncDocumentThemeColors(
        data.theme_primary_color,
        data.theme_secondary_color,
        data.theme_accent_color
      );
    },
  });
}
