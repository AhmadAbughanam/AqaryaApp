// Messages tab stack — wraps MessagesScreen (thread list) and ThreadDetailScreen.

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MessagesScreen from '../screens/citizen/MessagesScreen';
import ThreadDetailScreen from '../screens/citizen/ThreadDetailScreen';
import {Colors} from '../constants/colors';

export type CitizenMessagesStackParamList = {
  ThreadList: undefined;
  ThreadDetail: {threadId: string; subject: string};
};

const Stack = createNativeStackNavigator<CitizenMessagesStackParamList>();

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

const CitizenMessagesStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="ThreadList"
      component={MessagesScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="ThreadDetail"
      component={ThreadDetailScreen}
      options={({route}) => ({title: route.params.subject})}
    />
  </Stack.Navigator>
);

export default CitizenMessagesStack;
