// 1. Responsabilité : Instance Axios centralisée et intercepteur de normalisation des erreurs d'API
// 2. Dépendances clés : axios
// 3. Mots-clés métier : axios_client, interceptors, error_handling, api_error, base_url

import axios, { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('stpaul_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string; details?: unknown }>) => {
    const errorData = error.response?.data;
    const normalizedError: ApiError = {
      code: errorData?.error || 'UNKNOWN_ERROR',
      message: errorData?.message || error.message || 'Une erreur inattendue est survenue.',
      details: errorData?.details,
    };
    return Promise.reject(normalizedError);
  }
);
