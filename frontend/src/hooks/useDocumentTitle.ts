// 1. Responsabilité : Mise à jour dynamique du titre HTML, du favicon et des couleurs CSS du thème
// 2. Dépendances clés : react, src/components/ui/SchoolBrandLogo
// 3. Mots-clés métier : document_title, favicon_sync, theme_colors_sync, white_label

import { useEffect } from 'react';
import { adaptSvgDataUrl } from '@/components/ui/SchoolBrandLogo';

const DEFAULT_FAVICON_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23272154'/%3E%3Ccircle cx='22' cy='10' r='5' fill='%23EB5E57'/%3E%3Cpath d='M8 22l8-11 8 11H8z' fill='%23ffffff'/%3E%3C/svg%3E";

export const DEFAULT_THEME_COLORS = {
  PRIMARY: '#272154',
  SECONDARY: '#312783',
  ACCENT: '#EB5E57',
} as const;

export function useDocumentTitle(title: string, schoolName?: string): void {
  useEffect(() => {
    const suffix = schoolName && schoolName.trim() ? schoolName.trim() : 'Forum Orientation';
    document.title = `${title} | ${suffix}`;
  }, [title, schoolName]);
}

export function syncDocumentFavicon(logoUrl?: string): void {
  if (typeof document === 'undefined') return;
  const linkEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
  if (!linkEl) return;

  const trimmed = (logoUrl || '').trim();
  const isCustomImage =
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/');

  if (!isCustomImage) {
    linkEl.href = DEFAULT_FAVICON_DATA_URI;
    return;
  }

  const pictoSvg = adaptSvgDataUrl(trimmed, 'dark', true);
  linkEl.href = pictoSvg || trimmed;
}

export function syncDocumentThemeColors(
  primaryColor?: string,
  secondaryColor?: string,
  accentColor?: string
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--bleu-nuit', primaryColor?.trim() || DEFAULT_THEME_COLORS.PRIMARY);
  root.style.setProperty('--bleu-fonce', secondaryColor?.trim() || DEFAULT_THEME_COLORS.SECONDARY);
  root.style.setProperty('--c-primary', accentColor?.trim() || DEFAULT_THEME_COLORS.ACCENT);
}
