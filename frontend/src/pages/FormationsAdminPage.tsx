// 1. Responsabilité : Page d'administration des formations et intervenants du forum
// 2. Dépendances clés : react, src/hooks/*, src/components/*
// 3. Mots-clés métier : formations_admin, catalog_crud, capacity_management, csv_import

import { useState } from 'react';
import { Plus, Upload, Download, Search } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFormationDetail, useFormationMutations, useFormationsList } from '@/hooks/useFormations';
import { useEventConfig } from '@/hooks/useEventConfig';
import { useModalControls } from '@/hooks/useUiFilters';
import { Button } from '@/components/ui/Button';
import { FormationsTableWidget } from '@/components/formations/FormationsTableWidget';
import { FormationFormModal } from '@/components/formations/FormationFormModal';
import { CsvImportModal } from '@/components/students/CsvImportModal';
import { downloadCSV } from '@/lib/utils/csv';

export default function FormationsAdminPage() {
  useDocumentTitle('Formations & Quotas');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const { data: config } = useEventConfig();
  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;

  const { data: formationsData, isLoading, isError, error } = useFormationsList(
    levelFilter === 'ALL' ? undefined : levelFilter
  );
  const { createMutation, updateMutation, deleteMutation, importCsvMutation } = useFormationMutations();
  const {
    isFormationModalOpen,
    editingFormationId,
    isCsvImportModalOpen,
    csvImportType,
    openFormationModal,
    closeFormationModal,
    openCsvImportModal,
    closeCsvImportModal,
  } = useModalControls();

  const { data: currentEditingFormation } = useFormationDetail(editingFormationId);

  const filteredItems = (formationsData?.items || []).filter((f) => {
    if (!search) return true;
    return `${f.code} ${f.name} ${f.domain} ${f.speaker_name || ''} ${f.room || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const handleExportCSV = () => {
    const rows = [
      ['Code', 'Nom', 'Domaine', 'Intervenant', 'Salle', 'Niveaux', 'Capacite/Rot', 'Voeux Rang 1', 'Total Voeux', 'Affectes'],
      ...filteredItems.map((f) => [
        f.code,
        f.name,
        f.domain,
        f.speaker_name || '',
        f.room || '',
        f.target_levels,
        f.capacity_per_rotation,
        f.wishes_count_rank1,
        f.wishes_count_total,
        f.assigned_count,
      ]),
    ];
    downloadCSV('formations_forum_orientation.csv', rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">
            Catalogue des Formations & Quotas
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Gérez les formations, intervenants, salles et jauges de capacité sur les {rotationsCount} rotations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCsvImportModal('formations')}>
            <Upload className="w-4 h-4" />
            <span>Importer CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => openFormationModal(null)}>
            <Plus className="w-4 h-4" />
            <span>Ajouter une formation</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, domaine, intervenant, salle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs text-[#272154] focus:outline-none focus:ring-2 focus:ring-[#312783]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Filtrer par niveau :</span>
          {['ALL', '2NDE', '1ERE', 'TERM'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                levelFilter === lvl
                  ? 'bg-[#312783] text-white font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lvl === 'ALL' ? 'Tous' : lvl}
            </button>
          ))}
        </div>
      </div>

      <FormationsTableWidget
        formations={filteredItems}
        rotationsCount={rotationsCount}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onEdit={(id) => openFormationModal(id)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <FormationFormModal
        isOpen={isFormationModalOpen}
        onClose={closeFormationModal}
        formation={currentEditingFormation}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSave={async (payload) => {
          if (editingFormationId) {
            await updateMutation.mutateAsync({ id: editingFormationId, payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
      />

      <CsvImportModal
        isOpen={isCsvImportModalOpen && csvImportType === 'formations'}
        onClose={closeCsvImportModal}
        type="formations"
        isLoading={importCsvMutation.isPending}
        onImport={async (file) => await importCsvMutation.mutateAsync(file)}
      />
    </div>
  );
}
