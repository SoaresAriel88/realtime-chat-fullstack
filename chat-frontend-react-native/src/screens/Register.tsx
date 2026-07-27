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
import { register } from '../services/authApi';
import { getTenants, type Tenant } from '../services/tenantApi';

// CORREÇÃO 2: Recebendo a propriedade 'navigation' nativa
export default function Register({ navigation }: any) {
  const [name, setName] = useState('');
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

  async function handleRegisterSubmit() {
    setErrorMessage('');

    if (!tenantSlug) {
      setErrorMessage('Selecione uma empresa.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        tenantSlug,
      });
    
      await AsyncStorage.setItem('verificationEmail', email.trim());
      await AsyncStorage.setItem('verificationTenantSlug', tenantSlug);
    
      // CORREÇÃO 3: Trocado por navigation.navigate correspondendo ao nome no App.tsx
      navigation.navigate('VerifyEmail');
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível criar sua conta.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Cadastro</Text>
          <Text style={styles.subtitle}>
            Crie sua conta para acessar o chat real-time.
          </Text>
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#9ca3af"
          />
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo de 6 caracteres"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegisterSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Criar conta</Text>
          )}
        </TouchableOpacity>

        {/* CORREÇÃO 4: Voltar para a rota 'Login' definida no seu App.tsx */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerText}>
            Já tem uma conta? <Text style={styles.linkText}>Entrar</Text>
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
    marginTop: 8,
    marginBottom: 16,
    height: 48,
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
