const PERSISTENT_TOKEN_KEY = 'aqarya.auth.token';
const SESSION_TOKEN_KEY = 'aqarya.auth.session-token';

export const setSecureToken = async (
  token: string,
  persistent = false,
): Promise<void> => {
  const target = persistent ? localStorage : sessionStorage;
  const other = persistent ? sessionStorage : localStorage;
  target.setItem(persistent ? PERSISTENT_TOKEN_KEY : SESSION_TOKEN_KEY, token);
  other.removeItem(persistent ? SESSION_TOKEN_KEY : PERSISTENT_TOKEN_KEY);
};

export const getSecureToken = async (): Promise<string | null> =>
  sessionStorage.getItem(SESSION_TOKEN_KEY) ??
  localStorage.getItem(PERSISTENT_TOKEN_KEY);

export const clearSecureToken = async (): Promise<void> => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(PERSISTENT_TOKEN_KEY);
};
