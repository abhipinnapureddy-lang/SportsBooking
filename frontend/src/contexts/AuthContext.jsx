import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMyProfile } from '../api.js';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  if (typeof window === 'undefined') return { user: null, token: null, remembered: true };

  const localToken = localStorage.getItem('sb-token');
  if (localToken) {
    const user = localStorage.getItem('sb-user');
    return {
      user: user ? JSON.parse(user) : null,
      token: localToken,
      remembered: true
    };
  }

  const sessionToken = sessionStorage.getItem('sb-token');
  if (sessionToken) {
    const user = sessionStorage.getItem('sb-user');
    return {
      user: user ? JSON.parse(user) : null,
      token: sessionToken,
      remembered: false
    };
  }

  return { user: null, token: null, remembered: true };
};

export const AuthProvider = ({ children }) => {
  const { user: initialUser, token: initialToken, remembered: initialRemembered } = getStoredAuth();
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [remembered, setRemembered] = useState(initialRemembered);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }

    const initializeSession = async () => {
      try {
        const result = await fetchMyProfile(token);
        if (result.status === 'success') {
          setUser(result.data.user);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setInitializing(false);
      }
    };

    initializeSession();
  }, [token]);

  useEffect(() => {
    localStorage.removeItem('sb-token');
    localStorage.removeItem('sb-user');
    sessionStorage.removeItem('sb-token');
    sessionStorage.removeItem('sb-user');

    if (token) {
      const store = remembered ? localStorage : sessionStorage;
      store.setItem('sb-token', token);
      if (user) store.setItem('sb-user', JSON.stringify(user));
    }
  }, [token, user, remembered]);

  const login = (userData, accessToken, remember = true) => {
    setRemembered(remember);
    setUser(userData);
    setToken(accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRemembered(true);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      initializing,
      login,
      logout
    }),
    [user, token, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
