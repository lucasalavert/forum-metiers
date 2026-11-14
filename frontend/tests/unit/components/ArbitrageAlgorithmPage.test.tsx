// 1. Responsabilité : Tests unitaires de la page explicative de l'algorithme d'arbitrage
// 2. Dépendances clés : vitest, @testing-library/react, react-router-dom, src/pages/ArbitrageAlgorithmPage
// 3. Mots-clés métier : algorithm_page_test, pedagogical_guide, faq_card, router_test

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArbitrageAlgorithmPage from '@/pages/ArbitrageAlgorithmPage';
import { AlgorithmFaqCard } from '@/components/allocations/AlgorithmFaqCard';

describe('ArbitrageAlgorithmPage', () => {
  it('renders main pedagogical sections and key rules', () => {
    render(
      <MemoryRouter>
        <ArbitrageAlgorithmPage />
      </MemoryRouter>
    );

    // Title and back link
    expect(screen.getByText(/Fonctionnement du Moteur d'Affectation/i)).toBeInTheDocument();
    expect(screen.getByText(/Retour à l'Analyse & Arbitrage/i)).toBeInTheDocument();

    // 4 Key metrics
    expect(screen.getByText(/450 élèves/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4 créneaux/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/20 élèves max/i)).toBeInTheDocument();

    // 3 Golden rules
    expect(screen.getByText(/1. Les 3 Règles d'Or du Moteur/i)).toBeInTheDocument();
    expect(screen.getByText(/Plafond strict de 20 élèves/i)).toBeInTheDocument();
    expect(screen.getByText(/Anti-collision & Non-doublon/i)).toBeInTheDocument();

    // 5 cycle steps
    expect(screen.getByText(/2. Le Cycle d'Affectation en 5 Étapes/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimisation par permutations croisées/i)).toBeInTheDocument();

    // Solver options decrypted
    expect(screen.getByText(/3. Les Options du Solveur Décryptées/i)).toBeInTheDocument();
    expect(screen.getByText(/Conserver les verrous manuels/i)).toBeInTheDocument();
  });
});

describe('AlgorithmFaqCard', () => {
  it('renders frequent educational questions and back button', () => {
    render(
      <MemoryRouter>
        <AlgorithmFaqCard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Questions fréquentes de l'équipe éducative/i)).toBeInTheDocument();
    expect(screen.getByText(/Pourquoi un élève de 1ère\/Terminale a-t-il son Vœu 4 ou 5 \?/i)).toBeInTheDocument();
    expect(screen.getByText(/Retourner à la grille d'arbitrage/i)).toBeInTheDocument();
  });
});
