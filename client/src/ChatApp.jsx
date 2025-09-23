import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./component/sidebar";
import ChatArea from "./component/ChatArea";
import SettingsPanel from "./component/SettingsPanel/SettingsPanel";
import { generateGeminiStreamResponse, isGeminiConfigured } from "./services/geminiService";
import UpgradePlan from "./component/UpgradePlan";
import HelpModal from "./component/Help";
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = "chat_history_v1";

function titleFromText(text) {
  if (!text) return "Chat";
  const words = text.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const first = words.slice(0, 3).join(" ");
  const title = first.length ? first : text.slice(0, 15);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


export default function ChatApp({ user, onLogout, initialShowSettings = false, initialShowUpgradePlan = false, initialShowHelp = false }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(initialShowSettings);
  const [showUpgradePlan, setShowUpgradePlan] = useState(initialShowUpgradePlan);
  const [showHelp, setShowHelp] = useState(initialShowHelp);
  // const [currentPlan, setCurrentPlan] = useState("Free Plan");

  const PLAN_STORAGE_KEY = "current_plan";
  const THEME_STORAGE_KEY = "chat_theme"; // new key for theme persistence

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

  const [chats, setChats] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setChats(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.warn("Failed to parse chat history:", e);
        setChats([]);
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatIdParam = params.get("chatId");
    if (chatIdParam) setActiveChatId(chatIdParam);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let shouldBeDark = darkMode;
    if (theme === "system") shouldBeDark = systemPrefersDark;
    else if (theme === "dark") shouldBeDark = true;
    else if (theme === "light") shouldBeDark = false;
    setDarkMode(shouldBeDark);
    document.body.className = shouldBeDark ? "bg-dark text-white" : "bg-light text-dark";
  }, [theme]);

  // Chat management
  const upsertChat = (newChat) => {
    setChats((prev) => {
      const found = prev.find((c) => c.id === newChat.id);
      if (found) return prev.map((c) => (c.id === newChat.id ? newChat : c));
      else return [newChat, ...prev];
    });
  };

  const appendMessageToChat = (chatId, message) => {
    setChats((prev) =>
      prev.map((c) => (c.id !== chatId ? c : { ...c, messages: [...(c.messages || []), message] }))
    );
  };

  const currentChat = chats.find((c) => c.id === activeChatId) || null;
  const currentMessages = currentChat ? currentChat.messages || [] : [];

  const handleRenameChat = (chatId, newTitle) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)));
  };

  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const handleArchiveChat = (chatId) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, archived: true, archivedAt: new Date().toISOString() } : c
      )
    );
  };

  const handleRestoreChat = (chatId) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, archived: false, archivedAt: null } : c))
    );
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput("");
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setInput("");
    const params = new URLSearchParams(window.location.search);
    params.set("chatId", chatId);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    onLogout && onLogout();
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
    const trimmed = text.trim();
    const userMsg = { role: "user", text: trimmed, time: nowTime() };
    let chatId = activeChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat = {
        id: chatId,
        title: titleFromText(trimmed),
        createdAt: new Date().toISOString(),
        messages: [userMsg],
      };
      upsertChat(newChat);
      setActiveChatId(chatId);
      const params = new URLSearchParams(window.location.search);
      params.set("chatId", chatId);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    } else {
      appendMessageToChat(chatId, userMsg);
    }

    setInput("");
    setIsLoading(true);

    const assistantPlaceholder = {
      role: "assistant",
      text: "",
      time: nowTime(),
      isStreaming: true,
    };
    appendMessageToChat(chatId, assistantPlaceholder);

    const recentMessages = [
      ...(chats.find((c) => c.id === chatId)?.messages || []),
      userMsg,
    ];

    isStreamingCancelled.current = false;

    try {
      if (!isGeminiConfigured()) {
        const fallback =
          "Gemini API not configured. Add your VITE_GEMINI_API_KEY to .env to get real responses.";
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            const msgs = c.messages
              ? c.messages.map((m) =>
                m.isStreaming ? { ...m, text: fallback, isStreaming: false } : m
              )
              : [{ role: "assistant", text: fallback, time: nowTime() }];
            return { ...c, messages: msgs };
          })
        );
        setIsLoading(false);
        return;
      }

      let accumulated = "";
      await generateGeminiStreamResponse(trimmed, recentMessages, (chunk, isComplete, errorMessage) => {
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

        if (isComplete) {
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== chatId) return c;
              const msgs = (c.messages || []).map((m) =>
                m.isStreaming ? { ...m, text: accumulated.trim(), isStreaming: false } : m
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
      style={{ height: "100vh", overflow: "hidden", backgroundColor: "#C9D6DF" }}
    >
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
          <ChatArea
            darkMode={darkMode}
            toggleDarkMode={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            sidebarCollapsed={sidebarCollapsed}
            messages={currentMessages}
            message={input}
            setMessage={setInput}
            onSendMessage={handleSend}
            currentUser={currentUser}
            isLoading={isLoading}
            onCancelStream={handleCancelStream}
            chatTitle={currentChat?.title}
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
