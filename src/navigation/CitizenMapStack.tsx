// Map tab navigator — wraps MapScreen and the public listing detail screen.
// Nested inside CitizenTabNavigator as the MapTab.

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MapScreen from '../screens/citizen/MapScreen';
import PublicListingDetailScreen from '../screens/citizen/PublicListingDetailScreen';
import {Colors} from '../constants/colors';

export type CitizenMapStackParamList = {
  MapMain:
    | {initialCity?: string; initialLatitude?: number; initialLongitude?: number}
    | undefined;
  PublicListingDetail: {id: string; marketType?: 'sale' | 'rent' | 'investment'};
};

const Stack = createNativeStackNavigator<CitizenMapStackParamList>();

const sharedHeaderOptions = {
  headerStyle: {backgroundColor: Colors.backgroundSecondary},
  headerTitleStyle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },
  headerTintColor: Colors.primary,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: {backgroundColor: Colors.backgroundPrimary},
};

const CitizenMapStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="MapMain"
      component={MapScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="PublicListingDetail"
      component={PublicListingDetailScreen}
      options={{title: 'Property Details'}}
    />
  </Stack.Navigator>
);

export default CitizenMapStack;
