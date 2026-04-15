// i18n barrel — re-exports language context and the useStrings hook.
// Usage:
//   import {useStrings, LanguageProvider, useLanguage} from '../../i18n';
//   const strings = useStrings();

export {LanguageProvider, useLanguage} from './LanguageContext';
export type {SupportedLanguage} from './LanguageContext';

import {Strings} from '../constants/strings';
import {ArabicStrings} from './strings.ar';
import {useLanguage} from './LanguageContext';

/**
 * Returns the string set for the currently active language.
 * English is the default; Arabic is served when the user's language preference is 'ar'.
 * New screens should call useStrings() instead of importing Strings directly so that
 * the language preference is automatically respected.
 */
export const useStrings = (): typeof Strings => {
  const {language} = useLanguage();
  return language === 'ar' ? ArabicStrings : Strings;
};
