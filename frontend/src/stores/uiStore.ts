// 1. Responsabilité : Gestion de l'état UI client (filtres, modales, recherche active)
// 2. Dépendances clés : zustand, immer
// 3. Mots-clés métier : ui_store, zustand, client_state, filters, modal_visibility

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UiState {
  selectedLevelFilter: string | null;
  selectedClassFilter: string | null;
  searchFilter: string;
  isFormationModalOpen: boolean;
  editingFormationId: number | null;
  isCsvImportModalOpen: boolean;
  csvImportType: 'formations' | 'students' | 'wishes' | null;

  setLevelFilter: (level: string | null) => void;
  setClassFilter: (className: string | null) => void;
  setSearchFilter: (query: string) => void;
  openFormationModal: (formationId?: number | null) => void;
  closeFormationModal: () => void;
  openCsvImportModal: (type: 'formations' | 'students' | 'wishes') => void;
  closeCsvImportModal: () => void;
  resetFilters: () => void;
}

export const useUiStore = create<UiState>()(
  immer((set) => ({
    selectedLevelFilter: null,
    selectedClassFilter: null,
    searchFilter: '',
    isFormationModalOpen: false,
    editingFormationId: null,
    isCsvImportModalOpen: false,
    csvImportType: null,

    setLevelFilter: (level) =>
      set((state) => {
        state.selectedLevelFilter = level;
      }),
    setClassFilter: (className) =>
      set((state) => {
        state.selectedClassFilter = className;
      }),
    setSearchFilter: (query) =>
      set((state) => {
        state.searchFilter = query;
      }),
    openFormationModal: (formationId = null) =>
      set((state) => {
        state.isFormationModalOpen = true;
        state.editingFormationId = formationId;
      }),
    closeFormationModal: () =>
      set((state) => {
        state.isFormationModalOpen = false;
        state.editingFormationId = null;
      }),
    openCsvImportModal: (type) =>
      set((state) => {
        state.isCsvImportModalOpen = true;
        state.csvImportType = type;
      }),
    closeCsvImportModal: () =>
      set((state) => {
        state.isCsvImportModalOpen = false;
        state.csvImportType = null;
      }),
    resetFilters: () =>
      set((state) => {
        state.selectedLevelFilter = null;
        state.selectedClassFilter = null;
        state.searchFilter = '';
      }),
  }))
);
