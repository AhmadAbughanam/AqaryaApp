// Home tab navigator — wraps HomeScreen and the public listing detail screen.
// Nested inside CitizenTabNavigator as the HomeTab.

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/citizen/HomeScreen';
import PublicListingDetailScreen from '../screens/citizen/PublicListingDetailScreen';
import InvestmentOpportunityDetailScreen from '../screens/citizen/InvestmentOpportunityDetailScreen';
import NotificationsScreen from '../screens/citizen/NotificationsScreen';
import SearchFilterScreen from '../screens/citizen/SearchFilterScreen';
import {Colors} from '../constants/colors';

export type FilterParams = {
  propertyType?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  minAreaSqm?: number;
  maxAreaSqm?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: 'price_asc' | 'price_desc' | 'newest';
  verifiedOnly?: boolean;
};

export type CitizenHomeStackParamList = {
  HomeMain: {filters?: FilterParams} | undefined;
  SearchFilter: {initialFilters?: FilterParams} | undefined;
  PublicListingDetail: {id: string; marketType?: 'sale' | 'rent' | 'investment'};
  InvestmentOpportunityDetail: {id: string};
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<CitizenHomeStackParamList>();

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

const CitizenHomeStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="PublicListingDetail"
      component={PublicListingDetailScreen}
      options={{title: 'Property Details'}}
    />
    <Stack.Screen
      name="InvestmentOpportunityDetail"
      component={InvestmentOpportunityDetailScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{title: 'Notifications', headerShown: false}}
    />
    <Stack.Screen
      name="SearchFilter"
      component={SearchFilterScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

export default CitizenHomeStack;
