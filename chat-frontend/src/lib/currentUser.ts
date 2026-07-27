import type { User } from '../types/chat';

export function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  const user = JSON.parse(storedUser) as User;

  return {
    ...user,
    status: 'online',
  };
}

export function saveCurrentUser(user: User) {
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      status: 'online',
    }),
  );
}

export function clearCurrentUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
}