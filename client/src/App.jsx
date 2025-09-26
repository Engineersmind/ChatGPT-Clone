import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatApp from './ChatApp';
import AuthForm from './component/AuthForm';
import RequireAuth from './routes/RequireAuth';

import UpgradePlan from './component/UpgradePlan';
import { logoutUser as apiLogoutUser } from './services/authService';



const CheckoutPage = React.lazy(() => import('./component/CheckoutPage'));
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const USER_KEY = 'chatapp_current_user';
const THEME_STORAGE_KEY = 'chat_theme';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      return 'system';
    }
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const navigate = useNavigate();


 useEffect(() => {
  const checkUserSession = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token found');
      const { data } = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data) {
        setCurrentUser(data);
        setLoggedIn(true);
      }
    } catch (err) {
      setCurrentUser(null);
      setLoggedIn(false);
      console.warn('No active session or session check failed.', err);
    } finally {
      setLoading(false);
    }
  };
  checkUserSession();
}, []);



  const handleLogin = useCallback((user) => {
    setCurrentUser(user);
    setLoggedIn(true);

    navigate('/');
  }, [navigate]);

  const handleLogout = async () => {
  try {
    await apiLogoutUser();
  } catch (error) {
    console.error('Error logging out:', error);
  }

  setCurrentUser(null);
  setLoggedIn(false);
  localStorage.removeItem('authToken');          // Remove JWT token
  localStorage.removeItem(USER_KEY);              // Remove user info
};


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemPrefersDark(event.matches);

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  }, [theme]);

  const darkMode = useMemo(() => {
    if (theme === 'system') {
      return systemPrefersDark;
    }
    return theme === 'dark';
  }, [theme, systemPrefersDark]);

  const toggleDarkMode = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.className = darkMode ? 'bg-dark text-white' : 'bg-light text-dark';
  }, [darkMode]);


  const location = useLocation();
  const redirectFrom = location.state?.from;

  // After login redirect to original destination if present
  useEffect(() => {
    if (loggedIn && location.pathname === '/login') {
      navigate(redirectFrom || '/', { replace: true });
    }
  }, [loggedIn, location.pathname, navigate, redirectFrom]);

  if (loading) {
    const containerClasses = `d-flex flex-column align-items-center justify-content-center min-vh-100 ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`;
    return (
      <div className={containerClasses}>
        <div className="spinner-border mb-3" role="status" aria-live="polite" aria-label="Loading" />
        <p className="m-0 fw-semibold">Checking your session...</p>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="p-3">Loading...</div>}>
      <Routes>
        <Route
          path="/login"
          element={loggedIn ? <Navigate to="/" /> : <AuthForm onLogin={handleLogin} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <ChatApp
                user={currentUser}
                onLogout={handleLogout}
                theme={theme}
                onThemeChange={setTheme}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <ChatApp
                user={currentUser}
                onLogout={handleLogout}
                theme={theme}
                onThemeChange={setTheme}
                darkMode={darkMode}
                initialShowSettings
              />
            </RequireAuth>
          }
        />
        <Route
          path="/upgrade"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <ChatApp
                user={currentUser}
                onLogout={handleLogout}
                theme={theme}
                onThemeChange={setTheme}
                darkMode={darkMode}
                initialShowUpgradePlan
              />
            </RequireAuth>
          }
        />
        <Route
          path="/help"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <ChatApp
                user={currentUser}
                onLogout={handleLogout}
                theme={theme}
                onThemeChange={setTheme}
                darkMode={darkMode}
                initialShowHelp
              />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={<RequireAuth loggedIn={loggedIn}><CheckoutPage /></RequireAuth>}
        />
        {/* CHANGED: Simplified the catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;