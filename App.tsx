// Root app entry that bootstraps auth state and provides it globally.
import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import {AuthContext, AUTH_ROLE_KEY} from './src/store/AuthContext';
import {UserRole} from './src/api/auth';
import {
  clearSecureToken,
  getSecureToken,
  setSecureToken,
} from './src/services/secureStorage';
import {setUnauthorizedHandler} from './src/api/client';
import {Colors} from './src/constants/colors';
import {Strings} from './src/constants/strings';
import {LanguageProvider} from './src/i18n';

interface AuthState {
  isLoading: boolean;
  token: string | null;
  role: UserRole | null;
}

const App = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    token: null,
    role: null,
  });

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedToken = await getSecureToken();
        const savedRole = (await AsyncStorage.getItem(
          AUTH_ROLE_KEY,
        )) as UserRole | null;

        if (savedToken && savedRole) {
          setAuthState({isLoading: false, token: savedToken, role: savedRole});
          return;
        }
      } catch (error) {
        // Keep user signed out if stored data cannot be read.
      }

      setAuthState({isLoading: false, token: null, role: null});
    };

    void bootstrapAuth();
  }, []);

  const authContextValue = useMemo(
    () => ({
      token: authState.token,
      role: authState.role,
      isLoading: authState.isLoading,
      signIn: async (token: string, role: UserRole) => {
        await Promise.all([
          setSecureToken(token),
          AsyncStorage.setItem(AUTH_ROLE_KEY, role),
        ]);
        setAuthState({isLoading: false, token, role});
      },
      signOut: async () => {
        await Promise.all([
          clearSecureToken(),
          AsyncStorage.removeItem(AUTH_ROLE_KEY),
        ]);
        setAuthState({isLoading: false, token: null, role: null});
      },
    }),
    [authState],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => authContextValue.signOut());
    return () => setUnauthorizedHandler(null);
  }, [authContextValue]);

  return (
    <LanguageProvider>
      {authState.isLoading ? (
        <View style={styles.loadingContainer}>
          {/* Decorative soft circle background blobs */}
          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />

          {/* Logo mark */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner} />
            </View>
          </View>

          <Text style={styles.brandName}>{Strings.app.name}</Text>
          <Text style={styles.tagline}>{Strings.app.tagline}</Text>

          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.spinner}
          />
        </View>
      ) : (
        <AuthContext.Provider value={authContextValue}>
          <AppNavigator />
        </AuthContext.Provider>
      )}
    </LanguageProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Decorative background blobs
  blobTopRight: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 200,
    height: 320,
    opacity: 0.5,
    position: 'absolute',
    right: -80,
    top: -80,
    width: 320,
  },
  blobBottomLeft: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 200,
    bottom: -100,
    height: 280,
    left: -80,
    opacity: 0.4,
    position: 'absolute',
    width: 280,
  },

  // Logo mark — two nested circles like the UI's icon
  logoWrapper: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 32,
    elevation: 6,
    height: 80,
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: 80,
  },
  logoOuter: {
    alignItems: 'center',
    borderColor: Colors.primaryDark,
    borderRadius: 20,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  logoInner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    height: 18,
    width: 18,
  },

  // Text
  brandName: {
    color: Colors.textPrimary,
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
    marginBottom: 40,
  },

  spinner: {
    marginTop: 8,
  },
});

export default App;
