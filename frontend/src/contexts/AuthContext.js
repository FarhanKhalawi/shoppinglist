import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(() => {
    return localStorage.getItem('localMode') === 'true';
  });

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    // Check for JWT token
    const token = localStorage.getItem('authToken');
    
    if (isLocalMode) {
      setUser({ user_id: 'local', name: 'Local User', email: '' });
      setLoading(false);
      return;
    }

    if (!token) {
      // Try cookie-based auth
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      }
    } else {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    
    setLoading(false);
  }, [isLocalMode]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('authToken', response.data.token);
    setUser(response.data.user);
    setIsLocalMode(false);
    localStorage.removeItem('localMode');
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('authToken', response.data.token);
    setUser(response.data.user);
    setIsLocalMode(false);
    localStorage.removeItem('localMode');
    return response.data;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const setGoogleUser = (userData) => {
    setUser(userData);
    setIsLocalMode(false);
    localStorage.removeItem('localMode');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('localMode');
    setUser(null);
    setIsLocalMode(false);
  };

  const enableLocalMode = () => {
    setIsLocalMode(true);
    localStorage.setItem('localMode', 'true');
    setUser({ user_id: 'local', name: 'Local User', email: '' });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLocalMode,
      login,
      register,
      loginWithGoogle,
      setGoogleUser,
      logout,
      enableLocalMode,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
