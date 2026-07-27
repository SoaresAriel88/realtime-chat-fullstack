import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Conversation, Message } from '../types/chat';
import { api } from './api';

type UploadAttachmentResponse = {
  id: string;
  tenantId: string;
  conversationId: string;
  authorId: string;
  type: 'IMAGE' | 'FILE' | 'AUDIO';
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  audioDuration: number | null;
  createdAt: string;
};

export type MobileFile = {
  uri: string;
  name: string;
  type: string;
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem('accessToken');
  
  if (!token){
    throw new Error('Usuário não autenticado');
  }
  
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem('accessToken'); 
    await AsyncStorage.removeItem('user');
    
    throw new Error('Sessão expirada');
  }

  return response.json() as Promise<T>;
}

export async function getConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations');
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  return request<Message[]>(`/conversations/${conversationId}/messages`);
}

export async function createConversation(name: string): Promise<Conversation> {
  return request<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function uploadAttachment(
  conversationId: string,
  file: MobileFile,
) {
  const formData = new FormData();

  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any); 

  const response = await api.post<UploadAttachmentResponse>(
    `/chat/conversations/${conversationId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}
