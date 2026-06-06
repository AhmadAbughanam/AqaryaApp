// Shared formatting helpers for UI display.
// Intl formatters are cached to avoid expensive instantiations during renders.

// Cached DateTime formatter
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

// Cached Currency Formatter (e.g. $1,234)
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

// Cached Number Formatter (e.g. 1,234)
const numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number): string => {
  return numberFormatter.format(value);
};

// Cached Fraction Formatter (minimum 2 fraction digits)
const fractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatFraction = (value: number): string => {
  return fractionFormatter.format(value);
};

// Cached Precise Fraction Formatter (exactly 2 fraction digits)
const preciseFractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPreciseFraction = (value: number): string => {
  return preciseFractionFormatter.format(value);
};

// Cached Compact Currency Formatter (e.g. $1.2M)
const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCompactCurrency = (value: number): string => {
  return compactCurrencyFormatter.format(value);
};
