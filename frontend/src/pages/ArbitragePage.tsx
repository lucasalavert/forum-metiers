// 1. Responsabilité : Page d'analyse des tensions, exécution du solveur et ajustements manuels d'arbitrage
// 2. Dépendances clés : react, react-router-dom, src/hooks/*, src/components/*
// 3. Mots-clés métier : arbitrage_page, tension_heatmap, solver_execution, manual_adjustments, locks

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle2, Sliders, RefreshCw, BookOpen } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAllocationMutations, useAllocationStats } from '@/hooks/useAllocations';
import { useFormationsList } from '@/hooks/useFormations';
import { useStudentsList } from '@/hooks/useStudents';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RotationHeatmapChart } from '@/components/allocations/RotationHeatmapChart';
import { AllocationArbitrageGrid } from '@/components/allocations/AllocationArbitrageGrid';

export default function ArbitragePage() {
  useDocumentTitle('Analyse & Arbitrage');
  const [autoFillMissing, setAutoFillMissing] = useState(true);
  const [respectLocks, setRespectLocks] = useState(true);

  const { data: stats, isLoading: isStatsLoading, refetch } = useAllocationStats();
  const { data: formationsData } = useFormationsList();
  const { data: studentsData } = useStudentsList({ size: 1000 });
  const { runMutation, overrideMutation } = useAllocationMutations();

  const handleRun = () => {
    runMutation.mutate({
      auto_fill_missing: autoFillMissing,
      respect_locks: respectLocks,
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">
            Analyse des Tensions & Moteur d'Arbitrage
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Visualisez le remplissage des 4 rotations et ajustez manuellement les cas particuliers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isStatsLoading}>
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </Button>

          <Link to="/admin/arbitrage/algorithme">
            <Button variant="outline" size="sm" className="border-[#312783]/30 text-[#312783] hover:bg-[#312783]/5">
              <BookOpen className="w-4 h-4 text-[#EB5E57]" />
              <span>Comprendre l'algorithme</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Bloc Paramètres & Options du Solveur */}
      <Card className="bg-white p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#312783]/10 text-[#312783] rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#272154]">Options du Moteur de Répartition</h3>
              <p className="text-[11px] text-gray-500">
                Personnalisez les règles appliquées par l'algorithme automatique lors du calcul.
              </p>
            </div>
          </div>

          <Link
            to="/admin/arbitrage/algorithme"
            className="text-xs text-[#312783] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Comment ça marche ?</span>
          </Link>
        </div>

        {/* Grille des 2 options alignées et expliquées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1 */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-[#312783]/40 transition-all cursor-pointer shadow-2xs">
            <input
              type="checkbox"
              checked={autoFillMissing}
              onChange={(e) => setAutoFillMissing(e.target.checked)}
              className="mt-0.5 rounded text-[#EB5E57] focus:ring-[#EB5E57] h-4 w-4"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#272154]">
                  Compléter automatiquement les créneaux vacants
                </span>
                <Badge size="sm" variant="success">
                  Recommandé
                </Badge>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Attribue une formation avec des places libres aux élèves n'ayant pas exprimé de vœux ou dont les vœux
                étaient saturés. Si décoché, leurs créneaux resteront vides pour un arbitrage manuel.
              </p>
            </div>
          </label>

          {/* Option 2 */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-[#312783]/40 transition-all cursor-pointer shadow-2xs">
            <input
              type="checkbox"
              checked={respectLocks}
              onChange={(e) => setRespectLocks(e.target.checked)}
              className="mt-0.5 rounded text-[#EB5E57] focus:ring-[#EB5E57] h-4 w-4"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#272154]">
                  Conserver les affectations verrouillées (🔒)
                </span>
                <Badge size="sm" variant="secondary">
                  Protection
                </Badge>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Le solveur respectera scrupuleusement les choix déjà verrouillés par cadenas dans le tableau d'arbitrage
                ci-dessous et recalculera le reste de la promotion autour de ces choix figés.
              </p>
            </div>
          </label>
        </div>

        {/* Barre d'exécution */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Solveur déterministe • Respect strict des 20 élèves max • Optimisation 2-opt Swap</span>
          </div>

          <Button
            variant="primary"
            onClick={handleRun}
            isLoading={runMutation.isPending}
            className="shadow-sm font-semibold"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Lancer la répartition automatique (Solver)</span>
          </Button>
        </div>
      </Card>

      {/* Heatmap ECharts des Rotations */}
      <Card className="p-5">
        <div className="pb-3 border-b border-gray-100">
          <h3 className="font-heading font-bold text-sm text-[#272154]">
            Matrice de Remplissage : Formations × 4 Rotations
          </h3>
          <p className="text-[11px] text-gray-500">
            Visualisez et triez l'ensemble des ateliers sur les 4 créneaux (Vert: &lt;15 • Saumon: 15–19 • Rouge: 20 complet).
          </p>
        </div>
        <div className="mt-3">
          <RotationHeatmapChart tensions={stats?.tensions || []} />
        </div>
      </Card>

      {/* Matrice d'arbitrage manuel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-[#272154]">
            Arbitrage Manuel des Affectations
          </h3>
          <span className="text-xs text-gray-500">
            Modifiez une rotation ou verrouillez pour figer l'affectation
          </span>
        </div>

        <AllocationArbitrageGrid
          students={studentsData?.items || []}
          formations={formationsData?.items || []}
          onUpdateAssignment={(params) =>
            overrideMutation.mutate({
              student_id: params.studentId,
              rotation: params.rotation,
              formation_id: params.formationId,
              assignment_type: params.assignmentType,
              is_locked: params.isLocked,
            })
          }
        />
      </div>
    </div>
  );
}
