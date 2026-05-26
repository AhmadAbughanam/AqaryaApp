// Shared date formatting helpers for UI display.

// Cache Intl formatters to avoid re-instantiation overhead on every render

const defaultDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const defaultNumberFormatter = new Intl.NumberFormat('en-US');

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const minFraction2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

const fraction2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return defaultDateTimeFormatter.format(date);
};

export const formatNumber = (value: number): string => defaultNumberFormatter.format(value);

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatMinFraction2 = (value: number): string => minFraction2Formatter.format(value);

export const formatFraction2 = (value: number): string => fraction2Formatter.format(value);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCompactCurrency = (value: number): string => compactCurrencyFormatter.format(value);
