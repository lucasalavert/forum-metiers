// 1. Responsabilité : Affichage adaptatif du logo de l'établissement (SVG inversé fond sombre, image ou emblème générique)
// 2. Dépendances clés : react, clsx, lucide-react, src/lib/constants
// 3. Mots-clés métier : school_brand_logo, white_label, svg_color_inversion, icon_only_picto

import React from 'react';
import clsx from 'clsx';
import { GraduationCap } from 'lucide-react';
import { DEFAULT_BRANDING } from '@/lib/constants';

export interface SchoolBrandLogoProps {
  logoUrl?: string;
  schoolName?: string;
  variant?: 'light' | 'dark' | 'auto';
  height?: number;
  iconOnly?: boolean;
  className?: string;
}

function isCustomImageUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/') ||
    url.startsWith('data:image/')
  );
}

function decodeSvgDataUrl(dataUrl: string): string | null {
  if (!dataUrl.startsWith('data:image/svg+xml')) return null;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return null;
  const header = dataUrl.slice(0, commaIdx);
  const payload = dataUrl.slice(commaIdx + 1);
  try {
    if (header.includes(';base64')) {
      const bin = atob(payload);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    }
    return decodeURIComponent(payload);
  } catch {
    return null;
  }
}

export function adaptSvgDataUrl(
  dataUrl: string,
  variant: 'light' | 'dark' | 'auto',
  iconOnly: boolean
): string | null {
  const rawSvg = decodeSvgDataUrl(dataUrl);
  if (!rawSvg || !rawSvg.includes('<svg')) return null;

  let svg = rawSvg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, '');

  // Mode icône seule (menu latéral replié ou favicon) : isoler le pictogramme si le SVG contient .logo-text
  if (iconOnly && (svg.includes('logo-text') || svg.includes('logo-picto'))) {
    svg = svg.replace(/<g[^>]*class=["']logo-text["'][^>]*>[\s\S]*?<\/g>/i, '');
    svg = svg.replace(/viewBox=["'][^"']*["']/i, 'viewBox="0 0 62 61"');
    svg = svg.replace(/\bwidth=["'][^"']*["']/i, 'width="62"');
    svg = svg.replace(/\bheight=["'][^"']*["']/i, 'height="61"');
  }

  // S'assurer que width et height existent sur la balise <svg> à partir du viewBox
  const vbMatch = svg.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (vbMatch) {
    const [, vbW, vbH] = vbMatch;
    if (!/<svg[^>]*\bwidth=/i.test(svg)) {
      svg = svg.replace(/<svg\b/i, `<svg width="${vbW}" height="${vbH}"`);
    }
  }

  // Variante fond sombre (variant="light") : inverser la couleur principale sombre en blanc (#FFFFFF)
  if (variant === 'light') {
    svg = svg.replace(/fill=["'](#272154|#312783|#1e1b4b|#000000|#000|currentColor)["']/gi, 'fill="#FFFFFF"');
    if (!/<svg[^>]*\bfill=/i.test(svg)) {
      svg = svg.replace(/<svg\b/i, '<svg fill="#FFFFFF"');
    }
  } else {
    svg = svg.replace(/fill=["']currentColor["']/gi, 'fill="#272154"');
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SchoolBrandLogo: React.FC<SchoolBrandLogoProps> = ({
  logoUrl,
  schoolName,
  variant = 'auto',
  height = 42,
  iconOnly = false,
  className,
}) => {
  const resolvedName = (schoolName || DEFAULT_BRANDING.SCHOOL_NAME).trim();
  const normalizedUrl = (logoUrl || '').trim();

  // 1. Image personnalisée (SVG vectoriel adaptatif ou PNG/JPG/WebP)
  if (normalizedUrl !== 'none' && isCustomImageUrl(normalizedUrl)) {
    const adaptedSvgUrl = adaptSvgDataUrl(normalizedUrl, variant, iconOnly);

    // 1a. SVG vectoriel : rendu direct sans boîte blanche (couleurs inversées sur fond sombre + picto seul en iconOnly)
    if (adaptedSvgUrl) {
      return (
        <img
          src={adaptedSvgUrl}
          alt={`Logo ${resolvedName}`}
          style={{ height: `${iconOnly ? 34 : height}px` }}
          className={clsx('w-auto max-w-full object-contain shrink-0 transition-opacity', className)}
        />
      );
    }

    // 1b. Image matricielle (PNG/JPG/WebP)
    if (iconOnly) {
      return (
        <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
          <img
            src={normalizedUrl}
            alt={`Logo ${resolvedName}`}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    if (variant === 'light') {
      return (
        <div
          className={clsx(
            'bg-white/95 rounded-xl px-2.5 py-1.5 inline-flex items-center justify-center max-w-full shadow-2xs overflow-hidden',
            className
          )}
        >
          <img
            src={normalizedUrl}
            alt={`Logo ${resolvedName}`}
            style={{ height: `${height}px` }}
            className="w-auto max-w-full object-contain shrink-0"
          />
        </div>
      );
    }

    return (
      <img
        src={normalizedUrl}
        alt={`Logo ${resolvedName}`}
        style={{ height: `${height}px` }}
        className={clsx('w-auto max-w-full object-contain shrink-0', className)}
      />
    );
  }

  // 2. Emblème générique marque blanche
  const badgeColor =
    variant === 'light'
      ? 'bg-white/15 text-white border border-white/20'
      : 'bg-[#272154] text-white';

  const textColor = variant === 'light' ? 'text-white' : 'text-[#272154]';

  if (iconOnly) {
    return (
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          badgeColor,
          className
        )}
        aria-label={`Logo ${resolvedName}`}
      >
        <GraduationCap className="w-5 h-5 text-[#EB5E57]" />
      </div>
    );
  }

  return (
    <div
      className={clsx('inline-flex items-center gap-2.5 shrink-0 max-w-full', className)}
      aria-label={`Logo ${resolvedName}`}
    >
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
          badgeColor
        )}
      >
        <GraduationCap className="w-5 h-5 text-[#EB5E57]" />
      </div>
      <span
        className={clsx(
          'font-heading font-bold text-xs leading-tight line-clamp-2 max-w-[140px]',
          textColor
        )}
      >
        {resolvedName}
      </span>
    </div>
  );
};
