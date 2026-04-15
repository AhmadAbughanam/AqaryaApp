import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../store/AuthContext';
import AdminDashboardScreen from '../screens/dlsAdmin/AdminDashboardScreen';
import PropertyVerificationScreen from '../screens/dlsAdmin/PropertyVerificationScreen';
import AuditLogsScreen from '../screens/dlsAdmin/AuditLogsScreen';
import AnalyticsScreen from '../screens/dlsAdmin/AnalyticsScreen';
import AdminPropertyDetailScreen from '../screens/dlsAdmin/AdminPropertyDetailScreen';
import InvestmentReviewScreen from '../screens/dlsAdmin/InvestmentReviewScreen';
import AdminInvestmentDetailScreen from '../screens/dlsAdmin/AdminInvestmentDetailScreen';
import UserManagementScreen from '../screens/dlsAdmin/UserManagementScreen';
import AdminUserDetailScreen from '../screens/dlsAdmin/AdminUserDetailScreen';
import ModerationQueueScreen from '../screens/dlsAdmin/ModerationQueueScreen';
import ModerationDetailScreen from '../screens/dlsAdmin/ModerationDetailScreen';
import AnnouncementsScreen from '../screens/dlsAdmin/AnnouncementsScreen';
import CreateAnnouncementScreen from '../screens/dlsAdmin/CreateAnnouncementScreen';
import ContentManagementScreen from '../screens/dlsAdmin/ContentManagementScreen';
import {AC} from '../constants/adminColors';
import {useStrings} from '../i18n';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  PropertyVerification: undefined;
  AuditLogs: undefined;
  Analytics: undefined;
  AdminPropertyDetail: {id: string};
  InvestmentReview: undefined;
  AdminInvestmentDetail: {id: string};
  UserManagement: undefined;
  AdminUserDetail: {id: string};
  ModerationQueue: undefined;
  ModerationDetail: {id: string};
  AnnouncementsManagement: undefined;
  CreateAnnouncement: undefined;
  ContentManagement: undefined;
};

const sharedHeaderOptions = {
  headerStyle: {
    backgroundColor: AC.headerBg,
  },
  headerTitleStyle: {
    color: AC.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  headerTintColor: AC.accent,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: {
    backgroundColor: AC.bg,
  },
};

const SignOutButton = ({onPress, label}: {onPress: () => void; label: string}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
    hitSlop={8}
    accessibilityLabel="Sign out"
    accessibilityRole="button">
    <View style={styles.signOutPill}>
      <Text style={styles.signOutText}>{label}</Text>
    </View>
  </Pressable>
);

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminStack = () => {
  const {signOut} = useAuth();
  const strings = useStrings();
  const nav = strings.admin.nav;
  const signOutButton = <SignOutButton onPress={() => void signOut()} label={nav.signOut} />;

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
        options={{title: nav.commandCenter}}
      />
      <Stack.Screen
        name="PropertyVerification"
        component={PropertyVerificationScreen}
        options={{title: nav.saleListings}}
      />
      <Stack.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{title: nav.auditLogs}}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{title: nav.analytics}}
      />
      <Stack.Screen
        name="AdminPropertyDetail"
        component={AdminPropertyDetailScreen}
        options={{title: nav.propertyDetail}}
      />
      <Stack.Screen
        name="InvestmentReview"
        component={InvestmentReviewScreen}
        options={{title: nav.investmentReview}}
      />
      <Stack.Screen
        name="AdminInvestmentDetail"
        component={AdminInvestmentDetailScreen}
        options={{title: nav.opportunityDetail}}
      />
      <Stack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{title: nav.userManagement}}
      />
      <Stack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
        options={{title: nav.userProfile}}
      />
      <Stack.Screen
        name="ModerationQueue"
        component={ModerationQueueScreen}
        options={{title: nav.moderation}}
      />
      <Stack.Screen
        name="ModerationDetail"
        component={ModerationDetailScreen}
        options={{title: nav.reportDetail}}
      />
      <Stack.Screen
        name="AnnouncementsManagement"
        component={AnnouncementsScreen}
        options={{title: nav.announcements}}
      />
      <Stack.Screen
        name="CreateAnnouncement"
        component={CreateAnnouncementScreen}
        options={{title: nav.newAnnouncement}}
      />
      <Stack.Screen
        name="ContentManagement"
        component={ContentManagementScreen}
        options={{title: nav.helpContent}}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  signOutBtn: {
    marginRight: 2,
  },
  signOutBtnPressed: {
    opacity: 0.6,
  },
  signOutPill: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  signOutText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default AdminStack;
