// Global auth context for token/role state and auth actions.
import {createContext, useContext} from 'react';
import {UserRole} from '../api/auth';

export interface AuthContextValue {
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (token: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AUTH_ROLE_KEY = '@aqarya/auth_role';

const defaultAuthContextValue: AuthContextValue = {
  token: null,
  role: null,
  isLoading: false,
  signIn: async () => {
    // No-op fallback used only if a screen renders outside provider.
  },
  signOut: async () => {
    // No-op fallback used only if a screen renders outside provider.
  },
};

export const AuthContext = createContext<AuthContextValue>(
  defaultAuthContextValue,
);

export const useAuth = (): AuthContextValue => {
  return useContext(AuthContext);
};
