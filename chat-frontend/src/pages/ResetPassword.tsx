import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authApi';
import { isAxiosError } from 'axios';

export function ResetPassword() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [resetToken] = useState<string | null>(() =>
    sessionStorage.getItem('resetPasswordToken'),
  );

  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      sessionStorage.removeItem('resetPasswordToken');
      sessionStorage.removeItem('resetPasswordEmail');
      sessionStorage.removeItem('resetPasswordTenantSlug');

      navigate('/login', {
        replace: true,
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
      }finally {
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
          <h1
            style={{
              fontSize: '28px',
              marginBottom: '8px',
            }}
          >
            Redefinir senha
          </h1>

          <p style={{ color: '#9ca3af' }}>
            Digite e confirme sua nova senha.
          </p>
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          Nova senha

          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Mínimo de 6 caracteres"
            minLength={6}
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

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          Confirmar nova senha

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Digite novamente"
            minLength={6}
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
          {isLoading ? 'Alterando senha...' : 'Alterar senha'}
        </button>
      </form>
    </main>
  );
}