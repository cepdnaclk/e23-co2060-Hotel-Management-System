import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  ExternalLink,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../../api/api";
import "./AIAssistant.css";


const AI_OPEN_STORAGE_KEY =
  "tourismhub_ai_assistant_open";

const AI_MESSAGES_STORAGE_KEY =
  "tourismhub_ai_assistant_messages";

const AI_POSITION_STORAGE_KEY =
  "tourismhub_ai_assistant_launcher_position";


const PAGE_ASSISTANT_CONFIG = [
  {
    match: (pathname) =>
      pathname.startsWith("/trip-planner"),

    label: "Trip Planner",

    greeting:
      "Hi! I’m Alby. I can help you build, organize, and understand your TripLanka trip plan.",

    questions: [
      "How should I organize my trip days?",
      "How do I optimize my road route?",
      "How do I add hotels, events, or guides?",
      "How can I save or export my trip?",
    ],
  },

  {
    match: (pathname) =>
      pathname.startsWith("/hotels"),

    label: "Hotels",

    greeting:
      "Hi! I’m Alby. I can help you with hotels, rooms, bookings, and stay planning.",

    questions: [
      "How can I find a hotel?",
      "How do I check room details?",
      "How do I make a booking?",
      "Where can I manage my bookings?",
    ],
  },

  {
    match: (pathname) =>
      pathname.startsWith("/explore"),

    label: "Explore",

    greeting:
      "Hi! I’m Alby. I can help you explore Sri Lanka and turn places you like into a trip plan.",

    questions: [
      "How do I save a destination?",
      "What can I do on the Explore page?",
      "How can I use saved places in my trip?",
      "Tell me about Sri Lankan travel experiences",
    ],
  },

  {
    match: (pathname) =>
      pathname.startsWith("/events"),

    label: "Events",

    greeting:
      "Hi! I’m Alby. I can help you discover TripLanka events and use them in your journey.",

    questions: [
      "How do I find events?",
      "How do I view event details?",
      "Can I save an event for my trip?",
      "How do events work with the Trip Planner?",
    ],
  },

  {
    match: (pathname) =>
      pathname.startsWith("/tourist-guides") ||
      pathname.startsWith("/guides"),

    label: "Guides",

    greeting:
      "Hi! I’m Alby. I can help you browse tourist guides and use saved guides in your trip.",

    questions: [
      "How do I find a tourist guide?",
      "What information is in a guide profile?",
      "Can I save a guide for my trip?",
      "How do I add a guide to a trip day?",
    ],
  },

  {
    match: () => true,

    label: "TripLanka",

    greeting:
      "Hi! I’m Alby, your TripLanka travel helper. Ask me anything about the website or travelling in Sri Lanka.",

    questions: [
      "How can I plan a trip?",
      "How can I book a hotel?",
      "What can I explore in TripLanka?",
      "How can I find events and guides?",
    ],
  },
];


const getPageAssistantConfig = (
  pathname
) =>
  PAGE_ASSISTANT_CONFIG.find(
    (config) =>
      config.match(pathname)
  ) ||
  PAGE_ASSISTANT_CONFIG[
    PAGE_ASSISTANT_CONFIG.length - 1
  ];


const buildDefaultMessages = (
  pageConfig
) => [
  {
    sender: "assistant",
    text: pageConfig.greeting,
  },
];


const readStoredOpenState = () => {
  try {
    return (
      sessionStorage.getItem(
        AI_OPEN_STORAGE_KEY
      ) === "true"
    );
  } catch {
    return false;
  }
};



const clampLauncherY = (
  value
) => {
  if (
    typeof window ===
    "undefined"
  ) {
    return 120;
  }

  const launcherHeight =
    window.innerWidth <= 640
      ? 58
      : 62;

  const minY = 82;

  const maxY = Math.max(
    minY,
    window.innerHeight -
      launcherHeight -
      18
  );

  return Math.min(
    Math.max(
      Number(value) ||
        minY,
      minY
    ),
    maxY
  );
};


const getDefaultLauncherPosition =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return {
        side: "right",
        y: 120,
      };
    }

    return {
      side: "right",
      y: clampLauncherY(
        window.innerHeight -
          102
      ),
    };
  };


