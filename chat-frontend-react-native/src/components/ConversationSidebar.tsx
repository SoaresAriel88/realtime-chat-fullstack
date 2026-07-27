import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  FlatList 
} from 'react-native';

import { LogOut, MessageCircle, Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import type { Conversation } from '../types/chat';
import { Avatar } from './Avatar';

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeConversationId?: string;
  isConnected: boolean;
  isUsingMockData: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation: (name: string) => void;
  onLogout: () => void;
};

export function ConversationSidebar({
  conversations,
  activeConversationId,
  isConnected,
  isUsingMockData,
  onSelectConversation,
  onCreateConversation,
  onLogout,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState('');
  const [newConversationName, setNewConversationName] = useState('');

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreateConversation() {
    if (!newConversationName.trim()) return;
    onCreateConversation(newConversationName.trim());
    setNewConversationName('');
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View>
          <Text style={styles.eyebrow}>Realtime</Text>
          <Text style={styles.mainTitle}>Chats</Text>
        </View>
        <View style={[styles.connectionPill, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.connectionText}>{isConnected ? 'Online' : 'Offline'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          accessibilityLabel="Sair"
        >
          <LogOut size={18} color="#f87171" />
        </TouchableOpacity>
      </View>


      {isUsingMockData ? (
        <View style={styles.mockAlert}>
          <Text style={styles.mockAlertText}>
            Prévia visual ativa. Ligue o backend para usar dados reais.
          </Text>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Search size={16} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar conversa..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.createConversation}>
        <TextInput
          style={styles.createInput}
          value={newConversationName}
          onChangeText={setNewConversationName}
          placeholder="Nova conversa"
          placeholderTextColor="#9ca3af"
          onSubmitEditing={handleCreateConversation} 
          returnKeyType="done"
        />
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={handleCreateConversation} 
          accessibilityLabel="Criar conversa"
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle size={32} color="#4b5563" />
            <Text style={styles.emptyStateText}>Nenhuma conversa encontrada.</Text>
          </View>
        }
        renderItem={({ item: conversation }) => {
          const isActive = conversation.id === activeConversationId;
          const firstParticipant = conversation.participants?.[1] ?? conversation.participants?.[0];

          return (
            <TouchableOpacity
              style={[styles.conversationItem, isActive ? styles.conversationItemActive : null]}
              onPress={() => {
                onSelectConversation(conversation);
                // AJUSTE 2: Navega automaticamente para a tela de chat dinâmica do Expo Router
                router.push(`/chat/${conversation.id}` as any);
              }}
            >
              <Avatar name={conversation.name} status={firstParticipant?.status ?? 'online'} />
              
              <View style={styles.conversationContent}>
                <View style={styles.conversationTopline}>
                  <Text style={styles.conversationName} numberOfLines={1}>
                    {conversation.name}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {conversation.updatedAt ? 'agora' : ''}
                  </Text>
                </View>
                
                <Text style={styles.conversationSnippet} numberOfLines={1}>
                  {conversation.lastMessage?.content ?? conversation.description ?? 'Sem mensagens ainda'}
                </Text>
              </View>

              {/* Contador de não lidas */}
              {!!conversation.unreadCount ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    color: '#60a5fa',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  disconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  mockAlert: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  mockAlertText: {
    color: '#f59e0b',
    fontSize: 12,
    textAlign: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  createConversation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  createInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#fff',
    height: 44,
    fontSize: 14,
  },
  createButton: {
    width: 44,
    height: 44,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 24,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  conversationItemActive: {
    borderColor: '#2563eb',
    backgroundColor: '#1e293b',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  conversationTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  conversationTime: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  conversationSnippet: {
    fontSize: 13,
    color: '#9ca3af',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
});
