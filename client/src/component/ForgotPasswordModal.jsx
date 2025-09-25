import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { X as CloseIcon, Mail } from 'lucide-react';

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
 
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const foundUser = users.find(user => user.email === email);
    console.log('Searching for user with email:', email);
    console.log('Users in storage:', users);
 
    if (foundUser) {
      console.log('Found user for password reset:', foundUser);
      
      // 1. Generate a unique and secure
      //  token for the reset link.
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // 2. Store the token with the user's email and an expiration time (e.g., 1 hour).
      const resetStore = JSON.parse(localStorage.getItem('chatapp_password_resets') || '{}');
      const expiry = Date.now() + 3600000; // 1 hour from now
      resetStore[token] = { email: foundUser.email, expiry };
      localStorage.setItem('chatapp_password_resets', JSON.stringify(resetStore));
      
      // 3. Construct the full reset URL that will be sent in the email.
      const resetLink = `${window.location.origin}/login?reset_token=${token}&email=${encodeURIComponent(foundUser.email)}`;
      
      // 4. Prepare the parameters for the EmailJS template.
      const templateParams = {
        username: foundUser.username || foundUser.email.split('@')[0],
        to_email: foundUser.email,
        reset_link: resetLink // This variable MUST match the one in your EmailJS template (e.g., {{reset_link}})
      };
 
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      // IMPORTANT: Ensure this is your FORGOT PASSWORD template ID, not the welcome email one.
      const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID; 
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
 
      // 5. Send the email using EmailJS.
      emailjs.send(serviceId, templateId, templateParams, publicKey)
        .then(() => {
          // Show success message and reset state
          setSuccess('If an account with that email exists, a password reset link has been sent.');
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('EmailJS Error:', err);
          // Still show a generic success message to the user for security.
          setSuccess('If an account with that email exists, a password reset link has been sent.');
          setIsLoading(false);
        });
    } else {
      // If the user is not found, we don't reveal that information.
      // We wait for a moment and show the same success message for security reasons (prevents user enumeration).
      setTimeout(() => {
        setSuccess('If an account with that email exists, a password reset link has been sent.');
        setIsLoading(false);
      }, 1500);
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
 
          <button onClick={onClose} className="btn btn-link btn-sm mt-3 text-muted">
             Back to Login
          </button>
        </div>
      </Motion.div>
    </div>
  );
}