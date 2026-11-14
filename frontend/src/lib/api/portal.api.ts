// 1. Responsabilité : Fonctions asynchrones pures d'accès au portail élève par token unique
// 2. Dépendances clés : src/lib/api/client.ts, src/types/api.ts
// 3. Mots-clés métier : portal_api, student_token, wishes_submit, student_schedule

import { apiClient } from './client';
import { StudentPortalResponse } from '@/types/api';

export interface WishPayloadItem {
  formation_id: number;
  rank: number;
}

export async function fetchPortalStudent(token: string): Promise<StudentPortalResponse> {
  const { data } = await apiClient.get<StudentPortalResponse>(`/portal/${token}`);
  return data;
}

export async function submitStudentWishes(token: string, wishes: WishPayloadItem[]): Promise<StudentPortalResponse> {
  const { data } = await apiClient.put<StudentPortalResponse>(`/portal/${token}/wishes`, { wishes });
  return data;
}
