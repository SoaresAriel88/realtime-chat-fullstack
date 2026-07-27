import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentUser, clearCurrentUser } from '../lib/currentUser';
import { router } from 'expo-router';
import {
  getConversationMessages,
  getConversations,
  createConversation as createConversationApi,
  uploadAttachment as uploadAttachmentRequest,
} from '../services/chatApi';
import { connectSocket, socket } from '../services/socket';
import type {
  Conversation,
  Message,
  SocketAckResponse,
  User,
} from '../types/chat';

type IncomingSocketMessage = {
  id?: string;
  tenantId: string;
  room?: string;
  conversationId?: string;
  authorId: string;
  author?: Message['author'] | string;
  type?: Message['type'];
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  audioDuration?: number | null;
  createdAt?: string | Date;
};

type OnlineUsersPayload = {
  room: string; 
  users: User[];
};

function normalizeIncomingMessage(
  raw: IncomingSocketMessage,
  currentUser: User | null,
): Message {
  let createdAt: string;

  if (raw.createdAt instanceof Date) {
    createdAt = raw.createdAt.toISOString();
  } else if (raw.createdAt) {
    createdAt = raw.createdAt;
  } else {
    createdAt = new Date().toISOString();
  }

  const author =
    typeof raw.author === 'string'
      ? { id: raw.authorId, name: raw.author }
      : raw.author ?? {
          id: raw.authorId,
          name: currentUser && raw.authorId === currentUser.id ? currentUser.name : 'Usuário',
        };

  return {
    id: raw.id ?? Math.random().toString(36).substring(2) + Date.now().toString(36),
    tenantId: raw.tenantId,
    conversationId: raw.conversationId ?? raw.room ?? '',
    authorId: raw.authorId,
    author,
    type: raw.type ?? 'TEXT',
    content: raw.content ?? null,
    fileUrl: raw.fileUrl ?? null,
    fileName: raw.fileName ?? null,
    mimeType: raw.mimeType ?? null,
    fileSize: raw.fileSize ?? null,
    audioDuration: raw.audioDuration ?? null,
    createdAt,
  };
}

