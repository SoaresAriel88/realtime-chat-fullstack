import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Info, Phone, Video } from 'lucide-react-native';
import type { Conversation, User } from '../types/chat';
import { Avatar } from './Avatar';

type ChatHeaderProps = {
  conversation: Conversation | null;
  participants: User[];
};

export function ChatHeader({ conversation, participants }: ChatHeaderProps) {
  // Caso não haja conversa selecionada
  if (!conversation) {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Selecione uma conversa</Text>
          <Text style={styles.subtitle}>Escolha uma conversa para começar.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {/* Grupo do Avatar e Nome da Conversa */}
      <View style={styles.chatTitleGroup}>
        <Avatar name={conversation.name} status="online" />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {participants.length} participante(s) · ID: {conversation.id}
          </Text>
        </View>
      </View>

      {/* Ícones de Ação da Conversa */}
      <View style={styles.chatActions}>
        <TouchableOpacity style={styles.actionButton} accessibilityLabel="Chamada">
          <Phone size={18} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} accessibilityLabel="Vídeo">
          <Video size={18} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} accessibilityLabel="Informações">
          <Info size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111827', // Fundo escuro igual ao layout original
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Permite que o texto ocupe o espaço disponível sem empurrar os botões
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 8,
  },
});
