import { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// CORREÇÃO 1: Removido o import do expo-router
import { resetPassword } from '../services/authApi';
import { isAxiosError } from 'axios';

// CORREÇÃO 2: Recebendo a propriedade 'navigation' nativa do Stack
export default function ResetPassword({ navigation }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    async function loadResetToken() {
      try {
        const token = await AsyncStorage.getItem('resetPasswordToken');
        
        if (!token) {
          // CORREÇÃO 3: Trocado por navigation.reset para limpar a pilha de telas do celular
          navigation.reset({
            index: 0,
            routes: [{ name: 'ForgotPassword' }],
          });
          return;
        }
        
        setResetToken(token);
      } catch (error) {
        console.error(error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'ForgotPassword' }],
        });
      } finally {
        setIsPageLoading(false);
      }
    }
    loadResetToken();
  }, [navigation]);

  async function handleResetSubmit() {
    setErrorMessage('');

    if (!resetToken) {
      setErrorMessage('Token de recuperação não encontrado.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não são iguais.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        newPassword,
        token: resetToken,
      });

      await AsyncStorage.removeItem('resetPasswordToken');
      await AsyncStorage.removeItem('resetPasswordEmail');
      await AsyncStorage.removeItem('resetPasswordTenantSlug');

      // CORREÇÃO 4: Reseta a navegação mandando o usuário limpo para o Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('ERRO AO REDEFINIR SENHA:', error);
    
      if (isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
    
        if (typeof backendMessage === 'string') {
          setErrorMessage(backendMessage);
          return;
        }
      }
    
      setErrorMessage('Não foi possível redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isPageLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>Digite e confirme sua nova senha.</Text>
        </View>

        {/* Input da Nova Senha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nova senha</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo de 6 caracteres"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </View>

        {/* Input de Confirmação */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar nova senha</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Digite novamente"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Botão de Enviar */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleResetSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Alterar senha</Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111827',
    padding: 32,
    borderRadius: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#020617',
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
