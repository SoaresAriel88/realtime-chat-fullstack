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
// CORREÇÃO 1: Removido o import do expo-router
import { login } from '../services/authApi';
import { getTenants, type Tenant } from '../services/tenantApi';

// CORREÇÃO 2: Recebendo a propriedade 'navigation' nativa do StackNavigator
export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  async function handleLoginSubmit() {
    setErrorMessage('');
    
    if (!tenantSlug) {
      setErrorMessage('Selecione uma empresa.');
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email,
        password,
        tenantSlug,
      });

      // CORREÇÃO 3: Trocado router.push por navigation.navigate para abrir o painel do Chat
      navigation.navigate('Chat');
    } catch (error) {
      console.error(error);
      setErrorMessage('Email ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>

        <View style={styles.header}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Entre para acessar o chat real-time.
          </Text>
        </View>

        {/* Campo Empresa (Dropdown Nativo) */}
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

        {/* Campo Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
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

        {/* Campo Senha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Sua senha"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </View>

        {/* Esqueci minha senha */}
        <View style={styles.forgotPasswordContainer}>
          {/* CORREÇÃO 4: Ajustado para navegar até o ForgotPassword */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Botão de Entrar */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLoginSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Link para cadastro */}
        {/* CORREÇÃO 5: Ajustado para navegar até o Register */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Não tem uma conta? Cadastre-se
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
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#60a5fa',
    fontSize: 14,
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
    marginBottom: 16,
    height: 48,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
    textAlign: 'center',
  },
});
