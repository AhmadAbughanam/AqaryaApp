// Centralized API base URL configuration.
// Override with environment variable when available.
const DEFAULT_DEV_API_BASE_URL = 'http://10.0.2.2:3000';
const DEFAULT_PROD_API_BASE_URL = 'https://api.example.com';

const globalEnv =
  typeof globalThis !== 'undefined'
    ? ((globalThis as unknown as {process?: {env?: Record<string, string>}})
        .process?.env ??
      undefined)
    : undefined;
const envBaseUrl = globalEnv?.API_BASE_URL;

const normalizeBaseUrl = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('http10.')) {
    return `http://${trimmed.slice('http'.length)}`;
  }

  if (trimmed.startsWith('https10.')) {
    return `https://${trimmed.slice('https'.length)}`;
  }

  return `http://${trimmed}`;
};

export const API_BASE_URL =
  envBaseUrl && envBaseUrl.length > 0
    ? normalizeBaseUrl(envBaseUrl)
    : __DEV__
      ? DEFAULT_DEV_API_BASE_URL
      : DEFAULT_PROD_API_BASE_URL;
