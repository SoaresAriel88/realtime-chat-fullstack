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

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  if (!token){
    window.location.href = '/login';
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
  file: File,
) {
  const formData = new FormData();

  formData.append('file', file);

  const response = await api.post<UploadAttachmentResponse>(
    `/chat/conversations/${conversationId}/attachments`,
    formData,
  );

  return response.data;
}

