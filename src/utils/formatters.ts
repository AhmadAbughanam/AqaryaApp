// Shared date formatting helpers for UI display.

// Cache Intl formatters to prevent performance bottlenecks during React renders
const cachedDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const cachedCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const cachedCompactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const cachedNumberFormatter = new Intl.NumberFormat('en-US');

const cachedJodFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

const cachedJod2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return cachedDateTimeFormatter.format(date);
};

export const formatCurrency = (value: number): string => cachedCurrencyFormatter.format(value);

export const formatCompactCurrency = (value: number): string => cachedCompactCurrencyFormatter.format(value);

export const formatNumber = (value: number): string => cachedNumberFormatter.format(value);

export const formatJOD = (value: number): string => cachedJodFormatter.format(value);

export const formatJOD2 = (value: number): string => cachedJod2Formatter.format(value);
