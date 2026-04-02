// Root app entry that bootstraps auth state and provides it globally.
import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import {AuthContext, AUTH_ROLE_KEY} from './src/store/AuthContext';
import {normalizeUserRole, RawUserRole, UserRole} from './src/api/auth';
import {
  clearSecureToken,
  getSecureToken,
  setSecureToken,
} from './src/services/secureStorage';
import {setUnauthorizedHandler} from './src/api/client';
import {Colors} from './src/constants/colors';
import {Strings} from './src/constants/strings';
import BrandLogo from './src/components/BrandLogo';

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
        const savedRole = normalizeUserRole(
          (await AsyncStorage.getItem(AUTH_ROLE_KEY)) as RawUserRole | null,
        );

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

  if (authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Decorative soft circle background blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        <View style={styles.logoWrapper}>
          <BrandLogo size={92} cornerRatio={0.3} />
        </View>

        <Text style={styles.brandName}>{Strings.app.name}</Text>
        <Text style={styles.tagline}>{Strings.app.tagline}</Text>

        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={styles.spinner}
        />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <AppNavigator />
    </AuthContext.Provider>
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
    justifyContent: 'center',
    marginBottom: 20,
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
