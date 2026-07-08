import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AIAssistant.css";

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
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

  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hi! I am your TourismHub LK AI Assistant. Ask me about hotels, events, trip planning, or Sri Lankan tourism.",
    },
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const sendMessage = async (customMessage) => {
    const userMessage = customMessage || input;

    if (!userMessage.trim()) return;

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
      const response = await fetch("http://localhost:5000/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          currentPage: location.pathname,
          userRole: localStorage.getItem("role") || "guest",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.reply || "Assistant request failed");
      }

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
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Sorry, I could not connect to the AI assistant. Please check whether the backend server is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="ai-assistant">
      {isOpen && (
        <div className="ai-chat-box">
          <div className="ai-chat-header">
            <div>
              <h3>TourismHub LK AI Assistant</h3>
              <p>Website guide and Sri Lanka travel helper</p>
            </div>

            <button
              type="button"
              className="ai-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close TourismHub AI Assistant"
            >
              ×
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-message ${
                  message.sender === "user" ? "ai-user" : "ai-bot"
                }`}
              >
                {message.text}
              </div>
            ))}

            {loading && <div className="ai-message ai-bot">Thinking...</div>}

            {actions.length > 0 && (
              <div className="ai-actions">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
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
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Ask TourismHub LK AI Assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button type="button" onClick={() => sendMessage()}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ai-floating-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open TourismHub LK AI Assistant"
      >
        <img
          src="/ai-assistant.png"
          alt="TourismHub LK AI Assistant"
          className="ai-button-image"
        />
      </button>
    </div>
  );
}

export default AIAssistant;
