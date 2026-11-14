// 1. Responsabilité : Tests unitaires du widget tableau des formations avec vérification des 3 états
// 2. Dépendances clés : vitest, @testing-library/react, src/components/formations/FormationsTableWidget
// 3. Mots-clés métier : widget_test, 3_states_rule, loading_state, error_state, data_state

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormationsTableWidget } from '@/components/formations/FormationsTableWidget';
import { FormationItem } from '@/types/domain';

describe('FormationsTableWidget', () => {
  const mockFormations: FormationItem[] = [
    {
      id: 1,
      code: 'FOR-01',
      name: 'Santé & Médecine',
      domain: 'Santé',
      description: 'Découverte des études médicales',
      speaker_name: 'Dr. Test',
      room: 'Salle B101',
      target_levels: '2NDE,1ERE,TERM',
      capacity_per_rotation: 20,
      active_rotations: '1,2,3,4',
      wishes_count_rank1: 15,
      wishes_count_total: 40,
      assigned_count: 70,
      occupancy_r1: 18,
      occupancy_r2: 17,
      occupancy_r3: 18,
      occupancy_r4: 17,
    },
  ];

  it('renders loading state when isLoading is true', () => {
    render(
      <FormationsTableWidget
        isLoading={true}
        isError={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/Chargement des formations/i)).toBeInTheDocument();
  });

  it('renders error state when isError is true', () => {
    render(
      <FormationsTableWidget
        isLoading={false}
        isError={true}
        error={new Error('Erreur de connexion')}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument();
  });

  it('renders data nominal table when formations are provided', () => {
    render(
      <FormationsTableWidget
        formations={mockFormations}
        isLoading={false}
        isError={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Santé & Médecine')).toBeInTheDocument();
    expect(screen.getByText('FOR-01')).toBeInTheDocument();
    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
  });
});
