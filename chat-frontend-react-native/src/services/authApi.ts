import AsyncStorage from '@react-native-async-storage/async-storage';
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
type VerifyEmailOtpRequest = {
  email: string;
  otpCode: string;
  tenantSlug: string;
};

type ResendEmailOtpRequest = {
  email: string;
  tenantSlug: string;
};
type ForgotPasswordRequest = {
  email: string;
  tenantSlug: string;
};
type VerifyResetPasswordOtpRequest = {
  email: string;
  resetPasswordOtp: string;
  tenantSlug: string;
};

type VerifyResetPasswordOtpResponse = {
  token: string;
};
type ResetPasswordRequest = {
  newPassword: string;
  token: string;
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
  try {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('tenantSlug', data.tenantSlug);
  } catch(error) {
    console.error("Erro ao acessar o token e o tenantSlug", error);
  }
  const meResponse = await api.get<BackendUser>('/users/me', {
    params: {
      _: Date.now(),
    },
  });
  console.log('ME RESPONSE:', meResponse.data);

  const user = mapBackendUserToChatUser(meResponse.data);

    await saveCurrentUser(user);

  return {
    accessToken,
    user,
  };
}

export async function register(data: RegisterRequest) {
  const response = await api.post('/users/register', data);

  return response.data;
}
export async function verifyEmailOtp(data: VerifyEmailOtpRequest) {
  const response = await api.post('/users/verify-otp', data);

  return response.data;
}

export async function resendEmailOtp(data: ResendEmailOtpRequest) {
  const response = await api.post('/users/resend-otp', data);

  return response.data;
}
export async function forgotPassword(data: ForgotPasswordRequest) {
  const response = await api.post('/auth/forgot-password', data);

  return response.data;
}
export async function verifyResetPasswordOtp(
  data: VerifyResetPasswordOtpRequest,
) {
  const response = await api.post<VerifyResetPasswordOtpResponse>(
    '/auth/verify-reset-password-otp',
    data,
  );


  return response.data;
}
export async function resetPassword(data: ResetPasswordRequest) {
  const response = await api.post(
    '/auth/reset-password',
    {
      newPassword: data.newPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    },
  );

  return response.data;
}
export async function logout() {
    try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('tenantSlug');
    } catch (error) {
        console.error('Não foi possível remover os dados do usuário', error);
    }
}