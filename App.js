import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { store, hydrateStore } from './store';
import { start } from './store/thunks';
import HomeScreen from './screens/HomeScreen';
import PickGroupScreen from './screens/PickGroupScreen';
import DetailScreen from './screens/DetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import DialogHost from './components/DialogHost';
import { colors } from './styles/theme';

const Stack = createNativeStackNavigator();
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg } };

function Root() {
  const dispatch = useDispatch();
  const hydrated = useSelector((s) => s.tracked.hydrated);

  useEffect(() => {
    if (hydrated) return dispatch(start());
    return undefined;
  }, [dispatch, hydrated]);

  if (!hydrated) return <View style={styles.fill} />;
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Pick" component={PickGroupScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Root />
        <DialogHost />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
