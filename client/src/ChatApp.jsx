import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./component/sidebar";
import ChatArea from "./component/ChatArea";
import axios from "axios";
import SettingsPanel from "./component/SettingsPanel/SettingsPanel";
import { generateGeminiStreamResponse, isGeminiConfigured } from "./services/geminiService";
import {
  fetchChats,
  createChat as createChatApi,
  appendMessages as appendMessagesApi,
  updateChat as updateChatApi,
  deleteChat as deleteChatApi,
} from "./services/chatService";
import UpgradePlan from "./component/UpgradePlan";
import HelpModal from "./component/Help";
import { useNavigate } from 'react-router-dom';

function titleFromText(text) {
  if (!text) return "Chat";
  const words = text.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const first = words.slice(0, 3).join(" ");
  const title = first.length ? first : text.slice(0, 15);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

const STORAGE_KEY = "chat_history_v1"; // legacy key kept for compatibility with cached state
const MAX_TITLE_LENGTH = 15; // constraint for chat titles

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const normalizeMessage = (message) => ({
  role: message?.role === "assistant" ? "assistant" : "user",
  text: typeof message?.text === "string" ? message.text : "",
  time:
    typeof message?.time === "string" && message.time.trim().length
      ? message.time
      : new Date().toISOString(),
  isStreaming: Boolean(message?.isStreaming) && !message?.isError ? true : false,
  isError: Boolean(message?.isError),
});

const normalizeChat = (chat) => {
  if (!chat) {
    return {
      id: undefined,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      archivedAt: null,
      messages: [],
    };
  }

  const id = chat._id || chat.id;

  return {
    id,
    title: chat.title || "New Chat",
    createdAt: chat.createdAt || new Date().toISOString(),
    updatedAt: chat.updatedAt || chat.createdAt || new Date().toISOString(),
    archived: Boolean(chat.archived),
    archivedAt: chat.archivedAt || null,
    messages: Array.isArray(chat.messages) ? chat.messages.map(normalizeMessage) : [],
  };
};

const sortChatsByRecency = (chats = []) =>
  [...chats].sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bDate - aDate;
  });


