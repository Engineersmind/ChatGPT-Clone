import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import './SocialLoginModal.css';
import axios from 'axios';
 
export default function ResetPasswordModal({ darkMode, email, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
  // import axios from 'axios';

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setIsLoading(true);

  if (password !== confirmPassword) {
    setError("Passwords don't match.");
    setIsLoading(false);
    return;
  }

  try {
    // Get token and email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset_token');
    const emailFromUrl = urlParams.get('email')?.trim().toLowerCase(); // normalize

    console.log('DEBUG FRONTEND: token from URL =', token);
    console.log('DEBUG FRONTEND: email from URL =', emailFromUrl);

    if (!token || !emailFromUrl) {
      setError('Invalid or expired password reset link.');
      setIsLoading(false);
      return;
    }

    const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
      email: emailFromUrl,
      token,           // send as "token"
      newPassword: password,
    });

    console.log('DEBUG FRONTEND: response.data =', response.data);

    setSuccess('Your password has been reset successfully!');
    onComplete && onComplete(); // optional callback
  } catch (err) {
    console.error('DEBUG FRONTEND ERROR:', err.response?.data || err);
    setError(err.response?.data?.message || 'Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};



 
  return (
    <div className="modal-overlay">
      <Motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`}
        style={{ maxWidth: '450px' }}
      >
        <div className="p-5 text-center">
          <Lock size={48} className="mb-3 text-primary" />
          <h4 className="fw-bold">Create New Password</h4>
          <p className="text-muted small mb-4">
            Enter a new password for the account associated with <strong className={darkMode ? 'text-white' : 'text-dark'}>{email}</strong>.
          </p>
 
          {error && <div className="alert alert-danger small p-2">{error}</div>}
          {success && <div className="alert alert-success small p-2">{success}</div>}
 
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="position-relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                 <button type="button" className="btn position-absolute top-50 end-0 translate-middle-y me-2 text-muted" style={{ background: 'none', border: 'none' }} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
               <div className="position-relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }}
                disabled={isLoading}
              >
                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </Motion.div>
    </div>
  );
}