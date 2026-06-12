// Shared date formatting helpers for UI display.

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

const currencyDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return defaultDateTimeFormatter.format(date);
};

export const formatNumber = (value: number): string => {
  return defaultNumberFormatter.format(value);
};

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

export const formatCurrencyDecimals = (value: number): string => {
  return currencyDecimalsFormatter.format(value);
};

export const formatDecimal = (value: number): string => {
  return decimalFormatter.format(value);
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
