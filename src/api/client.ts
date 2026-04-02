// Shared authenticated Axios client for protected API endpoints.
import axios, {AxiosError, AxiosInstance} from 'axios';
import {getSecureToken} from '../services/secureStorage';
import {API_BASE_URL} from '../config/api';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type UnauthorizedHandler = () => void | Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (
  handler: UnauthorizedHandler | null,
): void => {
  unauthorizedHandler = handler;
};

export const createAuthenticatedApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
  });

  client.interceptors.request.use(async config => {
    const token = await getSecureToken();

    if (!token) {
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
      throw new ApiError('Authentication required. Please sign in again.', 401);
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    response => response,
    async (error: AxiosError<{message?: string}>) => {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ??
        (status === 401
          ? 'Your session has expired. Please sign in again.'
          : 'Unable to complete request at this time.');

      if (status === 401 && unauthorizedHandler) {
        await unauthorizedHandler();
      }

      throw new ApiError(message, status);
    },
  );

  return client;
};
