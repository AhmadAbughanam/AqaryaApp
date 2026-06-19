// Shared date formatting helpers for UI display.

// ⚡ Bolt: Cache Intl.DateTimeFormat and Intl.NumberFormat instances.
// Instantiating Intl formatters is an expensive operation and can cause performance bottlenecks
// if done inside render functions or loops. Caching them reduces memory allocations and processing time.

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
export const formatNumber = (value: number): string => numberFormatter.format(value);

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
export const formatCurrency = (value: number): string => currencyFormatter.format(value);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
export const formatCompactCurrency = (value: number): string => compactCurrencyFormatter.format(value);

const twoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const formatTwoDecimals = (value: number): string => twoDecimalsFormatter.format(value);
