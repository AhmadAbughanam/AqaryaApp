// Shared date formatting helpers for UI display.

const _dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
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

  return _dateTimeFormatter.format(date);
};

const _currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number): string => _currencyFormatter.format(value);

const _compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCompactCurrency = (value: number): string => _compactCurrencyFormatter.format(value);

const _numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number): string => _numberFormatter.format(value);

const _decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
});

export const formatDecimal = (value: number): string => _decimalFormatter.format(value);

const _decimalStrictFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatDecimalStrict = (value: number): string => _decimalStrictFormatter.format(value);
