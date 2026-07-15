import { FileText } from 'lucide-react';
import { getCurrentUser } from '../lib/currentUser';
import type { Message } from '../types/chat';
import { Avatar } from './Avatar';

type MessageBubbleProps = {
  message: Message;
};

function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatFileSize(size: number | null) {
  if (!size) {
    return '';
  }

  const sizeInKilobytes = size / 1024;

  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toFixed(1)} KB`;
  }

  const sizeInMegabytes = sizeInKilobytes / 1024;

  return `${sizeInMegabytes.toFixed(1)} MB`;
}

function getFileUrl(fileUrl: string | null) {
  if (!fileUrl) {
    return '';
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL;

  return `${apiUrl}${fileUrl}`;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const currentUser = getCurrentUser();

  const isOwnMessage = currentUser
    ? message.authorId === currentUser.id
    : false;

  const authorName =
    message.author?.name ??
    (isOwnMessage ? currentUser?.name : 'Usuário');

  const attachmentUrl = getFileUrl(message.fileUrl);

  return (
    <div className={`message-row ${isOwnMessage ? 'own' : ''}`}>
      {!isOwnMessage && (
        <Avatar
          name={authorName ?? ''}
          status={message.author?.status}
        />
      )}

      <div className={`message-bubble ${isOwnMessage ? 'own' : ''}`}>
        {!isOwnMessage && <strong>{authorName}</strong>}

        {message.type === 'TEXT' && message.content && (
          <p>{message.content}</p>
        )}

        {message.type === 'IMAGE' && attachmentUrl && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={attachmentUrl}
              alt={message.fileName ?? 'Imagem enviada'}
              className="message-image"
            />
          </a>
        )}

        {message.type === 'FILE' && attachmentUrl && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="message-file"
          >
            <FileText size={24} />

            <div>
              <strong>
                {message.fileName ?? 'Arquivo enviado'}
              </strong>

              {message.fileSize && (
                <small>{formatFileSize(message.fileSize)}</small>
              )}
            </div>
          </a>
        )}

        {message.type === 'AUDIO' && attachmentUrl && (
          <audio
            controls
            preload="metadata"
            src={attachmentUrl}
            className="message-audio"
          >
            Seu navegador não suporta reprodução de áudio.
          </audio>
        )}

        {message.type !== 'TEXT' && message.content && (
          <p>{message.content}</p>
        )}

        <span>{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}