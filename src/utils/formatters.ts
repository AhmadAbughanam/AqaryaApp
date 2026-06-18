// Shared date formatting helpers for UI display.
// Caching Intl formatters to avoid expensive instantiation on every render, improving performance.

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

const min2FractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatMin2Fraction = (value: number): string => {
  return min2FractionFormatter.format(value);
};

const exact2FractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatExact2Fraction = (value: number): string => {
  return exact2FractionFormatter.format(value);
};

const currencyCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrencyCompact = (value: number): string => {
  return currencyCompactFormatter.format(value);
};
