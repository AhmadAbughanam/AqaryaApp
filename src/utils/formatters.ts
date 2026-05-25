// Shared formatting helpers for UI display.
// Intl instances are cached to prevent performance bottlenecks during React renders.

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

const numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number): string => {
  return numberFormatter.format(value);
};

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDecimal = (value: number): string => {
  return decimalFormatter.format(value);
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
