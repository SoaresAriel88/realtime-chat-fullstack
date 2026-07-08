import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { currentUser } from '../lib/currentUser';
import {
  createConversation,
  getConversationMessages,
  getConversations,
} from '../services/chatApi';
import { socket } from '../services/socket';
import type { Conversation, Message, SocketAckResponse } from '../types/chat';

type IncomingSocketMessage = {
  id?: string;
  room?: string;
  conversationId?: string;
  authorId: string;
  author?: Message['author'] | string;
  content: string;
  createdAt?: string | Date;
};

function normalizeIncomingMessage(raw: IncomingSocketMessage): Message {
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
          name: raw.authorId === currentUser.id ? currentUser.name : 'Usuário',
        };

  return {
    id: raw.id ?? crypto.randomUUID(),
    conversationId: raw.conversationId ?? raw.room ?? '',
    authorId: raw.authorId,
    author,
    content: raw.content,
    createdAt,
  };
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const activeConversationIdRef = useRef<string | null>(null);
  const previousRoomRef = useRef<string | null>(null);

  const activeParticipants = useMemo(() => {
    return activeConversation?.participants ?? [currentUser];
  }, [activeConversation]);

  useEffect(() => {
    socket.connect();

    function handleConnect() {
      setIsConnected(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function handleNewMessage(rawMessage: IncomingSocketMessage) {
      const newMessage = normalizeIncomingMessage(rawMessage);

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

    function handleTypingStart(payload: { author?: string; authorName?: string }) {
      setTypingUser(payload.authorName ?? payload.author ?? 'Alguém');
    }

    function handleTypingStop() {
      setTypingUser(null);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:user_typing', handleTypingStart);
    socket.on('chat:user_stop_typing', handleTypingStop);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:user_typing', handleTypingStart);
      socket.off('chat:user_stop_typing', handleTypingStop);

      socket.disconnect();
    };
  }, []);

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
        setIsUsingMockData(false);
      }
    }

    void loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConversation) {
      activeConversationIdRef.current = null;
      setMessages([]);
      return;
    }

    let isCancelled = false;

    async function joinAndLoadMessages() {
      if (!activeConversation) return;

      const roomId = activeConversation.id;

      activeConversationIdRef.current = roomId;
      setIsLoadingMessages(true);
      setTypingUser(null);

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
          name: activeConversation.name,
        },
        (ack?: SocketAckResponse) => {
          if (ack && !ack.success) {
            console.warn(ack.message);
          }
        },
      );

      try {
        const apiMessages = await getConversationMessages(roomId);

        if (isCancelled) return;

        setMessages(apiMessages.map(normalizeIncomingMessage));
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
  }, [activeConversation]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversation) return;

      const trimmedContent = content.trim();

      if (!trimmedContent) return;

      socket.emit(
        'chat:send_message',
        {
          room: activeConversation.id,
          authorId: currentUser.id,
          content: trimmedContent,
        },
        (ack?: SocketAckResponse) => {
          if (ack && !ack.success) {
            console.warn(ack.message);
          }
        },
      );
    },
    [activeConversation],
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
      setIsUsingMockData(false);
    } catch (error) {
      console.error('Erro ao criar conversation:', error);
    }
  }, []);

  const startTyping = useCallback(() => {
    if (!activeConversation) return;

    socket.emit('chat:typing_start', {
      room: activeConversation.id,
      author: currentUser.name,
    });
  }, [activeConversation]);

  const stopTyping = useCallback(() => {
    if (!activeConversation) return;

    socket.emit('chat:typing_stop', {
      room: activeConversation.id,
      author: currentUser.name,
    });
  }, [activeConversation]);

  return {
    conversations,
    activeConversation,
    activeParticipants,
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
  };
}