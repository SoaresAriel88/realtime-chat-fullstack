import { saveCurrentUser } from '../lib/currentUser';
import type { User } from '../types/chat';
import { api } from './api';

type LoginRequest = {
  email: string;
  password: string;
  tenantSlug: string;
};

type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  tenantSlug: string;
};

type AuthResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
};

type BackendUser = {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
};

function getAccessToken(data: AuthResponse) {
  return data.accessToken ?? data.access_token ?? data.token;
}

function mapBackendUserToChatUser(user: BackendUser): User {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    status: 'online',
  };
}

export async function login(data: LoginRequest) {
  const response = await api.post<AuthResponse>('/auth/login', data);

  const accessToken = getAccessToken(response.data);

  if (!accessToken) {
    throw new Error('Token não retornado pelo backend.');
  }

  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('tenantSlug', data.tenantSlug);

  const meResponse = await api.get<BackendUser>('/users/me', {
    params: {
      _: Date.now(),
    },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  console.log('ME RESPONSE:', meResponse.data);

  const user = mapBackendUserToChatUser(meResponse.data);

  saveCurrentUser(user);

  return {
    accessToken,
    user,
  };
}

export async function register(data: RegisterRequest) {
  const response = await api.post('/users/register', data);

  return response.data;
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tenantSlug');
}