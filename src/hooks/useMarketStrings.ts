// useMarketStrings — returns translated market-mode, category, and filter-chip
// arrays based on the current active language.
//
// Keeps stable key-based state in screens while resolving display labels through
// the i18n layer at render time. Switching language updates all labels immediately
// without resetting any selected key.

import {useStrings} from '../i18n';
import {
  FilterChip,
  MarketMode,
  MarketModeOption,
  MARKET_MODE_KEYS,
  PROPERTY_CATEGORY_META,
  FILTER_CHIP_KEYS,
  PropertyCategory,
} from '../types/market';

export const useMarketStrings = () => {
  const strings = useStrings();
  const m = strings.market;

  const modeOptions: MarketModeOption[] = MARKET_MODE_KEYS.map(
    (key): MarketModeOption => {
      const label: Record<MarketMode, string> = {
        buy: m.buy,
        rent: m.rent,
        invest: m.invest,
      };
      return {key, label: label[key]};
    },
  );

  const categoryLabelMap: Record<string, string> = {
    all: m.catAll,
    apartment: m.catApartment,
    villa: m.catVilla,
    commercial: m.catCommercial,
    land: m.catLand,
  };

  const categories: PropertyCategory[] = PROPERTY_CATEGORY_META.map(
    (meta): PropertyCategory => ({
      key: meta.key,
      icon: meta.icon,
      label: categoryLabelMap[meta.key] ?? meta.key,
    }),
  );

  const filterLabelMap: Record<string, string> = {
    all: m.filterAll,
    verified: m.filterVerified,
    new: m.filterNew,
    under500: m.filterUnder500,
    over500: m.filterOver500,
    amman: m.filterAmman,
    aqaba: m.filterAqaba,
  };

  const filterChips: FilterChip[] = FILTER_CHIP_KEYS.map(
    (key): FilterChip => ({
      key,
      label: filterLabelMap[key] ?? key,
    }),
  );

  return {modeOptions, categories, filterChips};
};
