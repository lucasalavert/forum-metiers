// 1. Responsabilité : Accès atomique découplé à l'état UI du store Zustand
// 2. Dépendances clés : src/stores/uiStore.ts
// 3. Mots-clés métier : ui_hooks, atomic_selectors, filters_state, modal_state

import { useUiStore } from '@/stores/uiStore';

export function useUiFilters() {
  const selectedLevel = useUiStore((s) => s.selectedLevelFilter);
  const selectedClass = useUiStore((s) => s.selectedClassFilter);
  const searchFilter = useUiStore((s) => s.searchFilter);
  const setLevelFilter = useUiStore((s) => s.setLevelFilter);
  const setClassFilter = useUiStore((s) => s.setClassFilter);
  const setSearchFilter = useUiStore((s) => s.setSearchFilter);
  const resetFilters = useUiStore((s) => s.resetFilters);

  return {
    selectedLevel,
    selectedClass,
    searchFilter,
    setLevelFilter,
    setClassFilter,
    setSearchFilter,
    resetFilters,
  };
}

export function useModalControls() {
  const isFormationModalOpen = useUiStore((s) => s.isFormationModalOpen);
  const editingFormationId = useUiStore((s) => s.editingFormationId);
  const isCsvImportModalOpen = useUiStore((s) => s.isCsvImportModalOpen);
  const csvImportType = useUiStore((s) => s.csvImportType);

  const openFormationModal = useUiStore((s) => s.openFormationModal);
  const closeFormationModal = useUiStore((s) => s.closeFormationModal);
  const openCsvImportModal = useUiStore((s) => s.openCsvImportModal);
  const closeCsvImportModal = useUiStore((s) => s.closeCsvImportModal);

  return {
    isFormationModalOpen,
    editingFormationId,
    isCsvImportModalOpen,
    csvImportType,
    openFormationModal,
    closeFormationModal,
    openCsvImportModal,
    closeCsvImportModal,
  };
}
