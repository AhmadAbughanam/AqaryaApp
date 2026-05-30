// Shared formatting helpers for UI display.

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

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const currencyNoFractionFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrencyNoFraction = (value: number): string => currencyNoFractionFormatter.format(value);

export const numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const decimalTwoFractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDecimalTwoFraction = (value: number): string => decimalTwoFractionFormatter.format(value);

export const decimalMinTwoFractionFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatDecimalMinTwoFraction = (value: number): string => decimalMinTwoFractionFormatter.format(value);

export const currencyCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrencyCompact = (value: number): string => currencyCompactFormatter.format(value);
