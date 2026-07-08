import { Image, Mic, Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';

type MessageInputProps = {
  disabled?: boolean;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
};

export function MessageInput({ disabled, onSendMessage, onTypingStart, onTypingStop }: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<number | null>(null);

  function handleTyping(value: string) {
    setContent(value);
    onTypingStart();

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingStop();
    }, 700);
  }

  function handleSubmit() {
    if (!content.trim()) return;
    onSendMessage(content);
    setContent('');
    onTypingStop();
  }

  return (
    <footer className="message-input-bar">
      <div className="input-actions-left">
        <button type="button" aria-label="Anexar arquivo" disabled={disabled}>
          <Paperclip size={18} />
        </button>
        <button type="button" aria-label="Imagem" disabled={disabled}>
          <Image size={18} />
        </button>
      </div>

      <input
        disabled={disabled}
        value={content}
        onChange={(event) => handleTyping(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleSubmit();
        }}
        placeholder="Digite sua mensagem..."
      />

      <div className="input-actions-right">
        <button type="button" aria-label="Áudio" disabled={disabled}>
          <Mic size={18} />
        </button>
        <button type="button" className="send-button" onClick={handleSubmit} disabled={disabled || !content.trim()}>
          <Send size={18} />
          Enviar
        </button>
      </div>
    </footer>
  );
}
