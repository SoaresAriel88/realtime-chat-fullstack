	import { FormEvent, useEffect, useState } from 'react';
	import { Link, useNavigate } from 'react-router-dom';
	import { login } from '../services/authApi';
	import { getTenants, type Tenant } from '../services/tenantApi';


	export function Login() {
		const navigate = useNavigate();

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
			setIsLoading(true);

			try {
				await login({
					email,
					password,
					tenantSlug,
				});

				navigate('/chat');
			} catch (error) {
				console.error(error);
				setErrorMessage('Email ou senha inválidos.');
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
						<h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Login</h1>
						<p style={{ color: '#9ca3af' }}>
							Entre para acessar o chat real-time.
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
							placeholder="Sua senha"
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
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
						}}
						>
						<Link
							to="/forgot-password"
							style={{
							color: '#60a5fa',
							fontSize: '14px',
							textDecoration: 'none',
							}}
						>
							Esqueci minha senha
						</Link>
					</div>

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
						{isLoading ? 'Entrando...' : 'Entrar'}
					</button>
					<Link to="/register" style={{ textDecoration: 'none', color: '#2563eb', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
						Não tem uma conta ? Cadastre-se
					</Link>
				</form>
			</main>
		);
	}