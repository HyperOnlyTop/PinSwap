import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there's a token, prefer fetching fresh user from backend to keep roles and data up-to-date
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const me = await fetchMe();
        if (me) {
          // normalize older 'type' field to 'role' and vice-versa for compatibility
          const normalized = { ...me };
          if (normalized.type && !normalized.role) normalized.role = normalized.type;
          if (normalized.role && !normalized.type) normalized.type = normalized.role;
          setUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
          setLoading(false);
          return;
        }
      }
      // fallback to stored user (legacy or offline)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.type && !parsed.role) parsed.role = parsed.type;
          if (parsed.role && !parsed.type) parsed.type = parsed.role;
          setUser(parsed);
        } catch (err) {
          console.warn('Invalid stored user in localStorage');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password, userType) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const requestedRole = (userType === 'user') ? 'citizen' : userType;
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: requestedRole })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Login failed' };

      // Save token and user
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) {
        const normalized = { ...data.user };
        if (normalized.type && !normalized.role) normalized.role = normalized.type;
        if (normalized.role && !normalized.type) normalized.type = normalized.role;
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      }
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // fetch current user from backend
  const fetchMe = async () => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      if (!token) return null;
      const res = await fetch(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (err) {
      return null;
    }
  };

  const register = async (userData, userType) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.message || 'Registration failed', errors: data.errors };

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) {
        const normalized = { ...data.user };
        if (normalized.type && !normalized.role) normalized.role = normalized.type;
        if (normalized.role && !normalized.type) normalized.type = normalized.role;
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      }
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // update profile on backend
  const saveProfile = async (updates) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Update failed', errors: data.errors };
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/users/me/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Change password failed' };
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Request a password reset token (backend will return token in dev)
  const forgotPassword = async (email) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Request failed' };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Reset password using token from email/reset link
  const resetPassword = async (token, newPassword) => {
    try {
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Reset failed' };
      // store new token if returned
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    // normalize shape
    if (updatedUser.type && !updatedUser.role) updatedUser.role = updatedUser.type;
    if (updatedUser.role && !updatedUser.type) updatedUser.type = updatedUser.role;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const addPoints = (points) => {
    // backend uses role 'citizen' for regular users; ensure we check role
    if (user && user.role === 'citizen') {
      const updatedUser = { ...user, points: (user.points || 0) + points };
      if (updatedUser.type && !updatedUser.role) updatedUser.role = updatedUser.type;
      if (updatedUser.role && !updatedUser.type) updatedUser.type = updatedUser.role;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    register,
    fetchMe,
    logout,
    updateUser,
    saveProfile,
  changePassword,
    forgotPassword,
    resetPassword,
    addPoints,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
