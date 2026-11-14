// 1. Responsabilité : Layout épuré mobile-first marque blanche pour le portail élève
// 2. Dépendances clés : react, react-router-dom, src/hooks/useEventConfig, src/components/ui/SchoolBrandLogo
// 3. Mots-clés métier : student_layout, mobile_first, student_portal, white_label, z_index_isolation

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SchoolBrandLogo } from '@/components/ui/SchoolBrandLogo';
import { useEventConfig } from '@/hooks/useEventConfig';
import { syncDocumentFavicon } from '@/hooks/useDocumentTitle';
import { DEFAULT_BRANDING } from '@/lib/constants';

export const StudentLayout: React.FC = () => {
  const { data: config } = useEventConfig();
  const schoolName = config?.school_name || DEFAULT_BRANDING.SCHOOL_NAME;
  const schoolSubtitle = config?.school_subtitle ?? DEFAULT_BRANDING.SCHOOL_SUBTITLE;
  const eventTitle = config?.event_title || DEFAULT_BRANDING.EVENT_TITLE;
  const dateLabel = config?.event_date_label || DEFAULT_BRANDING.EVENT_DATE_LABEL;

  useEffect(() => {
    syncDocumentFavicon(config?.school_logo_url);
  }, [config?.school_logo_url]);

  return (
    <div className="min-h-screen bg-[#F3F1F0] flex flex-col justify-between">
      {/* Header institutionnel */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <SchoolBrandLogo
              logoUrl={config?.school_logo_url}
              schoolName={schoolName}
              variant="dark"
              height={34}
              className="h-8 w-auto max-w-[150px] sm:max-w-[200px]"
            />
            <div className="border-l border-gray-300 pl-3 hidden sm:block">
              <span className="text-xs font-semibold text-[#272154] block">Portail des Vœux</span>
              <span className="text-[10px] text-gray-500 block">
                {eventTitle} • {dateLabel}
              </span>
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-[#312783]/10 text-[#312783] whitespace-nowrap">
            {dateLabel}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1 pb-24 sm:pb-6 relative z-0 isolate">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200/60 py-4 px-4 text-center text-xs text-gray-500">
        {schoolName}
        {schoolSubtitle ? ` — ${schoolSubtitle}` : ''} • En cas de question, contactez votre professeur principal.
      </footer>
    </div>
  );
};
