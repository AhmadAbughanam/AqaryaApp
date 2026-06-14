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

const numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number): string => {
  return numberFormatter.format(value);
};

const number2DecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNumber2Decimals = (value: number): string => {
  return number2DecimalsFormatter.format(value);
};

const min2DecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatMin2Decimals = (value: number): string => {
  return min2DecimalsFormatter.format(value);
};

const currencyUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrencyUsd = (value: number): string => {
  return currencyUsdFormatter.format(value);
};

const currencyUsdCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrencyUsdCompact = (value: number): string => {
  return currencyUsdCompactFormatter.format(value);
};
