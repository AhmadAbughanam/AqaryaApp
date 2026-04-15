// Bottom-tab shell for citizen users.
// Five tabs: Home, Map, Properties, Messages, Profile.
// Properties tab hosts the full sale + investment stack (CitizenStack).
// Profile tab is a standalone screen.

import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute, NavigatorScreenParams} from '@react-navigation/native';
import CitizenStack, {CitizenStackParamList} from './CitizenStack';
import CitizenHomeStack, {CitizenHomeStackParamList} from './CitizenHomeStack';
import CitizenMapStack, {CitizenMapStackParamList} from './CitizenMapStack';
import CitizenMessagesStack, {CitizenMessagesStackParamList} from './CitizenMessagesStack';
import CitizenProfileStack, {CitizenProfileStackParamList} from './CitizenProfileStack';
import {Colors} from '../constants/colors';
import {useStrings} from '../i18n';
import {InvestModeContext} from '../store/investModeState';

export type CitizenTabParamList = {
  HomeTab: NavigatorScreenParams<CitizenHomeStackParamList> | undefined;
  MapTab: NavigatorScreenParams<CitizenMapStackParamList> | undefined;
  PropertiesTab: NavigatorScreenParams<CitizenStackParamList> | undefined;
  MessagesTab: NavigatorScreenParams<CitizenMessagesStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<CitizenProfileStackParamList> | undefined;
};

// ─── Tab icons ────────────────────────────────────────────────────────────────

const HomeIcon = ({color, size}: {color: string; size: number}) => {
  const roofHalf = Math.round(size * 0.36);
  const wallW = Math.round(size * 0.52);
  const wallH = Math.round(size * 0.35);
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 1}}>
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: roofHalf, borderRightWidth: roofHalf,
        borderBottomWidth: Math.round(size * 0.3),
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
        marginBottom: -1,
      }} />
      <View style={{
        width: wallW, height: wallH,
        borderColor: color, borderWidth: 1.8,
        borderTopWidth: 0,
        borderRadius: 2,
      }} />
    </View>
  );
};

const MapIcon = ({color, size}: {color: string; size: number}) => {
  const outer = Math.round(size * 0.75);
  const inner = Math.round(size * 0.28);
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <View style={{
        width: outer, height: outer,
        borderRadius: outer / 2,
        borderWidth: 1.8, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          width: inner, height: inner,
          borderRadius: inner / 2,
          backgroundColor: color,
        }} />
      </View>
    </View>
  );
};

const PropertiesIcon = ({color, size}: {color: string; size: number}) => {
  const sq = Math.round(size * 0.32);
  const gap = Math.round(size * 0.1);
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <View style={{flexDirection: 'row', marginBottom: gap}}>
        <View style={[styles.gridSquare, {width: sq, height: sq, borderColor: color, marginRight: gap}]} />
        <View style={[styles.gridSquare, {width: sq, height: sq, borderColor: color}]} />
      </View>
      <View style={{flexDirection: 'row'}}>
        <View style={[styles.gridSquare, {width: sq, height: sq, borderColor: color, marginRight: gap}]} />
        <View style={[styles.gridSquare, {width: sq, height: sq, borderColor: color}]} />
      </View>
    </View>
  );
};

const MessagesIcon = ({color, size}: {color: string; size: number}) => {
  const bubbleW = Math.round(size * 0.75);
  const bubbleH = Math.round(size * 0.6);
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <View style={{
        width: bubbleW, height: bubbleH,
        borderRadius: 6, borderWidth: 1.8,
        borderColor: color,
        marginBottom: Math.round(size * 0.08),
      }} />
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: Math.round(size * 0.12),
        borderRightWidth: 0,
        borderTopWidth: Math.round(size * 0.18),
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
        alignSelf: 'flex-start',
        marginLeft: Math.round(size * 0.15),
        marginTop: -Math.round(size * 0.06),
      }} />
    </View>
  );
};

