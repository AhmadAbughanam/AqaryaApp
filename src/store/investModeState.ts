// Invest-mode context — shared between CitizenTabNavigator (provider + consumer)
// and HomeScreen (setter) so the tab bar can go dark when invest mode is active.
import {createContext, useContext} from 'react';

interface InvestModeValue {
  isInvest: boolean;
  setIsInvest: (v: boolean) => void;
}

export const InvestModeContext = createContext<InvestModeValue>({
  isInvest: false,
  setIsInvest: () => undefined,
});

export const useInvestMode = (): InvestModeValue => useContext(InvestModeContext);
