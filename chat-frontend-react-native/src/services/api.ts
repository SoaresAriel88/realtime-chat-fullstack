import { create } from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  try {

    const token = await AsyncStorage.getItem('accessToken');

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Erro ao buscar o token:", error);
  }

  return config;
});
