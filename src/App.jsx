import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import AnimatedAuthForm from "./component/AnimatedAuthForm";
import ResetPasswordModal from "./component/ResetPasswordModal";

function WelcomePage({ user, onLogout }) {
  return (
    <div style={{
        display: 'flex',
        flexDirection: 'column',          
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        fontFamily: 'sans-serif'
    }}>
      
      <h1>Welcome, {user?.username || user?.name || user?.email}!</h1>
      
      <p>You have successfully logged into QuantumChat.</p>
      <button 
        onClick={onLogout} 
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#0d6efd',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginTop: '20px'
        }}
      >
        Logout
      </button>
    </div>
  );
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const raw = localStorage.getItem('quantumchat_theme');
      return raw ? JSON.parse(raw) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  const [resetInfo, setResetInfo] = useState({ token: null, email: null });
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle Password Reset Link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('reset_token');
    if (token) {
      const resetStore = JSON.parse(localStorage.getItem('chatapp_password_resets') || '{}');
      const stored = resetStore[token];
      
      if (stored && stored.expiry > Date.now()) {
        setResetInfo({ token, email: stored.email });
      } else {
        if (stored) {
            delete resetStore[token];
            localStorage.setItem('chatapp_password_resets', JSON.stringify(resetStore));
        }
        alert("Password reset link is invalid or has expired.");
        navigate('/login', { replace: true });
      }
    }
  }, [location, navigate]);

  useEffect(() => {
    const restoreSession = () => {
      try {
        const sessionData = localStorage.getItem('quantumchat_current_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          setCurrentUser(session.user);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    restoreSession();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('quantumchat_theme', JSON.stringify(next));
      return next;
    });
  };

  const handleLogin = (user, rememberMe = false) => {
    const sessionData = { user };
    localStorage.setItem('quantumchat_current_session', JSON.stringify(sessionData));
    if (rememberMe) {
       
    }
    setCurrentUser(user);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('quantumchat_current_session');
    setCurrentUser(null);
    setLoggedIn(false);
  };
  
  const handleResetComplete = () => {
    const resetStore = JSON.parse(localStorage.getItem('chatapp_password_resets') || '{}');
    if (resetInfo.token && resetStore[resetInfo.token]) {
        delete resetStore[resetInfo.token];
        localStorage.setItem('chatapp_password_resets', JSON.stringify(resetStore));
    }
    setResetInfo({ token: null, email: null });
    navigate('/login', { replace: true });
  };

  if (isLoadingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: darkMode ? '#1a1a1a' : '#ffffff' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  
  if (resetInfo.token && resetInfo.email) {
    return <ResetPasswordModal darkMode={darkMode} email={resetInfo.email} onComplete={handleResetComplete} />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          loggedIn ? 
          <Navigate to="/" replace /> : 
          <AnimatedAuthForm 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            onLogin={handleLogin} 
          />
        } 
      />
      <Route
        path="/"
        element={
          loggedIn ? 
          <WelcomePage user={currentUser} onLogout={handleLogout} /> : 
          <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to={loggedIn ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