export function useChat() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  const activeConversationIdRef = useRef<string | null>(null);
  const previousRoomRef = useRef<string | null>(null);
  const activeParticipants = onlineUsers;

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function initSocket() {
      await connectSocket();
    }
    initSocket();

    function handleConnect() {
      setIsConnected(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
      setOnlineUsers([]);
      setJoinedRoomId(null);
    }

    function handleNewMessage(rawMessage: IncomingSocketMessage) {
      console.log('RECEBI chat:new_message:', rawMessage);
      const newMessage = normalizeIncomingMessage(rawMessage, currentUser);
      const activeConversationId = activeConversationIdRef.current;

      if (activeConversationId && newMessage.conversationId && newMessage.conversationId !== activeConversationId) {
        return;
      }

      setMessages((previousMessages: Message[]) => {
        const alreadyExists = previousMessages.some((message: Message) => message.id === newMessage.id);
        if (alreadyExists) return previousMessages;
        return [...previousMessages, newMessage];
      });
    }

    function handleOnlineUsers(payload: OnlineUsersPayload) {
      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId && payload.room !== activeConversationId) return;
      setOnlineUsers(payload.users);
    }

    function handleTypingStart(payload: { author?: string; authorName?: string; room: string }) {
      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId && payload.room !== activeConversationId) return;
      setTypingUser(payload.authorName ?? payload.author ?? 'Alguém');
    }

    function handleTypingStop(payload: { author?: string; authorName?: string; room: string }) {
      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId && payload.room !== activeConversationId) return;
      setTypingUser(null);
    }
     
  function handleRoomCreated(room: Conversation) {
    console.log('RECEBI chat:room_created:', room);

    setConversations((previousConversations) => {
      const alreadyExists = previousConversations.some(
        (item) => item.id === room.id,
      );

      if (alreadyExists) return previousConversations;

      return [room, ...previousConversations];
    });
  }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:online_users', handleOnlineUsers);
    socket.on('chat:user_typing', handleTypingStart);
    socket.on('chat:user_stop_typing', handleTypingStop);
    socket.on('chat:room_created', handleRoomCreated);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:online_users', handleOnlineUsers);
      socket.off('chat:user_typing', handleTypingStart);
      socket.off('chat:user_stop_typing', handleTypingStop);
      socket.off('chat:room_created', handleRoomCreated);
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    async function loadConversations() {
      try {
        const apiConversations = await getConversations();
        setConversations(apiConversations);
        setActiveConversation(apiConversations[0] ?? null);
        setIsUsingMockData(false);
      } catch (error) {
        console.error('Erro ao carregar conversations:', error);
        setConversations([]);
        setActiveConversation(null);
        setMessages([]);
        setOnlineUsers([]);
        setJoinedRoomId(null);
      }
    }
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConversation) {
      activeConversationIdRef.current = null;
      setMessages([]);
      setOnlineUsers([]);
      setTypingUser(null);
      setJoinedRoomId(null);
      return;
    }

    if (!isConnected) return;
    let isCancelled = false;

    async function joinAndLoadMessages() {
      if (!activeConversation) return;
      const roomId = activeConversation.id;
      activeConversationIdRef.current = roomId;
      setJoinedRoomId(null);
      setIsLoadingMessages(true);
      setTypingUser(null);
      setOnlineUsers([]);

      const previousRoom = previousRoomRef.current;
      if (previousRoom && previousRoom !== roomId) {
        socket.emit('chat:leave_room', { room: previousRoom });
      }
      previousRoomRef.current = roomId;

      socket.emit('chat:join_room', { room: roomId }, (ack?: SocketAckResponse) => {
        if (isCancelled) return;
        if (ack?.success) {
          setJoinedRoomId(roomId);
          return;
        }
        setJoinedRoomId(null);
      });

      try {
        const apiMessages = await getConversationMessages(roomId);
        if (isCancelled) return;
        setMessages(apiMessages.map((msg) => normalizeIncomingMessage(msg, currentUser)));
      } catch (error) {
        console.error('Erro ao buscar mensagens da sala:', error);
      } finally {
        if (!isCancelled) setIsLoadingMessages(false);
      }
    }
    void joinAndLoadMessages();

    return () => {
      isCancelled = true;
    };
  }, [activeConversation, isConnected, currentUser]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation) return;
    socket.emit('chat:send_message', {
      room: activeConversation.id,
      content,
      type: 'TEXT',
    });
  }, [activeConversation]);

  const sendAttachment = useCallback(async (file: any) => {
    if (!activeConversation) return;
    try {
      const fileToUpload = {
        uri: file.uri,
        name: file.name,
        type: file.type,
      };

      const uploaded = await uploadAttachmentRequest(activeConversation.id, fileToUpload as any);
      
      socket.emit('chat:send_message', {
        room: activeConversation.id,
        type: uploaded.type,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
      });
    } catch (error) {
      console.error("Erro ao enviar anexo:", error);
    }
  }, [activeConversation]);

  const startTyping = useCallback(() => {
    if (!activeConversation) return;
    socket.emit('chat:typing_start', { room: activeConversation.id });
  }, [activeConversation]);

  const stopTyping = useCallback(() => {
    if (!activeConversation) return;
    socket.emit('chat:typing_stop', { room: activeConversation.id });
  }, [activeConversation]);

  const createNewConversation = useCallback(async (name: string) => {
    try {
      const newChat = await createConversationApi(name);
      setConversations((prev) => [newChat, ...prev]); // já adiciona aqui
      setActiveConversation(newChat);
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
    }
  }, []);
  const logout = useCallback(async () => {
    socket.disconnect();
  
    await clearCurrentUser();
  
    setCurrentUser(null);
    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
    setOnlineUsers([]);
    setIsConnected(false);
    setJoinedRoomId(null);
  
    router.replace('/login');
  }, []);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    onlineUsers,
    isConnected,
    isLoadingMessages,
    isUsingMockData,
    typingUser,
    joinedRoomId,
    activeParticipants,
    selectConversation,
    sendMessage,
    sendAttachment,
    createNewConversation,
    startTyping,
    stopTyping,
    logout,
  };
}
