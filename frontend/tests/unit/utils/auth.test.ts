// 1. Responsabilité : Tests unitaires de la gestion du stockage local et des sessions administrateur
// 2. Dépendances clés : vitest, src/lib/api/auth.api
// 3. Mots-clés métier : auth_tests, token_storage, logout_clean, session_check

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isAdminAuthenticated,
  getAdminToken,
  getStoredAdminUser,
  logoutAdmin,
} from '@/lib/api/auth.api';

describe('Auth API Local State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reports unauthenticated when localStorage is empty', () => {
    expect(isAdminAuthenticated()).toBe(false);
    expect(getAdminToken()).toBeNull();
    expect(getStoredAdminUser()).toBeNull();
  });

  it('reports authenticated when token is stored', () => {
    localStorage.setItem('stpaul_admin_token', 'mock_jwt_token_123');
    localStorage.setItem(
      'stpaul_admin_user',
      JSON.stringify({
        id: 1,
        username: 'admin',
        email: 'admin@etablissement.fr',
        full_name: 'Direction Établissement',
        is_active: true,
      })
    );

    expect(isAdminAuthenticated()).toBe(true);
    expect(getAdminToken()).toBe('mock_jwt_token_123');
    const user = getStoredAdminUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe('admin@etablissement.fr');
  });

  it('clears token and user on logout', () => {
    localStorage.setItem('stpaul_admin_token', 'mock_jwt_token_123');
    localStorage.setItem('stpaul_admin_user', JSON.stringify({ id: 1 }));

    logoutAdmin();

    expect(isAdminAuthenticated()).toBe(false);
    expect(getAdminToken()).toBeNull();
    expect(getStoredAdminUser()).toBeNull();
  });
});
