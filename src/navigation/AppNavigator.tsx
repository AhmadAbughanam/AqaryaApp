import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import CitizenTabNavigator from './CitizenTabNavigator';
import AdminStack from './AdminStack';
import IntroScreen from '../screens/auth/IntroScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtherRoleScreen from '../screens/auth/OtherRoleScreen';
import {useAuth} from '../store/AuthContext';
import {
  IntroDismissedContext,
  INTRO_DISMISSED_KEY,
} from '../store/introState';
import {Colors} from '../constants/colors';

export type RootStackParamList = {
  Intro: undefined;
  Login: undefined;
  CitizenFlow: undefined;
  AdminFlow: undefined;
  OtherFlow: undefined;
};

const AppTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.backgroundPrimary,
    card: Colors.backgroundSecondary,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.error,
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const {token, role} = useAuth();
  const isAuthenticated = Boolean(token);

  // null = still loading from AsyncStorage
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(INTRO_DISMISSED_KEY)
      .then(value => setIntroSeen(value === 'true'))
      .catch(() => setIntroSeen(true)); // fail-safe: skip intro on storage error
  }, []);

  // Optimistic dismiss — update state immediately, persist in background
  const dismissIntro = useCallback(() => {
    setIntroSeen(true);
    AsyncStorage.setItem(INTRO_DISMISSED_KEY, 'true').catch(() => undefined);
  }, []);

  // Hold rendering until the intro flag is known to avoid a flash
  if (introSeen === null) {
    return <View style={styles.loadingPlaceholder} />;
  }

  return (
    <IntroDismissedContext.Provider value={dismissIntro}>
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: {backgroundColor: Colors.backgroundPrimary},
            animation: 'fade_from_bottom',
          }}>

          {/* Unauthenticated: intro (first visit only) then login */}
          {!isAuthenticated && !introSeen ? (
            <Stack.Screen name="Intro" component={IntroScreen} />
          ) : null}
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : null}

          {/* Authenticated routes */}
          {isAuthenticated && role === 'citizen' ? (
            <Stack.Screen name="CitizenFlow" component={CitizenTabNavigator} />
          ) : null}
          {isAuthenticated && role === 'admin' ? (
            <Stack.Screen name="AdminFlow" component={AdminStack} />
          ) : null}
          {isAuthenticated && role !== 'citizen' && role !== 'admin' ? (
            <Stack.Screen name="OtherFlow" component={OtherRoleScreen} />
          ) : null}

        </Stack.Navigator>
      </NavigationContainer>
    </IntroDismissedContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingPlaceholder: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
});

export default AppNavigator;
