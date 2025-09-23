import React from 'react';

export default function HelpModal({ darkMode, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className={`p-4 rounded-3 shadow ${darkMode ? 'bg-dark text-white' : 'bg-white text-dark'}`}
        style={{ width: '480px', maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Help & Support</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>×</button>
        </div>
        <p className="mb-2">Welcome to QuantumChat! Here's a quick guide:</p>
        <ul className="small mb-3">
          <li>Create a new conversation with the <strong>New Chat</strong> button.</li>
          <li>Switch between chats from the sidebar list.</li>
          <li>Access <strong>Settings</strong> to manage theme & archived chats.</li>
          <li>Upgrade your plan anytime via the <strong>Upgrade</strong> option.</li>
          <li>Need to resume where you left? Login persistence uses your local browser storage.</li>
        </ul>
        <p className="small text-muted mb-1">Support: <a href="mailto:support@quantumchat.com">support@quantumchat.com</a></p>
        <p className="small text-muted">Version: 1.0.0</p>
        <div className="text-end">
          <button onClick={onClose} className="btn btn-primary btn-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
