import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Plus,
  X,
  Menu,
  Search,
  Book,
  Zap,
  Grid3X3,
  Folder,
  User,
  ArrowUp,
  Settings,
  HelpCircle,
  Crown
} from 'lucide-react';
import gptIcon from '../assets/gpt-clone-icon.png';
import ChatActionsDropdown from './ChatActionsDropdown';

export default function Sidebar({
  darkMode,
  chats = [],
  onNewChat,
  onLogout,
  isCollapsed,
  onToggle,
  currentUser,
  onSelectChat,
  activeChatId,
  onSettings,
  onRename,
  onArchive,
  onDelete,
  onShowUpgradePlan,
  onHelp,
  currentPlan
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats);
  const [openDropdownChatId, setOpenDropdownChatId] = useState(null);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const prevChatsLength = useRef(chats.length);
  const userMenuRef = useRef(null); // ✅ ref for outside click

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChats(chats);
    } else {
      setFilteredChats(
        chats.filter((chat) =>
          chat.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, chats]);

  useEffect(() => {
    if (scrollContainerRef.current && chats.length > prevChatsLength.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    prevChatsLength.current = chats.length;
  }, [chats]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingChatId]);

  // ✅ Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const shouldShowFull = !isCollapsed;
  const sidebarWidth = shouldShowFull ? '280px' : '60px';

  const navButtonStyle = {
    background: 'none',
    border: 'none',
    transition: 'background-color 0.2s',
    width: '100%',
    textAlign: 'start',
    padding: '6px 12px',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  };

  const handleHover = (e) => {
    e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
  };
  const handleLeave = (e) => {
    e.target.style.backgroundColor = 'transparent';
  };

  return (
   <div
  className={`d-flex flex-column shadow ${darkMode ? 'text-white' : 'bg-white text-dark'}`}
  style={{
    backgroundColor: darkMode ? '#1E2022' : '#ffffff', // ✅ Correct background
    width: sidebarWidth,
    borderRight: `1px solid ${darkMode ? '#333' : 'var(--bs-border-color)'}`,
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000, // ✅ ensure it overlays body
    transition: 'width 0.3s ease-in-out',
  }}
>

      {/* Header */}
      <div
        className={`d-flex align-items-center justify-content-between p-3 ${darkMode ? 'border-bottom border-dark' : 'border-bottom'}`}
        style={{ minHeight: '60px' }}
      >
        {shouldShowFull ? (
          <>
            <div className="d-flex align-items-center gap-2">
              <img onClick={onNewChat} src={gptIcon} alt="ChatClone Logo" style={{ width: '24px', height: '24px', cursor: 'pointer' }} />
              <h2 onClick={onNewChat} className="h5 fw-bold mb-0 text-success" style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>
                QuantumChat
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="btn btn-sm"
              style={{ background: 'none', border: 'none', color: darkMode ? 'white' : 'black' }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="btn btn-sm mx-auto"
            style={{ background: 'none', border: 'none', color: darkMode ? 'white' : 'black' }}
            title="Expand Sidebar"
          >
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div
        className="d-flex flex-column flex-grow-1"
        style={{ minHeight: 0, overflowY: 'auto' }}
        ref={scrollContainerRef}
      >
        {/* Expanded: New Chat & Search */}
        {shouldShowFull && (
          <div className="p-3 border-bottom">
            <button
              onClick={onNewChat}
              className="btn text-white w-100 mb-3 rounded-3 d-flex align-items-center justify-content-center gap-2"
              style={{ background: 'linear-gradient(to right, #3b82f6, #827e8aff)', border: 'none' }}
            >
              <Plus size={16} /> New Chat
            </button>

            <button
              onClick={() => setShowSearchModal(true)}
              className={`btn w-100 mb-3 rounded-3 d-flex align-items-center gap-2 ${darkMode ? 'text-white' : 'text-dark'}`}
              style={{ background: 'none', border: 'none' }}
              onMouseEnter={handleHover}
              onMouseLeave={handleLeave}
            >
              <Search size={16} /> Search Chats
            </button>
          </div>
        )}

        {/* Collapsed: New Chat, Search, Library */}
        {!shouldShowFull && (
          <div className="p-2">
            <button
              onClick={onNewChat}
              className="btn text-white w-100 mb-3 rounded-3 d-flex justify-content-center"
              style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }}
              title="New Chat"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowSearchModal(true)}
              className={`btn w-100 mb-3 rounded-3 d-flex justify-content-center ${darkMode ? 'text-white' : 'text-dark'}`}
              style={{ background: 'none', border: 'none' }}
              title="Search Chats"
            >
              <Search size={16} />
            </button>
           
          </div>
        )}

        
        {/* Recent Chats */}
        {shouldShowFull && (
          <div className="flex-grow-1 d-flex flex-column p-3">
            <h6 className={darkMode ? 'text-light' : 'text-muted'}>Recent Chats</h6>
            <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {chats.filter((c) => !c.archived).length === 0 ? (
                <small className={darkMode ? 'text-light' : 'text-muted'}>No chats found</small>
              ) : (
                chats
                  .filter((c) => !c.archived)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      onClick={(e) => {
                        if (renamingChatId) return; // prevent navigation while renaming
                        onSelectChat(chat.id);
                      }}
                      className={`p-2 rounded-3 mb-2 d-flex justify-content-between align-items-center ${activeChatId === chat.id ? 'bg-primary text-white' : ''}`}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: activeChatId === chat.id ? '#0d6efd' : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (activeChatId !== chat.id) {
                          e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f1f1f1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeChatId !== chat.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1 }}>
                        {renamingChatId === chat.id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            maxLength={60}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmed = renameValue.trim();
                                if (trimmed) {
                                  onRename && onRename(chat.id, trimmed);
                                }
                                setRenamingChatId(null);
                                setRenameValue("");
                              } else if (e.key === 'Escape') {
                                setRenamingChatId(null);
                                setRenameValue("");
                              }
                            }}
                            onBlur={() => {
                              const trimmed = renameValue.trim();
                              if (trimmed) {
                                onRename && onRename(chat.id, trimmed);
                              }
                              setRenamingChatId(null);
                              setRenameValue("");
                            }}
                            className={`form-control form-control-sm ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                            style={{ minWidth: 0 }}
                            placeholder="Rename chat"
                          />
                        ) : (
                          chat.title
                        )}
                      </span>
                      <div style={{ position: 'relative', zIndex: 1000 }}>
                        <ChatActionsDropdown
                          chat={chat}
                          darkMode={darkMode}
                          onRename={onRename}
                          onRequestRename={() => {
                            setRenamingChatId(chat.id);
                            setRenameValue(chat.title || "");
                          }}
                          onArchive={onArchive}
                          onDelete={onDelete}
                          openDropdownChatId={openDropdownChatId}
                          setOpenDropdownChatId={setOpenDropdownChatId}
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className={`p-4 rounded-3 shadow ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}
            style={{ width: '400px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5>Search Chats</h5>
            <input
              type="text"
              className="form-control mt-2 mb-3"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              {filteredChats
                .filter((c) => !c.archived)
                .map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id);
                      setShowSearchModal(false);
                    }}
                    className="p-2 rounded-3 mb-2"
                    style={{
                      cursor: 'pointer',
                      backgroundColor:
                        activeChatId === chat.id
                          ? '#0d6efd'
                          : darkMode
                            ? '#2a2a2a'
                            : '#efefefff',
                      color:
                        activeChatId === chat.id
                          ? 'white'
                          : darkMode
                            ? 'white'
                            : 'black',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (activeChatId !== chat.id) {
                        e.currentTarget.style.backgroundColor = darkMode
                          ? '#3a3a3a'
                          : '#ececec';
                      }
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (activeChatId !== chat.id) {
                        e.currentTarget.style.backgroundColor = darkMode
                          ? '#2a2a2a'
                          : '#ffffffff';
                      }
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {chat.title}
                  </div>
                ))}

            </div>
          </div>
        </div>
      )}

      {/* User Info (pinned to bottom) */}
      <div
        className={`${shouldShowFull ? 'p-3 border-top' : 'p-2'} mt-auto`}
        style={{ position: 'sticky', bottom: 0, zIndex: 1000, background: darkMode ? '#111' : '#fff' }}
        ref={userMenuRef} // ✅ wrap user menu for outside click
      >
        {shouldShowFull ? (
          <>
            <div className="d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="d-flex align-items-center gap-2">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center ${darkMode ? 'bg-dark border border-secondary' : 'bg-light'}`}
                  style={{ width: '32px', height: '32px' }}
                >
                  <User size={16} />
                </div>
                <div className="d-flex align-items-center gap-2">
<div className="fw-semibold small">
  {(currentUser?.name || currentUser?.username || "User").split(" ")[0]}
</div>
                  {currentPlan === "Free" && (
                    <small className={darkMode ? 'text-success' : 'text-muted'}>
                      {currentPlan} Plan
                    </small>
                  )}

                  {currentPlan === "Pro" && (
                    <span
                      className="badge bg-warning d-flex align-items-center"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <small className={darkMode ? 'text-light' : 'text-muted'}>{currentPlan}</small>
                      <Crown size={12} style={{ marginLeft: 4, color: '#92400e' }} />
                    </span>
                  )}
                </div>


              </div>
            </div>

            {showUserMenu && (
              <div
                className={`position-absolute bottom-100 w-100 mb-2 rounded-3 shadow ${darkMode ? 'bg-dark border border-secondary' : 'bg-white border'}`}
                style={{ left: '12px', right: '12px', zIndex: 1000 }}
                onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
              >
                <div className="p-2">
                  {currentPlan !== "Pro" && (
                    <button
                      className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                      style={{ background: 'none', border: 'none' }}
                      onClick={() => {
                        setShowUserMenu(false);
                        onShowUpgradePlan && onShowUpgradePlan();
                      }}
                    >
                      <ArrowUp size={14} className="me-2" /> Upgrade Plan
                    </button>
                  )}

                  <button
                    className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => {
                      setShowUserMenu(false);
                      onSettings && onSettings();
                    }}
                  >
                    <Settings size={14} className="me-2" /> Settings
                  </button>
                  <button
                    className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => {
                      setShowUserMenu(false);
                      onHelp && onHelp();
                    }}
                  >
                    <HelpCircle size={14} className="me-2" /> Help
                  </button>
                  <button
                    onClick={onLogout}
                    className="btn btn-outline-danger w-100 text-start"
                    style={{ border: 'none' }}
                  >
                    <LogOut size={14} className="me-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <button
              className={`btn w-100 rounded-3 d-flex justify-content-center ${darkMode ? 'text-white' : 'text-dark'}`}
              style={{ background: 'none', border: 'none' }}
              title="Account"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User size={16} />
            </button>
            {showUserMenu && (
              <div
                className={`shadow ${darkMode ? 'bg-dark border border-secondary' : 'bg-white border'}`}
                style={{
                  position: "absolute",
                  bottom: "60px",
                  left: "50%",
                  transform: "translateX(-10%)",
                  minWidth: "180px",
                  zIndex: 2000
                }}
                onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
              >
                <div className="p-2">
                  {currentPlan !== "Pro" && (
                    <button
                      className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                      style={{ background: 'none', border: 'none' }}
                      onClick={() => {
                        setShowUserMenu(false);
                        onShowUpgradePlan && onShowUpgradePlan();
                      }}
                    >
                      <ArrowUp size={14} className="me-2" /> Upgrade Plan
                    </button>
                  )}

                  <button
                    className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => {
                      setShowUserMenu(false);
                      onSettings && onSettings();
                    }}
                  >
                    <Settings size={14} className="me-2" /> Settings
                  </button>
                  <button
                    className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => {
                      setShowUserMenu(false);
                      onHelp && onHelp();
                    }}
                  >
                    <HelpCircle size={14} className="me-2" /> Help
                  </button>
                  <button onClick={onLogout} className="btn btn-outline-danger w-100 text-start" style={{ border: 'none' }}>
                    <LogOut size={14} className="me-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
