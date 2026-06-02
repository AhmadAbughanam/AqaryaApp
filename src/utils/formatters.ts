// Shared date and number formatting helpers for UI display.
// Uses cached Intl instances to prevent performance bottlenecks during React renders.

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

export const numberFormatter = new Intl.NumberFormat('en-US');

export const currencyUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const minimumTwoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const twoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNumber = (value: number): string => numberFormatter.format(value);
export const formatCurrencyUsd = (value: number): string => currencyUsdFormatter.format(value);
export const formatMinimumTwoDecimals = (value: number): string => minimumTwoDecimalsFormatter.format(value);
export const formatTwoDecimals = (value: number): string => twoDecimalsFormatter.format(value);

export const compactCurrencyUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
export const formatCompactCurrencyUsd = (value: number): string => compactCurrencyUsdFormatter.format(value);
