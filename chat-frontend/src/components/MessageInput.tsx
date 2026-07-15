import { Image, Mic, Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';

type MessageInputProps = {
  disabled?: boolean;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onSelectAttachment: (file: File) => void;
};

export function MessageInput({
  disabled,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onSelectAttachment,
}: MessageInputProps) {
  const [content, setContent] = useState('');

  const typingTimeoutRef = useRef<number | null>(null);

  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  function handleFileSelected(file: File | undefined) {
    if (!file) return;

    onSelectAttachment(file);
  }
  async function startRecording() {
    if (disabled || isRecording) return;
  
    setRecordingError('');
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
  
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
  
      const supportedMimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ];
  
      const supportedMimeType = supportedMimeTypes.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType),
      );
  
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, {
            mimeType: supportedMimeType,
          })
        : new MediaRecorder(stream);
  
      mediaRecorderRef.current = recorder;
  
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      recorder.onstop = () => {
        const recorderMimeType =
          recorder.mimeType || supportedMimeType || 'audio/webm';
  
        const baseMimeType = recorderMimeType.split(';')[0];
  
        const extension =
          baseMimeType === 'audio/mp4'
            ? 'm4a'
            : baseMimeType === 'audio/ogg'
              ? 'ogg'
              : 'webm';
  
        const audioBlob = new Blob(audioChunksRef.current, {
          type: baseMimeType,
        });
  
        const audioFile = new File(
          [audioBlob],
          `audio-${Date.now()}.${extension}`,
          {
            type: baseMimeType,
          },
        );
  
        audioChunksRef.current = [];
  
        if (audioFile.size > 0) {
          onSelectAttachment(audioFile);
        }
      };
  
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('ERRO COMPLETO DO MICROFONE:', error);
    
      if (error instanceof DOMException) {
        console.error('NOME DO ERRO:', error.name);
        console.error('MENSAGEM DO ERRO:', error.message);
    
        if (error.name === 'NotAllowedError') {
          setRecordingError(
            'A permissão do microfone foi negada ou bloqueada pelo navegador.',
          );
          return;
        }
    
        if (error.name === 'NotFoundError') {
          setRecordingError(
            'Nenhum microfone foi encontrado no dispositivo.',
          );
          return;
        }
    
        if (error.name === 'NotReadableError') {
          setRecordingError(
            'O microfone está sendo usado ou não pôde ser acessado.',
          );
          return;
        }
      }
    
      setRecordingError(
        'Não foi possível acessar o microfone.',
      );
    
      setIsRecording(false);
    }
  }
  function stopRecording() {
    const recorder = mediaRecorderRef.current;
  
    if (!recorder || recorder.state === 'inactive') {
      return;
    }
  
    recorder.stop();
  
    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());
  
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
  
    setIsRecording(false);
  }

  return (
    <footer className="message-input-bar">
      <div className="input-actions-left">
        <input
          ref={attachmentInputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={(event) => {
            handleFileSelected(event.target.files?.[0]);

            event.target.value = '';
          }}
        />

        <input
          ref={imageInputRef}
          type="file"
          hidden
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            handleFileSelected(event.target.files?.[0]);

            event.target.value = '';
          }}
        />

        <button
          type="button"
          aria-label="Anexar arquivo"
          disabled={disabled}
          onClick={() => attachmentInputRef.current?.click()}
        >
          <Paperclip size={18} />
        </button>

        <button
          type="button"
          aria-label="Imagem"
          disabled={disabled}
          onClick={() => imageInputRef.current?.click()}
        >
          <Image size={18} />
        </button>
      </div>

      <input
        disabled={disabled}
        value={content}
        onChange={(event) => handleTyping(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleSubmit();
          }
        }}
        placeholder="Digite sua mensagem..."
      />

      <div className="input-actions-right">
      <button
          type="button"
          aria-label={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          disabled={disabled}
          onClick={() => {
            if (isRecording) {
              stopRecording();
              return;
            }

            void startRecording();
          }}
          className={isRecording ? 'recording-button' : ''}
        >
          <Mic size={18} />

          {isRecording && <span>Parar</span>}
      </button>

        <button
          type="button"
          className="send-button"
          onClick={handleSubmit}
          disabled={disabled || !content.trim()}
        >
          <Send size={18} />
          Enviar
        </button>
      </div>
      {recordingError && (
      <span className="recording-error">
        {recordingError}
      </span>
      )}
    </footer>
  );
}