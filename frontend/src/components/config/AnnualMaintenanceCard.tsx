// 1. Responsabilité : Carte d'administration pour l'export d'archive annuelle (.zip) et la purge sélective inter-années
// 2. Dépendances clés : react, @tanstack/react-query, lucide-react, src/lib/api/config.api, src/components/ui/*
// 3. Mots-clés métier : annual_archive, zip_export, selective_purge, reset_edition, danger_zone

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, Trash2, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { downloadAnnualArchiveZip, purgeForumData } from '@/lib/api/config.api';

export interface AnnualMaintenanceCardProps {
  eventDate?: string;
}

export const AnnualMaintenanceCard: React.FC<AnnualMaintenanceCardProps> = ({ eventDate }) => {
  const queryClient = useQueryClient();

  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeWishes, setPurgeWishes] = useState(true);
  const [purgeStudents, setPurgeStudents] = useState(true);
  const [purgeFormations, setPurgeFormations] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportArchive = async () => {
    setIsExporting(true);
    setFeedback(null);
    try {
      await downloadAnnualArchiveZip(eventDate);
      setFeedback({
        type: 'success',
        text: 'Archive ZIP téléchargée (formations, élèves, vœux, plannings, émargement et configuration).',
      });
    } catch {
      setFeedback({
        type: 'error',
        text: "Impossible de générer l'archive ZIP de l'édition en cours.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleStudents = (checked: boolean) => {
    setPurgeStudents(checked);
    if (checked) setPurgeWishes(true);
  };

  const handleToggleFormations = (checked: boolean) => {
    setPurgeFormations(checked);
    if (checked) setPurgeWishes(true);
  };

  const handlePurge = async () => {
    if (!purgeWishes && !purgeStudents && !purgeFormations) return;

    const targets: string[] = [];
    if (purgeFormations) targets.push('le catalogue des formations');
    if (purgeStudents) targets.push('la liste des élèves et des classes');
    targets.push('tous les vœux saisis et les plannings attribués');

    const confirmed = window.confirm(
      `ATTENTION — Action irréversible :\n\nVous êtes sur le point de supprimer définitivement ${targets.join(', ')}.\n\nAvez-vous bien téléchargé l'archive ZIP de l'année en cours avant de continuer ?`
    );
    if (!confirmed) return;

    setIsPurging(true);
    setFeedback(null);
    try {
      const res = await purgeForumData({
        purge_wishes: purgeWishes || purgeStudents || purgeFormations,
        purge_students: purgeStudents,
        purge_formations: purgeFormations,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['class-configs'] }),
        queryClient.invalidateQueries({ queryKey: ['formations'] }),
        queryClient.invalidateQueries({ queryKey: ['allocations'] }),
      ]);
      setFeedback({ type: 'success', text: res.message });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Une erreur est survenue lors de la purge des données.',
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <Card className="p-6 bg-white border border-gray-200 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-[#312783]" />
          <h3 className="font-heading font-bold text-sm text-[#272154]">
            Archivage Annuel & Préparation de la Nouvelle Édition
          </h3>
        </div>
        <span className="text-[11px] font-medium text-gray-500">
          Sauvegardez l'édition passée avant de purger pour l'année suivante
        </span>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Bloc 1 : Export archive complète */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-[#F3F1F0]/70 border border-gray-200 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#272154]">1. Exporter l'année en cours (Archive totale)</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Télécharge une archive <b>.ZIP</b> contenant tous les fichiers CSV ré-importables
              (<code>formations.csv</code>, <code>students.csv</code>, <code>wishes.csv</code>) ainsi que les
              plannings finaux (<code>plannings_eleves.csv</code>), les feuilles d'émargement
              (<code>emargement_salles.csv</code>) et la configuration (<code>config_forum.json</code>).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportArchive}
            isLoading={isExporting}
            className="w-full justify-center bg-white border-[#312783] text-[#312783] hover:bg-[#312783]/5"
          >
            <Download className="w-4 h-4" />
            <span>Exporter l'année en cours (.ZIP)</span>
          </Button>
        </div>

        {/* Bloc 2 : Purge sélective */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>2. Purger les données pour l'année suivante</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPurgeWishes(true);
                    setPurgeStudents(true);
                    setPurgeFormations(false);
                  }}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Garder les formations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurgeWishes(true);
                    setPurgeStudents(true);
                    setPurgeFormations(true);
                  }}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-rose-300 text-rose-700 hover:bg-rose-100"
                >
                  Tout cocher
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeWishes || purgeStudents || purgeFormations}
                  disabled={purgeStudents || purgeFormations}
                  onChange={(e) => setPurgeWishes(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div className="text-[11px]">
                  <span className="font-bold text-[#272154] block">Vœux & Plannings</span>
                  <span className="text-gray-500">Choix élèves et affectations du solveur</span>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeStudents}
                  onChange={(e) => handleToggleStudents(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div className="text-[11px]">
                  <span className="font-bold text-[#272154] block">Élèves & Classes</span>
                  <span className="text-gray-500">Effectifs, classes et liens uniques</span>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeFormations}
                  onChange={(e) => handleToggleFormations(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div className="text-[11px]">
                  <span className="font-bold text-[#272154] block">Formations</span>
                  <span className="text-gray-500">Catalogue des ateliers et salles</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handlePurge}
              isLoading={isPurging}
              disabled={!purgeWishes && !purgeStudents && !purgeFormations}
            >
              <Trash2 className="w-4 h-4" />
              <span>Purger la sélection</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
