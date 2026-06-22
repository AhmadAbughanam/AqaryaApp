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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
export const formatCurrency = (value: number): string => currencyFormatter.format(value);

const numberFormatter = new Intl.NumberFormat('en-US');
export const formatNumber = (value: number): string => numberFormatter.format(value);

const jodFormatter = new Intl.NumberFormat('en-US', {minimumFractionDigits: 2});
export const formatJOD = (value: number): string => jodFormatter.format(value);

const exactTwoFractionFormatter = new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
export const formatTwoFractionDigits = (value: number): string => exactTwoFractionFormatter.format(value);

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
export const formatCompactCurrency = (value: number): string => compactCurrencyFormatter.format(value);
