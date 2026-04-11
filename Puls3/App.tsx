import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import JoinGroupsScreen from './src/screens/JoinGroupsScreen';

export type RootStackParamList = {
  Home: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
