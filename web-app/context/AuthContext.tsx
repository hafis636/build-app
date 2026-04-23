'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api, { setAccessToken, getAccessToken } from '../utils/api';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialCheckDone = useRef(false);

  const fetchUser = useCallback(async (token?: string) => {
    const currentToken = token || getAccessToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (token: string) => {
    setAccessToken(token);
    await fetchUser(token);
    router.push('/');
  }, [fetchUser, router]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const initAuth = async () => {
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { 
          withCredentials: true 
        });
        const { accessToken } = response.data;
        setAccessToken(accessToken);
        await fetchUser(accessToken);
      } catch (error) {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
