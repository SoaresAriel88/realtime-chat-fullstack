import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authApi';
import { getTenants, type Tenant } from '../services/tenantApi';

export function Register() {
  const navigate = useNavigate();

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

    void loadTenants();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      navigate('/login');
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível criar sua conta.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        padding: '24px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#111827',
          padding: '32px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Cadastro</h1>
          <p style={{ color: '#9ca3af' }}>
            Crie sua conta para acessar o chat real-time.
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          Empresa
          <select
            value={tenantSlug}
            onChange={(event) => setTenantSlug(event.target.value)}
            required
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#020617',
              color: '#fff',
            }}
          >
            <option value="" disabled>
              Selecione uma empresa
            </option>

            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.slug}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          Nome
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            required
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#020617',
              color: '#fff',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seuemail@gmail.com"
            required
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#020617',
              color: '#fff',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo de 6 caracteres"
            required
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#020617',
              color: '#fff',
            }}
          />
        </label>

        {errorMessage && (
          <span style={{ color: '#f87171', fontSize: '14px' }}>
            {errorMessage}
          </span>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{ color: '#60a5fa' }}>
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}