// 1. Responsabilité : Page de mire de connexion sécurisée marque blanche pour l'accès à l'administration
// 2. Dépendances clés : react, react-router-dom, lucide-react, src/lib/api/auth.api, src/hooks/useEventConfig
// 3. Mots-clés métier : admin_login, authentication_page, credentials_form, white_label, z_index_isolation

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { SchoolBrandLogo } from '@/components/ui/SchoolBrandLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { loginAdmin } from '@/lib/api/auth.api';
import { useDocumentTitle, syncDocumentFavicon } from '@/hooks/useDocumentTitle';
import { useEventConfig } from '@/hooks/useEventConfig';
import { DEFAULT_BRANDING } from '@/lib/constants';

export default function AdminLoginPage() {
  const { data: config } = useEventConfig();
  const schoolName = config?.school_name || DEFAULT_BRANDING.SCHOOL_NAME;
  const schoolSubtitle = config?.school_subtitle ?? DEFAULT_BRANDING.SCHOOL_SUBTITLE;
  const eventTitle = config?.event_title || DEFAULT_BRANDING.EVENT_TITLE;
  const eventYear = (config?.event_date || '2027-01-20').slice(0, 4);

  useDocumentTitle('Connexion Administration', schoolName);

  useEffect(() => {
    syncDocumentFavicon(config?.school_logo_url);
  }, [config?.school_logo_url]);

  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string })?.from || '/admin';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await loginAdmin({
        username_or_email: identifier.trim(),
        password,
      });
      if (
        typeof window !== 'undefined' &&
        'PasswordCredential' in window &&
        navigator.credentials?.store
      ) {
        try {
          const Cred = (window as unknown as {
            PasswordCredential: new (data: { id: string; password: string }) => Credential;
          }).PasswordCredential;
          await navigator.credentials.store(
            new Cred({ id: identifier.trim(), password })
          );
        } catch {
          // Ignoré si non supporté ou contexte HTTP non sécurisé
        }
      }
      navigate(fromPath, { replace: true });
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMsg(errObj.message || 'Identifiant ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F1F0] flex flex-col justify-between">
      <header className="sticky top-0 z-40 bg-[#F3F1F0]/95 backdrop-blur-xs border-b border-gray-200/60 px-4 sm:px-6 py-3">
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <SchoolBrandLogo
              logoUrl={config?.school_logo_url}
              schoolName={schoolName}
              variant="dark"
              height={40}
            />
            <div>
              <h1 className="font-heading font-bold text-sm tracking-tight text-[#272154]">
                {schoolName}
              </h1>
              <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                {schoolSubtitle ? `${schoolSubtitle} • ` : ''}
                {eventTitle}
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="text-xs font-semibold text-gray-600 hover:text-[#272154] transition-colors shrink-0"
          >
            Retour au portail
          </Link>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto px-4 my-8 relative z-0 isolate">
        <Card className="p-8 shadow-sm border border-gray-200/80 bg-white">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#312783]/10 text-[#312783] flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[#272154]">
              Accès Administration
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Plateforme d'organisation : {eventTitle}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form method="post" action="/admin/login" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-[#272154] mb-1.5">
                Identifiant ou Email académique
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#272154] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 mt-2"
              isLoading={isLoading}
            >
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </main>

      <footer className="text-center py-4 text-[11px] text-gray-500">
        © {eventYear} {schoolName} • Espace sécurisé réservé au personnel autorisé
      </footer>
    </div>
  );
}
