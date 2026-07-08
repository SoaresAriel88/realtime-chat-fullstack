import type { Conversation, Message } from '../types/chat';
import { currentUser } from '../lib/currentUser';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-geral',
    name: 'Sala Geral',
    description: 'Conversa principal do projeto',
    unreadCount: 2,
    updatedAt: new Date().toISOString(),
    participants: [currentUser, { id: 'user-joao', name: 'João', status: 'online' }],
    lastMessage: {
      authorName: 'João',
      content: 'Fiz o teste do histórico aqui e funcionou.',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'conv-backend',
    name: 'Backend NestJS',
    description: 'Gateway, Prisma e histórico',
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
    participants: [currentUser, { id: 'user-maria', name: 'Maria', status: 'away' }],
    lastMessage: {
      authorName: 'Ariel',
      content: 'Agora falta plugar o front no socket.',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'conv-design',
    name: 'Design do Chat',
    description: 'Layout inspirado no shadcn',
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
    participants: [currentUser, { id: 'user-pedro', name: 'Pedro', status: 'offline' }],
    lastMessage: {
      authorName: 'Pedro',
      content: 'A sidebar ficou no padrão dashboard.',
      createdAt: new Date().toISOString(),
    },
  },
];

export const mockMessages: Record<string, Message[]> = {
  'conv-geral': [
    {
      id: 'msg-1',
      conversationId: 'conv-geral',
      authorId: 'user-joao',
      author: { id: 'user-joao', name: 'João', status: 'online' },
      content: 'Ariel, criei uma conversation nova aqui no banco.',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-geral',
      authorId: currentUser.id,
      author: currentUser,
      content: 'Boa! Agora precisamos mostrar o histórico no frontend.',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
    {
      id: 'msg-3',
      conversationId: 'conv-geral',
      authorId: 'user-joao',
      author: { id: 'user-joao', name: 'João', status: 'online' },
      content: 'Fiz o teste do histórico aqui e funcionou.',
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ],
  'conv-backend': [
    {
      id: 'msg-4',
      conversationId: 'conv-backend',
      authorId: currentUser.id,
      author: currentUser,
      content: 'O evento principal vai ser chat:send_message, certo?',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ],
  'conv-design': [
    {
      id: 'msg-5',
      conversationId: 'conv-design',
      authorId: 'user-pedro',
      author: { id: 'user-pedro', name: 'Pedro', status: 'offline' },
      content: 'A sidebar ficou no padrão dashboard.',
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
  ],
};
