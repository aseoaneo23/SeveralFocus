import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OneSignal, LogLevel } from 'react-native-onesignal';

import CreateUserScreen from './src/screens/CreateUserScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import JoinGroupsScreen from './src/screens/JoinGroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';

export type RootStackParamList = {
  CreateUser: undefined;
  Home: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    console.log("ONESIGNAL_APP_ID", process.env.ONESIGNAL_APP_ID);

    OneSignal.initialize("2426485f-1cb8-4ac9-a326-7df332e72244");
    OneSignal.Notifications.requestPermission(false);

  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="CreateUser"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="CreateUser" component={CreateUserScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupsScreen} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
