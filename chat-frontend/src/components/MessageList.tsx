import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  typingUser: string | null;
};

export function MessageList({ messages, isLoading, typingUser }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUser]);

  if (isLoading) {
    return (
      <main className="message-list loading">
        <Loader2 className="spin" size={28} />
        <span>Carregando histórico da conversation...</span>
      </main>
    );
  }

  return (
    <main className="message-list">
      <div className="message-day-divider">Hoje</div>

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {typingUser && (
        <div className="typing-indicator">
          <span>{typingUser} está digitando</span>
          <div className="typing-dots">
            <i />
            <i />
            <i />
          </div>
        </div>
      )}

      {!messages.length && (
        <div className="empty-chat">
          <h3>Nenhuma mensagem ainda</h3>
          <p>Envie a primeira mensagem para testar o Socket.IO.</p>
        </div>
      )}

      <div ref={bottomRef} />
    </main>
  );
}
