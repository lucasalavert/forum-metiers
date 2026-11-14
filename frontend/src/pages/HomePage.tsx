// 1. Responsabilité : Page d'accueil publique marque blanche avec consignes d'accès personnalisables
// 2. Dépendances clés : react, react-router-dom, lucide-react, src/components/*, src/hooks/useEventConfig
// 3. Mots-clés métier : home_disclaimer, ent_warning, custom_instructions, white_label, current_year

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  Shield,
  Calendar,
} from 'lucide-react';
import { SchoolBrandLogo } from '@/components/ui/SchoolBrandLogo';
import { Card } from '@/components/ui/Card';
import { useDocumentTitle, syncDocumentFavicon } from '@/hooks/useDocumentTitle';
import { useEventConfig } from '@/hooks/useEventConfig';
import { DEFAULT_BRANDING } from '@/lib/constants';

export default function HomePage() {
  const { data: config } = useEventConfig();

  const schoolName = config?.school_name || DEFAULT_BRANDING.SCHOOL_NAME;
  const schoolSubtitle = config?.school_subtitle ?? DEFAULT_BRANDING.SCHOOL_SUBTITLE;
  const eventTitle = config?.event_title || DEFAULT_BRANDING.EVENT_TITLE;
  const eventDateLabel = config?.event_date_label || DEFAULT_BRANDING.EVENT_DATE_LABEL;
  const entName = config?.ent_name || DEFAULT_BRANDING.ENT_NAME;
  const websiteUrl = (config?.school_website_url ?? DEFAULT_BRANDING.SCHOOL_WEBSITE_URL).trim();
  const currentYear = new Date().getFullYear();

  const customInstructions = (config?.home_access_instructions || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  useDocumentTitle(eventTitle, schoolName);

  useEffect(() => {
    syncDocumentFavicon(config?.school_logo_url);
  }, [config?.school_logo_url]);

  return (
    <div className="min-h-screen bg-[#F3F1F0] flex flex-col justify-between">
      {/* En-tête officiel fixe */}
      <header className="sticky top-0 z-40 bg-[#F3F1F0]/95 backdrop-blur-xs border-b border-gray-200/60 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <SchoolBrandLogo
              logoUrl={config?.school_logo_url}
              schoolName={schoolName}
              variant="dark"
              height={44}
            />
            <div>
              <h1 className="font-heading font-bold text-base tracking-tight text-[#272154]">
                {schoolName}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {schoolSubtitle ? `${schoolSubtitle} • ` : ''}
                {eventTitle}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#312783] bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#EB5E57]" />
            <span>{eventDateLabel}</span>
          </div>
        </div>
      </header>

      {/* Contenu principal : Consignes d'accès élève */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 my-8 relative z-0 isolate">
        <Card className="p-6 sm:p-8 bg-white border border-gray-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#272154] via-[#312783] to-[#EB5E57]" />

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-800 text-[11px] font-semibold">
                <span>Accès nominatif et individualisé</span>
              </div>

              <h2 className="font-heading font-bold text-2xl text-[#272154] tracking-tight">
                Lien d'accès direct non valide
              </h2>

              <p className="text-sm text-gray-700 leading-relaxed">
                Ce lien d'accès général ne permet pas d'accéder directement à une fiche de vœux.
                Pour formuler vos choix d'ateliers ou consulter votre planning nominatif,
                <b> vous devez impérativement utiliser le lien personnel et unique qui vous a été envoyé via votre messagerie {entName}</b>.
              </p>

              <div className="bg-[#F3F1F0]/70 rounded-xl p-4 border border-gray-200/70 space-y-2 mt-4 text-xs text-gray-700">
                <p className="font-bold text-[#272154] text-[13px]">
                  Comment accéder à votre espace élève ?
                </p>
                {customInstructions.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                    {customInstructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                    <li>
                      Connectez-vous à votre compte <b>{entName}</b> (élève ou responsable).
                    </li>
                    <li>
                      Ouvrez le message ayant pour objet : <i>« {eventTitle} - Vos vœux d'orientation »</i>.
                    </li>
                    <li>
                      Cliquez sur le <b>lien unique</b> qui y figure pour être directement authentifié.
                    </li>
                  </ol>
                )}
              </div>
            </div>
          </div>
        </Card>
      </main>

      <footer className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-200/60 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          <span>© {currentYear} {schoolName}</span>
          {websiteUrl && (
            <>
              <span> • </span>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center gap-1 text-[#312783]"
              >
                <span>Site de l'établissement</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>

        <Link
          to="/admin/login"
          className="flex items-center gap-1.5 font-semibold text-[#272154] hover:text-[#EB5E57] transition-colors py-1 px-2.5 rounded-lg hover:bg-white/80"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Accès Administration</span>
        </Link>
      </footer>
    </div>
  );
}
