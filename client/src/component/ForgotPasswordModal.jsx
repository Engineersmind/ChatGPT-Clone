import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { X as CloseIcon, Mail } from 'lucide-react';
import { requestPasswordReset } from '../services/authService';

export default function ForgotPasswordModal({ darkMode, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset({ email: email.trim() });
      setSuccess('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      console.error('Password reset request failed:', err);
      const message = err?.response?.data?.message || 'Unable to send password reset email right now. Please try again later.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <Motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`}
        style={{ maxWidth: '450px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={`modal-close-btn ${darkMode ? 'text-light' : 'text-dark'}`}>
          <CloseIcon size={24} />
        </button>
        <div className="p-5 text-center">
          <Mail size={48} className="mb-3 text-primary" />
          <h4 className="fw-bold">Forgot Password?</h4>
          <p className={`small mb-4 ${darkMode ? 'text-light' : 'text-muted'}`}>
            No worries! Enter your email and we'll send you a link to reset your password.
          </p>
 
          {error && <div className="alert alert-danger small p-2">{error}</div>}
          {success && <div className="alert alert-success small p-2">{success}</div>}
 
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="email"
                  className={`form-control ${darkMode ? 'text-white border-secondary' : ''}`}
                  style={darkMode ? { 
                    backgroundColor: '#2a2a2a', 
                    color: '#ffffff',
                    borderColor: '#6c757d'
                  } : {}}
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }}
                disabled={isLoading}
              >
                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Send Reset Link'}
              </button>
            </form>
          )}
 
          <button onClick={onClose} className={`btn btn-link btn-sm mt-3 ${darkMode ? 'text-light' : 'text-muted'}`}>
             Back to Login
          </button>
        </div>
      </Motion.div>
    </div>
  );
}