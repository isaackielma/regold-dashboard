import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Investor } from '../types';

interface AuthContextValue {
  investor: Investor | null;
  token: string | null;
  signIn: (token: string, investor: Investor) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [investor, setInvestor] = useState<Investor | null>(() => {
    const raw = localStorage.getItem('investor');
    return raw ? (JSON.parse(raw) as Investor) : null;
  });

  const signIn = useCallback((newToken: string, newInvestor: Investor) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('investor', JSON.stringify(newInvestor));
    setToken(newToken);
    setInvestor(newInvestor);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('investor');
    setToken(null);
    setInvestor(null);
  }, []);

  // Clear stale state if token disappears externally
  useEffect(() => {
    if (!localStorage.getItem('token')) signOut();
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ token, investor, signIn, signOut, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
