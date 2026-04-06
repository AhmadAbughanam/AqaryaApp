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
