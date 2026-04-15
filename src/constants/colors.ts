// Centralized color constants — warm neutral palette matching the login screen.
// Primary accent: near-black (#1A1A1A). Background: warm light gray (#EDEDEB).

export const Colors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  backgroundPrimary: '#EDEDEB',    // Warm light gray — main screen background
  backgroundSecondary: '#FFFFFF',  // Pure white — cards, modals, inputs
  backgroundMuted: '#F0F0EE',      // Soft warm gray — subtle section backgrounds

  // ─── Brand / Primary ───────────────────────────────────────────────────────
  primary: '#1A1A1A',              // Near-black — buttons, active icons, accents
  primaryDark: '#1A1A1A',          // Near-black — headings, dark cards, logo
  primaryLight: '#E8E8E4',         // Pale warm gray — tags, badges, decorative
  primaryMuted: '#8A8A8A',         // Medium gray — subtitles, secondary text

  // ─── Dark Stat Cards ───────────────────────────────────────────────────────
  cardDark: '#1A1A1A',             // Near-black — stat card background
  cardDarkAlt: '#111111',          // Deeper black — price card background

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#1A1A1A',          // Near-black — primary body text & headings
  textSecondary: '#8A8A8A',        // Medium gray — subtitles, labels, captions
  textMuted: '#AEAEAE',            // Light gray — placeholder text, disabled
  textOnDark: '#FFFFFF',           // White — text on dark cards/buttons
  textOnDarkMuted: '#CCCCCC',      // Light gray — secondary text on dark

  // ─── UI Elements ───────────────────────────────────────────────────────────
  border: '#E0E0DC',               // Warm light gray — input borders, dividers
  borderFocus: '#1A1A1A',          // Near-black — focused input border
  inputBackground: '#FFFFFF',      // White — input fill
  iconDefault: '#AEAEAE',          // Light gray — inactive icons
  iconActive: '#1A1A1A',           // Near-black — active/selected icons

  // ─── Status & Feedback ─────────────────────────────────────────────────────
  success: '#3A7D44',              // Green — success states
  successLight: '#E3F2E7',         // Light green — success badge background
  warning: '#D4A853',              // Warm amber — warning states
  warningLight: '#FBF3E0',         // Light amber — warning badge background
  error: '#C0544A',                // Muted red — error states
  errorLight: '#FAE8E6',           // Light red — error badge background
  info: '#4A7A9B',                 // Steel blue — info states
  infoLight: '#E3EEF7',            // Light blue — info badge background

  // ─── Map & Property Pins ───────────────────────────────────────────────────
  mapPinBackground: '#FFFFFF',     // White — avatar pin ring
  mapPinBorder: '#1A1A1A',         // Near-black — avatar pin border

  // ─── Chat Interface ────────────────────────────────────────────────────────
  chatBubbleUser: '#1A1A1A',       // Near-black — user message bubble
  chatBubbleBot: '#FFFFFF',        // White — bot message bubble
  chatBubbleBotBorder: '#E0E0DC',  // Warm gray — bot bubble border
  chatInputBackground: '#FFFFFF',  // White — chat input background
  chatOnlineIndicator: '#4CAF7D',  // Fresh green — online status dot

  // ─── Overlays & Shadows ────────────────────────────────────────────────────
  overlay: 'rgba(26, 26, 26, 0.4)',       // Near-black overlay — modals
  shadowColor: '#1A1A1A',                  // Near-black — card shadows
  shadowColorDark: '#000000',             // Black — elevated card shadows

  // ─── Navigation ────────────────────────────────────────────────────────────
  navBackground: '#FFFFFF',        // White — bottom nav bar
  navBorder: '#E8E8E4',            // Warm gray — nav top border
  navActive: '#1A1A1A',            // Near-black — active tab icon/label
  navInactive: '#AEAEAE',          // Light gray — inactive tab icon/label
  navActiveIndicator: '#F0F0EE',   // Warm gray — active tab background pill

  // ─── Misc ──────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
