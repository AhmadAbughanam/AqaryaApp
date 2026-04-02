// Secure token storage helpers backed by the platform keychain/keystore.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const AUTH_SERVICE = 'aqarya.auth.token';
const AUTH_ACCOUNT = 'jwt';
const FALLBACK_TOKEN_KEY = '@aqarya/auth_token_fallback';

export const setSecureToken = async (token: string): Promise<void> => {
  try {
    await Keychain.setGenericPassword(AUTH_ACCOUNT, token, {
      service: AUTH_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });

    // Keep fallback store clean when secure write succeeds.
    await AsyncStorage.removeItem(FALLBACK_TOKEN_KEY);
  } catch (error) {
    // Fallback for devices/environments where secure module is unavailable.
    await AsyncStorage.setItem(FALLBACK_TOKEN_KEY, token);
  }
};

export const getSecureToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: AUTH_SERVICE,
    });

    if (credentials) {
      return credentials.password;
    }
  } catch (error) {
    // Fall through to AsyncStorage fallback read.
  }

  return AsyncStorage.getItem(FALLBACK_TOKEN_KEY);
};

export const clearSecureToken = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({service: AUTH_SERVICE});
  } catch (error) {
    // Ignore secure-store clear errors and clear fallback store as well.
  }

  await AsyncStorage.removeItem(FALLBACK_TOKEN_KEY);
};
