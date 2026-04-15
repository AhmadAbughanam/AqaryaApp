import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CitizenProfileScreen from '../screens/citizen/CitizenProfileScreen';
import WalletScreen from '../screens/citizen/WalletScreen';
import {Colors} from '../constants/colors';

export type CitizenProfileStackParamList = {
  Profile: undefined;
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<CitizenProfileStackParamList>();

const CitizenProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {backgroundColor: Colors.backgroundSecondary},
      headerTitleStyle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '700' as const,
      },
      headerTintColor: Colors.primary,
      headerShadowVisible: false,
      contentStyle: {backgroundColor: Colors.backgroundPrimary},
    }}>
    <Stack.Screen
      name="Profile"
      component={CitizenProfileScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Wallet"
      component={WalletScreen}
      options={{title: 'My Ejod Wallet'}}
    />
  </Stack.Navigator>
);

export default CitizenProfileStack;
