export type User = {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
};

export type Conversation = {
  id: string;
  name: string;
  description?: string;
  updatedAt?: string;
  unreadCount?: number;
  participants?: User[];
  lastMessage?: {
    content: string;
    createdAt?: string;
    authorName?: string;
  };
};

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author?: User;
  conversationId: string;
};

export type SendMessagePayload = {
  conversationId: string;
  room: string;
  authorId: string;
  content: string;
};

export type JoinRoomPayload = {
  conversationId: string;
  room: string;
};

export type SocketAckResponse = {
  success: boolean;
  message: string;
  room?: {
    id: string;
    name: string;
  };
};
