import { getCurrentUser } from '../lib/currentUser';
import type { Message } from '../types/chat';
import { Avatar } from './Avatar';

type MessageBubbleProps = {
  message: Message;
};

function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const currentUser = getCurrentUser();

  const isOwnMessage = currentUser
    ? message.authorId === currentUser.id
    : false;

  const authorName =
    message.author?.name ?? (isOwnMessage ? currentUser?.name : 'Usuário');

  return (
    <div className={`message-row ${isOwnMessage ? 'own' : ''}`}>
      {!isOwnMessage && (
        <Avatar name={authorName ?? ''} status={message.author?.status} />
      )}

      <div className={`message-bubble ${isOwnMessage ? 'own' : ''}`}>
        {!isOwnMessage && <strong>{authorName}</strong>}
        <p>{message.content}</p>
        <span>{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}