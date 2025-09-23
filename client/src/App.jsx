import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ChatApp from './ChatApp';
import AuthForm from './component/AuthForm';
import RequireAuth from './routes/RequireAuth';
import UpgradePlan from './component/UpgradePlan';

// Lazy placeholder pages / wrappers
const CheckoutPage = React.lazy(() => import('./component/CheckoutPage'));

const USER_KEY = "chatapp_remember_user";

function App() {
  const [loggedIn, setLoggedIn] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? true : false;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [darkMode, setDarkMode] = useState(false);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Set theme based on user prefs or system
    const userTheme = user.preferences?.theme || 'system';
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(userTheme === 'dark' || (userTheme === 'system' && systemPrefersDark));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoggedIn(false);
    setDarkMode(false);
    localStorage.removeItem(USER_KEY);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    document.body.className = darkMode ? 'bg-dark text-white' : 'bg-light text-dark';
  }, [darkMode]);

  const location = useLocation();
  const navigate = useNavigate();

  // After login redirect to original destination if present
  useEffect(() => {
    if (loggedIn && location.pathname === '/login') {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [loggedIn, location.pathname]);

  return (
    <React.Suspense fallback={<div className="p-3">Loading...</div>}>
      <Routes>
        <Route
          path="/login"
          element={<AuthForm onLogin={handleLogin} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <ChatApp user={currentUser} onLogout={handleLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <ChatApp user={currentUser} onLogout={handleLogout} initialShowSettings />
            </RequireAuth>
          }
        />
        <Route
          path="/upgrade"
          element={
            <RequireAuth>
              <ChatApp user={currentUser} onLogout={handleLogout} initialShowUpgradePlan />
            </RequireAuth>
          }
        />
        <Route
          path="/help"
          element={
            <RequireAuth>
              <ChatApp user={currentUser} onLogout={handleLogout} initialShowHelp />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to={loggedIn ? '/' : '/login'} replace />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;
