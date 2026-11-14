// 1. Responsabilité : Carte FAQ explicative des questions fréquentes sur l'algorithme de répartition
// 2. Dépendances clés : react, react-router-dom, lucide-react, src/components/ui/*
// 3. Mots-clés métier : algorithm_faq, pedagogical_notes, common_questions, return_button

import React from 'react';
import { Link } from 'react-router-dom';
import { Info, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const AlgorithmFaqCard: React.FC = () => {
  return (
    <Card className="p-5 bg-[#F3F1F0]/70 border border-gray-200 space-y-4">
      <h3 className="font-heading font-bold text-base text-[#272154] flex items-center gap-2">
        <Info className="w-5 h-5 text-[#312783]" />
        <span>Questions fréquentes de l'équipe éducative</span>
      </h3>

      <div className="space-y-3 text-xs text-gray-700">
        <div>
          <h4 className="font-bold text-[#272154]">Pourquoi un élève de 1ère/Terminale a-t-il son Vœu 4 ou 5 ?</h4>
          <p className="mt-0.5 text-gray-600 leading-relaxed">
            Chaque élève de 1ère et Terminale doit assister à 4 formations distinctes. Comme il formule 6 vœux ordonnés,
            les vœux 1, 2, 3 et 4 correspondent à l'affectation optimale. Si un atelier très demandé (ex: Droit ou Médecine)
            est saturé, le solveur se replie naturellement sur le Vœu 5 ou 6.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-[#272154]">Le résultat change-t-il si on relance le solveur plusieurs fois ?</h4>
          <p className="mt-0.5 text-gray-600 leading-relaxed">
            Non. L'algorithme est 100% déterministe : à jeu de vœux et contraintes identiques, il produira exactement
            les mêmes affectations. Il n'y a aucun facteur de hasard ou de tirage au sort.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-[#272154]">Peut-on forcer manuellement un élève dans un atelier complet ?</h4>
          <p className="mt-0.5 text-gray-600 leading-relaxed">
            Oui, via la grille d'arbitrage. Cependant, pour la sécurité et la qualité des échanges, il est fortement
            recommandé de ne pas dépasser 20 élèves par atelier.
          </p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Link to="/admin/arbitrage">
          <Button variant="primary" size="sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Retourner à la grille d'arbitrage</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
};
