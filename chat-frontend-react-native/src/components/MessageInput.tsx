import React, { useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Platform 
} from 'react-native';
import { Image, Mic, Paperclip, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

type MobileFile = {
  uri: string;
  name: string;
  type: string;
};

type MessageInputProps = {
  disabled?: boolean;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onSelectAttachment: (file: MobileFile) => void;
};

export function MessageInput({
  disabled,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onSelectAttachment,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<any | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  function handleTyping(value: string) {
    setContent(value);
    onTypingStart();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 700);
  }

  function handleSubmit() {
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent('');
    onTypingStop();
  }

  async function handlePickImage() {
    if (disabled) return;
    setRecordingError('');

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setRecordingError('Permissão para acessar a galeria foi negada.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onSelectAttachment({
          uri: asset.uri,
          name: asset.fileName ?? `image-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        });
      }
    } catch (error) {
      console.error(error);
      setRecordingError('Erro ao selecionar imagem.');
    }
  }

  async function handlePickDocument() {
    if (disabled) return;
    setRecordingError('');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onSelectAttachment({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        });
      }
    } catch (error) {
      console.error(error);
      setRecordingError('Erro ao selecionar arquivo.');
    }
  }

  async function startRecording() {
    if (disabled || isRecording) return;
    setRecordingError('');

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setRecordingError('Permissão do microfone negada.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      setRecordingError('Não foi possível acessar o microfone.');
      setIsRecording(false);
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const rawUri = recordingRef.current.getURI();

      if (rawUri) {
        const formattedUri = Platform.OS === 'ios' ? rawUri.replace('file://', '') : rawUri;

        onSelectAttachment({
          uri: formattedUri,
          name: `audio-${Date.now()}.mp4`, // Modificado para .mp4 de áudio
          type: 'audio/mp4', // Ajustado MIME-type estável e universal para o Axios
        });
      }
    } catch (error) {
      console.error(error);
      setRecordingError('Erro ao finalizar gravação.');
    } finally {
      recordingRef.current = null;
    }
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePickDocument} disabled={disabled}>
            <Paperclip size={20} color={disabled ? '#4b5563' : '#9ca3af'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handlePickImage} disabled={disabled}>
            <Image size={20} color={disabled ? '#4b5563' : '#9ca3af'} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, disabled && styles.inputDisabled, { maxHeight: 100 }]}
          editable={!disabled}
          value={content}
          onChangeText={handleTyping}
          placeholder={disabled ? "Conversa desativada" : "Digite sua mensagem..."}
          placeholderTextColor="#6b7280"
          multiline
        />

        <View style={styles.actionsRight}>
          <TouchableOpacity 
            style={[styles.iconButton, isRecording && styles.recordingActive]} 
            onPress={isRecording ? stopRecording : startRecording}
            disabled={disabled}
          >
            <Mic size={20} color={isRecording ? '#ef4444' : (disabled ? '#4b5563' : '#9ca3af')} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sendButton, (!content.trim() || disabled) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={disabled || !content.trim()}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isRecording && <Text style={styles.recordingText}>Gravando áudio... Clique no microfone para parar e enviar.</Text>}
      {recordingError ? <Text style={styles.errorText}>{recordingError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
  },
  recordingActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputDisabled: {
    color: '#4b5563',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    backgroundColor: '#2563eb',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#1f2937',
  },
  recordingText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
