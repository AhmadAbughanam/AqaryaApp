import axios, {AxiosError} from 'axios';
import {API_BASE_URL} from '../config/api';

export type UserRole = 'citizen' | 'admin';
export type RawUserRole =
  | UserRole
  | 'dlsAdmin'
  | 'dlsadmin'
  | 'auditor'
  | 'analyst';

export const normalizeUserRole = (role: RawUserRole | string | null): UserRole | null => {
  if (role === 'citizen') {
    return 'citizen';
  }

  if (
    role === 'admin' ||
    role === 'dlsAdmin' ||
    role === 'dlsadmin' ||
    role === 'auditor' ||
    role === 'analyst'
  ) {
    return 'admin';
  }

  return null;
};

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  role: UserRole;
}

const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

interface Envelope<T> {
  data?: T;
}

const DEV_FALLBACK_USERS: Record<string, UserRole> = {
  citizen: 'citizen',
  citizen2: 'citizen',
  citizen3: 'citizen',
  admin: 'admin',
  dlsadmin: 'admin',
  auditor: 'admin',
  analyst: 'admin',
};

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResult> => {
  try {
    const response = await authApi.post<
      | {token: string; role: RawUserRole}
      | Envelope<{token: string; role: RawUserRole}>
    >('/auth/login', credentials);

    const payload =
      response.data &&
      typeof response.data === 'object' &&
      'data' in (response.data as Envelope<{token: string; role: RawUserRole}>) &&
      (response.data as Envelope<{token: string; role: RawUserRole}>).data
        ? (response.data as Envelope<{token: string; role: RawUserRole}>).data
        : (response.data as {token: string; role: RawUserRole});

    if (!payload) {
      throw new Error('Authentication service returned an empty response.');
    }

    const role = normalizeUserRole(payload.role);
    if (!role) {
      throw new Error('Unsupported role returned by authentication service.');
    }

    return {
      token: payload.token,
      role,
    };
  } catch (error) {
    const axiosError = error as AxiosError<{message?: string}>;

    if (axiosError.response?.data?.message) {
      throw new Error(axiosError.response.data.message);
    }

    if (axiosError.code === 'ERR_NETWORK') {
      if (__DEV__) {
        const username = credentials.username.trim().toLowerCase();
        const matchedRole = DEV_FALLBACK_USERS[username];

        if (matchedRole && credentials.password.trim() === '123456') {
          return {
            token: `dev-jwt-${username}-${Date.now()}`,
            role: matchedRole,
          };
        }
      }

      throw new Error(
        `Cannot reach authentication server at ${API_BASE_URL}. Verify backend is running and reachable from emulator.`,
      );
    }

    throw new Error('Login request failed. Please try again.');
  }
};
