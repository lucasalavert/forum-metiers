// 1. Responsabilité : Layout principal d'administration avec barre latérale fixe, repliable et marque blanche
// 2. Dépendances clés : react, react-router-dom, lucide-react, src/hooks/useEventConfig
// 3. Mots-clés métier : admin_layout, sticky_sidebar, collapsible_sidebar, white_label, z_index_isolation

import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  GraduationCap,
  Users,
  Sliders,
  CalendarCheck,
  LogOut,
  UserCheck,
  ShieldCheck,
  PanelLeftClose,
} from 'lucide-react';
import { useEventConfig } from '@/hooks/useEventConfig';
import { syncDocumentFavicon } from '@/hooks/useDocumentTitle';
import { getStoredAdminUser, logoutAdmin } from '@/lib/api/auth.api';
import { SchoolBrandLogo } from '@/components/ui/SchoolBrandLogo';
import { DEFAULT_BRANDING } from '@/lib/constants';

const SIDEBAR_STORAGE_KEY = 'forum_stpaul_sidebar_collapsed';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { data: config } = useEventConfig();
  const currentUser = getStoredAdminUser();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/admin/config', label: 'Configuration Forum', icon: Settings },
    { to: '/admin/formations', label: 'Formations & Quotas', icon: GraduationCap },
    { to: '/admin/students', label: 'Élèves & Liens', icon: Users },
    { to: '/admin/arbitrage', label: 'Analyse & Arbitrage', icon: Sliders },
    { to: '/admin/results', label: 'Plannings & Résultats', icon: CalendarCheck },
    { to: '/admin/users', label: 'Comptes Équipe', icon: ShieldCheck },
  ];

  const dateLabel = config?.event_date_label || DEFAULT_BRANDING.EVENT_DATE_LABEL;
  const schoolName = config?.school_name || DEFAULT_BRANDING.SCHOOL_NAME;
  const schoolSubtitle = config?.school_subtitle ?? DEFAULT_BRANDING.SCHOOL_SUBTITLE;
  const eventTitle = config?.event_title || DEFAULT_BRANDING.EVENT_TITLE;

  useEffect(() => {
    syncDocumentFavicon(config?.school_logo_url);
  }, [config?.school_logo_url]);

  return (
    <div className="flex min-h-dvh bg-[#F3F1F0]">
      {/* Sidebar latérale fixe au scroll et repliable */}
      <aside
        aria-label="Menu principal d'administration"
        className={`sticky top-0 h-dvh bg-[#272154] text-white flex flex-col justify-between shrink-0 shadow-lg transition-all duration-300 z-50 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* En-tête Sidebar : Logo & Bouton de repli */}
        <div
          className={`border-b border-white/10 flex ${
            isCollapsed
              ? 'flex-col items-center justify-center py-4 px-2'
              : 'flex-col gap-2 p-5'
          }`}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              title="Déplier le menu latéral"
              aria-label="Déplier le menu latéral"
              className="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
            >
              <SchoolBrandLogo
                logoUrl={config?.school_logo_url}
                schoolName={schoolName}
                variant="light"
                height={30}
                iconOnly
              />
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between w-full gap-2">
                <SchoolBrandLogo
                  logoUrl={config?.school_logo_url}
                  schoolName={schoolName}
                  variant="light"
                  height={40}
                  className="w-auto max-w-[175px]"
                />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Ranger le menu sur la gauche"
                  aria-label="Ranger le menu sur la gauche"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] text-white/60 tracking-wider uppercase font-semibold truncate">
                {eventTitle}
              </div>
            </>
          )}
        </div>

        {/* Navigation scrollable indépendamment si écran bas */}
        <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition-all ${
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
                  } ${
                    isActive
                      ? 'bg-[#EB5E57] text-white font-semibold shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isCollapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200/80 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#312783] bg-[#312783]/10 px-2.5 py-1 rounded-full">
              {schoolName}
              {schoolSubtitle ? ` — ${schoolSubtitle}` : ''}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              {dateLabel} • {config?.rotations_count || 4} rotations • Quota cible {config?.default_capacity || 20} élèves / rotation
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              <UserCheck className="w-3.5 h-3.5 text-[#312783]" />
              <span>{currentUser?.full_name || 'Direction Établissement'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="p-8 flex-1 relative z-0 isolate">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
