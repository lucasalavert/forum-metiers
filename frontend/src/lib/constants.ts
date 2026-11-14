// 1. Responsabilité : Constantes horaires (R1 à R6) et valeurs par défaut de marque blanche du forum
// 2. Dépendances clés : aucune
// 3. Mots-clés métier : constants, rotations_schedule, colors, domains, event_details, white_label

export const DEFAULT_BRANDING = {
  SCHOOL_NAME: 'Lycée Général et Technologique',
  SCHOOL_SUBTITLE: "Forum de l'Orientation",
  SCHOOL_WEBSITE_URL: '',
  ENT_NAME: 'Pronote / ÉcoleDirecte',
  EVENT_TITLE: "Forum des Métiers & de l'Orientation",
  EVENT_DATE_LABEL: 'Mercredi 20 janvier 2027',
} as const;

export const EVENT_DETAILS = {
  TITLE: DEFAULT_BRANDING.EVENT_TITLE,
  SCHOOL: DEFAULT_BRANDING.SCHOOL_NAME,
  CITY: DEFAULT_BRANDING.SCHOOL_SUBTITLE,
  DATE_DISPLAY: DEFAULT_BRANDING.EVENT_DATE_LABEL,
  HOURS_DISPLAY: '08h30 – 12h00',
} as const;

export const ROTATION_SCHEDULES: Record<number, { label: string; time: string; start: string; end: string }> = {
  1: { label: 'Rotation 1', time: '08h30 – 09h20', start: '08:30', end: '09:20' },
  2: { label: 'Rotation 2', time: '09h20 – 10h10', start: '09:20', end: '10:10' },
  3: { label: 'Rotation 3', time: '10h20 – 11h10', start: '10:20', end: '11:10' },
  4: { label: 'Rotation 4', time: '11h10 – 12h00', start: '11:10', end: '12:00' },
  5: { label: 'Rotation 5', time: '13h30 – 14h20', start: '13:30', end: '14:20' },
  6: { label: 'Rotation 6', time: '14h30 – 15h20', start: '14:30', end: '15:20' },
};

export const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '2NDE': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '1ERE': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  TERM: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export const DOMAIN_BADGE_COLORS: Record<string, string> = {
  'Santé & Paramédical': 'bg-rose-100 text-rose-800',
  'Sciences & Ingénierie': 'bg-indigo-100 text-indigo-800',
  'Droit & Sciences Politiques': 'bg-amber-100 text-amber-800',
  'Sécurité & Défense': 'bg-slate-200 text-slate-800',
  'Management & Commerce': 'bg-blue-100 text-blue-800',
  'Communication & Médias': 'bg-pink-100 text-pink-800',
  'Architecture & Design': 'bg-teal-100 text-teal-800',
  'Culture & Lettres': 'bg-violet-100 text-violet-800',
  'Sport & Événementiel': 'bg-orange-100 text-orange-800',
  'Filières Technologiques': 'bg-cyan-100 text-cyan-800',
};
