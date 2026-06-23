// Shared date formatting helpers for UI display.

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

// Cached formatters to prevent re-creation during renders
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

const fraction2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const minFraction2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);
export const formatCompactCurrency = (value: number): string => compactCurrencyFormatter.format(value);
export const formatNumber = (value: number): string => numberFormatter.format(value);
export const formatFraction2 = (value: number): string => fraction2Formatter.format(value);
export const formatMinFraction2 = (value: number): string => minFraction2Formatter.format(value);
