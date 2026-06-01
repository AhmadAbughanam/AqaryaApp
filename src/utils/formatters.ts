// Shared formatting helpers for UI display.

// Cache the DateTimeFormat to avoid expensive instantiations during render
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

// Cache NumberFormat instances
const currencyFormatters: Record<string, Intl.NumberFormat> = {};

export const formatCurrency = (value: number, currency = 'USD', maxFractionDigits = 0, notation?: 'compact' | 'standard'): string => {
  const cacheKey = `${currency}-${maxFractionDigits}-${notation || 'standard'}`;
  if (!currencyFormatters[cacheKey]) {
    currencyFormatters[cacheKey] = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: maxFractionDigits,
      ...(notation ? { notation } : {}),
    });
  }
  return currencyFormatters[cacheKey].format(value);
};

// Number formatter with configurable fraction digits
const numberFormatters: Record<string, Intl.NumberFormat> = {};

export const formatNumber = (value: number, minFractionDigits = 0, maxFractionDigits?: number): string => {
  const cacheKey = `${minFractionDigits}-${maxFractionDigits}`;
  if (!numberFormatters[cacheKey]) {
    numberFormatters[cacheKey] = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    });
  }
  return numberFormatters[cacheKey].format(value);
};

// Default number formatter
const defaultNumberFormatter = new Intl.NumberFormat('en-US');

export const formatDefaultNumber = (value: number): string => {
  return defaultNumberFormatter.format(value);
};
