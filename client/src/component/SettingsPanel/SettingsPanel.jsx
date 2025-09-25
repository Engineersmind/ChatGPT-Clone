import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Archive,
  RotateCcw,
  Trash2,
  Calendar
} from "lucide-react";
import "./SettingsPanel.css";

const STORAGE_KEY = "chat_history_v1";

const SettingsPanel = ({
  isOpen = true,
  onClose = () => { },
  darkMode = false,
  theme = "system",
  setTheme = () => { },
  currentUser = { name: "John Doe", email: "john@example.com" },
  onSettingsChange = () => { },
  chats = undefined, // optional: if provided, will be used as source of truth
  onRestoreChat = undefined, // optional callback
  onPermanentlyDeleteChat = undefined // optional callback
}) => {
  function getDefaultSettings() {
    return {
      appearance: {
        theme: "system",
        fontSize: "medium",
        reduceMotion: false
      },
      customInstructions: {
        responseStyle: "",
        aboutYou: "",
        enabled: false
      },
      language: "en",
      privacy: {
        saveHistory: true,
        analytics: true,
        shareData: false
      },
      advanced: {
        codeHighlighting: true,
        streamResponses: true,
        showTimestamps: false
      }
    };
  }

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(
      `chatgpt_settings_${currentUser?.email || "default"}`
    );
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {
          appearance: {
            theme: theme || "system",
            fontSize: "medium",
            reduceMotion: false,
            ...parsed.appearance
          },
          customInstructions: {
            responseStyle: "",
            aboutYou: "",
            enabled: false,
            ...parsed.customInstructions
          },
          language: parsed.language || "en",
          privacy: {
            saveHistory: true,
            analytics: true,
            shareData: false,
            ...parsed.privacy
          },
          advanced: {
            codeHighlighting: true,
            streamResponses: true,
            showTimestamps: false,
            ...parsed.advanced
          }
        };
      } catch {
        return getDefaultSettings();
      }
    }
    return getDefaultSettings();
  });

  // Keep settings.appearance.theme in sync with incoming `theme` prop from parent
  useEffect(() => {
    setSettings((prev) => {
      const incoming = theme || "system";
      if (prev?.appearance?.theme === incoming) return prev;
      return { ...prev, appearance: { ...prev.appearance, theme: incoming } };
    });
  }, [theme]);

  const [expandedSections, setExpandedSections] = useState({
    appearance: true,
    customInstructions: false,
    language: false,
    privacy: false,
    advanced: false,
    archive: true
  });

  const [archivedChats, setArchivedChats] = useState([]);

  useEffect(() => {
    if (Array.isArray(chats) && chats.length > 0) {
      setArchivedChats(chats.filter((c) => c.archived));
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setArchivedChats(parsed.filter((c) => c.archived));
      } else {
        setArchivedChats([]);
      }
    } catch (err) {
      console.warn("Failed to read chats from storage:", err);
      setArchivedChats([]);
    }
  }, [chats]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleThemeChange = (newTheme) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme: newTheme }
    }));
    setTheme(newTheme);
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        `chatgpt_settings_${currentUser?.email || "default"}`,
        JSON.stringify(settings)
      );
      if (onSettingsChange) onSettingsChange(settings);
    } catch (error) {
      console.warn("Failed to save settings:", error);
    }
  }, [settings, currentUser?.email, onSettingsChange]);

  const saveChatsToStorage = (updatedChatsArray) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChatsArray));
    } catch (err) {
      console.warn("Failed to save chats to storage:", err);
    }
  };

  const handleRestoreChat = (chatId) => {
    if (typeof onRestoreChat === "function") {
      try { onRestoreChat(chatId); } catch (err) { console.warn(err); }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(parsed)
        ? parsed.map((c) => (c.id === chatId ? { ...c, archived: false } : c))
        : parsed;
      if (Array.isArray(updated)) {
        saveChatsToStorage(updated);
        setArchivedChats(updated.filter((c) => c.archived));
      }
    } catch (err) {
      console.warn("Failed to restore chat in storage:", err);
    }
  };

  const handleDeleteChat = (chatId) => {
    if (typeof onPermanentlyDeleteChat === "function") {
      try { onPermanentlyDeleteChat(chatId); } catch (err) { console.warn(err); }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(parsed) ? parsed.filter((c) => c.id !== chatId) : parsed;
      if (Array.isArray(updated)) {
        saveChatsToStorage(updated);
        setArchivedChats(updated.filter((c) => c.archived));
      }
    } catch (err) {
      console.warn("Failed to delete chat in storage:", err);
    }
  };

  const handleRestoreAll = () => {
    if (!window.confirm("Restore all archived chats? They will appear in your chat list again.")) return;
    if (typeof onRestoreChat === "function") {
      archivedChats.forEach((c) => {
        try { onRestoreChat(c.id); } catch (err) { console.warn(err); }
      });
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(parsed)
        ? parsed.map((c) => (c.archived ? { ...c, archived: false } : c))
        : parsed;
      if (Array.isArray(updated)) {
        saveChatsToStorage(updated);
        setArchivedChats([]); // none archived anymore
      }
    } catch (err) {
      console.warn("Failed to restore all in storage:", err);
    }
  };

  const handleDeleteAll = () => {
    if (!window.confirm("Permanently delete all archived chats? This action cannot be undone.")) return;
    if (typeof onPermanentlyDeleteChat === "function") {
      archivedChats.forEach((c) => {
        try { onPermanentlyDeleteChat(c.id); } catch (err) { console.warn(err); }
      });
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(parsed) ? parsed.filter((c) => !c.archived) : parsed;
      if (Array.isArray(updated)) {
        saveChatsToStorage(updated);
        setArchivedChats([]);
      }
    } catch (err) {
      console.warn("Failed to delete all archived in storage:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className={`settings-container ${darkMode ? "dark" : ""}`}
        onClick={(e) => e.stopPropagation()}
        data-theme={settings.appearance.theme}
      >
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Appearance */}
          <div className={`settings-section ${expandedSections.appearance ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('appearance')}>
              <div className="section-title">
                <h3>Appearance</h3>
                <span className="section-description">Customize how QuantumChat looks</span>
              </div>
              <div className="section-toggle">
                {expandedSections.appearance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expandedSections.appearance && (
              <div className="section-content">
                <div className="setting-group">
                  <div className="setting-label">
                    <h4>Theme</h4>
                    <p>Choose how QuantumChat looks to you</p>
                  </div>
                  <div className="theme-buttons">
                    <button
                      className={`btn ${settings.appearance.theme === 'light' ? 'primary' : 'secondary'}`}
                      onClick={() => handleThemeChange('light')}
                      style={{
                        backgroundColor: settings.appearance.theme === 'light' ? '#007bff' : '#6c757d',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        marginRight: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Light
                    </button>
                    <button
                      className={`btn ${settings.appearance.theme === 'dark' ? 'primary' : 'secondary'}`}
                      onClick={() => handleThemeChange('dark')}
                      style={{
                        backgroundColor: settings.appearance.theme === 'dark' ? '#007bff' : '#6c757d',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        marginRight: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Dark
                    </button>
                   
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Instructions */}
          <div className={`settings-section ${expandedSections.customInstructions ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('customInstructions')}>
              <div className="section-title">
                <h3>Custom instructions</h3>
                <span className="section-description">Customize QuantumChat's responses</span>
              </div>
              <div className="section-toggle">
                {expandedSections.customInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expandedSections.customInstructions && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Enable custom instructions</h4>
                    <p>QuantumChat will consider your custom instructions for every conversation</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.customInstructions.enabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, customInstructions: { ...prev.customInstructions, enabled: e.target.checked } }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {settings.customInstructions.enabled && (
                  <>
                    <div className="setting-group">
                      <label className="input-label">What would you like QuantumChat to know about you to provide better responses?</label>
                      <textarea
                        value={settings.customInstructions.aboutYou}
                        onChange={(e) => setSettings(prev => ({ ...prev, customInstructions: { ...prev.customInstructions, aboutYou: e.target.value } }))}
                        placeholder="e.g., I'm a software developer working on web applications..."
                        rows={3}
                        className="settings-textarea"
                      />
                    </div>

                    <div className="setting-group">
                      <label className="input-label">How would you like QuantumChat to respond?</label>
                      <textarea
                        value={settings.customInstructions.responseStyle}
                        onChange={(e) => setSettings(prev => ({ ...prev, customInstructions: { ...prev.customInstructions, responseStyle: e.target.value } }))}
                        placeholder="e.g., Be concise and provide code examples when relevant..."
                        rows={3}
                        className="settings-textarea"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Data Controls */}
          <div className={`settings-section ${expandedSections.privacy ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('privacy')}>
              <div className="section-title">
                <h3>Data controls</h3>
                <span className="section-description">Manage your data and privacy</span>
              </div>
              <div className="section-toggle">
                {expandedSections.privacy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expandedSections.privacy && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Chat history & training</h4>
                    <p>Save new chats on this browser to appear in your history and improve our models</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.privacy.saveHistory}
                      onChange={(e) => setSettings(prev => ({ ...prev, privacy: { ...prev.privacy, saveHistory: e.target.checked } }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Improve the model for everyone</h4>
                    <p>Allow your conversations to be used to improve our models</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.privacy.analytics}
                      onChange={(e) => setSettings(prev => ({ ...prev, privacy: { ...prev.privacy, analytics: e.target.checked } }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Archived Chats */}
          <div className={`settings-section ${expandedSections.archive ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('archive')}>
              <div className="section-title">
                <h3>Archived Chats</h3>
                <span className="section-description">Manage your archived conversations</span>
              </div>
              <div className="section-toggle">
                {expandedSections.archive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expandedSections.archive && (
              <div className="section-content">
                <div className="archive-stats">
                  <div className="stat-item">
                    <Archive size={16} />
                    <span>{archivedChats.length} archived chats</span>
                  </div>
                </div>

                <div className="archived-chats-list">
                  {archivedChats.length === 0 ? (
                    <div className="empty-archive">
                      <Archive size={24} className="empty-icon" />
                      <p>No archived chats</p>
                      <small>Archived conversations will appear here</small>
                    </div>
                  ) : (
                    archivedChats
                      .sort((a, b) => new Date(b.archivedAt || b.createdAt) - new Date(a.archivedAt || a.createdAt))
                      .map((chat) => (
                        <div key={chat.id} className="archived-chat-item">
                          <div className="chat-info">
                            <div className="chat-title-archive">{chat.title || "Untitled Chat"}</div>
                            <div className="chat-meta">
                              <Calendar size={12} />
                              <span>
                                Archived {chat.archivedAt ? new Date(chat.archivedAt).toLocaleDateString() : 'recently'}
                              </span>
                            </div>
                          </div>
                          <div className="chat-actions">
                            <button
                              className="btn-icon restore"
                              onClick={() => handleRestoreChat(chat.id)}
                              title="Restore chat"
                              aria-label="Restore chat"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => {
                                if (window.confirm('Permanently delete this chat? This action cannot be undone.')) {
                                  handleDeleteChat(chat.id);
                                }
                              }}
                              title="Delete permanently"
                              aria-label="Delete chat permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {archivedChats.length > 0 && (
                  <div className="archive-actions">
                    <button
                      className="btn secondary"
                      onClick={handleRestoreAll}
                      style={{ color: '#0d6efd' }} // unique blue text, always visible
                    >
                      <RotateCcw size={14} /> Restore All
                    </button>

                    <button
                      className="btn danger"
                      onClick={handleDeleteAll}
                      style={{ color: '#dc3545' }} // unique red text, always visible
                    >
                      <Trash2 size={14} /> Delete All
                    </button>

                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced */}
          <div className={`settings-section ${expandedSections.advanced ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('advanced')}>
              <div className="section-title">
                <h3>Advanced</h3>
                <span className="section-description">Advanced features and settings</span>
              </div>
              <div className="section-toggle">
                {expandedSections.advanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expandedSections.advanced && (
              <div className="section-content">
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Code highlighting</h4>
                    <p>Enable syntax highlighting for code blocks</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.advanced.codeHighlighting}
                      onChange={(e) => setSettings(prev => ({ ...prev, advanced: { ...prev.advanced, codeHighlighting: e.target.checked } }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h4>Stream responses</h4>
                    <p>Show responses as they're being generated</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.advanced.streamResponses}
                      onChange={(e) => setSettings(prev => ({ ...prev, advanced: { ...prev.advanced, streamResponses: e.target.checked } }))}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <div className="settings-version">QuantumChat v1.0.0</div>
          <div className="settings-links">
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#help">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
