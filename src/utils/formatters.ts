// Shared date formatting helpers for UI display.


// Cached formatters to prevent performance bottlenecks during React renders
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatNumber = new Intl.NumberFormat('en-US').format;
export const formatCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format;
export const formatFraction2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format;
export const formatFractionMin2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format;

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
};
