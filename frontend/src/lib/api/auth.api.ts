// 1. Responsabilité : Appels API et gestion de la persistance locale de la session administrateur
// 2. Dépendances clés : src/lib/api/client, src/types/api
// 3. Mots-clés métier : auth_api, login, admin_session, logout, local_storage

import { apiClient } from './client';
import {
  AdminUser,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
  LoginPayload,
  TokenResponse,
} from '@/types/api';

const TOKEN_KEY = 'stpaul_admin_token';
const USER_KEY = 'stpaul_admin_user';

export async function loginAdmin(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload);
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  const { data } = await apiClient.get<AdminUser>('/auth/me');
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  return data;
}

export function logoutAdmin(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>('/auth/users');
  return data;
}

export async function createAdminUser(payload: AdminUserCreatePayload): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>('/auth/users', payload);
  return data;
}

export async function updateAdminUser(userId: number, payload: AdminUserUpdatePayload): Promise<AdminUser> {
  const { data } = await apiClient.put<AdminUser>(`/auth/users/${userId}`, payload);
  return data;
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await apiClient.delete(`/auth/users/${userId}`);
}

