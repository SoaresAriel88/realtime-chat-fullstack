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
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// CORREÇÃO 1: Removido o import do expo-router
import { forgotPassword } from '../services/authApi';
import { getTenants, type Tenant } from '../services/tenantApi';

// CORREÇÃO 2: Recebendo a propriedade 'navigation' nativa do Stack
export default function ForgotPassword({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadTenants() {
      try {
        const data = await getTenants();
        setTenants(data);

        if (data.length > 0) {
          setTenantSlug(data[0].slug);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Não foi possível carregar as empresas.');
      }
    }
    loadTenants();
  }, []);

  async function handleForgotSubmit() {
    setErrorMessage('');

    if (!tenantSlug) {
      setErrorMessage('Selecione uma empresa.');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword({
        email: email.trim(),
        tenantSlug,
      });

      await AsyncStorage.setItem('resetPasswordEmail', email.trim());
      await AsyncStorage.setItem('resetPasswordTenantSlug', tenantSlug);

      // CORREÇÃO 3: Alinhado com o nome exato da rota pública no App.tsx
      navigation.navigate('VerifyResetPassword');
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Não foi possível enviar o código. Verifique o e-mail e a empresa.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Esqueci minha senha</Text>
          <Text style={styles.subtitle}>
            Informe seu e-mail para receber um código de recuperação.
          </Text>
        </View>

        {/* Dropdown Nativo da Empresa */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Empresa</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={tenantSlug}
              onValueChange={(itemValue) => setTenantSlug(itemValue)}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label="Selecione uma empresa" value="" enabled={false} />
              {tenants.map((tenant) => (
                <Picker.Item key={tenant.id} label={tenant.name} value={tenant.slug} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Input de E-mail */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@gmail.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Botão de Enviar */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleForgotSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar código</Text>
          )}
        </TouchableOpacity>

        {/* Voltar para o login */}
        {/* CORREÇÃO 4: Alinhado para voltar à rota 'Login' */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerText}>
            Lembrou sua senha? <Text style={styles.linkText}>Voltar para o login</Text>
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
  pickerWrapper: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
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
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    color: '#60a5fa',
  },
});
