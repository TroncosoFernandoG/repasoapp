import { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
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

  return <Dashboard user={user} onLogout={handleLogout} />;
}