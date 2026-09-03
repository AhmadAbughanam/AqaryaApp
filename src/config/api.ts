const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/$/, '');

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || '/api',
);
