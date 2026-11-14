// 1. Responsabilité : Modale d'importation de fichiers CSV (Élèves ou Formations)
// 2. Dépendances clés : react, src/components/ui/Modal, src/components/ui/Button, src/lib/utils/csv
// 3. Mots-clés métier : csv_import, file_upload, template_download, validation_errors

import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { downloadCSV } from '@/lib/utils/csv';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'formations' | 'students' | 'wishes' | null;
  onImport: (file: File) => Promise<{ success: boolean; imported_count: number; updated_count: number; errors: string[] }>;
  isLoading: boolean;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onImport,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  } | null>(null);

  const title =
    type === 'formations'
      ? 'Importer les formations (CSV)'
      : type === 'wishes'
      ? 'Importer les vœux élèves (CSV)'
      : 'Importer la liste des élèves (CSV)';

  const handleDownloadTemplate = () => {
    if (type === 'formations') {
      const rows = [
        ['code', 'name', 'domain', 'speaker', 'room', 'levels', 'capacity', 'description'],
        ['FOR-01', 'Études de Santé (PASS/L.AS)', 'Santé & Paramédical', 'Faculté de Médecine', 'Amphi A', '2NDE,1ERE,TERM', '20', 'Présentation des filières médicales'],
        ['FOR-02', 'Classes Préparatoires MPSI/PCSI', 'Sciences & Ingénierie', 'Lycée Victor Hugo', 'Salle B104', '1ERE,TERM', '20', 'Présentation des CPGE scientifiques'],
      ];
      downloadCSV('modele_formations_forum.csv', rows);
    } else if (type === 'wishes') {
      const rows = [
        ['email', 'nom', 'prenom', 'classe', 'wish_1', 'wish_2', 'wish_3', 'wish_4', 'wish_5', 'wish_6'],
        ['jean.dupont@etablissement.fr', 'DUPONT', 'Jean', '1ère 1', 'FOR-01', 'FOR-02', 'FOR-07', 'FOR-14', 'FOR-18', 'FOR-25'],
        ['alice.martin@etablissement.fr', 'MARTIN', 'Alice', '2nde 2', 'FOR-01', 'FOR-04', 'FOR-14', 'FOR-28', '', ''],
      ];
      downloadCSV('modele_voeux_forum.csv', rows);
    } else {
      const rows = [
        ['nom', 'prenom', 'classe', 'niveau', 'email'],
        ['DUPONT', 'Jean', '1ère 1', '1ERE', 'jean.dupont@etablissement.fr'],
        ['MARTIN', 'Alice', '2nde 2', '2NDE', 'alice.martin@etablissement.fr'],
      ];
      downloadCSV('modele_eleves_forum.csv', rows);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const res = await onImport(selectedFile);
    setImportResult({
      success: res.success,
      imported: res.imported_count,
      updated: res.updated_count,
      errors: res.errors,
    });
    if (res.errors.length === 0) {
      setTimeout(() => {
        onClose();
        setImportResult(null);
        setSelectedFile(null);
      }, 1500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div>
            <div className="font-semibold text-gray-800">Modèle de fichier recommandé</div>
            <p className="text-[11px] text-gray-500">Téléchargez le format standard avec en-têtes</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger modèle</span>
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-300 hover:border-[#312783] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white">
          <input
            type="file"
            accept=".csv,text/csv"
            id="csv-file-input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
                setImportResult(null);
              }
            }}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="font-semibold text-sm text-[#272154] block">
              {selectedFile ? selectedFile.name : 'Sélectionner un fichier CSV'}
            </span>
            <span className="text-[11px] text-gray-400 block mt-1">
              Encodage UTF-8 recommandé, séparateur point-virgule ou virgule
            </span>
          </label>
        </div>

        {importResult && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              importResult.errors.length === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {importResult.errors.length === 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Importation réussie ({importResult.imported} créés, {importResult.updated} mis à jour)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Erreurs lors de l'importation :</span>
                </>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={!selectedFile} isLoading={isLoading}>
            Lancer l'importation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
