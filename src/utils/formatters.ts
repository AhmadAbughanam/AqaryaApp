// Shared date formatting helpers for UI display.

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('en-US');

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const decimals2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

const strictDecimals2Formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return dateTimeFormatter.format(date);
};

export const formatNumber = (value: number | bigint): string => {
  return numberFormatter.format(value);
};

export const formatCurrency = (value: number | bigint): string => {
  return currencyFormatter.format(value);
};

export const formatDecimals2 = (value: number | bigint): string => {
  return decimals2Formatter.format(value);
};

export const formatStrictDecimals2 = (value: number | bigint): string => {
  return strictDecimals2Formatter.format(value);
};
