import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('agentguard_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('agentguard_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agentguard_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('agentguard_user', JSON.stringify(res.data.data));
          }
        } catch {
          localStorage.removeItem('agentguard_token');
          localStorage.removeItem('agentguard_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data.data;
    setToken(access_token);
    setUser(loggedUser);
    localStorage.setItem('agentguard_token', access_token);
    localStorage.setItem('agentguard_user', JSON.stringify(loggedUser));
  };

  const register = async (name: string, email: string, password: string, role = 'SECURITY_ANALYST') => {
    const res = await apiClient.post('/auth/register', { name, email, password, role });
    const { access_token, user: registeredUser } = res.data.data;
    setToken(access_token);
    setUser(registeredUser);
    localStorage.setItem('agentguard_token', access_token);
    localStorage.setItem('agentguard_user', JSON.stringify(registeredUser));
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore error during logout
    } finally {
      localStorage.removeItem('agentguard_token');
      localStorage.removeItem('agentguard_user');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
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
