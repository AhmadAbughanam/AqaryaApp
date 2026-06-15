// Shared date and number formatting helpers for UI display.
// Cached Intl formatters are used to prevent performance bottlenecks during React renders.

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

const numberFormatters: Record<string, Intl.NumberFormat> = {};

export const getNumberFormatter = (options: Intl.NumberFormatOptions = {}): Intl.NumberFormat => {
  const cacheKey = JSON.stringify(options);
  if (!numberFormatters[cacheKey]) {
    numberFormatters[cacheKey] = new Intl.NumberFormat('en-US', options);
  }
  return numberFormatters[cacheKey];
};

export const formatCurrency = (value: number, options: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}): string => {
  return getNumberFormatter(options).format(value);
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  return getNumberFormatter(options).format(value);
};
