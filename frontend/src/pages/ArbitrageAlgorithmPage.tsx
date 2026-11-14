// 1. Responsabilité : Page explicative détaillée et vulgarisée de l'algorithme d'arbitrage et d'affectation
// 2. Dépendances clés : react, react-router-dom, lucide-react, src/components/ui/*, src/components/allocations/*
// 3. Mots-clés métier : algorithm_explanation, solver_logic, pedagogical_guide, 2opt_swap, fairness

import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  Layers,
  Sparkles,
  Scale,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlgorithmFaqCard } from '@/components/allocations/AlgorithmFaqCard';

export default function ArbitrageAlgorithmPage() {
  useDocumentTitle("Explication de l'Algorithme d'Arbitrage");

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Barre de retour et En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/arbitrage"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#312783] hover:text-[#272154] mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'Analyse & Arbitrage</span>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-[#272154] flex items-center gap-2.5">
            <span>Fonctionnement du Moteur d'Affectation</span>
            <Badge variant="primary" size="sm">
              Guide Pédagogique
            </Badge>
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Comprendre comment l'algorithme automatique répartit équitablement les élèves sur les 4 créneaux
            du Forum des Métiers, sans favoritisme et dans le respect strict des capacités d'accueil.
          </p>
        </div>

        <Link to="/admin/arbitrage">
          <Button variant="primary" size="sm" className="shadow-xs">
            <Zap className="w-4 h-4" />
            <span>Ouvrir l'Arbitrage</span>
          </Button>
        </Link>
      </div>

      {/* 4 Chiffres Clés du Problème */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <Users className="w-4 h-4 text-[#312783]" />
            <span>Élèves à répartir</span>
          </div>
          <div className="font-heading font-bold text-2xl text-[#272154] mt-1">450 élèves</div>
          <div className="text-[11px] text-gray-400 mt-0.5">2nde, 1ère et Terminale</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <Clock className="w-4 h-4 text-[#00A68D]" />
            <span>Rotations horaires</span>
          </div>
          <div className="font-heading font-bold text-2xl text-[#272154] mt-1">4 créneaux</div>
          <div className="text-[11px] text-gray-400 mt-0.5">R1, R2, R3 et R4</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-[#E62154]" />
            <span>Capacité par atelier</span>
          </div>
          <div className="font-heading font-bold text-2xl text-[#272154] mt-1">20 élèves max</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Sécurité & confort d'écoute</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <Scale className="w-4 h-4 text-[#9E2986]" />
            <span>Équité & Rigueur</span>
          </div>
          <div className="font-heading font-bold text-2xl text-[#272154] mt-1">100% Déterministe</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Aucun tirage au sort opaque</div>
        </Card>
      </div>

      {/* Section 1 : Les 3 Règles d'Or (Contraintes Infranchissables) */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg text-[#272154] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#EB5E57]" />
          <span>1. Les 3 Règles d'Or du Moteur (Contraintes Dures)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border border-gray-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#E62154] flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-[#272154]">Plafond strict de 20 élèves</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pour des raisons de sécurité incendie et de confort pédagogique, aucun intervenant ne reçoit plus de 20
              élèves sur un créneau. Le solveur refuse tout dépassement.
            </p>
          </Card>

          <Card className="p-4 bg-white border border-gray-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#312783] flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-[#272154]">Anti-collision & Non-doublon</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Un élève ne peut pas être à deux endroits différents à la même heure. De plus, il n'assiste jamais deux
              fois à la même formation : il découvre 4 ateliers différents.
            </p>
          </Card>

          <Card className="p-4 bg-white border border-gray-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00A68D] flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-[#272154]">Parcours adapté par niveau</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              En <b>Seconde</b>, les élèves ont <b>2 créneaux obligatoires</b> de présentation des spécialités du lycée
              (ex: R1+R2 pour la 2nde 1) et <b>2 formations</b>. En <b>1ère/Terminale</b>, les 4 créneaux sont libres.
            </p>
          </Card>
        </div>
      </div>

      {/* Section 2 : Le Cycle d'Affectation en 5 Étapes */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg text-[#272154] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#312783]" />
          <span>2. Le Cycle d'Affectation en 5 Étapes</span>
        </h2>

        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#312783] text-white flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#272154]">Figeage des créneaux fixes & Cadenas manuels</h4>
                <Badge variant="neutral" size="sm">Priorité Absolue</Badge>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Le solveur commence par bloquer les créneaux de présentation des spécialités pour les élèves de Seconde
                selon le planning de leur classe. Ensuite, si l'option est activée, il verrouille toutes les affectations
                précédemment fixées manuellement par la direction (🔒).
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#312783] text-white flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#272154]">Calcul des tensions & Ateliers sous pression</h4>
                <Badge variant="primary" size="sm">Analyse Prédictive</Badge>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Le moteur calcule la demande totale sur chaque métier (ex: Médecine, Droit, Ingénierie aéronautique). Les
                ateliers les plus demandés sont traités en priorité pour être remplis de manière harmonieuse sur les 4
                créneaux sans créer d'engorgement tardif.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#312783] text-white flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#272154]">Attribution gloutonne par ordre de préférence</h4>
                <Badge variant="success" size="sm">Satisfaction Vœux</Badge>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                L'algorithme traite d'abord l'ensemble des <b>Vœux 1</b> de tous les élèves. Puis il passe aux <b>Vœux 2</b>
                , puis aux <b>Vœux 3</b>, etc. Pour chaque vœu, l'élève est orienté vers le créneau disponible où la salle
                est la moins encombrée pour équilibrer les effectifs.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#EB5E57] text-white flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#272154]">Optimisation par permutations croisées (2-opt Swap)</h4>
                <Badge variant="purple" size="sm">Intelligence Collective</Badge>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Lorsqu'un atelier est complet sur un créneau mais libre sur un autre, le solveur teste des permutations
                entre élèves. Par exemple, si l'Élève A et l'Élève B peuvent échanger un créneau sans changer leurs
                formations, l'échange est opéré pour libérer une place et satisfaire un meilleur vœu pour l'un d'eux.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#00A68D] text-white flex items-center justify-center font-bold text-sm shrink-0">
              5
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#272154]">Répartition des places vacantes (Optionnelle)</h4>
                <Badge variant="neutral" size="sm">Complétion Globale</Badge>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Si un élève n'a pas formulé de vœux ou si tous ses choix étaient saturés, le solveur lui propose une
                formation compatible avec son niveau où il reste des places disponibles, tout en veillant à ne pas surcharger
                les salles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 : Les Options du Solveur Décryptées */}
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg text-[#272154] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00A68D]" />
          <span>3. Les Options du Solveur Décryptées</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 bg-white border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#272154]">Compléter automatiquement les créneaux vides</h3>
              <Badge variant="success" size="sm">Activé par défaut</Badge>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <p>
                <b>Quand l'activer :</b> Idéal pour obtenir immédiatement un planning complet pour 100% des élèves inscrits
                au forum, même ceux qui sont en retard dans la saisie de leurs vœux.
              </p>
              <p>
                <b>Quand la désactiver :</b> Si vous souhaitez identifier uniquement les élèves en attente et affecter
                manuellement leurs créneaux au cas par cas avec leur professeur principal.
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#272154]">Conserver les verrous manuels (🔒)</h3>
              <Badge variant="secondary" size="sm">Activé par défaut</Badge>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <p>
                <b>Son rôle :</b> Lorsque vous ajustez un élève dans la grille d'arbitrage et cliquez sur l'icône cadenas,
                cette affectation devient inaltérable. Le solveur recalculera le reste de la promotion autour de ce choix.
              </p>
              <p>
                <b>Quand la désactiver :</b> Uniquement si vous souhaitez réinitialiser totalement l'algorithme à zéro en
                écrasant tous les arbitrages manuels précédents.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Section 4 : FAQ Éducative */}
      <AlgorithmFaqCard />
    </div>
  );
}
