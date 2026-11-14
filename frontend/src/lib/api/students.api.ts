// 1. Responsabilité : Fonctions asynchrones pures d'accès aux API des élèves et des classes
// 2. Dépendances clés : src/lib/api/client.ts, src/types/*
// 3. Mots-clés métier : students_api, fetch_students, class_configs, update_specialty, import_csv

import { apiClient } from './client';
import { CSVImportResultResponse, StudentListResponse } from '@/types/api';
import { ClassConfigItem, StudentItem } from '@/types/domain';

export interface StudentFilterParams {
  level?: string;
  class_name?: string;
  has_wishes?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export async function fetchStudents(params?: StudentFilterParams): Promise<StudentListResponse> {
  const { data } = await apiClient.get<StudentListResponse>('/students', { params });
  return data;
}

export async function fetchStudent(id: number): Promise<StudentItem> {
  const { data } = await apiClient.get<StudentItem>(`/students/${id}`);
  return data;
}

export async function createStudent(payload: Partial<StudentItem>): Promise<StudentItem> {
  const { data } = await apiClient.post<StudentItem>('/students', payload);
  return data;
}

export async function updateStudent(id: number, payload: Partial<StudentItem>): Promise<StudentItem> {
  const { data } = await apiClient.put<StudentItem>(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id: number): Promise<void> {
  await apiClient.delete(`/students/${id}`);
}

export async function fetchClassConfigs(): Promise<ClassConfigItem[]> {
  const { data } = await apiClient.get<ClassConfigItem[]>('/students/class-configs');
  return data;
}

export async function updateClassSpecialtyRotations(
  className: string,
  specialtyRotations: string
): Promise<ClassConfigItem> {
  const { data } = await apiClient.put<ClassConfigItem>(
    `/students/class-configs/${encodeURIComponent(className)}`,
    { specialty_rotations: specialtyRotations }
  );
  return data;
}

export async function importStudentsCSV(file: File): Promise<CSVImportResultResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<CSVImportResultResponse>('/students/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function importWishesCSV(file: File): Promise<CSVImportResultResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<CSVImportResultResponse>('/students/import-wishes-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function regenerateStudentToken(studentId: number): Promise<StudentItem> {
  const { data } = await apiClient.post<StudentItem>(`/students/${studentId}/regenerate-token`);
  return data;
}

export async function regenerateAllTokens(): Promise<{ updated_count: number }> {
  const { data } = await apiClient.post<{ updated_count: number }>('/students/regenerate-all-tokens');
  return data;
}

