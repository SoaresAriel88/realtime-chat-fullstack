import { Info, Phone, Video } from 'lucide-react';
import type { Conversation, User } from '../types/chat';
import { Avatar } from './Avatar';

type ChatHeaderProps = {
  conversation: Conversation | null;
  participants: User[];
};

export function ChatHeader({ conversation, participants }: ChatHeaderProps) {
  if (!conversation) {
    return (
      <header className="chat-header">
        <div>
          <h2>Selecione uma conversa</h2>
          <p>Escolha uma conversation para começar.</p>
        </div>
      </header>
    );
  }

  return (
    <header className="chat-header">
      <div className="chat-title-group">
        <Avatar name={conversation.name} status="online" />
        <div>
          <h2>{conversation.name}</h2>
          <p>{participants.length} participante(s) · Conversation ID: {conversation.id}</p>
        </div>
      </div>

      <div className="chat-actions">
        <button type="button" aria-label="Chamada">
          <Phone size={18} />
        </button>
        <button type="button" aria-label="Vídeo">
          <Video size={18} />
        </button>
        <button type="button" aria-label="Informações">
          <Info size={18} />
        </button>
      </div>
    </header>
  );
}
