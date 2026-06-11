// Shared date and number formatting helpers for UI display.

// ─── Cached Formatters ────────────────────────────────────────────────────────
// Reusing Intl instances prevents performance bottlenecks during React renders.

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-US');

const fractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

const exactFractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ─── Format Functions ─────────────────────────────────────────────────────────

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
};

export const formatCurrency = (value: number | bigint): string =>
  currencyFormatter.format(value);

export const formatCompactCurrency = (value: number | bigint): string =>
  compactCurrencyFormatter.format(value);

export const formatNumber = (value: number | bigint): string =>
  numberFormatter.format(value);

export const formatFraction = (value: number | bigint): string =>
  fractionFormatter.format(value);

export const formatExactFraction = (value: number | bigint): string =>
  exactFractionFormatter.format(value);
