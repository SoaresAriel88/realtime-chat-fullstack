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
import { resendEmailOtp, verifyEmailOtp } from '../services/authApi';

// CORREÇÃO 2: Recebendo a propriedade 'navigation' nativa do Stack
export default function VerifyEmail({ navigation }: any) {
  const [otpCode, setOtpCode] = useState('');
  const [secondsToResend, setSecondsToResend] = useState(60);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [email, setEmail] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerificationData() {
      try {
        const storedEmail = await AsyncStorage.getItem('verificationEmail');
        const storedSlug = await AsyncStorage.getItem('verificationTenantSlug');

        if (!storedEmail || !storedSlug) {
          // CORREÇÃO 3: Trocado por navigation.reset para redirecionar limpando o histórico
          navigation.reset({
            index: 0,
            routes: [{ name: 'Register' }],
          });
          return;
        }

        setEmail(storedEmail);
        setTenantSlug(storedSlug);
      } catch (error) {
        console.error(error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Register' }],
        });
      } finally {
        setIsPageLoading(false);
      }
    }
    loadVerificationData();
  }, [navigation]);

  useEffect(() => {
    if (secondsToResend <= 0 || isPageLoading) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsToResend((previousSeconds) => {
        if (previousSeconds <= 1) {
          return 0;
        }
        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [secondsToResend, isPageLoading]);

  async function handleVerifySubmit() {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !tenantSlug) {
      setErrorMessage('Os dados da verificação não foram encontrados.');
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMessage('Digite o código de 6 números.');
      return;
    }

    setIsVerifying(true);

    try {
      await verifyEmailOtp({
        email,
        otpCode,
        tenantSlug,
      });

      await AsyncStorage.removeItem('verificationEmail');
      await AsyncStorage.removeItem('verificationTenantSlug');

      // CORREÇÃO 4: Reseta a navegação mandando o usuário em segurança para o Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Código inválido, expirado ou bloqueado.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (!email || !tenantSlug) {
      setErrorMessage('Os dados da verificação não foram encontrados.');
      return;
    }

    if (secondsToResend > 0) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      await resendEmailOtp({
        email,
        tenantSlug,
      });

      setSecondsToResend(60);
      setSuccessMessage('Um novo código foi enviado para seu e-mail.');
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível reenviar o código agora.');
    } finally {
      setIsResending(false);
    }
  }

  function handleOtpChange(value: string) {
    const onlyNumbers = value.replace(/\D/g, '');
    setOtpCode(onlyNumbers.slice(0, 6));
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
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.subtitle}>Enviamos um código de 6 números para:</Text>
          <Text style={styles.emailHighlight}>{email}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código de verificação</Text>
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

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, isVerifying && styles.buttonDisabled]} 
          onPress={handleVerifySubmit}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar código</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.buttonSecondary, 
            (secondsToResend > 0 || isResending) && styles.buttonSecondaryDisabled
          ]} 
          onPress={handleResendOtp}
          disabled={secondsToResend > 0 || isResending}
        >
          <Text style={[
            styles.buttonSecondaryText,
            secondsToResend > 0 && { color: '#6b7280' }
          ]}>
            {isResending
              ? 'Reenviando...'
              : secondsToResend > 0
                ? `Reenviar código em ${secondsToResend}s`
                : 'Reenviar código'}
          </Text>
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
  successText: {
    color: '#4ade80',
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
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSecondary: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  buttonSecondaryDisabled: {
    borderColor: '#1f2937',
  },
  buttonSecondaryText: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
