import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MyPropertiesScreen from '../screens/citizen/MyPropertiesScreen';
import PropertyDetailScreen from '../screens/citizen/PropertyDetailScreen';
import InvestmentSimulationScreen from '../screens/citizen/InvestmentSimulationScreen';
import PortfolioScreen from '../screens/citizen/PortfolioScreen';
import SellPropertyScreen from '../screens/citizen/SellPropertyScreen';
import HelpScreen from '../screens/citizen/HelpScreen';
import {Colors} from '../constants/colors';

export type CitizenStackParamList = {
  MyProperties: undefined;
  PropertyDetail: {id: string};
  InvestmentSimulation: {propertyId?: string} | undefined;
  Portfolio: undefined;
  Help: undefined;
  SellProperty:
    | {
        propertyId?: string;
        title?: string;
        location?: string;
        ownerName?: string;
        ownershipType?: string;
        ownershipProofType?: string;
        ownershipProofNumber?: string;
        description?: string;
        propertyValue?: number;
        price?: number;
      }
    | undefined;
};

const sharedHeaderOptions = {
  headerStyle: {
    backgroundColor: Colors.backgroundSecondary,
  },
  headerTitleStyle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },
  headerTintColor: Colors.primary,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: {
    backgroundColor: Colors.backgroundPrimary,
  },
};

const Stack = createNativeStackNavigator<CitizenStackParamList>();

const CitizenStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="MyProperties"
      screenOptions={sharedHeaderOptions}>
      <Stack.Screen
        name="MyProperties"
        component={MyPropertiesScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{title: 'Property Detail'}}
      />

      <Stack.Screen
        name="InvestmentSimulation"
        component={InvestmentSimulationScreen}
        options={{title: 'Buy Simulation'}}
      />

      <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{title: 'Simulation History'}}
      />

      <Stack.Screen
        name="SellProperty"
        component={SellPropertyScreen}
        options={{title: 'Sell Property'}}
      />

      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{title: 'Help & Support'}}
      />
    </Stack.Navigator>
  );
};

export default CitizenStack;
