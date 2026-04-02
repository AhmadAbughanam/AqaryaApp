import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../store/AuthContext';
import PropertyListScreen from '../screens/citizen/PropertyListScreen';
import PropertyDetailScreen from '../screens/citizen/PropertyDetailScreen';
import InvestmentSimulationScreen from '../screens/citizen/InvestmentSimulationScreen';
import PortfolioScreen from '../screens/citizen/PortfolioScreen';
import SellPropertyScreen from '../screens/citizen/SellPropertyScreen';
import CitizenProfileScreen from '../screens/citizen/CitizenProfileScreen';
import {Colors} from '../constants/colors';

export type CitizenStackParamList = {
  SellingMarketplace: undefined;
  PropertyDetail: {id: string};
  InvestmentSimulation: {propertyId?: string} | undefined;
  Portfolio: undefined;
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
  Profile: undefined;
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

const SignOutButton = ({onPress}: {onPress: () => void}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
    hitSlop={8}
    accessibilityLabel="Sign out"
    accessibilityRole="button">
    <View style={styles.signOutPill}>
      <Text style={styles.signOutText}>Sign Out</Text>
    </View>
  </Pressable>
);

const Stack = createNativeStackNavigator<CitizenStackParamList>();

const CitizenStack = () => {
  const {signOut} = useAuth();
  const signOutButton = <SignOutButton onPress={() => void signOut()} />;

  return (
    <Stack.Navigator
      initialRouteName="SellingMarketplace"
      screenOptions={{
        ...sharedHeaderOptions,
        headerRight: () => signOutButton,
      }}>
      <Stack.Screen
        name="SellingMarketplace"
        component={PropertyListScreen}
        options={{title: 'Selling Marketplace'}}
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
        name="Profile"
        component={CitizenProfileScreen}
        options={{title: 'My Profile'}}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  signOutBtn: {
    marginRight: 4,
  },
  signOutBtnPressed: {
    opacity: 0.7,
  },
  signOutPill: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  signOutText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default CitizenStack;
