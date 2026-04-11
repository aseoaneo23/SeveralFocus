import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
