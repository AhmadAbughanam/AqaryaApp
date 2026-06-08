// Shared date and number formatting helpers for UI display.
// Uses cached Intl formatters to prevent performance bottlenecks during React renders.

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

const numberFormatter = new Intl.NumberFormat('en-US');

const fractionalFormatter2 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const minimumFractionFormatter2 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
};

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatFractional2 = (value: number): string => fractionalFormatter2.format(value);

export const formatMinimumFraction2 = (value: number): string => minimumFractionFormatter2.format(value);

const currencyCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrencyCompact = (value: number): string => currencyCompactFormatter.format(value);

const jodCompactFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const formatJodCompact = (amount: number): string => `JOD ${jodCompactFormatter.format(amount / 1000)}k`;
