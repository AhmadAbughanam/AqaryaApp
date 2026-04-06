import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../store/AuthContext';
import AdminDashboardScreen from '../screens/dlsAdmin/AdminDashboardScreen';
import PropertyVerificationScreen from '../screens/dlsAdmin/PropertyVerificationScreen';
import AuditLogsScreen from '../screens/dlsAdmin/AuditLogsScreen';
import AnalyticsScreen from '../screens/dlsAdmin/AnalyticsScreen';
import AdminPropertyDetailScreen from '../screens/dlsAdmin/AdminPropertyDetailScreen';
import {Colors} from '../constants/colors';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  PropertyVerification: undefined;
  AuditLogs: undefined;
  Analytics: undefined;
  AdminPropertyDetail: {id: string};
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

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminStack = () => {
  const {signOut} = useAuth();
  const signOutButton = <SignOutButton onPress={() => void signOut()} />;

  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        ...sharedHeaderOptions,
        headerRight: () => signOutButton,
      }}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{title: 'Admin Dashboard'}}
      />
      <Stack.Screen
        name="PropertyVerification"
        component={PropertyVerificationScreen}
        options={{title: 'Sale Listings'}}
      />
      <Stack.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{title: 'Audit Logs'}}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{title: 'Analytics'}}
      />
      <Stack.Screen
        name="AdminPropertyDetail"
        component={AdminPropertyDetailScreen}
        options={{title: 'Property Detail'}}
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

export default AdminStack;
