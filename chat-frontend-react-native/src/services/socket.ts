import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

const socketUrl = SOCKET_URL ?? API_URL;

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket'], 
});

export async function connectSocket() {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    socket.auth = { token };
    
    if (socket.connected) {
      socket.disconnect();
    }
    
    socket.connect();
  } catch (error) {
    console.error("Erro ao conectar ao socket:", error);
  }
}

export async function refreshSocketAuth() {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    socket.auth = { token };
  } catch (error) {
    console.error("Erro ao atualizar autenticação do socket:", error);
  }
}
