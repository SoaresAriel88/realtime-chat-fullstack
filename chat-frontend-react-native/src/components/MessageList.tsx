import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { getCurrentUser } from '../lib/currentUser';
import type { Message, User } from '../types/chat';
import { MessageBubble } from './MessageBubble';
// AJUSTE 1: Importação mantida da biblioteca correta de alta performance do Expo
import { SafeAreaView } from 'react-native-safe-area-context';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  typingUser: string | null;
};

export function MessageList({ messages, isLoading, typingUser }: MessageListProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      // CORREÇÃO 2: Trocada a View de loading por SafeAreaView
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando histórico da conversa...</Text>
      </SafeAreaView>
    );
  }

  const invertedMessages = [...messages].reverse();

  return (
    // CORREÇÃO 3: Trocada a View principal por SafeAreaView configurada para gerenciar as bordas laterais do dispositivo
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={invertedMessages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.listContent}
        
        ListHeaderComponent={
          typingUser ? (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{typingUser} está digitando...</Text>
            </View>
          ) : null
        }

        ListFooterComponent={
          messages.length > 0 ? (
            <View style={styles.messageDayDivider}>
              <Text style={styles.dividerText}>Hoje</Text>
            </View>
          ) : (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptySubtitle}>
                Envie a primeira mensagem para testar o Socket.IO.
              </Text>
            </View>
          )
        }

        renderItem={({ item }) => (
          <MessageBubble message={item} currentUser={currentUser} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  messageDayDivider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerText: {
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: 'bold',
  },
  typingIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  typingText: {
    color: '#9ca3af',
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
