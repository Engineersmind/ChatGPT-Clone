import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  currentUser,
  isLoading = false,
  onCancelStream,
  chatTitle,
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

  const stripMarkdown = (text) => {
    return text
      .replace(/(\*|_|~|`|#|>|-|\+|\[|\])/g, "")
      .replace(/\!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  };

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

    return () => synthRef.current.cancel();

  }, []);


  const handleSuggestedClick = (text) => onSendMessage(text);

  const handleSaveEdit = (msgId) => {
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
                style={{ width: "24px", height: "24px" }}
              />
              <h2
                className="h5 fw-bold mb-0 gradient-text"
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
          }}
        >
          <div
            style={{
              display: "flex",
              width: "70%",
              minWidth: 300,
              maxWidth: 800,
              justifyContent: "center",
            }}
          >
            <div className="d-flex gap-2 align-items-center w-100">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    if (message.trim()) {
                      onSendMessage(message);
                    }
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className={`form-control rounded-3 ${darkMode ? "bg-dark text-white border-secondary" : ""
                  }`}
                style={{ width: "100%" }}
                autoFocus
              />
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-3 rounded-4 shadow-sm mb-3 ${msg.role === "user"
                    ? "ms-auto text-white"
                    : msg.isError
                      ? "bg-danger bg-opacity-10 border border-danger"
                      : darkMode
                        ? "bg-dark text-white border border-secondary"
                        : "bg-light"
                    }`}
                  style={{
                    maxWidth: "80%",
                    background: darkMode ? "#666" : "#8e9296ff",
                    color: darkMode ? "#d42d2dff" : "#164048",
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
                          onClick={() => handleSaveEdit(msgId)}
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
                    className={`small mt-1 ${msg.role === "user"
                      ? "text-white-50"
                      : msg.isError
                        ? "text-danger"
                        : darkMode
                          ? "text-light opacity-75"
                          : "text-muted"
                      }`}
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
                  {msg.role === "user" && editingMsgId !== msgId && (
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
                  )}
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
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/*  Down Arrow only if scrollable and NOT at bottom will be impalement */}
{messages.length > 0 && isScrollable && showScrollDown && (
            <motion.button
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ArrowDown size={20} />
            </motion.button>
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
              <div className="d-flex gap-2 align-items-center">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      if (message.trim()) {
                        onSendMessage(message);
                      }
                    }
                  }}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className={`form-control rounded-3 ${darkMode ? "bg-dark text-white border-secondary" : ""
                    }`}
                  style={{ width: "100%" }}
                  autoFocus
                />
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