export default function ChatApp({ user, onLogout, initialShowSettings = false, initialShowUpgradePlan = false, initialShowHelp = false }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(initialShowSettings);
  const [showUpgradePlan, setShowUpgradePlan] = useState(initialShowUpgradePlan);
  const [showHelp, setShowHelp] = useState(initialShowHelp);
  // const [currentPlan, setCurrentPlan] = useState("Free Plan");

  const PLAN_STORAGE_KEY = "current_plan";
  const THEME_STORAGE_KEY = "chat_theme";

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "system";
    } catch {
      return "system";
    }
  });

  const [currentPlan, setCurrentPlan] = useState(() => {
    try {
      return localStorage.getItem(PLAN_STORAGE_KEY) || "Free";
    } catch {
      return "Free";
    }
  });

  useEffect(() => {
    localStorage.setItem(PLAN_STORAGE_KEY, currentPlan);
  }, [currentPlan]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || { name: "User" });
  const isStreamingCancelled = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  // Sync panel open state with URL paths (simple approach)
  useEffect(() => {
    if (initialShowSettings) setShowSettings(true);
    if (initialShowUpgradePlan) setShowUpgradePlan(true);
    if (initialShowHelp) setShowHelp(true);
  }, [initialShowSettings, initialShowUpgradePlan, initialShowHelp]);

  useEffect(() => {
    let isMounted = true;

   const loadChats = async () => {
  setLoadingChats(true);
  setLoadError(null);
  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.get("http://localhost:5000/api/chats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const normalizedChats = Array.isArray(response.data)
      ? response.data.map(normalizeChat)
      : [];
    setChats(sortChatsByRecency(normalizedChats));
  } catch (error) {
    console.error('Failed to load chats:', error);
    setLoadError(error.message || 'Failed to load chats.');
    setChats([]);
  } finally {
    setLoadingChats(false);
  }
};


    loadChats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatIdParam = params.get("chatId");

    if (!chatIdParam) {
      setActiveChatId(null);
      return;
    }

    const exists = chats.some((c) => c.id === chatIdParam);
    if (exists) {
      setActiveChatId(chatIdParam);
    } else if (!loadingChats) {
      params.delete("chatId");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        query ? `${window.location.pathname}?${query}` : window.location.pathname
      );
      setActiveChatId(null);
    }
  }, [chats, loadingChats]);


  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let shouldBeDark = theme === "system" ? systemPrefersDark : theme === "dark";
    if (theme === "light") {
      shouldBeDark = false;
    }
    if (shouldBeDark !== darkMode) {
      setDarkMode(shouldBeDark);
    }
    document.body.className = shouldBeDark ? "bg-dark text-white" : "bg-light text-dark";
  }, [theme, darkMode]);

  // Chat management
  const upsertChat = (chat) => {
    const normalized = normalizeChat(chat);
    setChats((prev) => {
      const exists = prev.some((c) => c.id === normalized.id);
      const updated = exists
        ? prev.map((c) => (c.id === normalized.id ? normalized : c))
        : [normalized, ...prev];
      return sortChatsByRecency(updated);
    });
  };

  const appendMessageToChat = (chatId, message) => {
    const normalizedMessage = normalizeMessage(message);
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== chatId) return c;
        const nextMessages = [...(c.messages || []), normalizedMessage];
        return {
          ...c,
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        };
      });
      return sortChatsByRecency(updated);
    });
  };

  const currentChat = chats.find((c) => c.id === activeChatId) || null;
  const currentMessages = currentChat ? currentChat.messages || [] : [];

  const handleRenameChat = async (chatId, newTitle) => {
    if (!newTitle) return;
    const trimmed = newTitle.trim().slice(0, MAX_TITLE_LENGTH);
    if (!trimmed) return;
    try {
      const updated = await updateChatApi(chatId, { title: trimmed });
      upsertChat(updated);
    } catch (error) {
      console.error('Failed to rename chat:', error);
      alert(error.response?.data?.message || 'Failed to rename chat.');
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChatApi(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        const params = new URLSearchParams(window.location.search);
        params.delete("chatId");
        const query = params.toString();
        window.history.replaceState(
          null,
          "",
          query ? `${window.location.pathname}?${query}` : window.location.pathname
        );
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert(error.response?.data?.message || 'Failed to delete chat.');
    }
  };

  const handleArchiveChat = async (chatId) => {
    try {
      const updated = await updateChatApi(chatId, { archived: true });
      upsertChat(updated);
    } catch (error) {
      console.error('Failed to archive chat:', error);
      alert(error.response?.data?.message || 'Failed to archive chat.');
    }
  };

  const handleRestoreChat = async (chatId) => {
    try {
      const updated = await updateChatApi(chatId, { archived: false });
      upsertChat(updated);
    } catch (error) {
      console.error('Failed to restore chat:', error);
      alert(error.response?.data?.message || 'Failed to restore chat.');
    }
  };

  const handleNewChat = () => {
    // Starting a fresh new chat (no messages yet) -> clear chatId param so refresh doesn't resurrect old chat
    setActiveChatId(null);
    setInput("");
    const params = new URLSearchParams(window.location.search);
    if (params.has("chatId")) {
      params.delete("chatId");
      const query = params.toString();
      window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setInput("");
    const params = new URLSearchParams(window.location.search);
    params.set("chatId", chatId);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    if (onLogout) {
      try {
        await onLogout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  const handleCancelStream = () => {
    isStreamingCancelled.current = true;
    setIsLoading(false);
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const msgs = (c.messages || []).map((m) =>
          m.isStreaming ? { ...m, isStreaming: false, text: (m.text || "") + " (Cancelled)" } : m
        );
        return { ...c, messages: msgs };
      })
    );
  };

  const handleSend = async (text) => {
    if (!text || !text.trim()) return;

    if (loadingChats) {
      alert('Chats are still loading. Please try again in a moment.');
      return;
    }

    const trimmed = text.trim();
    const userMsg = { role: "user", text: trimmed, time: nowTime() };

    setInput("");
    setIsLoading(true);
    isStreamingCancelled.current = false;

    let chatId = activeChatId;
    if (chatId && !chats.some((c) => c.id === chatId)) {
      chatId = null;
      setActiveChatId(null);
    }
    let chatAfterUser;

    try {
      if (!chatId) {
        const created = await createChatApi({
          title: titleFromText(trimmed),
          messages: [userMsg],
        });
        const normalized = normalizeChat(created);
        upsertChat(normalized);
        chatId = normalized.id;
        chatAfterUser = normalized;
        setActiveChatId(chatId);
        const params = new URLSearchParams(window.location.search);
        params.set("chatId", chatId);
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      } else {
        const updated = await appendMessagesApi(chatId, [userMsg]);
        const normalized = normalizeChat(updated);
        upsertChat(normalized);
        chatAfterUser = normalized;
      }
    } catch (error) {
      console.error('Failed to persist user message:', error);
      alert(error.response?.data?.message || 'Failed to save your message. Please try again.');
      setIsLoading(false);
      return;
    }

    if (!chatId) {
      setIsLoading(false);
      return;
    }

    if (!isGeminiConfigured()) {
      const fallback =
        "Gemini API not configured. Add your VITE_GEMINI_API_KEY to .env to get real responses.";
      const fallbackTime = nowTime();
      appendMessageToChat(chatId, {
        role: "assistant",
        text: fallback,
        time: fallbackTime,
        isStreaming: false,
      });
      setIsLoading(false);
      appendMessagesApi(chatId, [
        { role: "assistant", text: fallback, time: fallbackTime },
      ])
        .then((responseChat) => {
          const normalized = normalizeChat(responseChat);
          upsertChat(normalized);
        })
        .catch((persistError) => {
          console.error('Failed to save fallback assistant reply:', persistError);
        });
      return;
    }

    const assistantPlaceholder = {
      role: "assistant",
      text: "",
      time: nowTime(),
      isStreaming: true,
    };
    appendMessageToChat(chatId, assistantPlaceholder);

    const historyForGemini = chatAfterUser?.messages || [];

    try {
      let accumulated = "";
      const assistantTimestamp = nowTime();
      await generateGeminiStreamResponse(trimmed, historyForGemini, (chunk, isComplete, errorMessage) => {
        if (isStreamingCancelled.current) {
          setIsLoading(false);
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== chatId) return c;
              const msgs = (c.messages || []).map((m) =>
                m.isStreaming ? { ...m, isStreaming: false, text: (m.text || "") + " (Cancelled)" } : m
              );
              return { ...c, messages: msgs };
            })
          );
          return;
        }

        if (errorMessage) {
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== chatId) return c;
              const msgs = (c.messages || []).map((m) =>
                m.isStreaming
                  ? { ...m, text: `Error: ${errorMessage}`, isStreaming: false, isError: true }
                  : m
              );
              return { ...c, messages: msgs };
            })
          );
          setIsLoading(false);
          return;
        }

        if (chunk) {
          accumulated += chunk;
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== chatId) return c;
              const msgs = (c.messages || []).map((m) =>
                m.isStreaming ? { ...m, text: (m.text || "") + chunk } : m
              );
              return { ...c, messages: msgs };
            })
          );
        }

        if (isComplete) {
          const finalText = accumulated.trim();
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== chatId) return c;
              const msgs = (c.messages || []).map((m) =>
                m.isStreaming ? { ...m, text: finalText, isStreaming: false } : m
              );
              return { ...c, messages: msgs };
            })
          );
          setIsLoading(false);

          if (!finalText) {
            return;
          }

          appendMessagesApi(chatId, [
            { role: "assistant", text: finalText, time: assistantTimestamp },
          ])
            .then((responseChat) => {
              const normalized = normalizeChat(responseChat);
              upsertChat(normalized);
            })
            .catch((persistError) => {
              console.error('Failed to save assistant reply:', persistError);
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== chatId) return c;
                  const msgs = (c.messages || []).map((m) =>
                    !m.isStreaming && m.text === finalText
                      ? { ...m, isError: true, text: `${finalText}\n\n(Failed to save to server)` }
                      : m
                  );
                  return { ...c, messages: msgs };
                })
              );
            });
        }
      });
    } catch (err) {
      const errMsg = `Error: ${err.message || "Failed to fetch response."}`;
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const msgs = (c.messages || []).map((m) =>
            m.isStreaming ? { ...m, text: errMsg, isStreaming: false, isError: true } : m
          );
          return { ...c, messages: msgs };
        })
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`d-flex ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`}
      style={{ height: "100vh", overflow: "hidden" }}
    >
      {showHelp && (
  <HelpModal
    isOpen={showHelp}
    onClose={closeHelp}
    darkMode={darkMode}
  />
)}
      {showUpgradePlan ? (
        <UpgradePlan
          darkMode={darkMode}
          onClose={() => { setShowUpgradePlan(false); navigate('/'); }}
          onUpgradeSuccess={() => {
            setShowUpgradePlan(false);
            setCurrentPlan("Pro");
            navigate('/');
          }}
        />
      ) : (
        <>
          <Sidebar
            darkMode={darkMode}
            chats={chats}
            onNewChat={handleNewChat}
            onLogout={handleLogout}
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((s) => !s)}
            currentUser={currentUser}
            onSelectChat={handleSelectChat}
            activeChatId={activeChatId}
            onSettings={() => { setShowSettings(true); navigate('/settings'); }}
            onRename={handleRenameChat}
            onDelete={handleDeleteChat}
            onArchive={handleArchiveChat}
            onShowUpgradePlan={() => { setShowUpgradePlan(true); navigate('/upgrade'); }}
            onHelp={() => { setShowHelp(true); navigate('/help'); }}
            currentPlan={currentPlan}

          />
          {loadError && (
            <div
              className="alert alert-danger"
              role="alert"
              style={{ position: "fixed", top: 16, right: 16, zIndex: 1200 }}
            >
              {loadError}
            </div>
          )}
          <ChatArea
            darkMode={darkMode}
            toggleDarkMode={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            sidebarCollapsed={sidebarCollapsed}
            messages={currentMessages}
            message={input}
            setMessage={setInput}
            onSendMessage={handleSend}
            isLoading={isLoading || loadingChats}
            onCancelStream={handleCancelStream}
            chatTitle={currentChat?.title}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
          />
          <SettingsPanel
            chats={chats}
            onRestoreChat={handleRestoreChat}
            onPermanentlyDeleteChat={handleDeleteChat}
            isOpen={showSettings}
            onClose={() => { setShowSettings(false); navigate('/'); }}
            theme={theme}
            setTheme={(t) => setTheme(t)}
          />
          <HelpModal
            darkMode={darkMode}
            isOpen={showHelp}
            onClose={() => { setShowHelp(false); navigate('/'); }}
          />
        </>
      )}
    </div>
  );
}
