import { MessageCircle, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from '../types/chat';
import { Avatar } from './Avatar';

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeConversationId?: string;
  isConnected: boolean;
  isUsingMockData: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation: (name: string) => void;
};

export function ConversationSidebar({
  conversations,
  activeConversationId,
  isConnected,
  isUsingMockData,
  onSelectConversation,
  onCreateConversation,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState('');
  const [newConversationName, setNewConversationName] = useState('');

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreateConversation() {
    onCreateConversation(newConversationName);
    setNewConversationName('');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <span className="eyebrow">Realtime</span>
          <h1>Chats</h1>
        </div>
        <div className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </div>

      {isUsingMockData && (
        <div className="mock-alert">Prévia visual ativa. Ligue o backend para usar dados reais.</div>
      )}

      <div className="search-box">
        <Search size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar conversation..."
        />
      </div>

      <div className="create-conversation">
        <input
          value={newConversationName}
          onChange={(event) => setNewConversationName(event.target.value)}
          placeholder="Nova conversation"
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleCreateConversation();
          }}
        />
        <button onClick={handleCreateConversation} aria-label="Criar conversation">
          <Plus size={18} />
        </button>
      </div>

      <div className="conversation-list">
        {filteredConversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const firstParticipant = conversation.participants?.[1] ?? conversation.participants?.[0];

          return (
            <button
              type="button"
              className={`conversation-item ${isActive ? 'active' : ''}`}
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
            >
              <Avatar name={conversation.name} status={firstParticipant?.status ?? 'online'} />
              <div className="conversation-content">
                <div className="conversation-topline">
                  <strong>{conversation.name}</strong>
                  <span>{conversation.updatedAt ? 'agora' : ''}</span>
                </div>
                <p>{conversation.lastMessage?.content ?? conversation.description ?? 'Sem mensagens ainda'}</p>
              </div>
              {!!conversation.unreadCount && <span className="unread-badge">{conversation.unreadCount}</span>}
            </button>
          );
        })}

        {!filteredConversations.length && (
          <div className="empty-state">
            <MessageCircle size={20} />
            <span>Nenhuma conversa encontrada.</span>
          </div>
        )}
      </div>
    </aside>
  );
}
