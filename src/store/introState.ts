// Intro dismissed context — shared between AppNavigator (provider) and
// IntroScreen (consumer) to avoid a circular import.
import {createContext, useContext} from 'react';

export const INTRO_DISMISSED_KEY = '@aqarya/intro_dismissed';

// The context value is the dismiss function itself.
export const IntroDismissedContext = createContext<() => void>(() => undefined);
export const useIntroDismissed = (): (() => void) =>
  useContext(IntroDismissedContext);
