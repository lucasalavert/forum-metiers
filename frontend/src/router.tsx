// 1. Responsabilité : Définition centralisée des routes de l'application Forum des Métiers
// 2. Dépendances clés : react-router-dom, src/components/layout/*, src/components/auth/*, src/pages/*
// 3. Mots-clés métier : router, routes_definition, admin_routes, student_portal_route, home_disclaimer

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';
import HomePage from '@/pages/HomePage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import ForumConfigAdminPage from '@/pages/ForumConfigAdminPage';
import FormationsAdminPage from '@/pages/FormationsAdminPage';
import StudentsAdminPage from '@/pages/StudentsAdminPage';
import ArbitragePage from '@/pages/ArbitragePage';
import ArbitrageAlgorithmPage from '@/pages/ArbitrageAlgorithmPage';
import ResultsSchedulePage from '@/pages/ResultsSchedulePage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import StudentPortalPage from '@/pages/StudentPortalPage';

export const router = createBrowserRouter([
  // Page d'accueil publique avec disclaimer ÉcoleDirecte
  {
    path: '/',
    element: <HomePage />,
  },
  // Mire de connexion Administrateur
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  // Routes Administration protégées par jeton de session
  {
    path: '/admin',
    element: <AdminAuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: 'config',
            element: <ForumConfigAdminPage />,
          },
          {
            path: 'formations',
            element: <FormationsAdminPage />,
          },
          {
            path: 'students',
            element: <StudentsAdminPage />,
          },
          {
            path: 'arbitrage',
            element: <ArbitragePage />,
          },
          {
            path: 'arbitrage/algorithme',
            element: <ArbitrageAlgorithmPage />,
          },
          {
            path: 'results',
            element: <ResultsSchedulePage />,
          },
          {
            path: 'users',
            element: <AdminUsersPage />,
          },
        ],
      },
    ],
  },
  // Redirections de courtoisie pour les anciens liens sans /admin
  {
    path: '/formations',
    element: <Navigate to="/admin/formations" replace />,
  },
  {
    path: '/students',
    element: <Navigate to="/admin/students" replace />,
  },
  {
    path: '/arbitrage',
    element: <Navigate to="/admin/arbitrage" replace />,
  },
  {
    path: '/results',
    element: <Navigate to="/admin/results" replace />,
  },
  // Route Portail Élève par lien unique
  {
    path: '/v',
    element: <StudentLayout />,
    children: [
      {
        path: ':token',
        element: <StudentPortalPage />,
      },
      {
        index: true,
        element: <Navigate to="/" replace />,
      },
    ],
  },
  // Fallback global vers l'accueil
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
