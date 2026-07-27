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
import { verifyResetPasswordOtp } from '../services/authApi';

// CORREÇÃO 2: Recebendo a propriedade 'navigation' nativa do Stack
export default function VerifyResetPassword({ navigation }: any) {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadResetData() {
      try {
        const storedEmail = await AsyncStorage.getItem('resetPasswordEmail');
        const storedSlug = await AsyncStorage.getItem('resetPasswordTenantSlug');

        if (!storedEmail || !storedSlug) {
          // CORREÇÃO 3: Trocado por navigation.reset para limpar a pilha de telas do celular
          navigation.reset({
            index: 0,
            routes: [{ name: 'ForgotPassword' }],
          });
          return;
        }

        setEmail(storedEmail);
        setTenantSlug(storedSlug);
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
    loadResetData();
  }, [navigation]);

  function handleOtpChange(value: string) {
    const onlyNumbers = value.replace(/\D/g, '');
    setOtpCode(onlyNumbers.slice(0, 6));
  }

  async function handleVerifySubmit() {
    setErrorMessage('');

    if (!email || !tenantSlug) {
      setErrorMessage('Os dados da recuperação de senha não foram encontrados.');
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMessage('Digite o código de 6 números.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyResetPasswordOtp({
        email,
        tenantSlug,
        resetPasswordOtp: otpCode,
      });

      await AsyncStorage.setItem('resetPasswordToken', response.token);

      // CORREÇÃO 4: Navegando para o próximo passo usando o nome definido no seu App.tsx
      navigation.navigate('ResetPassword');
    } catch (error) {
      console.error(error);
      setErrorMessage('Código inválido, expirado ou bloqueado.');
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
          <Text style={styles.title}>Verifique o código</Text>
          <Text style={styles.subtitle}>Enviamos um código de recuperação para:</Text>
          <Text style={styles.emailHighlight}>{email}</Text>
        </View>

        {/* Input do Código de Recuperação */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código de recuperação</Text>
          <TextInput
            style={styles.inputOtp}
            value={otpCode}
            onChangeText={handleOtpChange}
            placeholder="000000"
            placeholderTextColor="#374151"
            maxLength={6}
            keyboardType="number-pad"
            autoFocus
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Botão de Enviar */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleVerifySubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar código</Text>
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
  emailHighlight: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    marginBottom: 12,
    fontSize: 16,
  },
  inputOtp: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#020617',
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
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
