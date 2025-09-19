import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, User, Mail, Lock, Eye, EyeOff, X as CloseIcon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import quantumIcon from '../assets/quantum-chat-icon.png';
import SocialLoginModal from './SocialLoginModal';
import '../styles/animatedAuth.css';

const googleLogo = "https://www.vectorlogo.zone/logos/google/google-icon.svg";
const microsoftLogo = "https://www.vectorlogo.zone/logos/microsoft/microsoft-icon.svg";

const AnimatedAuthForm = ({ darkMode, toggleDarkMode, onLogin }) => {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ visible: false, message: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('auth-container');
      if (container) container.classList.add('sign-in');
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const toggle = () => {
    setError('');
    setSuccess('');
    const container = document.getElementById('auth-container');
    if (container) {
      container.classList.add('transitioning');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        container.classList.toggle('sign-in');
        container.classList.toggle('sign-up');
        setIsSignIn(!isSignIn);
        setTimeout(() => container.classList.remove('transitioning'), 1000);
      }, 300);
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
      const foundUser = users.find(user => user.email === email && user.password === password);
      if (foundUser) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          onLogin(foundUser, rememberMe);
          try { navigate('/', { replace: true }); } catch (e) { console.error(e); }
        }, 1000);
      } else {
        setError('Invalid credentials. Please try again.');
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service');
      setIsLoading(false);
      return;
    }
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
      if (users.some(user => user.email === email)) {
        setError('An account with this email already exists');
        setIsLoading(false);
        return;
      }
      const newUser = {
        id: Date.now(),
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
        preferences: {
          theme: darkMode ? 'dark' : 'light',
          language: 'en',
          notifications: true
        }
      };
      users.push(newUser);
      localStorage.setItem('chatapp_users', JSON.stringify(users));
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        if (serviceId && templateId && publicKey) {
          emailjs.send(serviceId, templateId, { username: newUser.username, to_email: newUser.email }, publicKey);
        }
      } catch (emailError) { console.error("EmailJS Error:", emailError) }
      setSuccess('Account created successfully!');
      setTimeout(() => {
        toggle();
        setEmail(email);
        setPassword('');
        setSuccess('Please sign in with your new account');
      }, 1500);
      setIsLoading(false);
    }, 1500);
  };

  const handleSocialLogin = (provider) => {
    setActiveProvider(provider);
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSocialLoginSuccess = (provider, user) => {
    setIsModalOpen(false);
    setSuccess(`Successfully authenticated with ${provider}!`);
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const existingUser = users.find(u => u.email === user.email);
    let userToLogin = existingUser;

    if (!existingUser) {
        users.push(user);
        localStorage.setItem('chatapp_users', JSON.stringify(users));
        userToLogin = user;
    } else {
        existingUser.lastLogin = new Date().toISOString();
        localStorage.setItem('chatapp_users', JSON.stringify(users.map(u => u.id === existingUser.id ? existingUser : u)));
    }
    
    setTimeout(() => {
      onLogin(userToLogin, true);
      try { navigate('/', { replace: true }); } catch (e) { console.error(e); }
    }, 1500);
  };
  
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError('');
        setSuccess('Authenticating with Google...');
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const profile = res.data;
        const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
        let existing = users.find(u => u.email === profile.email);
        let userToLogin;
        if (!existing) {
          const newUser = {
            id: profile.sub || Date.now(),
            email: profile.email,
            username: profile.name || profile.email.split('@')[0],
            provider: 'Google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            preferences: { theme: 'system', language: 'en', notifications: true }
          };
          users.push(newUser);
          localStorage.setItem('chatapp_users', JSON.stringify(users));
          userToLogin = newUser;
        } else {
          existing.lastLogin = new Date().toISOString();
          localStorage.setItem('chatapp_users', JSON.stringify(users.map(u => u.id === existing.id ? existing : u)));
          userToLogin = existing;
        }
        setTimeout(() => {
          onLogin(userToLogin, true);
          try { navigate('/', { replace: true }); } catch (e) { console.error(e); }
        }, 800);
      } catch (err) {
        setError('Google login failed. Please try again.');
        setSuccess('');
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    }
  });

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!forgotPasswordEmail) { 
      setToast({ visible: true, message: 'Please enter your email address.' });
      setIsLoading(false);
      return; 
    }

    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const foundUser = users.find(u => u.email === forgotPasswordEmail);

    if (foundUser) {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetStore = JSON.parse(localStorage.getItem('chatapp_password_resets') || '{}');
      
      const expiry = Date.now() + 3600000;
      resetStore[token] = { email: foundUser.email, expiry };
      localStorage.setItem('chatapp_password_resets', JSON.stringify(resetStore));
      
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          const resetLink = `${window.location.origin}/login?reset_token=${token}`;
          const templateParams = {
              username: foundUser.username || foundUser.email.split('@')[0],
              to_email: foundUser.email,
              reset_link: resetLink
          };

          emailjs.send(serviceId, templateId, templateParams, publicKey);
        }
      } catch (e) {
          console.error("Failed to send password reset email:", e);
      }
    }
    
    setToast({ visible: true, message: 'If an account with that email exists, a reset link has been sent.' });

    setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setIsLoading(false);
    }, 2000);
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      {toast.visible && (
        <div className="toast-notification">
          {toast.message} 
        </div>
      )}

      <div className="theme-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div id="auth-container" className="container">
        <div className="row">
          {/* SIGN UP */}
          <div className="col align-items-center flex-col sign-up">
            <div className="form-wrapper align-items-center">
              <div className="form sign-up">
                <div className="logo-mobile">
                  <img src={quantumIcon} alt="QuantumChat Logo" className="highlighted-icon" />
                  <h3>QuantumChat</h3>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSignUp}>
                  <div className="input-group">
                    <User size={18} />
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Mail size={18} />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="input-group">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                 <div className="terms-checkbox">
  <input
    type="checkbox"
    id="agreeTerms"
    checked={agreeTerms}
    onChange={e => setAgreeTerms(e.target.checked)}
  />
  <label htmlFor="agreeTerms">
    I agree to the{" "}
    <a
      href="https://policies.google.com/terms"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", color: "blue" }}
    >
      Terms of Service
    </a>
  </label>
