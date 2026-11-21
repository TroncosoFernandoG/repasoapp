import { FormEvent, useState } from 'react';
import { apiClient, ApiClientError, saveSession } from '../services/apiClient';
import { AuthResponse } from '../types/api.types';
import './AuthPage.css';

interface AuthPageProps {
  onAuthenticated: (auth: AuthResponse) => void;
}

type AuthMode = 'login' | 'register';

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (mode === 'register' && (trimmedName.length < 3 || trimmedName.length > 80)) {
      setErrorMessage('El nombre completo debe tener entre 3 y 80 caracteres.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setErrorMessage('Ingresá un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response =
        mode === 'login'
          ? await apiClient.login({ email: trimmedEmail, password })
          : await apiClient.register({
              fullName: trimmedName,
              email: trimmedEmail,
              password
            });

      saveSession(response);
      onAuthenticated(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al iniciar sesión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <section className="auth-card" aria-label="Autenticación de usuario">
        <header className="auth-header">
          <h1>RepasoApp</h1>
          <p>Organizá tus materias y priorizá cada examen</p>
        </header>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Crear Cuenta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                type="text"
                placeholder="Ej. Fernando Troncoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="estudiante@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p className="auth-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Procesando...'
              : mode === 'login'
                ? 'Ingresar'
                : 'Registrarme'}
          </button>
        </form>
      </section>
    </div>
  );
}