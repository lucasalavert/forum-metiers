// 1. Responsabilité : Fonctions asynchrones pures d'accès aux API de formations
// 2. Dépendances clés : src/lib/api/client.ts, src/types/*
// 3. Mots-clés métier : formations_api, fetch_formations, create_formation, update_formation, delete_formation, import_csv

import { apiClient } from './client';
import { CSVImportResultResponse, FormationListResponse } from '@/types/api';
import { FormationItem } from '@/types/domain';

export async function fetchFormations(level?: string): Promise<FormationListResponse> {
  const params = level ? { level } : {};
  const { data } = await apiClient.get<FormationListResponse>('/formations', { params });
  return data;
}

export async function fetchFormation(id: number): Promise<FormationItem> {
  const { data } = await apiClient.get<FormationItem>(`/formations/${id}`);
  return data;
}

export async function createFormation(payload: Partial<FormationItem>): Promise<FormationItem> {
  const { data } = await apiClient.post<FormationItem>('/formations', payload);
  return data;
}

export async function updateFormation(id: number, payload: Partial<FormationItem>): Promise<FormationItem> {
  const { data } = await apiClient.put<FormationItem>(`/formations/${id}`, payload);
  return data;
}

export async function deleteFormation(id: number): Promise<void> {
  await apiClient.delete(`/formations/${id}`);
}

export async function importFormationsCSV(file: File): Promise<CSVImportResultResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<CSVImportResultResponse>('/formations/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