</div>

                  <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign up'}
                  </button>
                </form>
                <p>
                  <span>Already have an account?</span>
                  <b onClick={toggle} className="pointer">Sign in here</b>
                </p>
                <div className="social-login-divider"><span>or sign up with</span></div>
                <div className="social-login-buttons">
                  <button className="social-btn" type="button" onClick={() => googleLogin()} aria-label="Sign up with Google">
                    <img src={googleLogo} alt="Google" style={{ width: '18px', height: '18px' }} />
                  </button>
                  <button className="social-btn" type="button" onClick={() => handleSocialLogin('Microsoft')} aria-label="Sign up with Microsoft">
                    <img src={microsoftLogo} alt="Microsoft" style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* SIGN IN */}
          <div className="col align-items-center flex-col sign-in">
            <div className="form-wrapper align-items-center">
              <div className="form sign-in">
                <div className="logo-mobile">
                  <img src={quantumIcon} alt="QuantumChat Logo" className="highlighted-icon" />
                  <h3>QuantumChat</h3>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSignIn}>
                  <div className="input-group">
                    <Mail size={18} />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="extra-options">
                    <div className="remember-me">
                      <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}/>
                      <label htmlFor="rememberMe">Remember Me</label>
                    </div>
                    <div className="forgot-password">
                      <button type="button" className="btn btn-link p-0" onClick={() => setShowForgotPassword(true)}>
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign in'}
                  </button>
                </form>
                <p>
                  <span>Don't have an account?</span>
                  <b onClick={toggle} className="pointer">Sign up here</b>
                </p>
                <div className="social-login-divider"><span>or continue with</span></div>
                <div className="social-login-buttons">
                  <button className="social-btn" type="button" onClick={() => googleLogin()} aria-label="Sign in with Google">
                     <img src={googleLogo} alt="Google" style={{ width: '18px', height: '18px' }} />
                  </button>
                  <button className="social-btn" type="button" onClick={() => handleSocialLogin('Microsoft')} aria-label="Sign in with Microsoft">
                     <img src={microsoftLogo} alt="Microsoft" style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* CONTENT SECTION */}
        <div className="row content-row">
          <div className="col align-items-center flex-col">
            <div className="text sign-in">
              <h2>QuantumChat</h2>
              <p>Experience AI-powered conversations at quantum speed</p>
            </div>
            <div className="img sign-in"><img src={quantumIcon} alt="QuantumChat Logo" className="content-icon" /></div>
          </div>
          <div className="col align-items-center flex-col mobile-hidden">
            <div className="img sign-up"><img src={quantumIcon} alt="QuantumChat Logo" className="content-icon" /></div>
            <div className="text sign-up">
              <h2>Join QuantumChat</h2>
              <p>Unlock the future of AI-powered conversations</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div 
            className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`}
            onClick={e => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setShowForgotPassword(false)}>
                <CloseIcon size={22} />
            </button>
            <div>
              <h5 className="fw-bold">Forgot Password</h5>
              <p className="small text-muted">Enter your email and we'll send a reset link.</p>
              
              <form onSubmit={handleForgotSubmit} className="mt-4">
                <div className="mb-3">
                  <input 
                    type="email" 
                    className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`}
                    placeholder="Enter your registered email" 
                    value={forgotPasswordEmail} 
                    onChange={e => setForgotPasswordEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForgotPassword(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <SocialLoginModal
          provider={activeProvider}
          darkMode={darkMode}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSocialLoginSuccess}
        />
      )}
    </div>
  );
};

export default AnimatedAuthForm;