import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sun,
  Moon,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  X,
  ArrowDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import gptIcon from "../assets/gpt-clone-icon.png";
import MarkdownMessage from "./MarkdownMessage";

export default function ChatArea({
  darkMode,
  toggleDarkMode,
  sidebarCollapsed,
  messages = [],
  message,
  setMessage,
  onSendMessage,
  isLoading = false,
  onCancelStream,
  chatTitle,
  activeChatId, // optional prop; if not provided overlay still works
  onNewChat,
}) {
  const [copiedStates, setCopiedStates] = useState({});
  const [likedStates, setLikedStates] = useState({});
  const [dislikedStates, setDislikedStates] = useState({});
  const [speakingStates, setSpeakingStates] = useState({});
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false); // ✅ updated
  const [isScrollable, setIsScrollable] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const stripMarkdown = (text) =>
    text
      .replace(/[*_~`#>+-]/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1");

  //---- Clipboard ----//
  const copyToClipboard = async (text, msgId) => {
    try {
      const cleanText = stripMarkdown(text);
      await navigator.clipboard.writeText(cleanText);
      setCopiedStates((prev) => ({ ...prev, [msgId]: true }));
      setTimeout(
        () => setCopiedStates((prev) => ({ ...prev, [msgId]: false })),
        2000
      );
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const toggleLike = (msgId) => {
    setLikedStates((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
    if (dislikedStates[msgId]) {
      setDislikedStates((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const toggleDislike = (msgId) => {
    setDislikedStates((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
    if (likedStates[msgId]) {
      setLikedStates((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleShare = (msgText) => {
    const shareData = { title: "ChatClone Message", text: msgText };
    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.error("Share failed:", err));
    } else {
      navigator.clipboard
        .writeText(msgText)
        .then(() => alert("Message copied for sharing"));
    }
  };

  //---- Text-to-Speech ----//
  const handleReadAloud = (msgId, msgText) => {

    if (speakingStates[msgId]) {

      synthRef.current.cancel();

      setSpeakingStates((prev) => ({ ...prev, [msgId]: false }));

      return;

    }

    const utterance = new SpeechSynthesisUtterance(stripMarkdown(msgText));

    utterance.onend = () => {

      setSpeakingStates((prev) => ({ ...prev, [msgId]: false }));

    };

    synthRef.current.cancel();

    synthRef.current.speak(utterance);

    setSpeakingStates((prev) => ({ ...prev, [msgId]: true }));

  };

  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      synth?.cancel();
    };
  }, []);


  const handleSuggestedClick = (text) => onSendMessage(text);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onSendMessage(editText);
    }
    setEditingMsgId(null);
    setEditText("");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollHeight, scrollTop, clientHeight } = scrollContainerRef.current;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      setIsScrollable(scrollHeight > clientHeight + 5);
      setShowScrollDown(distanceFromBottom > 100); // ✅ hide completely when near bottom
    };
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
    }
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sidebarWidth = sidebarCollapsed ? 60 : 280;

  return (
    <div
      className="flex-grow-1 d-flex flex-column"
      style={{
        marginLeft: sidebarWidth,
        transition: "margin-left 0.3s ease-in-out",
        width: "100%",
        position: "relative",
        height: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        className={`d-flex align-items-center p-3 shadow border-bottom ${darkMode ? "bg-dark border-dark" : "bg-white"
          }`}
        style={{ width: "100%" }}
      >
        <div
          style={{
            width: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {sidebarCollapsed && (
            <>
              <img
                src={gptIcon}
                alt="ChatClone Logo"
                onClick={onNewChat}
                style={{ width: "24px", height: "24px" , cursor: 'pointer'}}
              />
              <h2
                className="h5 fw-bold mb-0 text-success"
                style={{ marginLeft: 8 }}
              >
                QuantumChat
              </h2>
            </>
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {!sidebarCollapsed && chatTitle && (
            <h2
              className="h5 fw-bold mb-0"
              style={{
                fontWeight: "600",
                color: "#2189dd",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {chatTitle}
            </h2>
          )}
        </div>
        <div
          style={{
            width: 160,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={toggleDarkMode}
            className={`btn rounded-3 ${darkMode ? "btn-outline-light" : "btn-outline-secondary"
              }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Input Centered for New Chat */}
      {messages.length === 0 ? (
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            padding: '0 16px',
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: 'column',
              gap: 16,
              width: "70%",
              minWidth: 300,
              maxWidth: 760,
              justifyContent: "center",
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: 560 }}>
              <h1 style={{
                fontSize: '1.9rem',
                margin: 0,
                fontWeight: 600,
                background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                Hello, how can I help you?
              </h1>
              <p style={{
                marginTop: 10,
                marginBottom: 0,
                fontSize: 15,
                lineHeight: 1.5,
                color: darkMode ? '#a1a1aa' : '#4b5563'
              }}>
                Ask me anything – debugging code, generating ideas, refining prompts, or exploring a new topic. Just start typing below.
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center w-100" style={{ position: 'relative', maxWidth: 760 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  key={(activeChatId || 'new') + '-top'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      if (message.trim()) {
                        onSendMessage(message);
                      }
                    }
                  }}
                  disabled={isLoading}
                  className={`form-control rounded-3 ${darkMode ? "bg-dark text-white border-secondary" : ""}`}
                  style={{ width: "100%", paddingLeft: 12, caretColor: darkMode ? '#fff' : '#111' }}
                  autoFocus
                  autoComplete="off"
                />
                {!message && !isLoading && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 18,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      fontSize: 14,
                      userSelect: 'none'
                    }}
                  >Type your message...</span>
                )}
              </div>
              <button
                onClick={() => {
                  if (!isLoading && message.trim()) onSendMessage(message);
                }}
                disabled={!message.trim() || isLoading}
                className="btn text-white rounded-3"
                style={{
                  background:
                    !message.trim() || isLoading
                      ? "#6c757d"
                      : "linear-gradient(to right, #3b82f6, #8b5cf6)",
                  border: "none",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages List */}
          <div
            ref={scrollContainerRef}
            className="flex-grow-1 overflow-auto p-4"
            style={{ backgroundColor: darkMode ? "#2a2a2a" : "#fff" }}
          >
            {messages.map((msg, i) => {
              const msgId = `msg-${i}`;
              const isAssistant = msg.role !== "user";
              const suggested = isAssistant ? msg.suggested || [] : [];
              return (
                <div
                  key={i}
                  className={`p-3 rounded-4 shadow-sm mb-3 ${msg.role === "user"
                    ? "ms-auto"
                    : msg.isError
                      ? "bg-danger bg-opacity-10 border border-danger"
                      : ""
                    }`}
                  style={{
                    maxWidth: "80%",
                    background: msg.isError
                      ? (darkMode ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)')
                      : msg.role === 'user'
                        ? (darkMode ? '#2d3b46' : '#ffffff')
                        : (darkMode ? '#232b33' : '#f5f7fa'),
                    color: darkMode ? (msg.role === 'user' ? '#f1f5f9' : '#e2e8f0') : '#1f2937',
                    border: '1px solid',
                    borderColor: msg.isError
                      ? (darkMode ? '#b91c1c' : '#ef4444')
                      : msg.role === 'user'
                        ? (darkMode ? '#3c4954' : '#e2e8f0')
                        : (darkMode ? '#313c46' : '#e3e8ee'),
                    boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.08)'
                  }}
                >
                  <div className="fw-medium">
                    {editingMsgId === msgId ? (
                      <div className="d-flex gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="form-control form-control-sm"
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="btn btn-sm btn-success"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMsgId(null);
                            setEditText("");
                          }}
                          className="btn btn-sm btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isAssistant ? (
                      <MarkdownMessage darkMode={darkMode}>
                        {msg.text}
                      </MarkdownMessage>
                    ) : (
                      msg.text
                    )}
                    {msg.isStreaming && <span className="typing-cursor">|</span>}
                  </div>
                  <div
                    className={`small mt-1 ${darkMode ? 'text-white-50' : 'text-black-50'}`}
                    style={{ letterSpacing: '.25px', opacity: 0.8 }}
                  >
                    {msg.time}
                    {msg.isError ? " • Error" : ""}
                    {msg.isStreaming ? " • Typing..." : ""}
                  </div>
                  {isAssistant && !msg.isStreaming && (
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => copyToClipboard(msg.text, msgId)}
                        className={`btn btn-sm ${darkMode ? "btn-outline-light" : "btn-outline-secondary"
                          }`}
                      >
                        {copiedStates[msgId] ? "Copied!" : <Copy size={14} />}
                      </button>



                      <button
                        onClick={() => toggleLike(msgId)}
                        className={`btn btn-sm ${likedStates[msgId]
                          ? "btn-primary"
                          : darkMode
                            ? "btn-outline-light"
                            : "btn-outline-secondary"
                          }`}
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => toggleDislike(msgId)}
                        className={`btn btn-sm ${dislikedStates[msgId]
                          ? "btn-danger"
                          : darkMode
                            ? "btn-outline-light"
                            : "btn-outline-secondary"
                          }`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                      <button
                        onClick={() => handleShare(msg.text)}
                        className={`btn btn-sm ${darkMode ? "btn-outline-light" : "btn-outline-secondary"
                          }`}
                      >
                        <Send size={14} />
                      </button>

                      <button
                        onClick={() => handleReadAloud(msgId, msg.text)}
                        className={`btn btn-sm ${darkMode ? "btn-outline-light" : "btn-outline-secondary"
                          }`}
                      >
                        {speakingStates[msgId] ? (
                          <VolumeX size={14} />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>



                    </div>
                  )}
                  {/* {msg.role === "user" && editingMsgId !== msgId && (
                    <div className="d-flex mt-2">
                      <button
                        onClick={() => {
                          setEditingMsgId(msgId);
                          setEditText(msg.text);
                        }}
                        className={`btn btn-sm ${darkMode ? "btn-outline-light" : "btn-outline-light"
                          }`}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>
                  )} */}
                  {isAssistant && suggested.length > 0 && (
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {suggested.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedClick(s)}
                          className="btn btn-sm btn-outline-primary"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/*  Down Arrow only if scrollable and NOT at bottom will be impalement */}
{messages.length > 0 && isScrollable && showScrollDown && (
            <button
              onClick={scrollToBottom}
              className={`btn rounded-circle shadow ${darkMode ? "btn-light text-dark" : "btn-dark text-white"
                }`}
              style={{
                position: "fixed",
                bottom: "70px",
                left: `calc(${sidebarCollapsed ? "60px" : "280px"} + (100% - ${sidebarCollapsed ? "60px" : "280px"
                  })/2)`,
                transform: "translateX(-50%)",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <ArrowDown size={20} />
            </button>
          )}



          {/* Input at bottom */}
          <div
            className={`p-3 border-top ${darkMode ? "bg-dark border-dark" : "bg-white"
              }`}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "70%", minWidth: 300, maxWidth: 800 }}>
              <div className="d-flex gap-2 align-items-center" style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    key={(activeChatId || 'new') + '-bottom'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        if (message.trim()) {
                          onSendMessage(message);
                        }
                      }
                    }}
                    disabled={isLoading}
                    className={`form-control rounded-3 ${darkMode ? "bg-dark text-white border-secondary" : ""}`}
                    style={{ width: "100%", paddingLeft: 12, caretColor: darkMode ? '#fff' : '#111' }}
                    autoFocus
                    autoComplete="off"
                  />
                  {!message && !isLoading && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 18,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: darkMode ? '#9ca3af' : '#6b7280',
                        fontSize: 14,
                        userSelect: 'none'
                      }}
                    >Type your message...</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <button
                        onClick={onCancelStream}
                        className="btn btn-sm btn-danger"
                        style={{
                          borderRadius: "50%",
                          padding: "9px",
                          marginLeft: "2px",
                        }}
                        title="Cancel"
                      >
                        <X size={24} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (!isLoading && message.trim()) onSendMessage(message);
                      }}
                      disabled={!message.trim() || isLoading}
                      className="btn text-white rounded-3"
                      style={{
                        background:
                          !message.trim() || isLoading
                            ? "#6c757d"
                            : "linear-gradient(to right, #3b82f6, #8b5cf6)",
                        border: "none",
                      }}
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <style>{`
        .typing-cursor { animation: blink 1s infinite; color: #6c757d; margin-left: 2px; }
        @keyframes blink { 0%,50%{opacity:1}51%,100%{opacity:0} }
      `}</style>
    </div>
  );
}