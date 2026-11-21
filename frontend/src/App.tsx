import { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { clearSession, getStoredToken, getStoredUser } from './services/apiClient';
import { AuthResponse, PublicUser } from './types/api.types';

export function App() {
  const [user, setUser] = useState<PublicUser | null>(() => {
    const token = getStoredToken();
    return token ? getStoredUser() : null;
  });

  const handleAuthenticated = (auth: AuthResponse): void => {
    setUser(auth.user);
  };

  const handleLogout = (): void => {
    clearSession();
    setUser(null);
  };

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <h1>RepasoApp</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Hola, {user.fullName}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '0.5rem 1rem',
            borderRadius: '8px'
          }}
        >
          Cerrar sesión
        </button>
      </header>
      <p style={{ color: 'var(--text-secondary)' }}>
        Sesión iniciada correctamente. Listo para construir el Dashboard en T15.
      </p>
    </main>
  );
}