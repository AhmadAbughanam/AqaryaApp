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

// Cached NumberFormat instances for performance
// Resolves bottleneck from instantiating Intl formatters inline in React render cycles
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const currencyNoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const defaultNumberFormatter = new Intl.NumberFormat('en-US');

const twoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const minTwoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);
export const formatCurrencyNoDecimals = (value: number): string => currencyNoDecimalsFormatter.format(value);
export const formatNumber = (value: number): string => defaultNumberFormatter.format(value);
export const formatTwoDecimals = (value: number): string => twoDecimalsFormatter.format(value);
export const formatMinTwoDecimals = (value: number): string => minTwoDecimalsFormatter.format(value);
