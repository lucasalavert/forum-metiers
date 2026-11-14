// 1. Responsabilité : Appels API pour la configuration générale, l'archive annuelle (.zip) et la purge sélective
// 2. Dépendances clés : src/lib/api/client, src/types/api
// 3. Mots-clés métier : config_api, event_settings, annual_archive, selective_purge

import { apiClient } from './client';
import {
  EventConfig,
  EventConfigUpdatePayload,
  PurgeForumDataPayload,
  PurgeForumDataResponse,
} from '@/types/api';

export async function getEventConfig(): Promise<EventConfig> {
  const { data } = await apiClient.get<EventConfig>('/config');
  return data;
}

export async function updateEventConfig(payload: EventConfigUpdatePayload): Promise<EventConfig> {
  const { data } = await apiClient.put<EventConfig>('/config', payload);
  return data;
}

export async function downloadAnnualArchiveZip(eventDate?: string): Promise<void> {
  const response = await apiClient.get<Blob>('/config/archive', {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDate = (eventDate || 'edition').replace(/\//g, '-');
  link.href = url;
  link.download = `archive_forum_${safeDate}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function purgeForumData(payload: PurgeForumDataPayload): Promise<PurgeForumDataResponse> {
  const { data } = await apiClient.post<PurgeForumDataResponse>('/config/purge', payload);
  return data;
}
