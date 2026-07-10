import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./AIAssistant.css";

const AI_OPEN_STORAGE_KEY = "tourismhub_ai_assistant_open";
const AI_MESSAGES_STORAGE_KEY = "tourismhub_ai_assistant_messages";

const defaultMessages = [
  {
    sender: "assistant",
    text: "Hi! I am your TourismHub LK AI Assistant. Ask me about hotels, events, trip planning, or Sri Lankan tourism.",
  },
];

const getStoredOpenState = () => {
  try {
    return sessionStorage.getItem(AI_OPEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const getStoredMessages = () => {
  try {
    const storedMessages = sessionStorage.getItem(AI_MESSAGES_STORAGE_KEY);

    if (!storedMessages) {
      return defaultMessages;
    }

    const parsedMessages = JSON.parse(storedMessages);

    if (!Array.isArray(parsedMessages) || parsedMessages.length === 0) {
      return defaultMessages;
    }

    return parsedMessages;
  } catch {
    return defaultMessages;
  }
};

function TraditionalBotIcon({ className = "" }) {
  return (
    <svg
      className={`ai-traditional-bot ${className}`}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Traditional AI bot"
    >
      <circle className="ai-bot-bg" cx="48" cy="48" r="44" />
      <circle className="ai-bot-ring" cx="48" cy="48" r="39" />
      <circle className="ai-bot-inner-soft" cx="48" cy="48" r="34" />

      <path
        className="ai-bot-halo"
        d="M24 30c7-13 41-13 48 0-5-5-13-8-24-8s-19 3-24 8Z"
      />
      <path
        className="ai-bot-crown"
        d="M30 31l5-12 7 10 6-13 6 13 7-10 5 12c-11-5-25-5-36 0Z"
      />
      <path className="ai-bot-crown-band" d="M31 31h34v7H31z" />
      <circle className="ai-bot-gem" cx="48" cy="29" r="3" />
      <circle className="ai-bot-gem" cx="38" cy="32" r="2" />
      <circle className="ai-bot-gem" cx="58" cy="32" r="2" />

      <rect className="ai-bot-ear" x="19" y="43" width="12" height="18" rx="6" />
      <rect className="ai-bot-ear" x="65" y="43" width="12" height="18" rx="6" />
      <circle className="ai-bot-ear-dot" cx="25" cy="52" r="3" />
      <circle className="ai-bot-ear-dot" cx="71" cy="52" r="3" />

      <rect className="ai-bot-head" x="27" y="34" width="42" height="31" rx="14" />
      <rect className="ai-bot-face" x="33" y="42" width="30" height="14" rx="7" />
      <circle className="ai-bot-eye" cx="42" cy="49" r="2.5" />
      <circle className="ai-bot-eye" cx="54" cy="49" r="2.5" />
      <path className="ai-bot-smile" d="M43 56c3 2 7 2 10 0" />
      <path className="ai-bot-cheek-light" d="M31 58c3 6 9 10 17 10s14-4 17-10c-5 6-29 6-34 0Z" />

      <path
        className="ai-bot-body"
        d="M34 66h28c5 0 9 4 9 9v5H25v-5c0-5 4-9 9-9Z"
      />
      <path className="ai-bot-shawl" d="M31 70c8 7 26 7 34 0v10H31Z" />
      <circle className="ai-bot-core" cx="48" cy="74" r="5" />
      <path className="ai-bot-lotus" d="M48 70c2 3 2 6 0 9-2-3-2-6 0-9Zm-5 4c3 1 5 3 5 5-3 0-5-2-5-5Zm10 0c0 3-2 5-5 5 0-2 2-4 5-5Z" />
    </svg>
  );
}

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(getStoredOpenState);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);

  const [quickQuestions, setQuickQuestions] = useState([
    "How can I book a hotel?",
    "Tell me about Sri Lankan culture",
    "What are famous heritage sites?",
    "How can I plan a trip?",
  ]);

  const [messages, setMessages] = useState(getStoredMessages);

  const navigate = useNavigate();
  const location = useLocation();
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(AI_OPEN_STORAGE_KEY, String(isOpen));
    } catch {
      // session storage can fail in private browsing, so ignore safely
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem(AI_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // session storage can fail in private browsing, so ignore safely
    }
  }, [messages]);

  useEffect(() => {
    if (!chatBodyRef.current) return;
    chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (customMessage) => {
    const userMessage = customMessage || input;

    if (!userMessage.trim() || loading) return;

    setInput("");
    setActions([]);
    setExternalLinks([]);

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setLoading(true);

    try {
      const response = await api.post("/assistant/chat", {
        message: userMessage,
        currentPage: location.pathname,
        userRole: localStorage.getItem("role") || "guest",
      });

      const data = response.data;

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text:
            data.reply ||
            "I can help you use TourismHub LK and learn about Sri Lanka.",
        },
      ]);

      setActions(data.suggestedActions || []);
      setExternalLinks(data.externalLinks || []);

      if (data.quickQuestions && data.quickQuestions.length > 0) {
        setQuickQuestions(data.quickQuestions);
      }
    } catch (error) {
      const assistantError =
        error.code === "ERR_NETWORK"
          ? "I cannot reach the backend server right now. Please try again in a moment."
          : error.response?.data?.reply ||
            "Sorry, I could not connect to the AI assistant. Please try again shortly.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: assistantError,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages(defaultMessages);
    setActions([]);
    setExternalLinks([]);
    setInput("");

    try {
      sessionStorage.removeItem(AI_MESSAGES_STORAGE_KEY);
    } catch {
      // session storage can fail in private browsing, so ignore safely
    }
  };

  const handleActionClick = (path) => {
    setIsOpen(true);

    try {
      sessionStorage.setItem(AI_OPEN_STORAGE_KEY, "true");
    } catch {
      // session storage can fail in private browsing, so ignore safely
    }

    navigate(path);
  };

  return (
    <div className={`ai-assistant ${isOpen ? "ai-assistant--open" : ""}`}>
      {isOpen && (
        <div className="ai-chat-box">
          <div className="ai-chat-header">
            <div className="ai-chat-title-wrap">
              <span className="ai-chat-avatar" aria-hidden="true">
                <TraditionalBotIcon />
              </span>

              <div>
                <h3>TourismHub LK AI Assistant</h3>
                <p>Website guide and Sri Lanka travel helper</p>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-clear-btn"
                onClick={clearConversation}
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                Clear
              </button>

              <button
                type="button"
                className="ai-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close TourismHub AI Assistant"
              >
                ×
              </button>
            </div>
          </div>

          <div className="ai-chat-body" ref={chatBodyRef} role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-message ${message.sender === "user" ? "ai-user" : "ai-bot"} ${
                  message.isError ? "ai-error" : ""
                }`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="ai-message ai-bot ai-typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}

            {actions.length > 0 && (
              <div className="ai-actions">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={loading}
                    onClick={() => handleActionClick(action.path)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {externalLinks.length > 0 && (
              <div className="ai-external-links">
                <p>Useful links:</p>

                {externalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            <div className="ai-quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask TourismHub LK AI Assistant..."
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button type="button" disabled={loading || !input.trim()} onClick={() => sendMessage()}>
              Send
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          className="ai-floating-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open TourismHub LK AI Assistant"
        >
          <span className="ai-orbit ai-orbit-one" aria-hidden="true" />
          <span className="ai-orbit ai-orbit-two" aria-hidden="true" />

          <span className="ai-bot-portrait" aria-hidden="true">
            <TraditionalBotIcon />
          </span>

          <span className="ai-button-label">AI</span>
          <span className="ai-button-subtitle">Assistant</span>
        </button>
      )}
    </div>
  );
}

export default AIAssistant;
