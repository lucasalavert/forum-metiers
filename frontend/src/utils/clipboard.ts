// 1. Responsabilité : Utilitaires de copie presse-papiers avec fallback HTTP et résolution d'URL de partage
// 2. Dépendances clés : aucune (API DOM natives)
// 3. Mots-clés métier : clipboard, copy_fallback, shareable_url, student_link, production_origin

const STORAGE_KEY_LAN_HOST = 'forum_stpaul_lan_host';

/**
 * Vérifie si l'utilisateur navigue depuis un environnement de développement local (localhost / 127.0.0.1)
 */
export function isLocalhostEnvironment(): boolean {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Récupère l'hôte LAN personnalisé configuré dans le localStorage (pour tests locaux Wi-Fi)
 */
export function getSavedLanHost(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LAN_HOST);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {
    // localStorage indisponible
  }
  return '';
}

/**
 * Enregistre l'hôte LAN personnalisé dans le localStorage
 */
export function setSavedLanHost(host: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAN_HOST, host.trim());
  } catch {
    // ignore
  }
}

/**
 * Détermine l'URL de base pour partager les accès élèves :
 * - En production (ex: forum.mon-etablissement.fr) : utilise TOUJOURS window.location.origin
 * - En local uniquement : utilise l'IP LAN si configurée par l'admin, sinon window.location.origin
 */
export function getShareableBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:5190';
  }

  // En production ou sur tout serveur distant, priorité absolue à l'origine du navigateur
  if (!isLocalhostEnvironment()) {
    return window.location.origin;
  }

  // En local uniquement : si un hôte LAN a été spécifié pour tester sur smartphone Wi-Fi
  const savedHost = getSavedLanHost();
  if (savedHost) {
    const clean = savedHost.replace(/^https?:\/\//, '');
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${clean}`;
  }

  return window.location.origin;
}

/**
 * Construit l'URL complète d'accès au portail élève
 */
export function getStudentShareableUrl(token: string, customBaseUrl?: string): string {
  const base = customBaseUrl && customBaseUrl.trim() ? customBaseUrl.trim() : getShareableBaseUrl();
  return `${base.replace(/\/$/, '')}/v/${token}`;
}

/**
 * Copie un texte dans le presse-papiers avec compatibilité totale HTTP / non-HTTPS
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // 1. Essai avec l'API moderne Clipboard (si disponible et contexte sécurisé)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Échec (fréquent sur HTTP non-localhost), on bascule sur le fallback
    }
  }

  // 2. Fallback universel via document.execCommand('copy')
  try {
    if (typeof document === 'undefined') return false;

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
