// 1. Responsabilité : Tests unitaires de la résolution d'URL LAN et utilitaires presse-papiers
// 2. Dépendances clés : vitest, src/utils/clipboard
// 3. Mots-clés métier : clipboard_tests, lan_url_resolution, shareable_link, copy_fallback

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSavedLanHost,
  setSavedLanHost,
  getShareableBaseUrl,
  getStudentShareableUrl,
  copyTextToClipboard,
  isLocalhostEnvironment,
} from '@/utils/clipboard';

describe('clipboard and LAN URL utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getSavedLanHost returns empty string when nothing is set', () => {
    expect(getSavedLanHost()).toBe('');
  });

  it('setSavedLanHost persists custom IP and port', () => {
    setSavedLanHost('192.168.1.150:5190');
    expect(getSavedLanHost()).toBe('192.168.1.150:5190');
  });

  it('isLocalhostEnvironment detects localhost correctly in test environment', () => {
    expect(isLocalhostEnvironment()).toBe(true);
  });

  it('getShareableBaseUrl returns origin by default and LAN host when configured', () => {
    // Par défaut sur localhost sans LAN host configuré : retourne window.location.origin
    const defaultUrl = getShareableBaseUrl();
    expect(defaultUrl).toBe(window.location.origin);

    // Quand un hôte LAN est configuré dans le localStorage
    setSavedLanHost('192.168.1.150:5190');
    const lanUrl = getShareableBaseUrl();
    expect(lanUrl).toContain('192.168.1.150:5190');
  });

  it('getStudentShareableUrl appends student token correctly', () => {
    const token = 'sp-9876543210fedcba';
    const studentUrl = getStudentShareableUrl(token);
    expect(studentUrl).toContain(`/v/${token}`);
  });

  it('copyTextToClipboard gracefully handles copying in test environment', async () => {
    const result = await copyTextToClipboard('https://example.com');
    expect(typeof result).toBe('boolean');
  });
});
