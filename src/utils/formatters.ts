// Shared formatting helpers for UI display.
// Cached Intl formatters improve performance by avoiding repeated instantiation during renders.

export const formatNumber = new Intl.NumberFormat('en-US').format;

export const formatCurrencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
}).format;

export const formatCurrencyUSD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format;

export const formatTwoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
}).format;

export const formatTwoDecimalsMax = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format;

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
