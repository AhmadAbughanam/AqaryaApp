// Language context — stores the active UI language, persists across restarts.
// Rendered at the root of the app (App.tsx) so all screens including login can use it.
// Call setLanguage to switch; the choice is saved to AsyncStorage immediately.
// After login, CitizenProfileScreen syncs the server preference via setLanguage.

import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'en' | 'ar';

export const LANGUAGE_STORAGE_KEY = '@aqarya/ui_language';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
});

export const LanguageProvider = ({children}: {children: React.ReactNode}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Restore saved language on mount (fast AsyncStorage read).
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(saved => {
        if (saved === 'en' || saved === 'ar') {
          setLanguageState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{language, setLanguage}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
