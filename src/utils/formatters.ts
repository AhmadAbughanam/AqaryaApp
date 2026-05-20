// Shared date and number formatting helpers for UI display.
// Caching Intl instances improves performance by avoiding re-instantiation in render loops.

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const defaultCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const defaultNumberFormatter = new Intl.NumberFormat('en-US');

const minTwoFractionDigitsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

const minMaxTwoFractionDigitsFormatter = new Intl.NumberFormat('en-US', {
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
  return defaultCurrencyFormatter.format(value);
};

export const formatNumber = (value: number): string => {
  return defaultNumberFormatter.format(value);
};

export const formatMinTwoFractionDigits = (value: number): string => {
  return minTwoFractionDigitsFormatter.format(value);
};

export const formatMinMaxTwoFractionDigits = (value: number): string => {
  return minMaxTwoFractionDigitsFormatter.format(value);
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
