// App.tsx
import React, { useEffect } from 'react';
// IMPORTANTE: Corregida la ruta de importación de AppNavigation a AppNavigator
import AppNavigator from './src/navigation/AppNavigator';

// OneSignal des-comentado para que funcionen las Push en el APK
import { OneSignal, LogLevel } from 'react-native-onesignal';

export default function App() {
  useEffect(() => {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize("2426485f-1cb8-4ac9-a326-7df332e72244");
    OneSignal.Notifications.requestPermission(false);
  }, []);

  return <AppNavigator />;
}