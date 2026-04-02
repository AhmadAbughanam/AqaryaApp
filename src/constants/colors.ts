// Placeholder: Centralized color constants scaffold.
// Design system colors extracted from the Riskify UI.
// Palette: soft mint backgrounds, dark forest greens, warm whites, dark stat cards.

export const Colors = {
  // ─── Backgrounds ───────────────────────────────────────────────────────────
  backgroundPrimary: '#EEF5F0',    // Soft mint — main screen background
  backgroundSecondary: '#FFFFFF',  // Pure white — cards, modals, inputs
  backgroundMuted: '#D9EBE3',      // Muted sage — subtle section backgrounds

  // ─── Brand / Primary ───────────────────────────────────────────────────────
  primary: '#4A7C6F',              // Sage green — buttons, active icons, accents
  primaryDark: '#1A2E28',          // Deep forest — headings, dark cards, logo
  primaryLight: '#C8DDD4',         // Pale sage — tags, badges, decorative blobs
  primaryMuted: '#6B9E8F',         // Medium sage — subtitles, secondary text

  // ─── Dark Stat Cards (the floating black cards in the screenshot) ──────────
  cardDark: '#1A2E28',             // Dark forest — stat card background
  cardDarkAlt: '#111E1B',          // Deeper variant — price card background

  // ─── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#1A2E28',          // Deep forest — primary body text & headings
  textSecondary: '#6B9E8F',        // Medium sage — subtitles, labels, captions
  textMuted: '#9DB8AF',            // Soft sage — placeholder text, disabled
  textOnDark: '#FFFFFF',           // White — text on dark cards/buttons
  textOnDarkMuted: '#A8C4BC',      // Muted white-green — secondary text on dark

  // ─── UI Elements ───────────────────────────────────────────────────────────
  border: '#D9EBE3',               // Pale sage — input borders, dividers
  borderFocus: '#4A7C6F',          // Sage green — focused input border
  inputBackground: '#F5FAF7',      // Near-white mint — input fill
  iconDefault: '#9DB8AF',          // Soft sage — inactive icons
  iconActive: '#1A2E28',           // Deep forest — active/selected icons

  // ─── Status & Feedback ─────────────────────────────────────────────────────
  success: '#4A7C6F',              // Sage green — success states
  successLight: '#E0F0EA',         // Light mint — success badge background
  warning: '#D4A853',              // Warm amber — warning states
  warningLight: '#FBF3E0',         // Light amber — warning badge background
  error: '#C0544A',                // Muted red — error states
  errorLight: '#FAE8E6',           // Light red — error badge background
  info: '#4A7A9B',                 // Steel blue — info states
  infoLight: '#E3EEF7',            // Light blue — info badge background

  // ─── Map & Property Pins ───────────────────────────────────────────────────
  mapPinBackground: '#FFFFFF',     // White — avatar pin ring
  mapPinBorder: '#4A7C6F',         // Sage green — avatar pin border

  // ─── Chat Interface ────────────────────────────────────────────────────────
  chatBubbleUser: '#1A2E28',       // Dark forest — user message bubble
  chatBubbleBot: '#FFFFFF',        // White — bot message bubble
  chatBubbleBotBorder: '#D9EBE3', // Pale sage — bot bubble border
  chatInputBackground: '#F5FAF7', // Near-white mint — chat input background
  chatOnlineIndicator: '#4CAF7D', // Fresh green — online status dot

  // ─── Overlays & Shadows ────────────────────────────────────────────────────
  overlay: 'rgba(26, 46, 40, 0.4)',       // Dark forest overlay — modals
  shadowColor: '#4A7C6F',                  // Sage — card shadows
  shadowColorDark: '#1A2E28',             // Dark — elevated card shadows

  // ─── Navigation ────────────────────────────────────────────────────────────
  navBackground: '#FFFFFF',        // White — bottom nav bar
  navBorder: '#EEF5F0',            // Mint — nav top border
  navActive: '#1A2E28',            // Deep forest — active tab icon/label
  navInactive: '#9DB8AF',          // Soft sage — inactive tab icon/label
  navActiveIndicator: '#EEF5F0',  // Mint — active tab background pill

  // ─── Misc ──────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;