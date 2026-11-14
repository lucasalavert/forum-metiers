// 1. Responsabilité : Carte de configuration marque blanche, logo et couleurs du thème d'établissement
// 2. Dépendances clés : react, lucide-react, src/components/ui/Card, src/components/ui/SchoolBrandLogo, src/hooks/useDocumentTitle
// 3. Mots-clés métier : school_branding, white_label, logo_upload, theme_colors, live_preview

import React, { useRef, useState } from 'react';
import { Building2, Globe, ImagePlus, MessageSquare, RotateCcw, EyeOff, Palette } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SchoolBrandLogo } from '@/components/ui/SchoolBrandLogo';
import { DEFAULT_THEME_COLORS, syncDocumentThemeColors } from '@/hooks/useDocumentTitle';

export interface SchoolBrandingState {
  schoolName: string;
  schoolSubtitle: string;
  schoolLogoUrl: string;
  schoolWebsiteUrl: string;
  entName: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themeAccentColor: string;
}

export interface SchoolBrandingConfigCardProps {
  branding: SchoolBrandingState;
  onChange: (key: keyof SchoolBrandingState, value: string) => void;
}

const MAX_LOGO_FILE_BYTES = 512 * 1024;

export const SchoolBrandingConfigCard: React.FC<SchoolBrandingConfigCardProps> = ({
  branding,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isUploadedDataUrl = branding.schoolLogoUrl.startsWith('data:image/');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image (SVG, PNG, JPG ou WebP).');
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      setUploadError('Le logo dépasse 500 Ko. Utilisez un SVG ou une image compressée.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange('schoolLogoUrl', reader.result);
      }
    };
    reader.onerror = () => setUploadError('Impossible de lire le fichier sélectionné.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleColorChange = (key: 'themePrimaryColor' | 'themeSecondaryColor' | 'themeAccentColor', val: string) => {
    onChange(key, val);
    const nextPrimary = key === 'themePrimaryColor' ? val : branding.themePrimaryColor;
    const nextSecondary = key === 'themeSecondaryColor' ? val : branding.themeSecondaryColor;
    const nextAccent = key === 'themeAccentColor' ? val : branding.themeAccentColor;
    syncDocumentThemeColors(nextPrimary, nextSecondary, nextAccent);
  };

  const handleResetColors = () => {
    onChange('themePrimaryColor', DEFAULT_THEME_COLORS.PRIMARY);
    onChange('themeSecondaryColor', DEFAULT_THEME_COLORS.SECONDARY);
    onChange('themeAccentColor', DEFAULT_THEME_COLORS.ACCENT);
    syncDocumentThemeColors(
      DEFAULT_THEME_COLORS.PRIMARY,
      DEFAULT_THEME_COLORS.SECONDARY,
      DEFAULT_THEME_COLORS.ACCENT
    );
  };

  const inputCls =
    'w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]';

  return (
    <Card className="p-6 bg-white border border-gray-200 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <Building2 className="w-4 h-4 text-[#EB5E57]" />
        <h3 className="font-heading font-bold text-sm text-[#272154]">
          Identité de l'Établissement & Marque Blanche
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#272154] mb-1">
            Nom complet de l'établissement
          </label>
          <input
            type="text"
            required
            value={branding.schoolName}
            onChange={(e) => onChange('schoolName', e.target.value)}
            placeholder="Ex : Lycée Victor Hugo"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#272154] mb-1">Ville / Sous-titre</label>
          <input
            type="text"
            value={branding.schoolSubtitle}
            onChange={(e) => onChange('schoolSubtitle', e.target.value)}
            placeholder="Ex : Forum de l'Orientation"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#272154] mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span>ENT / Messagerie élèves</span>
          </label>
          <input
            type="text"
            required
            value={branding.entName}
            onChange={(e) => onChange('entName', e.target.value)}
            placeholder="Ex : ÉcoleDirecte, Pronote, MBN..."
            className={inputCls}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#272154] mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <span>Site web de l'établissement (optionnel)</span>
          </label>
          <input
            type="url"
            value={branding.schoolWebsiteUrl}
            onChange={(e) => onChange('schoolWebsiteUrl', e.target.value)}
            placeholder="https://www.mon-lycee.fr"
            className={inputCls}
          />
        </div>
      </div>

      {/* Bloc Couleurs du thème */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#272154] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#EB5E57]" />
            <span>Couleurs du thème (Charte graphique)</span>
          </label>
          <button
            type="button"
            onClick={handleResetColors}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Couleurs par défaut</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { key: 'themePrimaryColor' as const, label: 'Principale (Menu/Titres)', value: branding.themePrimaryColor },
            { key: 'themeSecondaryColor' as const, label: 'Secondaire (Boutons)', value: branding.themeSecondaryColor },
            { key: 'themeAccentColor' as const, label: 'Accent (Actions/Badges)', value: branding.themeAccentColor },
          ].map((col) => (
            <div key={col.key} className="p-2 rounded-xl border border-gray-200 bg-gray-50/60 space-y-1">
              <span className="text-[10px] font-semibold text-gray-600 block truncate">{col.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={col.value}
                  onChange={(e) => handleColorChange(col.key, e.target.value.toUpperCase())}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-300 bg-white p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={col.value}
                  onChange={(e) => handleColorChange(col.key, e.target.value)}
                  maxLength={7}
                  className="w-full text-[11px] font-mono px-2 py-1 rounded border border-gray-300 bg-white uppercase"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloc Logo personnalisable */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-[#272154]">
            Logo de l'établissement (SVG, PNG, JPG, WebP — max 500 Ko)
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/webp,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#312783] hover:bg-[#272154] text-white text-[11px] font-semibold transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Importer un fichier</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                onChange('schoolLogoUrl', '');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Défaut</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                onChange('schoolLogoUrl', 'none');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-medium"
            >
              <EyeOff className="w-3 h-3" />
              <span>Sans image</span>
            </button>
          </div>
        </div>

        {isUploadedDataUrl ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <span className="font-medium">Fichier image intégré dans la base de données</span>
            <button
              type="button"
              onClick={() => onChange('schoolLogoUrl', '')}
              className="text-[11px] font-semibold text-emerald-900 hover:underline"
            >
              Retirer
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={branding.schoolLogoUrl === 'none' ? '' : branding.schoolLogoUrl}
            onChange={(e) => {
              setUploadError(null);
              onChange('schoolLogoUrl', e.target.value);
            }}
            placeholder="Ou collez une URL d'image (https://...) — laissez vide pour le logo automatique"
            className={inputCls}
          />
        )}

        {uploadError && <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-gray-200 bg-[#F3F1F0]/70 flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Aperçu fond clair (Portail)
            </span>
            <div className="h-12 flex items-center">
              <SchoolBrandLogo logoUrl={branding.schoolLogoUrl} schoolName={branding.schoolName} variant="dark" height={36} />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#272154] flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Aperçu fond sombre (Menu Admin)
            </span>
            <div className="h-12 flex items-center">
              <SchoolBrandLogo logoUrl={branding.schoolLogoUrl} schoolName={branding.schoolName} variant="light" height={36} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
