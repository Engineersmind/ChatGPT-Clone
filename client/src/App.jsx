import React, { useState, useEffect } from 'react';
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

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // The cookie is sent automatically by the browser due to `withCredentials: true`
        const { data } = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
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


  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
    
    navigate('/');
  };

  const handleLogout = async () => {
    try {

      await apiLogoutUser();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setCurrentUser(null);
    setLoggedIn(false);
    setDarkMode(false);
    localStorage.removeItem(USER_KEY);

  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
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
          element={<RequireAuth loggedIn={loggedIn}><ChatApp user={currentUser} onLogout={handleLogout} /></RequireAuth>}
        />
        <Route
          path="/settings"
          element={<RequireAuth loggedIn={loggedIn}><ChatApp user={currentUser} onLogout={handleLogout} initialShowSettings /></RequireAuth>}
        />
        <Route
          path="/upgrade"
          element={<RequireAuth loggedIn={loggedIn}><ChatApp user={currentUser} onLogout={handleLogout} initialShowUpgradePlan /></RequireAuth>}
        />
        <Route
          path="/help"
          element={<RequireAuth loggedIn={loggedIn}><ChatApp user={currentUser} onLogout={handleLogout} initialShowHelp /></RequireAuth>}
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