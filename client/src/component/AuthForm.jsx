import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import gptIcon from '../assets/gpt-clone-icon.png';
import SocialLoginModal from './SocialLoginModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ResetPasswordModal from './ResetPasswordModal';

export default function AuthForm({ darkMode, toggleDarkMode, onLogin }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetInfo, setResetInfo] = useState({ show: false, email: null, token: null });

  const [theme, setTheme] = useState(darkMode ? "dark" : "light"); // manage system/light/dark toggle

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log("URL Parameters:", params.toString());
    const emailParam = params.get('email');
    const tokenParam = params.get('reset_token');
    if (emailParam && tokenParam) {
      const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
      if (users.some(u => u.email === emailParam)) {
        setResetInfo({ show: true, email: emailParam, token: tokenParam });
      }
    }
  }, []);

  // --- NEW useEffect for persistent login ---
  useEffect(() => {
    const rememberedUser = localStorage.getItem('chatapp_remember_user');
    if (rememberedUser) {
      try {
        const user = JSON.parse(rememberedUser);
        const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
        const foundUser = users.find(u => u.id === user.id && u.email === user.email);

        if (foundUser) {
          onLogin(foundUser);
        } else {
          localStorage.removeItem('chatapp_remember_user');
        }
      } catch (e) {
        console.error("Error parsing remembered user from localStorage:", e);
        localStorage.removeItem('chatapp_remember_user');
      }
    }
  }, [onLogin]);

  // --- FULL BODY DARK/LIGHT MODE HANDLER ---
  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let shouldBeDark = darkMode;
    if (theme === "system") shouldBeDark = systemPrefersDark;
    else if (theme === "dark") shouldBeDark = true;
    else if (theme === "light") shouldBeDark = false;

    document.body.className = shouldBeDark ? "bg-dark text-white" : "bg-light text-dark";
  }, [theme, darkMode]);

  const handleResetComplete = () => {
    window.location.href = "/";
  };

  const [emailValid, setEmailValid] = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);

  const sendWelcomeEmail = (user) => {
    const templateParams = {
      username: user.name || user.username,
      to_email: user.email,
    };
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    emailjs.send(serviceId, templateId, templateParams, publicKey)
      .then(response => console.log('SUCCESS! Welcome email sent.', response.status, response.text))
      .catch(err => console.error('FAILED to send welcome email.', err));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    if (!email || !username || !password) { setError('❌ All fields are required.'); setIsLoading(false); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('❌ Please enter a valid email address.'); setIsLoading(false); return; }
    if (username.length < 3) { setError('❌ Username must be at least 3 characters long.'); setIsLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('❌ Username can only contain letters, numbers, and underscores.'); setIsLoading(false); return; }
    if (!agreeTerms) { setError('❌ Please agree to the Terms & Conditions.'); setIsLoading(false); return; }
    if (password.length < 6) { setError('❌ Password must be at least 6 characters long.'); setIsLoading(false); return; }
    const hasUpperCase = /[A-Z]/.test(password); const hasLowerCase = /[a-z]/.test(password); const hasNumbers = /\d/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) { setError('❌ Password must contain an uppercase letter, a lowercase letter, and a number.'); setIsLoading(false); return; }

    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    if (users.some(user => user.email === email)) { setError('❌ An account with this email already exists.'); setIsLoading(false); return; }

    const newUser = { id: Date.now(), email, username, password, createdAt: new Date().toISOString(), lastLogin: null, isActive: true, preferences: { theme: 'system', language: 'en', notifications: true } };
    users.push(newUser);
    localStorage.setItem('chatapp_users', JSON.stringify(users));
    sendWelcomeEmail(newUser);

    setSuccess('🎉 Account created successfully! Redirecting to login...');
    setIsLoading(false);
    setTimeout(() => { onLogin(newUser); }, 1500);

    setTimeout(() => {
      setIsLoginView(true);
      setSuccess('Welcome! Please log in with your new account.');
      setEmail('');
      setUsername('');
      setPassword('');
      setAgreeTerms(false);
      setTimeout(() => setSuccess(''), 3000);
    }, 2500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    if (!email || !password) { setError('❌ Email and password are required.'); setIsLoading(false); return; }
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const foundUser = users.find(user => user.email === email && user.password === password);

    if (foundUser) {
      foundUser.lastLogin = new Date().toISOString(); foundUser.isActive = true;
      const updatedUsers = users.map(user => user.id === foundUser.id ? foundUser : user);
      localStorage.setItem('chatapp_users', JSON.stringify(updatedUsers));
      if (rememberMe) {
        localStorage.setItem('chatapp_remember_user', JSON.stringify({ email: foundUser.email, id: foundUser.id }));
      } else {
        localStorage.removeItem('chatapp_remember_user');
      }
      setSuccess('✅ Login successful! Welcome back!');
      setTimeout(() => { onLogin(foundUser); }, 1500);
    } else {
      setError('❌ Invalid email or password. Please check your credentials.');
    }
    setIsLoading(false);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError('');
        setSuccess('Authenticating with Google...');
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userProfile = res.data;

        const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
        let existingUser = users.find(user => user.email === userProfile.email);
        let userToLogin;

        if (!existingUser) {
          setSuccess(`👋 Welcome, ${userProfile.name}! Creating your account...`);
          const newUser = {
            id: userProfile.sub,
            email: userProfile.email,
            name: userProfile.name,
            provider: 'Google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            preferences: { theme: 'system', language: 'en', notifications: true }
          };
          users.push(newUser);
          localStorage.setItem('chatapp_users', JSON.stringify(users));
          sendWelcomeEmail(newUser);
          userToLogin = newUser;
        } else {
          setSuccess(`✅ Welcome back, ${existingUser.name || existingUser.username}!`);
          existingUser.lastLogin = new Date().toISOString();
          localStorage.setItem('chatapp_users', JSON.stringify(users.map(u => u.id === existingUser.id ? existingUser : u)));
          userToLogin = existingUser;
        }
        if (rememberMe || !isLoginView) {
          localStorage.setItem('chatapp_remember_user', JSON.stringify({ email: userToLogin.email, id: userToLogin.id }));
        }

        setTimeout(() => {
          onLogin(userToLogin);
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        setError('❌ Google login failed. Please try again.');
        setSuccess('');
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('❌ Google login failed. Please try again.');
    },
  });

  const handleSocialLogin = (provider) => { setActiveProvider(provider); setIsModalOpen(true); };

  const handleSocialLoginSuccess = (provider) => {
    setIsModalOpen(false);
    setSuccess(`🎉 Successfully authenticated with ${provider}!`);
    const socialUser = { id: Date.now(), email: `user@${provider.toLowerCase()}.com`, username: `${provider} User`, provider, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), isActive: true, preferences: { theme: 'system', language: 'en', notifications: true } };
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    if (!users.some(u => u.provider === provider)) { users.push(socialUser); localStorage.setItem('chatapp_users', JSON.stringify(users)); }

    localStorage.setItem('chatapp_remember_user', JSON.stringify({ email: socialUser.email, id: socialUser.id }));

    setTimeout(() => { onLogin(socialUser); }, 1500);
  };

  const switchView = (view) => {
    setIsLoginView(view === 'login');
    setError(''); setSuccess(''); setEmail(''); setUsername(''); setPassword('');
    setAgreeTerms(false); setRememberMe(false); setEmailValid(null); setUsernameValid(null);
  };
  

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(re.test(email));
  };

  const validateUsername = (username) => {
    setUsernameValid(username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username));
  };

  // --- MODIFIED useEffect for pre-filling email if remembered ---
  useEffect(() => {
    const rememberedUser = localStorage.getItem('chatapp_remember_user');
    if (rememberedUser && isLoginView) {
      try {
        const user = JSON.parse(rememberedUser);
        setEmail(user.email);
        setRememberMe(true);
      } catch (e) {
        console.error("Error parsing remembered user for pre-fill:", e);
        localStorage.removeItem('chatapp_remember_user');
      }
    } else {
      setEmail('');
      setRememberMe(false);
    }
  }, [isLoginView]);

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++; if (password.length >= 8) score++; if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++; if (/\d/.test(password)) score++; if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (score < 3) return { score, label: 'Weak', color: '#dc3545' }; if (score < 5) return { score, label: 'Medium', color: '#ffc107' };
    return { score, label: 'Strong', color: '#28a745' };
  };

  const passwordStrength = getPasswordStrength(password);

  if (resetInfo.show) {
    return (
      <ResetPasswordModal
        darkMode={darkMode}
        email={resetInfo.email}
        onComplete={handleResetComplete}
      />
    );
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-center gradient-bg" style={{ minHeight: '100vh', padding: "20px", boxSizing: "border-box", overflow: 'hidden' }}>

        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center">
              <div className="text-center p-5">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                  <img src={gptIcon} alt="ChatClone Logo" style={{ width: '120px', height: '120px' }} className="mb-4" />
                  <h1 className="display-4 fw-bold mb-3" style={{ color: '#64748b' }}>QuantumChat</h1>
                  <p className="lead mb-4" style={{ color: '#64748b' }}>Enterprise-grade AI platform delivering intelligent conversational experiences.</p>
                </motion.div>
              </div>
            </div>
            <div className="col-lg-6 col-md-8 col-sm-10">
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`p-4 shadow-lg rounded-4 ${darkMode ? 'bg-dark text-white' : 'bg-white'}`}
                style={{
                  width: "100%",
                  maxWidth: '420px',
                  maxHeight: '92vh',
                  overflow: "hidden"
                }}
              >

                <div className="d-flex mb-4 rounded-3 p-1" style={{ backgroundColor: darkMode ? '#333' : '#f8f9fa' }}>
                  <button className={`btn flex-fill rounded-3 fw-semibold ${isLoginView ? 'btn-primary text-white' : (darkMode ? 'text-white' : 'text-dark')}`} style={{ background: isLoginView ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : 'none', border: 'none' }} onClick={() => switchView('login')}>LOG IN</button>
                  <button className={`btn flex-fill rounded-3 fw-semibold ${!isLoginView ? 'btn-primary text-white' : (darkMode ? 'text-white' : 'text-dark')}`} style={{ background: !isLoginView ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : 'none', border: 'none' }} onClick={() => switchView('signup')}>SIGN UP</button>
                </div>

                <AnimatePresence>
                  {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="alert alert-danger rounded-3 mb-3">{error}</motion.div>)}
                  {success && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="alert alert-success rounded-3 mb-3">{success}</motion.div>)}
                </AnimatePresence>

                <form onSubmit={isLoginView ? handleLogin : handleSignup}>
                  <div className="mb-3">
                    <input id="email" type="email"
                      className={`form-control form-control-lg rounded-3 ${darkMode ? 'bg-dark text-white border-secondary auth-input-dark' : ''}`}
                      placeholder="Enter your email address" value={email} onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                      required />
                  </div>

                  {!isLoginView && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3">
                      <input id="username" type="text"
                        className={`form-control form-control-lg rounded-3 ${darkMode ? 'bg-dark text-white border-secondary auth-input-dark' : ''}`}
                        placeholder="Choose a unique username" value={username} onChange={(e) => { setUsername(e.target.value); validateUsername(e.target.value); }}
                        required={!isLoginView} />
                    </motion.div>
                  )}

                  <div className="mb-3">
                    <div className="position-relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control form-control-lg rounded-3 pe-5 ${darkMode ? 'bg-dark text-white border-secondary auth-input-dark' : ''}`}
                        placeholder={isLoginView ? "Enter your password" : "Create a secure password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn position-absolute top-50 end-0 translate-middle-y"
                        style={{ border: 'none', background: 'transparent' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword
                          ? <EyeOff size={18} className="text-secondary" />
                          : <Eye size={18} className="text-secondary" />
                        }
                      </button>
                    </div>

                    {!isLoginView && password && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small>Password Strength:</small>
                          <small style={{ color: passwordStrength.color, fontWeight: 'bold' }}>{passwordStrength.label}</small>
                        </div>
                        <div className="progress" style={{ height: '4px' }}><div className="progress-bar" style={{ width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color, transition: 'all 0.3s ease' }} /></div>
                      </motion.div>
                    )}
                  </div>

                  {isLoginView ? (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="form-check"><input type="checkbox" className="form-check-input" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /><label className="form-check-label small" htmlFor="rememberMe">Remember Me</label></div>
                      <button type="button" className="btn btn-link small text-decoration-none p-0" onClick={() => setShowForgotPassword(true)}>Forgot Password?</button>
                    </div>
                  ) : (
                    <div className="mb-3 form-check"><input type="checkbox" className="form-check-input" id="agreeTerms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required /><label className="form-check-label small" htmlFor="agreeTerms">I agree to the <a href="#terms" className="text-decoration-none">Terms & Conditions</a></label></div>
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn text-white w-100 py-3 fw-bold rounded-3 mb-3" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }} disabled={isLoading}>
                    {isLoading && <div className="spinner-border spinner-border-sm me-2" role="status"></div>}
                    {isLoginView ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
                  </motion.button>
                </form>

                <div className="text-center my-3 position-relative"><hr /><span className={`px-3 position-absolute top-50 start-50 translate-middle ${darkMode ? 'bg-dark' : 'bg-white'}`}>or</span></div>

                <div className="d-flex justify-content-center gap-3 mb-4">
                  <button className={`btn d-flex align-items-center justify-content-center rounded-circle p-0 ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} style={{ width: '50px', height: '50px' }} onClick={loginWithGoogle} title="Continue with Google"><img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" style={{ width: '24px' }} /></button>
                  <button className={`btn d-flex align-items-center justify-content-center rounded-circle p-0 ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} style={{ width: '50px', height: '50px' }} onClick={() => handleSocialLogin('Microsoft')} title="Continue with Microsoft"><img src="https://www.vectorlogo.zone/logos/microsoft/microsoft-icon.svg" alt="Microsoft" style={{ width: '24px' }} /></button>
                  <button className={`btn d-flex align-items-center justify-content-center rounded-circle p-0 ${darkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`} style={{ width: '50px', height: '50px' }} onClick={() => handleSocialLogin('Apple')} title="Continue with Apple"><img src="https://www.vectorlogo.zone/logos/apple/apple-icon.svg" alt="Apple" style={{ width: '24px', filter: darkMode ? 'invert(1)' : 'none' }} /></button>
                </div>

                <div className="text-center"><span className="small">{isLoginView ? "Don't have an account? " : "Already have an account? "}<button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => switchView(isLoginView ? 'signup' : 'login')}>{isLoginView ? 'Sign Up' : 'Log In'}</button></span></div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && <SocialLoginModal provider={activeProvider} darkMode={darkMode} onClose={() => setIsModalOpen(false)} onSuccess={handleSocialLoginSuccess} />}
        {showForgotPassword && <ForgotPasswordModal darkMode={darkMode} onClose={() => setShowForgotPassword(false)} />}
      </AnimatePresence>
    </>
  );
}
