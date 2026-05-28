// Shared date and number formatting helpers for UI display.
// Caching Intl instances to avoid performance bottlenecks during React renders

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
});

const currencyNoFractionFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US');

const minFraction2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

const fixedFraction2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
};

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

export const formatCurrencyNoFraction = (value: number): string => {
  return currencyNoFractionFormatter.format(value);
};

export const formatNumber = (value: number): string => {
  return numberFormatter.format(value);
};

export const formatMin2 = (value: number): string => {
  return minFraction2Formatter.format(value);
};

export const formatFixed2 = (value: number): string => {
  return fixedFraction2Formatter.format(value);
};

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCompactCurrency = (value: number): string => {
  return compactCurrencyFormatter.format(value);
};
