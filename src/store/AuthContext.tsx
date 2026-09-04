import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {UserRole} from '../api/auth';
import {AUTH_ROLE_KEY} from '../mock/db';

export interface AuthContextValue {
  role: UserRole | null;
  isLoading: boolean;
  signIn: (role: UserRole) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredRole = (): UserRole | null => {
  const stored = localStorage.getItem(AUTH_ROLE_KEY);
  return stored === 'citizen' || stored === 'admin' ? stored : 'citizen';
};

export function AuthProvider({children}: {children: ReactNode}) {
  const [role, setRole] = useState<UserRole | null>(readStoredRole);

  const signIn = useCallback((nextRole: UserRole) => {
    localStorage.setItem(AUTH_ROLE_KEY, nextRole);
    setRole(nextRole);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_ROLE_KEY);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({role, isLoading: false, signIn, signOut}),
    [role, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
