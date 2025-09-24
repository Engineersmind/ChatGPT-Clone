import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import './SocialLoginModal.css';
 
export default function ResetPasswordModal({ darkMode, email, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
 
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
 
    let users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const userIndex = users.findIndex(user => user.email === email);
 
    if (userIndex === -1) {
      setError('An error occurred. User not found.');
      setIsLoading(false);
      return;
    }
 
    // <<<< THIS IS THE FINAL, CORRECTED LOGIC >>>>
    // 1. Create a new, updated user object with the new password.
    const updatedUser = { ...users[userIndex], password: password };
 
    // 2. Create a new array of all users, replacing the old user with the updated one.
    const updatedUsers = users.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    );
 
    // 3. Save the NEW array with the corrected password back to localStorage.
    localStorage.setItem('chatapp_users', JSON.stringify(updatedUsers));
    // <<<< END OF FIX >>>>
 
    setSuccess('Password has been reset successfully! You will be redirected to the login page shortly.');
    setIsLoading(false);
 
    setTimeout(() => {
        onComplete();
    }, 3000);
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