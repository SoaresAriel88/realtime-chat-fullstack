import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, LogBox } from 'react-native'; // ADICIONADO O LogBox AQUI
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Login from './screens/Login';
import Register from './screens/Register';
import VerifyEmail from './screens/VerifyEmail';
import ForgotPassword from './screens/ForgotPassword';
import VerifyResetPassword from './screens/VerifyResetPassword';
import ResetPassword from './screens/ResetPassword';
import ChatPage from './components/ChatPage';

LogBox.ignoreLogs([
  "Cannot read property 'isReady' of undefined",
  "Cannot read property 'isReady'"
]);

const Stack = createStackNavigator();

export default function App() {

  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setUserToken(token);
      } catch (error) {
        console.error('Erro ao buscar o token:', error);
      } finally {
        setIsCheckingToken(false);
      }
    }
    loadStorageData();
  }, []);

  if (isCheckingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={userToken ? 'Chat' : 'Login'}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#0f172a' },
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="VerifyResetPassword" component={VerifyResetPassword} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="Chat" component={ChatPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
