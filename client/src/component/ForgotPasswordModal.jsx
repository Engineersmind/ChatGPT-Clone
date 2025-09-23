import React, { useState } from 'react'; // THIS LINE IS NOW FIXED
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { X as CloseIcon, Mail } from 'lucide-react';
import './SocialLoginModal.css'; // We can reuse the same CSS for the overlay
 
export default function ForgotPasswordModal({ darkMode, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
   const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
 
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
 
    // To prevent security issues (user enumeration), we show a generic success message
    // whether the email exists or not. We only send the email if the user is found.
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const foundUser = users.find(user => user.email === email);
 
    if (foundUser) {
      // User exists, so we proceed to send the email
      const templateParams = {
        username: foundUser.username,
        to_email: foundUser.email,
      };
 
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
 
      emailjs.send(serviceId, templateId, templateParams, publicKey)
        .then(() => {
          setSuccess('If an account with that email exists, a password reset link has been sent.');
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('EmailJS Error:', err);
          // Still show success to the user, but log the error for debugging
          setSuccess('If an account with that email exists, a password reset link has been sent.');
          setIsLoading(false);
        });
    } else {
      // User does not exist, but we simulate a network delay and show the same message
      setTimeout(() => {
        setSuccess('If an account with that email exists, a password reset link has been sent.');
        setIsLoading(false);
      }, 1500);
    }
  };
 
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
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
          <p className="text-muted small mb-4">
            No worries! Enter your email and we'll send you a link to reset your password.
          </p>
 
          {error && <div className="alert alert-danger small p-2">{error}</div>}
          {success && <div className="alert alert-success small p-2">{success}</div>}
 
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="email"
                  className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`}
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
 
          <button onClick={onClose} className="btn btn-link btn-sm mt-3 text-muted">
             Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}