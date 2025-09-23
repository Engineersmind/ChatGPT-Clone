
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X as CloseIcon, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import emailjs from '@emailjs/browser'; 

const microsoftLogo = "https://www.vectorlogo.zone/logos/microsoft/microsoft-icon.svg";

// const sendWelcomeEmail = (user) => {
//   const templateParams = {
//     username: user.name || user.username,
//     to_email: user.email,
//   };
//   const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
//   const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
//   const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

//   if (serviceId && templateId && publicKey) {
//     emailjs.send(serviceId, templateId, templateParams, publicKey)
//       .then(response => console.log('SUCCESS! Welcome email sent.', response.status, response.text))
//       .catch(err => console.error('FAILED to send welcome email.', err));
//   }
// };

export default function SocialLoginModal({ provider, darkMode, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setIsLoading(false);
    setStep(1);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
  }, [provider]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (provider === 'Microsoft') {
      if (step === 1) {
        setTimeout(() => {
          setStep(2);
          setIsLoading(false);
        }, 500);
        return;
      }

      if (step === 2) {
        const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
        const existingUser = users.find(user => user.email === email);

        if (existingUser) {
          if (existingUser.password === password) {
            existingUser.lastLogin = new Date().toISOString();
            localStorage.setItem('chatapp_users', JSON.stringify(users.map(u => u.id === existingUser.id ? existingUser : u)));
  
            onSuccess(provider, existingUser);
          } else {
            setError('The password you entered is incorrect.');
            setIsLoading(false);
          }
        } else {
          const newUser = {
            id: Date.now(),
            email,
            username: email.split('@')[0],
            password,
            provider,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          users.push(newUser);
          localStorage.setItem('chatapp_users', JSON.stringify(users));
          sendWelcomeEmail(newUser);
         
          onSuccess(provider, newUser); 
        }
      }
    } else {
        setIsLoading(false);
        setError('Login provider is not supported.');
    }
  };

  const renderMicrosoftForm = () => (
    <div className="p-4 text-start">
      <img src={microsoftLogo} alt="Microsoft Logo" className="auth-provider-logo mb-3" />
      {error && <div className="alert alert-danger small p-2 mb-3">{error}</div>}
      {step === 1 && (
        <>
          <h5 className="fw-bold">Sign in</h5>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="Email, phone, or Skype" required />
            </div>
            <p className="text-muted small">No account? <a href="https://signup.live.com/" target="_blank" rel="noopener noreferrer" className={`dummy-link ${darkMode ? 'dark' : ''}`}>Create one!</a></p>
            <div className="text-end">
              <button type="submit" className="btn btn-primary px-4" disabled={isLoading || !email}>{isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Next'}</button>
            </div>
          </form>
        </>
      )}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="d-flex align-items-center mb-3">
            <Mail size={16} className="me-2 text-muted" />
            <span className="small">{email}</span>
          </div>
          <h5 className="fw-bold">Enter password</h5>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="position-relative mb-3">
              <Lock size={16} className="position-absolute top-50 translate-middle-y ms-3 text-muted" style={{ zIndex: 5 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`form-control ps-5 pe-5 ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`}
                placeholder="Password"
                required
              />
              <button type="button" className="btn position-absolute top-50 end-0 translate-middle-y" style={{ border: 'none', background: 'transparent', zIndex: 5 }} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} className="text-secondary" /> : <Eye size={18} className="text-secondary" />}
              </button>
            </div>
            <div className="text-end mt-3">
              <button type="submit" className="btn btn-primary px-4" disabled={isLoading || !password}>{isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}Sign in</button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (provider) {
      case 'Microsoft':
        return renderMicrosoftForm();
      default:
        return <div className="p-4">Provider not recognized.</div>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={`modal-close-btn ${darkMode ? 'text-light' : 'text-dark'}`}><CloseIcon size={24} /></button>
        {renderContent()}
      </motion.div>
    </div>
  );
}
