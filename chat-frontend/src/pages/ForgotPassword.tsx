import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authApi';
import { getTenants, type Tenant } from '../services/tenantApi';

export function ForgotPassword() {
  const navigate = useNavigate();

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
      await forgotPassword({
        email: email.trim(),
        tenantSlug,
      });

      sessionStorage.setItem('resetPasswordEmail', email.trim());
      sessionStorage.setItem('resetPasswordTenantSlug', tenantSlug);

      navigate('/verify-reset-password');
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
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
            Esqueci minha senha
          </h1>

          <p style={{ color: '#9ca3af' }}>
            Informe seu e-mail para receber um código de recuperação.
          </p>
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
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

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          E-mail

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

        {errorMessage && (
          <span
            style={{
              color: '#f87171',
              fontSize: '14px',
            }}
          >
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
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Enviando código...' : 'Enviar código'}
        </button>

        <p
          style={{
            color: '#9ca3af',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          Lembrou sua senha?{' '}
          <Link to="/login" style={{ color: '#60a5fa' }}>
            Voltar para o login
          </Link>
        </p>
      </form>
    </main>
  );
}