import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Bell, ShieldCheck, Users } from 'lucide-react-native';
import type { Conversation, User } from '../types/chat';
import { Avatar } from './Avatar'; // Mantido o padrão de importação local solicitado

type ConversationDetailsProps = {
  conversation: Conversation | null;
  participants: User[];
};

export function ConversationDetails({ conversation, participants }: ConversationDetailsProps) {
  return (
    // ScrollView permite rolagem vertical nativa no celular se a lista for grande
    <ScrollView style={styles.detailsPanel} contentContainerStyle={styles.contentContainer}>
      
      {/* Card Superior: Perfil Geral da Sala */}
      <View style={[styles.detailsCard, styles.center]}>
        <Avatar name={conversation?.name ?? 'Chat'} status="online" />
        <Text style={styles.chatName}>{conversation?.name ?? 'Conversation'}</Text>
        <Text style={styles.chatDescription}>
          {conversation?.description ?? 'Informações rápidas da sala atual.'}
        </Text>
      </View>

      {/* Card Central: Lista de Participantes */}
      <View style={styles.detailsCard}>
        <View style={styles.detailsTitleGroup}>
          <Users size={18} color="#9ca3af" />
          <Text style={styles.sectionTitle}>Participantes</Text>
        </View>

        <View style={styles.participantsList}>
          {participants.map((participant) => (
            <View style={styles.participantItem} key={participant.id}>
              <Avatar name={participant.name} status={participant.status} />
              <View style={styles.participantTextContainer}>
                <Text style={styles.participantName} numberOfLines={1}>
                  {participant.name}
                </Text>
                <Text style={styles.participantStatus}>
                  {participant.status ?? 'online'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Card Inferior: Informações Adicionais / Rodapé */}
      <View style={[styles.detailsCard, styles.smallItems]}>
        <View style={styles.infoRow}>
          <ShieldCheck size={18} color="#9ca3af" />
          <Text style={styles.infoRowText}>Mensagens salvas no histórico</Text>
        </View>
        <View style={[styles.infoRow, { marginTop: 12 }]}>
          <Bell size={18} color="#9ca3af" />
          <Text style={styles.infoRowText}>Realtime via Socket.IO</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  detailsPanel: {
    flex: 1,
    backgroundColor: '#0f172a', // Fundo azul escuro padrão
  },
  contentContainer: {
    padding: 16,
  },
  detailsCard: {
    backgroundColor: '#111827', // Card cinza escuro
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  chatDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  detailsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  participantsList: {
    width: '100%',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantStatus: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  smallItems: {
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 10,
  },
});
