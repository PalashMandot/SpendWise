import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string, currency?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('spendwise_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('spendwise_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem('spendwise_token');
    localStorage.removeItem('spendwise_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleLogoutEvent = () => logout();
    window.addEventListener('spendwise_logout', handleLogoutEvent);
    return () => window.removeEventListener('spendwise_logout', handleLogoutEvent);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('spendwise_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('spendwise_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('spendwise_token', res.access_token);
    setToken(res.access_token);
    const profile = await authApi.getMe();
    setUser(profile);
    localStorage.setItem('spendwise_user', JSON.stringify(profile));
  };

  const register = async (email: string, fullName: string, password: string, currency = 'USD') => {
    await authApi.register({ email, full_name: fullName, password, currency });
    await login(email, password);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('spendwise_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
