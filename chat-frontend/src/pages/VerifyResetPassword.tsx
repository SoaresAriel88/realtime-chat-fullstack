import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyResetPasswordOtp } from '../services/authApi';

export function VerifyResetPassword() {
  const navigate = useNavigate();

  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email] = useState<string | null>(() =>
    sessionStorage.getItem('resetPasswordEmail'),
  );

  const [tenantSlug] = useState<string | null>(() =>
    sessionStorage.getItem('resetPasswordTenantSlug'),
  );

  useEffect(() => {
    if (!email || !tenantSlug) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, tenantSlug, navigate]);

  function handleOtpChange(value: string) {
    const onlyNumbers = value.replace(/\D/g, '');

    setOtpCode(onlyNumbers.slice(0, 6));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');

    if (!email || !tenantSlug) {
      setErrorMessage(
        'Os dados da recuperação de senha não foram encontrados.',
      );
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

      sessionStorage.setItem('resetPasswordToken', response.token);

      navigate('/reset-password');
    } catch (error) {
      console.error(error);
      setErrorMessage('Código inválido, expirado ou bloqueado.');
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
            Verifique o código
          </h1>

          <p style={{ color: '#9ca3af' }}>
            Enviamos um código de recuperação para:
          </p>

          <strong
            style={{
              display: 'block',
              marginTop: '8px',
              overflowWrap: 'anywhere',
            }}
          >
            {email}
          </strong>
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          Código de recuperação

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otpCode}
            onChange={(event) => handleOtpChange(event.target.value)}
            placeholder="000000"
            maxLength={6}
            required
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #374151',
              background: '#020617',
              color: '#fff',
              fontSize: '24px',
              textAlign: 'center',
              letterSpacing: '8px',
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
          {isLoading ? 'Verificando...' : 'Verificar código'}
        </button>
      </form>
    </main>
  );
}