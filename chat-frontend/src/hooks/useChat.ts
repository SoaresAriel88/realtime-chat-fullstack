import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser } from '../lib/currentUser';
import {
  createConversation,
  getConversationMessages,
  getConversations,
  uploadAttachment as uploadAttachmentRequest,
} from '../services/chatApi';
import { refreshSocketAuth, socket } from '../services/socket';
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
      ? {
          id: raw.authorId,
          name: raw.author,
        }
      : raw.author ?? {
          id: raw.authorId,
          name:
            currentUser && raw.authorId === currentUser.id
              ? currentUser.name
              : 'Usuário',
        };

        return {
          id: raw.id ?? crypto.randomUUID(),
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
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
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
    refreshSocketAuth();
    socket.connect();

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

      if (
        activeConversationId &&
        newMessage.conversationId &&
        newMessage.conversationId !== activeConversationId
      ) {
        return;
      }

      setMessages((previousMessages: Message[]) => {
        const alreadyExists = previousMessages.some(
          (message: Message) => message.id === newMessage.id,
        );

        if (alreadyExists) return previousMessages;

        return [...previousMessages, newMessage];
      });
    }

    function handleOnlineUsers(payload: OnlineUsersPayload) {
      const activeConversationId = activeConversationIdRef.current;
      console.log('USUÁRIOS ONLINE RECEBIDOS:', payload);
      if (activeConversationId && payload.room !== activeConversationId) {
        return;
      }

      setOnlineUsers(payload.users);
    }

    function handleTypingStart(payload: {
      author?: string;
      authorName?: string;
      room: string;
    }) {
      const activeConversationId = activeConversationIdRef.current;

      if (activeConversationId && payload.room !== activeConversationId) {
        return;
      }

      setTypingUser(payload.authorName ?? payload.author ?? 'Alguém');
    }

    function handleTypingStop(payload: {
      author?: string;
      authorName?: string;
      room: string;
    }) {
      const activeConversationId = activeConversationIdRef.current;

      if (activeConversationId && payload.room !== activeConversationId) {
        return;
      }

      setTypingUser(null);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:online_users', handleOnlineUsers);
    socket.on('chat:user_typing', handleTypingStart);
    socket.on('chat:user_stop_typing', handleTypingStop);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:online_users', handleOnlineUsers);
      socket.off('chat:user_typing', handleTypingStart);
      socket.off('chat:user_stop_typing', handleTypingStop);

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
        setIsUsingMockData(false);
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

    if (!isConnected) {
      return;
    }

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
        socket.emit('chat:leave_room', {
          room: previousRoom,
        });
      }

      previousRoomRef.current = roomId;

      socket.emit(
        'chat:join_room',
        {
          room: roomId,
        },
        (ack?: SocketAckResponse) => {
          console.log('Tentando entrar na sala:', {
            roomId,
            conversationTenantId: activeConversation.tenantId,
            currentUserTenantId: currentUser?.tenantId,
          });

          console.log('ACK join_room', ack);

          if (isCancelled) return;

          if (ack?.success) {
            setJoinedRoomId(roomId);
            return;
          }

          setJoinedRoomId(null);

          if (ack && !ack.success) {
            console.warn(ack.message);
          }
        },
      );

      try {
        const apiMessages = await getConversationMessages(roomId);
        console.log('MENSAGENS CARREGADAS DO HISTÓRICO:', apiMessages);

        if (isCancelled) return;

        setMessages(
          apiMessages.map((message) =>
            normalizeIncomingMessage(message, currentUser),
          ),
        );

        setIsUsingMockData(false);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);

        if (isCancelled) return;

        setMessages([]);
        setIsUsingMockData(false);
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    void joinAndLoadMessages();

    return () => {
      isCancelled = true;
    };
  }, [activeConversation, currentUser, isConnected]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);  
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversation) return;
      if (!currentUser) return;

      if (joinedRoomId !== activeConversation.id) {
        console.warn('Ainda não entrou na sala atual:', {
          joinedRoomId,
          activeConversationId: activeConversation.id,
          activeConversationName: activeConversation.name,
          socketConnected: socket.connected,
        });

        return;
      }

      const trimmedContent = content.trim();

      if (!trimmedContent) return;

      console.log('FRONT SEND MESSAGE:', {
        activeConversationId: activeConversation.id,
        activeConversationName: activeConversation.name,
        joinedRoomId,
        socketConnected: socket.connected,
      });

      socket.emit(
        'chat:send_message',
        {
          room: activeConversation.id,
          content: trimmedContent,
        },
        (ack?: SocketAckResponse) => {
          console.log('ACK send_message:', ack);

          if (ack && !ack.success) {
            console.warn(ack.message);
          }
        },
      );
    },
    [activeConversation, currentUser, joinedRoomId],
  );
  
  const sendAttachment = useCallback(
    async (file: File) => {
      if (!activeConversation) return;
  
      if (joinedRoomId !== activeConversation.id) {
        console.warn('Ainda não entrou na sala atual para enviar o anexo:', {
          joinedRoomId,
          activeConversationId: activeConversation.id,
        });
  
        return;
      }
  
      try {
        await uploadAttachmentRequest(
          activeConversation.id,
          file,
        );
      } catch (error) {
        console.error('Erro ao enviar anexo:', error);
      }
    },
    [activeConversation, joinedRoomId],
  );

  const createNewConversation = useCallback(async (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    try {
      const conversation = await createConversation(trimmedName);

      setConversations((previousConversations: Conversation[]) => {
        const alreadyExists = previousConversations.some(
          (item: Conversation) => item.id === conversation.id,
        );

        if (alreadyExists) return previousConversations;

        return [conversation, ...previousConversations];
      });

      setActiveConversation(conversation);
      setMessages([]);
      setOnlineUsers([]);
      setTypingUser(null);
      setJoinedRoomId(null);
      setIsUsingMockData(false);
    } catch (error) {
      console.error('Erro ao criar conversation:', error);
    }
  }, []);

  const startTyping = useCallback(() => {
    if (!activeConversation) return;
    if (!currentUser) return;
    if (joinedRoomId !== activeConversation.id) return;

    socket.emit('chat:typing_start', {
      room: activeConversation.id,
    });
  }, [activeConversation, currentUser, joinedRoomId]);

  const stopTyping = useCallback(() => {
    if (!activeConversation) return;
    if (!currentUser) return;
    if (joinedRoomId !== activeConversation.id) return;

    socket.emit('chat:typing_stop', {
      room: activeConversation.id,
    });
  }, [activeConversation, currentUser, joinedRoomId]);

  return {
    conversations,
    activeConversation,
    activeParticipants,
    onlineUsers,
    messages,
    isConnected,
    isLoadingMessages,
    isUsingMockData,
    typingUser,
    selectConversation,
    sendMessage,
    createNewConversation,
    startTyping,
    stopTyping,
    sendAttachment,
  };
}