const ProfileIcon = ({color, size}: {color: string; size: number}) => {
  const head = Math.round(size * 0.32);
  const shoulderW = Math.round(size * 0.62);
  const shoulderH = Math.round(size * 0.28);
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: 3}}>
      <View style={{
        width: head, height: head,
        borderRadius: head / 2,
        borderWidth: 1.8, borderColor: color,
      }} />
      <View style={{
        width: shoulderW, height: shoulderH,
        borderTopLeftRadius: shoulderW / 2,
        borderTopRightRadius: shoulderW / 2,
        borderWidth: 1.8, borderColor: color,
        borderBottomWidth: 0,
      }} />
    </View>
  );
};

// ─── Navigator ────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<CitizenTabParamList>();

type NestedRouteState = {
  index?: number;
  routes?: Array<{
    name?: string;
    params?: {
      marketType?: string;
    };
  }>;
};

type NestedRouteParams = {
  screen?: string;
  params?: {
    marketType?: string;
  };
};

const getFocusedNestedRoute = (route: unknown) => {
  const state = (route as {state?: NestedRouteState}).state;
  if (!state?.routes?.length) {
    return null;
  }

  return state.routes[state.index ?? state.routes.length - 1] ?? null;
};

const isInvestmentPublicListingRoute = (route: unknown): boolean => {
  const focusedNestedRoute = getFocusedNestedRoute(route);
  const routeParams = (route as {params?: NestedRouteParams}).params;
  return (
    (focusedNestedRoute?.name === 'PublicListingDetail' &&
      focusedNestedRoute.params?.marketType === 'investment') ||
    (routeParams?.screen === 'PublicListingDetail' &&
      routeParams.params?.marketType === 'investment')
  );
};

const CitizenTabNavigator = () => {
  const strings = useStrings();
  const [isInvest, setIsInvest] = useState(false);

  return (
    <InvestModeContext.Provider value={{isInvest, setIsInvest}}>
    <Tab.Navigator
      screenOptions={({route}) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route);
        const isInvestmentDetailRoute =
          route.name === 'HomeTab' && focusedRouteName === 'InvestmentOpportunityDetail';
        const useDarkTabBar =
          isInvest ||
          isInvestmentDetailRoute ||
          ((route.name === 'HomeTab' || route.name === 'MapTab') &&
            isInvestmentPublicListingRoute(route));

        return {
          headerShown: false,
          tabBarStyle: useDarkTabBar ? styles.tabBarDark : styles.tabBar,
          tabBarActiveTintColor: useDarkTabBar ? '#7CBFAA' : Colors.navActive,
          tabBarInactiveTintColor: useDarkTabBar ? '#3A3A38' : Colors.navInactive,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        };
      }}>

      <Tab.Screen
        name="HomeTab"
        component={CitizenHomeStack}
        options={{
          tabBarLabel: strings.nav.home,
          tabBarIcon: ({color, size}) => <HomeIcon color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="MapTab"
        component={CitizenMapStack}
        options={{
          tabBarLabel: strings.nav.map,
          tabBarIcon: ({color, size}) => <MapIcon color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="PropertiesTab"
        component={CitizenStack}
        options={{
          tabBarLabel: strings.nav.properties,
          tabBarIcon: ({color, size}) => <PropertiesIcon color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="MessagesTab"
        component={CitizenMessagesStack}
        options={{
          tabBarLabel: strings.nav.messages,
          tabBarIcon: ({color, size}) => <MessagesIcon color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={CitizenProfileStack}
        options={{
          tabBarLabel: strings.nav.profile,
          tabBarIcon: ({color, size}) => <ProfileIcon color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
    </InvestModeContext.Provider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.navBackground,
    borderTopColor: Colors.navBorder,
    borderTopWidth: 1,
    elevation: 0,
    height: 62,
    paddingBottom: 10,
    paddingTop: 8,
    shadowOpacity: 0,
  },
  tabBarDark: {
    backgroundColor: '#111110',
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: 1,
    elevation: 0,
    height: 62,
    paddingBottom: 10,
    paddingTop: 8,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  gridSquare: {
    borderRadius: 3,
    borderWidth: 1.8,
  },
});

export default CitizenTabNavigator;
