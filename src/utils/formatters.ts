// Shared date formatting helpers for UI display.
// ⚡ Bolt: Cached for performance to avoid expensive re-instantiation of Intl formatters during render passes.

const cachedDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
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

  return cachedDateTimeFormatter.format(date);
};

export const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format;

export const formatCompactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
}).format;

export const formatTwoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format;

export const formatTwoDecimalsMin = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
}).format;

export const formatNumber = new Intl.NumberFormat('en-US').format;
