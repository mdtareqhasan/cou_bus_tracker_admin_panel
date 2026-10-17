import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const name = localStorage.getItem('admin_name');
    if (token && name && !isTokenExpired(token)) {
      setAdmin({ token, name });
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_name');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { accessToken, name } = res.data || {};

    // A 200 that isn't a token payload means we hit the wrong thing (e.g. a
    // static host answering /api with the SPA's index.html). Fail loudly here
    // instead of storing "undefined" and breaking every page afterwards.
    if (!accessToken) {
      const snippet = typeof res.data === 'string'
        ? res.data.slice(0, 120).replace(/\s+/g, ' ')
        : JSON.stringify(res.data);
      throw new Error(
        `Login returned HTTP ${res.status} without a token (${res.headers?.['content-type'] || 'no content-type'}). Body: ${snippet}`
      );
    }

    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_name', name);
    setAdmin({ token: accessToken, name });
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
