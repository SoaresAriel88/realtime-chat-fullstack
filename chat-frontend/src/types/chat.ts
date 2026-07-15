export type User = {
  id: string;
  tenantId: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
};
export type MessageAuthor = {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
};

export type Conversation = {
  id: string;
  tenantId: string;
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

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';

export type Message = {
  id: string;
  tenantId: string;
  conversationId: string;
  authorId: string;

  type: MessageType;
  content: string | null;

  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  audioDuration: number | null;

  createdAt: string;

  author?: {
    id: string;
    name: string;
    status?: 'online' | 'offline';
  };
};

export type SendMessagePayload = {
  room: string;
  content: string;
};

export type JoinRoomPayload = {
  room: string;
};

export type SocketAckResponse = {
  success: boolean;
  message: string;
  room?: {
    id: string;
    tenantId: string;
    name: string;
  };
};
