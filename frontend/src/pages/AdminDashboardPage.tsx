// 1. Responsabilité : Page d'accueil du tableau de bord d'administration du forum
// 2. Dépendances clés : react, src/hooks/*, src/components/*
// 3. Mots-clés métier : admin_dashboard, kpis, echarts, satisfaction, white_label

import { Users, GraduationCap, CheckCircle2, AlertTriangle, ArrowRight, Play, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAllocationMutations, useAllocationStats } from '@/hooks/useAllocations';
import { useEventConfig } from '@/hooks/useEventConfig';
import { DEFAULT_BRANDING } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SatisfactionDonutChart } from '@/components/allocations/SatisfactionDonutChart';
import { TensionAnalysisChart } from '@/components/allocations/TensionAnalysisChart';

export default function AdminDashboardPage() {
  const { data: config } = useEventConfig();
  useDocumentTitle('Tableau de bord', config?.school_name);
  const { data: stats, isLoading, isError } = useAllocationStats();
  const { runMutation } = useAllocationMutations();

  const schoolName = config?.school_name || DEFAULT_BRANDING.SCHOOL_NAME;
  const eventTitle = config?.event_title || DEFAULT_BRANDING.EVENT_TITLE;
  const dateLabel = config?.event_date_label || DEFAULT_BRANDING.EVENT_DATE_LABEL;
  const entName = config?.ent_name || DEFAULT_BRANDING.ENT_NAME;

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">
            Tableau de Bord • Répartition des Formations
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {eventTitle} — {schoolName} • {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => runMutation.mutate({ auto_fill_missing: true, respect_locks: true })}
            isLoading={runMutation.isPending}
            className="shadow-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Lancer la répartition automatique</span>
          </Button>
        </div>
      </div>

      {/* Bannière d'alerte : Vœux saisis mais non assignés */}
      {stats && (stats.students_pending_allocation ?? 0) > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-wrap items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-amber-900">
                {stats.students_pending_allocation} élève(s) ont saisi leurs vœux mais ne sont pas encore répartis sur leurs créneaux ({stats.unassigned_wishes_total ?? 0} créneaux en attente)
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                Des vœux ont été formulés ou modifiés depuis la dernière répartition. Relancez le solveur pour mettre à jour les plannings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/students?status=PENDING_ALLOCATION"
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-xs font-semibold text-amber-900 transition-colors"
            >
              Voir les élèves
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => runMutation.mutate({ auto_fill_missing: true, respect_locks: true })}
              isLoading={runMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Répartir maintenant</span>
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-[#312783]/10 text-[#312783] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Élèves inscrits</div>
            <div className="font-heading font-bold text-2xl text-[#272154]">
              {isLoading ? '...' : stats?.total_students ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {stats?.response_rate_percent ?? 0}% de vœux saisis
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            (stats?.students_pending_allocation ?? 0) > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Vœux non répartis</div>
            <div className={`font-heading font-bold text-2xl ${
              (stats?.students_pending_allocation ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {isLoading ? '...' : stats?.students_pending_allocation ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {(stats?.students_pending_allocation ?? 0) > 0
                ? `${stats?.unassigned_wishes_total ?? 0} créneau(x) en attente`
                : `${stats?.students_without_wishes ?? 0} sans vœu`}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-[#EB5E57]/10 text-[#EB5E57] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Formations & Métiers</div>
            <div className="font-heading font-bold text-2xl text-[#272154]">
              {isLoading ? '...' : stats?.total_formations ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Capacité : {stats?.total_seats_capacity ?? 0} places
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-[#00A68D]/10 text-[#00A68D] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Satisfaction globale</div>
            <div className="font-heading font-bold text-2xl text-[#00A68D]">
              {isLoading ? '...' : `${stats?.satisfaction?.satisfaction_rate_percent ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              des élèves ont obtenu un de leurs vœux
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-[#9E2986]/10 text-[#9E2986] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Taux de remplissage</div>
            <div className="font-heading font-bold text-2xl text-[#272154]">
              {isLoading ? '...' : `${stats?.overall_fill_rate_percent ?? 0}%`}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {stats?.total_assigned_seats ?? 0} places attribuées
            </div>
          </div>
        </Card>
      </div>

      {/* Graphiques ECharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#272154]">
                Qualité des Affectations (Rang de Vœu)
              </h3>
              <p className="text-[11px] text-gray-500">
                Proportion des formations obtenues selon la préférence
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center text-xs text-gray-400">
              Chargement du graphique...
            </div>
          ) : isError ? (
            <div className="h-72 flex items-center justify-center text-xs text-rose-500">
              Erreur de chargement des statistiques.
            </div>
          ) : (
            <SatisfactionDonutChart data={stats?.satisfaction} />
          )}
        </Card>

        <Card className="lg:col-span-7 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-heading font-bold text-sm text-[#272154]">
                Tensions : Formations les plus demandées
              </h3>
              <p className="text-[11px] text-gray-500">
                Comparaison entre le nombre de vœux formulés et la capacité maximale
              </p>
            </div>
            <Link
              to="/admin/arbitrage"
              className="text-xs text-[#312783] font-semibold hover:underline flex items-center gap-1"
            >
              Voir l'arbitrage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-xs text-gray-400">
              Chargement du graphique...
            </div>
          ) : isError ? (
            <div className="h-80 flex items-center justify-center text-xs text-rose-500">
              Erreur de chargement des tensions.
            </div>
          ) : (
            <TensionAnalysisChart tensions={stats?.tensions || []} limit={8} />
          )}
        </Card>
      </div>

      {/* Raccourcis rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/config"
          className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#312783] transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-heading font-bold text-sm text-[#272154]">
              Configuration Forum
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Date exacte, horaires des 4 rotations et statut
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#312783] transition-colors shrink-0" />
        </Link>

        <Link
          to="/admin/students"
          className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#312783] transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-heading font-bold text-sm text-[#272154]">
              Liens de saisie élèves
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Générer et exporter les URL {entName}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#312783] transition-colors shrink-0" />
        </Link>

        <Link
          to="/admin/formations"
          className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#312783] transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-heading font-bold text-sm text-[#272154]">
              Catalogue & Quotas
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Ajuster la capacité (20 max) et intervenants
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#312783] transition-colors shrink-0" />
        </Link>

        <Link
          to="/admin/results"
          className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#312783] transition-all flex items-center justify-between group"
        >
          <div>
            <h4 className="font-heading font-bold text-sm text-[#272154]">
              Feuilles d'émargement
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Imprimer les listes par salle et classe
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#312783] transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );
}
