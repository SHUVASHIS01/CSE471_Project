import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './api';
import { useIdleTimeout } from './hooks/useIdleTimeout';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Handle idle timeout logout - use useCallback to ensure stable reference
  const handleIdleTimeout = React.useCallback(async () => {
    console.log('[Idle Timeout] Session timeout: User inactive for 3 minutes');
    try {
      // Clear user state first
      setUser(null);
      // Attempt logout
      try {
        await authAPI.logout();
      } catch (logoutErr) {
        console.error('[Idle Timeout] Error during logout API call:', logoutErr);
      }
      // Show alert before redirecting
      alert('Your session has expired due to inactivity. Please log in again.');
      // Redirect to login page
      window.location.href = '/login';
    } catch (err) {
      console.error('[Idle Timeout] Error during idle timeout logout:', err);
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  // Enable idle timeout only when user is logged in
  // This will re-initialize whenever user state changes
  // The hook is in AuthContext which wraps all routes, so it works on ALL pages
  useIdleTimeout(3, handleIdleTimeout, !!user && !loading);

  const register = async (name, email, password, role) => {
    const response = await authAPI.register(name, email, password, role);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
