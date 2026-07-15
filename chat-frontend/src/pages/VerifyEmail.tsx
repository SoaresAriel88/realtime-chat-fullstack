import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  resendEmailOtp,
  verifyEmailOtp,
} from '../services/authApi';

export function VerifyEmail() {
  const navigate = useNavigate();

  const [otpCode, setOtpCode] = useState('');
  const [secondsToResend, setSecondsToResend] = useState(60);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [email] = useState<string | null>(() =>
    sessionStorage.getItem('verificationEmail'),
  );
  
  const [tenantSlug] = useState<string | null>(() =>
    sessionStorage.getItem('verificationTenantSlug'),
  );

  useEffect(() => {
    if (!email || !tenantSlug) {
      navigate('/register');
    }
  }, [email, tenantSlug, navigate]);

  useEffect(() => {
    if (secondsToResend <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsToResend((previousSeconds) => {
        if (previousSeconds <= 1) {
          return 0;
        }

        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [secondsToResend]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !tenantSlug) {
      setErrorMessage(
        'Os dados da verificação não foram encontrados.',
      );
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

      sessionStorage.removeItem('verificationEmail');
      sessionStorage.removeItem('verificationTenantSlug');

      navigate('/login', { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Código inválido, expirado ou bloqueado.',
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (!email || !tenantSlug) {
      setErrorMessage(
        'Os dados da verificação não foram encontrados.',
      );
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
      setSuccessMessage(
        'Um novo código foi enviado para seu e-mail.',
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Não foi possível reenviar o código agora.',
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleOtpChange(value: string) {
    const onlyNumbers = value.replace(/\D/g, '');

    setOtpCode(onlyNumbers.slice(0, 6));
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
          <h1
            style={{
              fontSize: '28px',
              marginBottom: '8px',
            }}
          >
            Verifique seu e-mail
          </h1>

          <p style={{ color: '#9ca3af' }}>
            Enviamos um código de 6 números para:
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
          Código de verificação

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otpCode}
            onChange={(event) =>
              handleOtpChange(event.target.value)
            }
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

        {successMessage && (
          <span
            style={{
              color: '#4ade80',
              fontSize: '14px',
            }}
          >
            {successMessage}
          </span>
        )}

        <button
          type="submit"
          disabled={isVerifying}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 'bold',
            cursor: isVerifying
              ? 'not-allowed'
              : 'pointer',
            opacity: isVerifying ? 0.7 : 1,
          }}
        >
          {isVerifying
            ? 'Verificando...'
            : 'Verificar código'}
        </button>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={
            secondsToResend > 0 || isResending
          }
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #374151',
            background: 'transparent',
            color:
              secondsToResend > 0
                ? '#6b7280'
                : '#60a5fa',
            fontWeight: 'bold',
            cursor:
              secondsToResend > 0 || isResending
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {isResending
            ? 'Reenviando...'
            : secondsToResend > 0
              ? `Reenviar código em ${secondsToResend}s`
              : 'Reenviar código'}
        </button>
      </form>
    </main>
  );
}