import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {UserRole} from '../api/auth';
import {
  clearSecureToken,
  getSecureToken,
  setSecureToken,
} from '../services/secureStorage';
import {setUnauthorizedHandler} from '../api/client';

const ROLE_KEY = 'aqarya.auth.role';

export interface AuthContextValue {
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (token: string, role: UserRole, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getSecureToken().then(savedToken => {
      if (!active) return;
      const savedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
      if (savedToken && (savedRole === 'citizen' || savedRole === 'admin')) {
        setToken(savedToken);
        setRole(savedRole);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (nextToken: string, nextRole: UserRole, remember = false) => {
      await setSecureToken(nextToken, remember);
      localStorage.setItem(ROLE_KEY, nextRole);
      setToken(nextToken);
      setRole(nextRole);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearSecureToken();
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setRole(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(
    () => ({token, role, isLoading, signIn, signOut}),
    [token, role, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
