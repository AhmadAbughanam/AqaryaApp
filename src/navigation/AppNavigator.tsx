import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import CitizenStack from './CitizenStack';
import AdminStack from './AdminStack';
import LoginScreen from '../screens/auth/LoginScreen';
import OtherRoleScreen from '../screens/auth/OtherRoleScreen';
import {useAuth} from '../store/AuthContext';
import {Colors} from '../constants/colors';

export type RootStackParamList = {
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

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: Colors.backgroundPrimary},
          animation: 'fade_from_bottom',
        }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : null}

        {isAuthenticated && role === 'citizen' ? (
          <Stack.Screen name="CitizenFlow" component={CitizenStack} />
        ) : null}

        {isAuthenticated && role === 'admin' ? (
          <Stack.Screen name="AdminFlow" component={AdminStack} />
        ) : null}

        {isAuthenticated && role !== 'citizen' && role !== 'admin' ? (
          <Stack.Screen name="OtherFlow" component={OtherRoleScreen} />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
