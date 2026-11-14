// 1. Responsabilité : Tests unitaires du composant logo marque blanche SchoolBrandLogo
// 2. Dépendances clés : vitest, @testing-library/react, src/components/ui/SchoolBrandLogo
// 3. Mots-clés métier : school_brand_logo, white_label, custom_image, fallback_emblem, test

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SchoolBrandLogo } from '@/components/ui/SchoolBrandLogo';

describe('SchoolBrandLogo', () => {
  it('renders default generic emblem with school name when logoUrl is empty or "none"', () => {
    const { rerender } = render(<SchoolBrandLogo logoUrl="" schoolName="Lycée Louis Pasteur" />);
    expect(screen.getByLabelText('Logo Lycée Louis Pasteur')).toBeInTheDocument();
    expect(screen.getByText('Lycée Louis Pasteur')).toBeInTheDocument();

    rerender(<SchoolBrandLogo logoUrl="none" schoolName="Lycée Victor Hugo" />);
    expect(screen.getByLabelText('Logo Lycée Victor Hugo')).toBeInTheDocument();
    expect(screen.getByText('Lycée Victor Hugo')).toBeInTheDocument();
  });

  it('renders custom image when logoUrl is a data URL or HTTP URL', () => {
    const { rerender } = render(
      <SchoolBrandLogo
        logoUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        schoolName="Lycée Victor Hugo"
      />
    );

    const img = screen.getByAltText('Logo Lycée Victor Hugo') as HTMLImageElement;
    expect(img.tagName.toLowerCase()).toBe('img');
    expect(img.src).toContain('data:image/png;base64,');

    rerender(<SchoolBrandLogo logoUrl="https://example.org/logo.svg" schoolName="Lycée Montaigne" />);
    const extImg = screen.getByAltText('Logo Lycée Montaigne') as HTMLImageElement;
    expect(extImg.src).toBe('https://example.org/logo.svg');
  });

  it('renders compact iconOnly mode with custom image or emblem', () => {
    const { rerender } = render(<SchoolBrandLogo logoUrl="" schoolName="Lycée Jean Jaurès" iconOnly />);
    expect(screen.getByLabelText('Logo Lycée Jean Jaurès')).toBeInTheDocument();
    expect(screen.queryByText('Lycée Jean Jaurès')).not.toBeInTheDocument();

    rerender(
      <SchoolBrandLogo
        logoUrl="https://example.org/badge.png"
        schoolName="Lycée Jean Jaurès"
        iconOnly
      />
    );
    expect(screen.getByAltText('Logo Lycée Jean Jaurès')).toBeInTheDocument();
  });

  it('auto-inverts dark fill to white on dark backgrounds and isolates picto in iconOnly for SVG data URLs', () => {
    const rawSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 263 61" fill="#272154"><g class="logo-picto"><path fill="#EB5E57" d="M0 0h10v10z"/></g><g class="logo-text"><path d="M20 20h10v10z"/></g></svg>';
    const b64 = `data:image/svg+xml;base64,${btoa(rawSvg)}`;

    const { rerender } = render(
      <SchoolBrandLogo logoUrl={b64} schoolName="Lycée Victor Hugo" variant="light" />
    );
    const imgLight = screen.getByAltText('Logo Lycée Victor Hugo') as HTMLImageElement;
    const decodedLight = decodeURIComponent(imgLight.src);
    expect(decodedLight).toContain('fill="#FFFFFF"');
    expect(decodedLight).toContain('fill="#EB5E57"');
    expect(decodedLight).toContain('logo-text');

    rerender(
      <SchoolBrandLogo logoUrl={b64} schoolName="Lycée Victor Hugo" variant="light" iconOnly />
    );
    const imgIcon = screen.getByAltText('Logo Lycée Victor Hugo') as HTMLImageElement;
    const decodedIcon = decodeURIComponent(imgIcon.src);
    expect(decodedIcon).toContain('viewBox="0 0 62 61"');
    expect(decodedIcon).not.toContain('logo-text');
  });
});
