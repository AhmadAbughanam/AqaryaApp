import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type SupportedLanguage = 'en' | 'ar';
export const LANGUAGE_STORAGE_KEY = 'aqarya.ui.language';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({children}: {children: ReactNode}) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() =>
    localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ar' ? 'ar' : 'en',
  );

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => ({language, setLanguage}), [language]);
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider.');
  return context;
}
