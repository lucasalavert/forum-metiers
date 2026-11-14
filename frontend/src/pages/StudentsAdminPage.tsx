// 1. Responsabilité : Page d'administration des élèves, liens uniques sécurisés et filtres de répartition
// 2. Dépendances clés : react, react-router-dom, src/hooks/*, src/components/*
// 3. Mots-clés métier : students_admin, unique_tokens, regenerate_tokens, specialty_config, status_filter

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Download, Search, RefreshCw } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useClassConfigs, useStudentMutations, useStudentsList } from '@/hooks/useStudents';
import { useEventConfig } from '@/hooks/useEventConfig';
import { useModalControls } from '@/hooks/useUiFilters';
import { Button } from '@/components/ui/Button';
import { StudentsTableWidget } from '@/components/students/StudentsTableWidget';
import { SecondeSpecialtiesBar } from '@/components/students/SecondeSpecialtiesBar';
import { CsvImportModal } from '@/components/students/CsvImportModal';
import { downloadCSV } from '@/lib/utils/csv';

export default function StudentsAdminPage() {
  useDocumentTitle('Élèves & Liens');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [search, setSearch] = useState<string>('');

  const { data: config } = useEventConfig();
  const rotationsCount = config?.rotations_count ?? config?.rotations?.length ?? 4;

  const { data: studentsData, isLoading, isError, error } = useStudentsList({
    level: levelFilter === 'ALL' ? undefined : levelFilter,
    class_name: classFilter === 'ALL' ? undefined : classFilter,
    search: search || undefined,
    size: 1000,
  });

  const { data: classConfigs } = useClassConfigs();
  const {
    deleteMutation,
    updateSpecialtyMutation,
    importCsvMutation,
    importWishesCsvMutation,
    regenerateTokenMutation,
    regenerateAllTokensMutation,
  } = useStudentMutations();
  const { isCsvImportModalOpen, csvImportType, openCsvImportModal, closeCsvImportModal } = useModalControls();

  const handleExportLinksCSV = () => {
    const rows = [
      ['Nom', 'Prenom', 'Classe', 'Niveau', 'Email', 'Statut Voeux', 'Nombre Voeux', 'Rotations Attribuees', 'Lien Unique Eleve'],
      ...(studentsData?.items || []).map((s) => [
        s.last_name,
        s.first_name,
        s.class_name,
        s.level,
        s.email || '',
        s.wishes_submitted_at ? 'Saisi' : 'En attente',
        s.wishes_count,
        s.assignments ? s.assignments.length : 0,
        `${window.location.origin}/v/${s.token}`,
      ]),
    ];
    downloadCSV('eleves_et_liens_forum_orientation.csv', rows);
  };

  const handleRegenerateAll = async () => {
    if (confirm('Voulez-vous régénérer les liens uniques sécurisés (Hash HMAC) de TOUS les élèves ? Tous les anciens liens seront invalidés.')) {
      try {
        const res = await regenerateAllTokensMutation.mutateAsync();
        alert(`${res.updated_count} liens élèves ont été sécurisés et mis à jour.`);
      } catch {
        alert('Erreur lors de la régénération des liens.');
      }
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'ALL') {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatus);
    }
    setSearchParams(newParams);
  };

  const allClasses = Array.from(new Set((classConfigs || []).map((c) => c.class_name))).sort();

  const displayedStudents = (studentsData?.items || []).filter((s) => {
    const assigned = s.assignments?.length ?? 0;
    if (statusFilter === 'PENDING_ALLOCATION') {
      return s.wishes_submitted_at !== null && assigned < rotationsCount;
    }
    if (statusFilter === 'NO_WISHES') {
      return s.wishes_submitted_at === null;
    }
    if (statusFilter === 'FULLY_ALLOCATED') {
      return assigned >= rotationsCount;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">
            Gestion des Élèves & Liens de Connexion
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Transmettez facilement le lien unique généré à chaque élève ou professeur principal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateAll}
            isLoading={regenerateAllTokensMutation.isPending}
            className="text-amber-700 hover:bg-amber-50 border-amber-200"
            title="Génère un nouveau jeton cryptographique salé pour tous les élèves"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Régénérer tous les liens (Hash)</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportLinksCSV}>
            <Download className="w-4 h-4" />
            <span>Exporter les liens (CSV)</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCsvImportModal('students')}>
            <Upload className="w-4 h-4" />
            <span>Importer des élèves (CSV)</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCsvImportModal('wishes')}>
            <Upload className="w-4 h-4" />
            <span>Importer des vœux (CSV)</span>
          </Button>
        </div>
      </div>

      <SecondeSpecialtiesBar
        configs={classConfigs || []}
        onUpdateSpecialty={(className, spec) =>
          updateSpecialtyMutation.mutate({ className, specialtyRotations: spec })
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, classe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs text-[#272154] focus:outline-none focus:ring-2 focus:ring-[#312783]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Statut :</span>
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'PENDING_ALLOCATION', label: 'Vœux non répartis' },
              { id: 'NO_WISHES', label: 'Sans vœu' },
              { id: 'FULLY_ALLOCATED', label: `Complet (${rotationsCount}/${rotationsCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => handleStatusChange(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st.id
                    ? st.id === 'PENDING_ALLOCATION'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-[#312783] text-white font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Niveau :</span>
            {['ALL', '2NDE', '1ERE', 'TERM'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  levelFilter === lvl
                    ? 'bg-[#312783] text-white font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lvl === 'ALL' ? 'Tous' : lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Classe :</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-gray-300 bg-white"
            >
              <option value="ALL">Toutes les classes</option>
              {allClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <StudentsTableWidget
        students={displayedStudents}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onDeleteStudent={(id) => deleteMutation.mutate(id)}
        onRegenerateToken={(id) => regenerateTokenMutation.mutate(id)}
      />

      <CsvImportModal
        isOpen={isCsvImportModalOpen && (csvImportType === 'students' || csvImportType === 'wishes')}
        onClose={closeCsvImportModal}
        type={csvImportType}
        isLoading={csvImportType === 'wishes' ? importWishesCsvMutation.isPending : importCsvMutation.isPending}
        onImport={async (file) =>
          csvImportType === 'wishes'
            ? await importWishesCsvMutation.mutateAsync(file)
            : await importCsvMutation.mutateAsync(file)
        }
      />
    </div>
  );
}
