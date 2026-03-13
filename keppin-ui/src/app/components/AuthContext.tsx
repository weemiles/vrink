import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  initAuth,
  subscribeAuth,
  getAuthSnapshot,
  type AuthState,
} from '../data/authStore';

const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useSyncExternalStore(subscribeAuth, getAuthSnapshot);

  useEffect(() => {
    void initAuth();
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
