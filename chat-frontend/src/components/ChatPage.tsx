import { ChatHeader } from './ChatHeader';
import { ConversationDetails } from './ConversationDetails';
import { ConversationSidebar } from './ConversationSidebar';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { useChat } from '../hooks/useChat';

export function ChatPage() {
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

  return (
    <div className="app-shell">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        isConnected={isConnected}
        isUsingMockData={isUsingMockData}
        onSelectConversation={selectConversation}
        onCreateConversation={createNewConversation}
      />

      <section className="chat-panel">
        <ChatHeader conversation={activeConversation} participants={activeParticipants} />
        <MessageList messages={messages} isLoading={isLoadingMessages} typingUser={typingUser} />
        <MessageInput
          disabled={!activeConversation}
          onSendMessage={sendMessage}
          onSelectAttachment={sendAttachment}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />
      </section>

      <ConversationDetails conversation={activeConversation} participants={activeParticipants} />
    </div>
  );
}
