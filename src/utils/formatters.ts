// Shared date formatting helpers for UI display.

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

// ⚡ Bolt Performance Optimization:
// Caching Intl.NumberFormat instances instead of re-instantiating them
// inline inside React components. Instantiating Intl APIs is a known
// performance bottleneck during renders. By caching and reusing the
// bound `.format` method, we avoid redundant object creation and improve
// the frame rate on lists and detail screens.

export const formatCompactCurrencyUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
}).format;

export const formatNumber = new Intl.NumberFormat('en-US').format;

export const formatTwoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format;

export const formatMinTwoDecimals = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
}).format;

export const formatCurrencyUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format;
