// 1. Responsabilité : Garde de navigation pour sécuriser les routes réservées à l'administration
// 2. Dépendances clés : react-router-dom, src/lib/api/auth.api
// 3. Mots-clés métier : auth_guard, route_protection, admin_access, redirect_login

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '@/lib/api/auth.api';

export const AdminAuthGuard: React.FC = () => {
  const location = useLocation();
  const isAuth = isAdminAuthenticated();

  if (!isAuth) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
