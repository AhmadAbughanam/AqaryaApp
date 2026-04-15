// MarketMode: the three browsing contexts a citizen can be in.
// sale = direct property purchase
// rent = rental listings (Phase 2 — data layer not yet wired)
// invest = fractional share investment

export type MarketMode = 'buy' | 'rent' | 'invest';

// Runtime shapes — labels resolved at render time via useMarketStrings().
export interface MarketModeOption {
  key: MarketMode;
  label: string;
}

export interface PropertyCategory {
  key: string;
  label: string;
  icon: string;
}

export interface FilterChip {
  key: string;
  label: string;
}

// Static metadata — stable keys and icons only; NO hardcoded English labels.
// Use useMarketStrings() to get the fully-translated arrays at render time.

export const MARKET_MODE_KEYS: MarketMode[] = ['buy', 'rent', 'invest'];

export interface PropertyCategoryMeta {
  key: string;
  icon: string;
}

export const PROPERTY_CATEGORY_META: PropertyCategoryMeta[] = [
  {key: 'all', icon: '⊞'},
  {key: 'apartment', icon: '🏢'},
  {key: 'villa', icon: '🏡'},
  {key: 'commercial', icon: '🏬'},
  {key: 'land', icon: '⬜'},
];

export const FILTER_CHIP_KEYS: string[] = [
  'all',
  'verified',
  'new',
  'under500',
  'over500',
  'amman',
  'aqaba',
];
