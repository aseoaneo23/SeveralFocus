// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'


import { STORAGE_KEYS } from './storage'
import { RootStackParamList } from './types'
import CreateUserScreen from '../screens/CreateUserScreen'
import HomeScreen from '../screens/HomeScreen'
import CreateGroupScreen from '../screens/CreateGroupScreen'
import JoinGroupsScreen from '../screens/JoinGroupsScreen'
import GroupDetailScreen from '../screens/GroupDetailScreen'

const COLORS = { background: '#1a1d24', detail: '#8e9aaf' }

type InitialRoute = 'CreateUser' | 'Home' | 'GroupDetail' | null

const Stack = createNativeStackNavigator<RootStackParamList>()

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.detail} />
    </View>
  )
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const [[, userId], [, groupId]] = await AsyncStorage.multiGet([
          STORAGE_KEYS.USER_ID,
          STORAGE_KEYS.GROUP_ID,
        ])

        if (!userId) setInitialRoute('CreateUser')
        else if (!groupId) setInitialRoute('Home')
        else setInitialRoute('GroupDetail')
      } catch {
        setInitialRoute('CreateUser')
      }
    }
    check()
  }, [])

  if (initialRoute === null) return <LoadingScreen />

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="CreateUser" component={CreateUserScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupsScreen} />
        <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1d24',
  },
})
