// 1. Responsabilité : Hooks TanStack Query pour la gestion asynchrone des élèves et des classes
// 2. Dépendances clés : @tanstack/react-query, src/lib/api/students.api.ts
// 3. Mots-clés métier : use_students, student_queries, class_configs, csv_import

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStudent,
  deleteStudent,
  fetchClassConfigs,
  fetchStudents,
  importStudentsCSV,
  importWishesCSV,
  regenerateAllTokens,
  regenerateStudentToken,
  StudentFilterParams,
  updateClassSpecialtyRotations,
  updateStudent,
} from '@/lib/api/students.api';
import { StudentItem } from '@/types/domain';

export function useStudentsList(params?: StudentFilterParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => fetchStudents(params),
    staleTime: 60 * 1000,
  });
}

export function useClassConfigs() {
  return useQuery({
    queryKey: ['class-configs'],
    queryFn: fetchClassConfigs,
    staleTime: 60 * 1000,
  });
}

export function useStudentMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: Partial<StudentItem>) => createStudent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['class-configs'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<StudentItem> }) =>
      updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const updateSpecialtyMutation = useMutation({
    mutationFn: ({ className, specialtyRotations }: { className: string; specialtyRotations: string }) =>
      updateClassSpecialtyRotations(className, specialtyRotations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-configs'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: (file: File) => importStudentsCSV(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['class-configs'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const importWishesCsvMutation = useMutation({
    mutationFn: (file: File) => importWishesCSV(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: (studentId: number) => regenerateStudentToken(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const regenerateAllTokensMutation = useMutation({
    mutationFn: () => regenerateAllTokens(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateSpecialtyMutation,
    importCsvMutation,
    importWishesCsvMutation,
    regenerateTokenMutation,
    regenerateAllTokensMutation,
  };
}
