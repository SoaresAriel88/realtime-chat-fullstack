import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  Text,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Ícone de menu hambúrguer para abrir a barra lateral no celular
import { Menu } from 'lucide-react-native'; 
import { useChat } from '../hooks/useChat';

// Importações dos seus componentes locais
import { ChatHeader } from './ChatHeader';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { ConversationSidebar } from './ConversationSidebar';

// Pega a largura exata da tela do celular para dimensionar o menu lateral de forma responsiva
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatPage() {
  const {
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
    sendAttachment,
    createNewConversation,
    startTyping,
    stopTyping,
  } = useChat();

  // Estado simples para abrir/fechar a barra lateral de chats no celular
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        
        {/* BARRA SUPERIOR CUSTOMIZADA: Substitui a barra do Drawer */}
        <View style={styles.topNavbar}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle} numberOfLines={1}>
            {activeConversation?.name ?? 'Chats'}
          </Text>
        </View>

        {/* CONTAINER DO FLUXO DO CHAT */}
        <View style={styles.chatArea}>
          
          {/* Painel Central de Mensagens */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flexContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.chatPanel}>
              <ChatHeader conversation={activeConversation} participants={activeParticipants} />
              <MessageList messages={messages} isLoading={isLoadingMessages} typingUser={typingUser} />
              <MessageInput
                disabled={!activeConversation}
                onSendMessage={sendMessage}
                onSelectAttachment={sendAttachment}
                onTypingStart={startTyping}
                onTypingStop={stopTyping}
              />
            </View>
          </KeyboardAvoidingView>

          {/* MENU LATERAL CUSTOMIZADO (SIDEBAR): Renderiza flutuando sobre a tela se estiver ativo */}
          {isSidebarOpen ? (
            <View style={styles.sidebarOverlay}>
              <View style={styles.sidebarContent}>
                <ConversationSidebar
                  conversations={conversations}
                  activeConversationId={activeConversation?.id}
                  isConnected={isConnected}
                  isUsingMockData={isUsingMockData}
                  onSelectConversation={(chat) => {
                    selectConversation(chat);
                    setIsSidebarOpen(false); // Fecha a barra lateral automaticamente
                  }}
                  onCreateConversation={createNewConversation}
                />
              </View>
              
           
              <TouchableOpacity 
                style={styles.sidebarOutsideTap} 
                onPress={() => setIsSidebarOpen(false)} 
              />
            </View>
          ) : null}

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  topNavbar: {
    height: 56,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  menuButton: {
    padding: 4,
    marginRight: 16,
  },
  navbarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  chatArea: {
    flex: 1,
    position: 'relative',
  },
  flexContainer: {
    flex: 1,
  },
  chatPanel: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 999, 
  },
  sidebarContent: {
    width: SCREEN_WIDTH * 0.75, 
    height: '100%',
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1f2937',
  },
  sidebarOutsideTap: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});
