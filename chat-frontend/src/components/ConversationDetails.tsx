import { Bell, ShieldCheck, Users } from 'lucide-react';
import type { Conversation, User } from '../types/chat';
import { Avatar } from './Avatar';

type ConversationDetailsProps = {
  conversation: Conversation | null;
  participants: User[];
};

export function ConversationDetails({ conversation, participants }: ConversationDetailsProps) {
  return (
    <aside className="details-panel">
      <div className="details-card center">
        <Avatar name={conversation?.name ?? 'Chat'} status="online" />
        <h3>{conversation?.name ?? 'Conversation'}</h3>
        <p>{conversation?.description ?? 'Informações rápidas da sala atual.'}</p>
      </div>

      <div className="details-card">
        <div className="details-title">
          <Users size={18} />
          <strong>Participantes</strong>
        </div>

        <div className="participants-list">
          {participants.map((participant) => (
            <div className="participant-item" key={participant.id}>
              <Avatar name={participant.name} status={participant.status} />
              <div>
                <strong>{participant.name}</strong>
                <span>{participant.status ?? 'online'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="details-card small-items">
        <div>
          <ShieldCheck size={18} />
          <span>Mensagens salvas no histórico</span>
        </div>
        <div>
          <Bell size={18} />
          <span>Realtime via Socket.IO</span>
        </div>
      </div>
    </aside>
  );
}
