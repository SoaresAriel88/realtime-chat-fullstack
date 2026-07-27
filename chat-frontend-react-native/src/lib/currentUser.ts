import type { User } from '../types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCurrentUser(): Promise<User | null> {
  const storedUser = await AsyncStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  const user = JSON.parse(storedUser) as User;

  return {
    ...user,
    status: 'online',
  };
}

export async function saveCurrentUser(user: User) {
  await AsyncStorage.setItem(
    'user',
    JSON.stringify({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      status: 'online',
    }),
  );
}

export async function clearCurrentUser() {
  try {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
  } catch (error) {
    console.error("Erro ao limpar os dados do usuário:", error);
  }
}