const readStoredLauncherPosition =
  () => {
    try {
      const stored =
        localStorage.getItem(
          AI_POSITION_STORAGE_KEY
        );

      if (!stored) {
        return getDefaultLauncherPosition();
      }

      const parsed =
        JSON.parse(stored);

      return {
        side:
          parsed?.side ===
          "left"
            ? "left"
            : "right",

        y: clampLauncherY(
          parsed?.y
        ),
      };
    } catch {
      return getDefaultLauncherPosition();
    }
  };


const readStoredMessages = () => {
  try {
    const stored =
      sessionStorage.getItem(
        AI_MESSAGES_STORAGE_KEY
      );

    if (!stored) {
      return null;
    }

    const parsed =
      JSON.parse(stored);

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0
    ) {
      return null;
    }

    return parsed.filter(
      (message) =>
        message &&
        typeof message.text ===
          "string" &&
        (
          message.sender ===
            "assistant" ||
          message.sender ===
            "user"
        )
    );
  } catch {
    return null;
  }
};


function AlbyAvatar({
  className = "",
}) {
  return (
    <svg
      className={[
        "ai-alby-avatar",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="albySiteOrb"
          cx="30%"
          cy="24%"
          r="82%"
        >
          <stop
            offset="0%"
            stopColor="#79E0CF"
          />

          <stop
            offset="34%"
            stopColor="#19B09E"
          />

          <stop
            offset="68%"
            stopColor="#08786D"
          />

          <stop
            offset="100%"
            stopColor="#064E45"
          />
        </radialGradient>

        <radialGradient
          id="albyGoldGlow"
          cx="77%"
          cy="23%"
          r="44%"
        >
          <stop
            offset="0%"
            stopColor="#F3C95B"
            stopOpacity="0.54"
          />

          <stop
            offset="100%"
            stopColor="#F3C95B"
            stopOpacity="0"
          />
        </radialGradient>

        <linearGradient
          id="albyOrbRingSite"
          x1="16"
          y1="14"
          x2="104"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#D8FFF6"
            stopOpacity="0.78"
          />

          <stop
            offset="58%"
            stopColor="#8AD8C8"
            stopOpacity="0.36"
          />

          <stop
            offset="100%"
            stopColor="#F0C557"
            stopOpacity="0.28"
          />
        </linearGradient>

        <filter
          id="albySiteOrbShadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor="#075E55"
            floodOpacity="0.26"
          />
        </filter>

        <filter
          id="albySiteStarGlow"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
        >
          <feGaussianBlur
            stdDeviation="1.25"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx="60"
        cy="60"
        r="50"
        fill="url(#albySiteOrb)"
        filter="url(#albySiteOrbShadow)"
      />

      <circle
        cx="60"
        cy="60"
        r="50"
        fill="url(#albyGoldGlow)"
      />

      <circle
        cx="60"
        cy="60"
        r="47"
        fill="none"
        stroke="url(#albyOrbRingSite)"
        strokeWidth="2"
      />

      <circle
        cx="38"
        cy="34"
        r="11"
        fill="#FFFFFF"
        opacity="0.07"
      />

      <path
        d="M45 34c2 10 7 15 17 17-10 2-15 7-17 17-2-10-7-15-17-17 10-2 15-7 17-17Z"
        fill="#FFFFFF"
        filter="url(#albySiteStarGlow)"
      />

      <path
        d="M74 22c1.4 6.8 4.8 10.2 11.6 11.6-6.8 1.4-10.2 4.8-11.6 11.6-1.4-6.8-4.8-10.2-11.6-11.6C69.2 32.2 72.6 28.8 74 22Z"
        fill="#FFF7D8"
        opacity="0.98"
      />

      <path
        d="M78 58c1.2 6 4.2 9 10.2 10.2-6 1.2-9 4.2-10.2 10.2-1.2-6-4.2-9-10.2-10.2C73.8 67 76.8 64 78 58Z"
        fill="#FFFFFF"
        opacity="0.94"
      />

      <circle
        cx="82"
        cy="45"
        r="2.8"
        fill="#F6D16B"
        opacity="0.94"
      />

      <circle
        cx="53"
        cy="79"
        r="2.4"
        fill="#D8FFF6"
        opacity="0.78"
      />
    </svg>
  );
}

function AIAssistant() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const pageConfig =
    useMemo(
      () =>
        getPageAssistantConfig(
          location.pathname
        ),
      [location.pathname]
    );


  const initialMessagesRef =
    useRef(null);

  if (
    initialMessagesRef.current ===
    null
  ) {
    initialMessagesRef.current =
      readStoredMessages() ||
      buildDefaultMessages(
        pageConfig
      );
  }


  const [
    isOpen,
    setIsOpen,
  ] = useState(
    readStoredOpenState
  );

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    messages,
    setMessages,
  ] = useState(
    initialMessagesRef.current
  );

  const [
    actions,
    setActions,
  ] = useState([]);

  const [
    externalLinks,
    setExternalLinks,
  ] = useState([]);

  const [
    quickQuestions,
    setQuickQuestions,
  ] = useState(
    pageConfig.questions
  );

  const [
    chatStarted,
    setChatStarted,
  ] = useState(
    () =>
      initialMessagesRef.current.some(
        (message) =>
          message.sender ===
          "user"
      )
  );

  const [
    showAiNotice,
    setShowAiNotice,
  ] = useState(false);

  const [
    launcherPosition,
    setLauncherPosition,
  ] = useState(
    readStoredLauncherPosition
  );

  const [
    isDraggingLauncher,
    setIsDraggingLauncher,
  ] = useState(false);


  const chatBodyRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const launcherRef =
    useRef(null);

  const launcherDragRef =
    useRef({
      pointerId: null,
      startX: 0,
      startY: 0,
      startTop: 0,
      moved: false,
    });

  const suppressLauncherClickRef =
    useRef(false);


  useEffect(() => {
    try {
      sessionStorage.setItem(
        AI_OPEN_STORAGE_KEY,
        String(isOpen)
      );
    } catch {
      // Keep the assistant usable when session storage is unavailable.
    }
  }, [isOpen]);


  useEffect(() => {
    try {
      sessionStorage.setItem(
        AI_MESSAGES_STORAGE_KEY,
        JSON.stringify(
          messages
        )
      );
    } catch {
      // Keep the assistant usable when session storage is unavailable.
    }
  }, [messages]);


  useEffect(() => {
    setQuickQuestions(
      pageConfig.questions
    );

    setActions([]);
    setExternalLinks([]);
  }, [
    pageConfig,
  ]);


  useEffect(() => {
    const handleResize = () => {
      setLauncherPosition(
        (current) => {
          const next = {
            ...current,
            y: clampLauncherY(
              current.y
            ),
          };

          try {
            localStorage.setItem(
              AI_POSITION_STORAGE_KEY,
              JSON.stringify(
                next
              )
            );
          } catch {
            // Keep drag positioning usable if local storage is unavailable.
          }

          return next;
        }
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);


  useEffect(() => {
    if (
      !chatBodyRef.current
    ) {
      return;
    }

    chatBodyRef.current.scrollTo({
      top:
        chatBodyRef.current
          .scrollHeight,
      behavior:
        "smooth",
    });
  }, [
    messages,
    loading,
    actions,
    externalLinks,
  ]);


  useEffect(() => {
    if (
      !isOpen ||
      !chatStarted
    ) {
      return;
    }

    window.requestAnimationFrame(
      () =>
        inputRef.current?.focus()
    );
  }, [
    isOpen,
    chatStarted,
  ]);


  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen]);


  const sendMessage =
    async (
      customMessage
    ) => {
      const value =
        typeof customMessage ===
        "string"
          ? customMessage
          : input;

      const userMessage =
        value.trim();

      if (
        !userMessage ||
        loading
      ) {
        return;
      }

      setChatStarted(true);

      setInput("");
      setActions([]);
      setExternalLinks([]);

      setMessages(
        (current) => [
          ...current,
          {
            sender: "user",
            text: userMessage,
          },
        ]
      );

      setLoading(true);

      try {
        const response =
          await api.post(
            "/assistant/chat",
            {
              message:
                userMessage,

              currentPage:
                `${location.pathname}${location.search}`,

              userRole:
                localStorage.getItem(
                  "role"
                ) ||
                "guest",
            }
          );

        const data =
          response?.data ||
          {};

        setMessages(
          (current) => [
            ...current,
            {
              sender:
                "assistant",

              text:
                data.reply ||
                "I can help you use TripLanka and plan your Sri Lanka journey.",
            },
          ]
        );

        setActions(
          Array.isArray(
            data.suggestedActions
          )
            ? data.suggestedActions
            : []
        );

        setExternalLinks(
          Array.isArray(
            data.externalLinks
          )
            ? data.externalLinks
            : []
        );

        if (
          Array.isArray(
            data.quickQuestions
          ) &&
          data.quickQuestions
            .length > 0
        ) {
          setQuickQuestions(
            data.quickQuestions.slice(
              0,
              4
            )
          );
        }
      } catch (error) {
        const assistantError =
          error?.code ===
          "ERR_NETWORK"
            ? "I cannot reach the TripLanka server right now. Please try again in a moment."
            : error?.response
                ?.data
                ?.reply ||
              "I could not complete that request right now. Please try again.";

        setMessages(
          (current) => [
            ...current,
            {
              sender:
                "assistant",
              text:
                assistantError,
              isError:
                true,
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };


  const clearConversation =
    () => {
      setMessages(
        buildDefaultMessages(
          pageConfig
        )
      );

      setActions([]);
      setExternalLinks([]);
      setQuickQuestions(
        pageConfig.questions
      );
      setInput("");
      setChatStarted(false);
      setShowAiNotice(false);

      try {
        sessionStorage.removeItem(
          AI_MESSAGES_STORAGE_KEY
        );
      } catch {
        // Keep the assistant usable when session storage is unavailable.
      }

    };


  const handleActionClick =
    (path) => {
      if (
        typeof path !==
          "string" ||
        !path.startsWith("/")
      ) {
        return;
      }

      setIsOpen(false);
      navigate(path);
    };


  const persistLauncherPosition =
    (position) => {
      try {
        localStorage.setItem(
          AI_POSITION_STORAGE_KEY,
          JSON.stringify(
            position
          )
        );
      } catch {
        // Keep drag positioning usable if local storage is unavailable.
      }
    };


  const handleLauncherPointerDown =
    (event) => {
      if (
        event.pointerType ===
          "mouse" &&
        event.button !== 0
      ) {
        return;
      }

      const rect =
        launcherRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      launcherDragRef.current = {
        pointerId:
          event.pointerId,
        startX:
          event.clientX,
        startY:
          event.clientY,
        startTop:
          rect.top,
        moved:
          false,
      };

      suppressLauncherClickRef.current =
        false;

      launcherRef.current?.setPointerCapture?.(
        event.pointerId
      );
    };


  const handleLauncherPointerMove =
    (event) => {
      const drag =
        launcherDragRef.current;

      if (
        drag.pointerId !==
        event.pointerId
      ) {
        return;
      }

      const deltaX =
        event.clientX -
        drag.startX;

      const deltaY =
        event.clientY -
        drag.startY;

      const distance =
        Math.hypot(
          deltaX,
          deltaY
        );

      if (
        !drag.moved &&
        distance < 5
      ) {
        return;
      }

      drag.moved = true;

      suppressLauncherClickRef.current =
        true;

      setIsDraggingLauncher(
        true
      );

      const nextPosition = {
        side:
          event.clientX <
          window.innerWidth / 2
            ? "left"
            : "right",

        y: clampLauncherY(
          drag.startTop +
            deltaY
        ),
      };

      setLauncherPosition(
        nextPosition
      );
    };


  const finishLauncherDrag =
    (event) => {
      const drag =
        launcherDragRef.current;

      if (
        drag.pointerId !==
        event.pointerId
      ) {
        return;
      }

      launcherRef.current?.releasePointerCapture?.(
        event.pointerId
      );

      if (drag.moved) {
        setLauncherPosition(
          (current) => {
            const next = {
              ...current,
              y: clampLauncherY(
                current.y
              ),
            };

            persistLauncherPosition(
              next
            );

            return next;
          }
        );
      }

      launcherDragRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        startTop: 0,
        moved: false,
      };

      window.requestAnimationFrame(
        () =>
          setIsDraggingLauncher(
            false
          )
      );
    };


  const handleLauncherClick =
    (event) => {
      if (
        suppressLauncherClickRef.current
      ) {
        event.preventDefault();

        suppressLauncherClickRef.current =
          false;

        return;
      }

      setIsOpen(true);
    };


  const handleInputKeyDown =
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    };


  const isFreshConversation =
    messages.length === 1 &&
    messages[0]?.sender ===
      "assistant" &&
    !loading &&
    actions.length === 0 &&
    externalLinks.length === 0;


  const startChat = () => {
    setShowAiNotice(false);
    setChatStarted(true);

    window.setTimeout(
      () =>
        inputRef.current?.focus(),
      0
    );
  };


  const welcomeDescription =
    pageConfig.label ===
    "Trip Planner"
      ? "Build your itinerary, organize trip days, understand routes, and get help using your saved trip items."
      : `Ask me about ${pageConfig.label.toLowerCase()} or how to use TripLanka. I’ll help you find the next step quickly.`;


  return (
    <div
      className={[
        "ai-assistant",
        isOpen
          ? "ai-assistant--open"
          : "",
        launcherPosition.side ===
        "left"
          ? "ai-assistant--left"
          : "ai-assistant--right",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isOpen && (
        <section
          className="ai-chat-box"
          aria-label="TripLanka AI Assistant"
        >
          <header className="ai-chat-header">
            <div className="ai-chat-title-wrap">
              <span
                className="ai-chat-avatar"
                aria-hidden="true"
              >
                <AlbyAvatar />
              </span>

              <div className="ai-chat-heading">
                <div className="ai-chat-eyebrow">
                  <Sparkles
                    size={13}
                  />

                  <span>
                    AI TRAVEL ASSISTANT
                  </span>
                </div>

                <h3>
                  Alby
                </h3>

                <p>
                  TourismHub AI ·{" "}
                  {pageConfig.label}
                </p>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-icon-button"
                onClick={
                  clearConversation
                }
                aria-label="Start a new AI conversation"
                title="New conversation"
              >
                <Trash2
                  size={17}
                />
              </button>

              <button
                type="button"
                className="ai-icon-button"
                onClick={() =>
                  setIsOpen(false)
                }
                aria-label="Close AI Assistant"
                title="Close"
              >
                <X
                  size={19}
                />
              </button>
            </div>
          </header>


          <div
            className="ai-chat-body"
            ref={chatBodyRef}
            role="log"
            aria-live="polite"
          >
            {!chatStarted &&
            isFreshConversation ? (
              <div className="ai-welcome-state">
                <div
                  className="ai-welcome-orb"
                  aria-hidden="true"
                >
                  <AlbyAvatar />
                </div>

                <span className="ai-welcome-kicker">
                  TourismHub AI
                </span>

                <h4>
                  Hey! I’m Alby.
                </h4>

                <p>
                  {welcomeDescription}
                </p>

                <button
                  type="button"
                  className="ai-welcome-cta"
                  onClick={startChat}
                >
                  <span>
                    Chat with Alby
                  </span>

                  <ArrowRight
                    size={17}
                  />
                </button>

                <div className="ai-welcome-disclaimer">
                  <span className="ai-welcome-divider" />

                  <div className="ai-welcome-disclaimer-line">
                    <span>
                      Alby can make mistakes.
                    </span>

                    <button
                      type="button"
                      className="ai-know-more-link"
                      onClick={() =>
                        setShowAiNotice(
                          (current) =>
                            !current
                        )
                      }
                      aria-expanded={showAiNotice}
                    >
                      Know more
                    </button>
                  </div>

                  {showAiNotice && (
                    <p className="ai-welcome-disclaimer-detail">
                      Alby may occasionally provide incomplete or inaccurate
                      travel information. Review important details such as
                      bookings, prices, availability, travel times, and official
                      requirements before making decisions.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="ai-context-pill">
                  <span className="ai-context-dot" />

                  {pageConfig.label}
                </div>

                <div className="ai-message-list">
                  {messages.map(
                    (
                      message,
                      index
                    ) => {
                      const isUser =
                        message.sender ===
                        "user";

                      return (
                        <div
                          key={`${message.sender}-${index}`}
                          className={[
                            "ai-message-row",
                            isUser
                              ? "ai-message-row--user"
                              : "ai-message-row--assistant",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {!isUser && (
                            <span
                              className="ai-message-avatar"
                              aria-hidden="true"
                            >
                              <Sparkles
                                size={14}
                              />
                            </span>
                          )}

                          <div
                            className={[
                              "ai-message",
                              isUser
                                ? "ai-user"
                                : "ai-bot",
                              message.isError
                                ? "ai-error"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {message.text}
                          </div>
                        </div>
                      );
                    }
                  )}

                  {loading && (
                    <div className="ai-message-row ai-message-row--assistant">
                      <span
                        className="ai-message-avatar"
                        aria-hidden="true"
                      >
                        <Sparkles
                          size={14}
                        />
                      </span>

                      <div
                        className="ai-message ai-bot ai-typing"
                        aria-label="Assistant is typing"
                      >
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                </div>

                {actions.length >
                  0 && (
                  <div className="ai-response-section">
                    <span className="ai-response-label">
                      Suggested actions
                    </span>

                    <div className="ai-actions">
                      {actions
                        .slice(0, 4)
                        .map(
                          (
                            action,
                            index
                          ) => (
                            <button
                              key={`${action.label}-${index}`}
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                handleActionClick(
                                  action.path
                                )
                              }
                            >
                              <span>
                                {action.label}
                              </span>

                              <ArrowRight
                                size={15}
                              />
                            </button>
                          )
                        )}
                    </div>
                  </div>
                )}

                {externalLinks.length >
                  0 && (
                  <div className="ai-response-section">
                    <span className="ai-response-label">
                      Useful links
                    </span>

                    <div className="ai-external-links">
                      {externalLinks
                        .slice(0, 4)
                        .map(
                          (
                            link,
                            index
                          ) => (
                            <a
                              key={`${link.url}-${index}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>
                                {link.label}
                              </span>

                              <ExternalLink
                                size={14}
                              />
                            </a>
                          )
                        )}
                    </div>
                  </div>
                )}

                {quickQuestions.length >
                  0 && (
                  <div className="ai-response-section ai-quick-section">
                    <span className="ai-response-label">
                      Try asking
                    </span>

                    <div className="ai-quick-questions">
                      {quickQuestions
                        .slice(0, 4)
                        .map(
                          (
                            question,
                            index
                          ) => (
                            <button
                              key={`${question}-${index}`}
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                sendMessage(
                                  question
                                )
                              }
                            >
                              {question}
                            </button>
                          )
                        )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>


          {chatStarted && (
          <footer className="ai-chat-composer">
            <div className="ai-chat-input">
              <textarea
                ref={inputRef}
                rows="1"
                maxLength="1200"
                placeholder={`Ask about ${pageConfig.label.toLowerCase()}...`}
                value={input}
                disabled={loading}
                onChange={(
                  event
                ) =>
                  setInput(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleInputKeyDown
                }
                aria-label="Message TripLanka AI Assistant"
              />

              <button
                type="button"
                className="ai-send-button"
                disabled={
                  loading ||
                  !input.trim()
                }
                onClick={() =>
                  sendMessage()
                }
                aria-label="Send message"
              >
                <Send
                  size={18}
                />
              </button>
            </div>

            <div className="ai-composer-meta">
              <span>
                Enter to send · Shift + Enter for a new line
              </span>

              <span>
                Review important travel details
              </span>
            </div>
          </footer>
          )}
        </section>
      )}


      {!isOpen && (
        <button
          ref={launcherRef}
          type="button"
          className={[
            "ai-floating-button",
            isDraggingLauncher
              ? "ai-floating-button--dragging"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            "--ai-launcher-y":
              `${launcherPosition.y}px`,
          }}
          onClick={
            handleLauncherClick
          }
          onPointerDown={
            handleLauncherPointerDown
          }
          onPointerMove={
            handleLauncherPointerMove
          }
          onPointerUp={
            finishLauncherDrag
          }
          onPointerCancel={
            finishLauncherDrag
          }
          aria-label="Open Alby, the TripLanka AI Assistant. Drag to move it."
          title="Ask Alby · Drag to move"
        >
          <span
            className="ai-launcher-person"
            aria-hidden="true"
          >
            <AlbyAvatar />
          </span>

          <span className="ai-floating-copy">
            <small>
              Need help?
            </small>

            <strong>
              Ask Alby
            </strong>
          </span>

          <span
            className="ai-floating-status"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}


export default AIAssistant;
