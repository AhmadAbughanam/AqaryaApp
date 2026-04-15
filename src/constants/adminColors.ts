// Admin color palette — matches the citizen/login warm neutral theme.
// Primary accent: near-black (#1A1A1A). Background: warm light gray (#EDEDEB).
// Import as `import {AC} from '../constants/adminColors'` in admin screens.
// Never use these in citizen-facing screens.

export const AC = {
  // ─── Page Backgrounds ─────────────────────────────────────────────────────
  bg: '#EDEDEB',             // Warm light gray — main screen background
  surface: '#FFFFFF',        // White — card / panel level 1
  surfaceHigh: '#F5F5F3',    // Slightly off-white — elevated cards, hero panels
  surfaceMid: '#F0F0EE',     // Soft warm gray — interactive elements, selected rows
  surfaceAccent: '#EAE9E6',  // Warmer muted gray — accent-tinted surfaces

  // ─── Borders ──────────────────────────────────────────────────────────────
  border: '#E0E0DC',
  borderSoft: '#E8E8E4',
  borderAccent: 'rgba(26,26,26,0.20)',
  borderSuccess: 'rgba(58,125,68,0.35)',
  borderDanger: 'rgba(192,84,74,0.35)',
  borderWarning: 'rgba(212,168,83,0.35)',

  // ─── Primary Accent — Near-black ──────────────────────────────────────────
  accent: '#1A1A1A',
  accentDim: 'rgba(26,26,26,0.06)',
  accentGlow: 'rgba(26,26,26,0.12)',

  // ─── Cyan — Data / Info (steel blue) ──────────────────────────────────────
  cyan: '#4A7A9B',
  cyanDim: 'rgba(74,122,155,0.12)',

  // ─── Status Palette ────────────────────────────────────────────────────────
  success: '#3A7D44',
  successDim: '#E3F2E7',
  warning: '#D4A853',
  warningDim: '#FBF3E0',
  danger: '#C0544A',
  dangerDim: '#FAE8E6',
  info: '#4A7A9B',
  infoDim: '#E3EEF7',

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#1A1A1A',
  textSecondary: '#8A8A8A',
  textMuted: '#AEAEAE',
  textAccent: '#1A1A1A',
  textCyan: '#4A7A9B',
  textSuccess: '#3A7D44',
  textDanger: '#C0544A',
  textWarning: '#D4A853',

  // ─── Navigation / Header ──────────────────────────────────────────────────
  headerBg: '#FFFFFF',
  headerBorder: '#E0E0DC',
  navActive: '#1A1A1A',
  navInactive: '#AEAEAE',

  // ─── Code / Mono blocks ───────────────────────────────────────────────────
  codeBg: '#F0F0EE',
  codeText: '#4A7A9B',

  // ─── Misc ─────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(26,26,26,0.4)',
} as const;

export type ACKey = keyof typeof AC;
