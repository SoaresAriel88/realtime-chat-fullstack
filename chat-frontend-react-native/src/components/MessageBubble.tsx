import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Linking 
} from 'react-native';
// Ícone de pause adicionado para dar feedback visual quando estiver tocando
import { FileText, Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av'; // REPRODUTOR NATIVO DO CELULAR
import type { Message, User } from '../types/chat';
import { Avatar } from './Avatar';

type MessageBubbleProps = {
  message: Message;
  currentUser: User | null;
};

function formatTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function formatFileSize(size: number | null) {
  if (!size) return '';
  const sizeInKilobytes = size / 1024;
  if (sizeInKilobytes < 1024) {
    return `${sizeInKilobytes.toFixed(1)} KB`;
  }
  const sizeInMegabytes = sizeInKilobytes / 1024;
  return `${sizeInMegabytes.toFixed(1)} MB`;
}

function getFileUrl(fileUrl: string | null) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  return `${apiUrl}${fileUrl}`;
}

export function MessageBubble({ message, currentUser }: MessageBubbleProps) {
  const isOwnMessage = currentUser ? message.authorId === currentUser.id : false;
  const authorName = message.author?.name ?? (isOwnMessage ? currentUser?.name : 'Usuário');
  const attachmentUrl = getFileUrl(message.fileUrl);

  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return soundInstance
      ? () => {
          soundInstance.unloadAsync();
        }
      : undefined;
  }, [soundInstance]);


  async function handlePlayPauseAudio() {
    if (!attachmentUrl) return;

    try {
      if (soundInstance && isPlaying) {
        await soundInstance.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundInstance && !isPlaying) {
        await soundInstance.playAsync();
        setIsPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: attachmentUrl },
        { shouldPlay: true }
      );

      setSoundInstance(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          try {
            await sound.stopAsync(); 
            await sound.setPositionAsync(0);
          } catch (err) {
            console.error('Erro ao resetar áudio:', err);
          }
        }
      });

    } catch (error) {
      console.error('Erro ao reproduzir áudio nativo:', error);
    }
  }


  const handleOpenLink = async () => {
    if (attachmentUrl) {
      const supported = await Linking.canOpenURL(attachmentUrl);
      if (supported) {
        await Linking.openURL(attachmentUrl);
      }
    }
  };

  return (
    <View style={[styles.messageRow, isOwnMessage ? styles.ownRow : styles.otherRow]}>
      {!isOwnMessage ? (
        <View style={styles.avatarContainer}>
          <Avatar name={authorName ?? ''} status={message.author?.status} />
        </View>
      ) : null}

      <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        {!isOwnMessage ? <Text style={styles.authorText}>{authorName}</Text> : null}

        {message.type === 'TEXT' && message.content ? (
          <Text style={styles.messageText}>{message.content}</Text>
        ) : null}

        {message.type === 'IMAGE' && attachmentUrl ? (
          <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.9}>
            <Image source={{ uri: attachmentUrl }} style={styles.messageImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}

        {message.type === 'FILE' && attachmentUrl ? (
          <TouchableOpacity style={styles.messageFile} onPress={handleOpenLink}>
            <FileText size={24} color="#60a5fa" />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {message.fileName ?? 'Arquivo enviado'}
              </Text>
              {message.fileSize ? (
                <Text style={styles.fileSize}>{formatFileSize(message.fileSize)}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : null}

        {message.type === 'AUDIO' && attachmentUrl ? (
          <TouchableOpacity style={styles.messageAudio} onPress={handlePlayPauseAudio}>
            <View style={styles.audioPlayButton}>
              {isPlaying ? (
                <Pause size={14} color="#fff" fill="#fff" />
              ) : (
                <Play size={14} color="#fff" fill="#fff" />
              )}
            </View>
            <Text style={styles.audioText}>
              {isPlaying ? 'Tocando áudio...' : 'Mensagem de voz'} {message.audioDuration ? `(${message.audioDuration}s)` : ''}
            </Text>
          </TouchableOpacity>
        ) : null}

        {message.type !== 'TEXT' && message.content ? (
          <Text style={[styles.messageText, { marginTop: 6 }]}>{message.content}</Text>
        ) : null}

        <Text style={styles.timeText}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  ownRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 4,
  },
  authorText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  messageImage: {
    width: 240,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#020617',
    marginTop: 4,
  },
  messageFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
    width: 220,
  },
  fileDetails: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  fileSize: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  messageAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 4,
    width: 210,
  },
  audioPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  audioText: {
    color: '#fff',
    fontSize: 13,
  },
  timeText: {
    fontSize: 10,
    color: '#9ca3af',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
