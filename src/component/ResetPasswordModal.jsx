import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';

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
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    
    let users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const userIndex = users.findIndex(user => user.email === email);

    if (userIndex === -1) {
      setError('An error occurred. User not found.');
      setIsLoading(false);
      return;
    }

    const updatedUser = { ...users[userIndex], password: password };
    const updatedUsers = users.map(user => 
      user.email === email ? updatedUser : user
    );

    localStorage.setItem('chatapp_users', JSON.stringify(updatedUsers));
    
    setSuccess('Password has been reset successfully! You will be redirected to the login page shortly.');
    
    setTimeout(() => {
        setIsLoading(false);
        onComplete();
    }, 2500);
  };

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`}
      > 
    
        <div className="text-center">
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
      </motion.div>
    </div>
  );
}