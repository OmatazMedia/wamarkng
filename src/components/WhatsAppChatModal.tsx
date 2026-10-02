/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  options?: Array<{ label: string; action: string }>;
}

type OffHoursStep = "NONE" | "AWAIT_NAME" | "AWAIT_EMAIL" | "AWAIT_PHONE" | "READY_TO_TRANSFER";

const WHATSAPP_PHONE_NUMBER = "2348031124296";

const quickSuggestions = [
  "🏢 Security & Access Control",
  "📹 CCTV Surveillance Systems",
  "🛢️ Oil & Gas Services",
  "🛡️ TSCM & Sweeping",
];

// Check West Africa / Nigeria Office Hours (Mon - Fri, 8:00 AM - 5:00 PM WAT / GMT+1)
const checkIsOfficeHours = () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      hour12: false,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);

    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
    return isWeekday && hour >= 8 && hour < 17;
  } catch {
    const localHour = new Date().getHours();
    const localDay = new Date().getDay();
    return localDay >= 1 && localDay <= 5 && localHour >= 8 && localHour < 17;
  }
};

export default function WhatsAppChatModal({
  isOpen,
  onClose,
  isBttActive = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  isBttActive?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [flowStarted, setFlowStarted] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [isOffHours, setIsOffHours] = useState(false);
  const [offHoursStep, setOffHoursStep] = useState<OffHoursStep>("NONE");
  
  // User lead details for off-hours
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userInquiries, setUserInquiries] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Reset all state when closing or restarting
  const resetChatState = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setMessages([]);
    setIsTyping(false);
    setInputValue("");
    setFlowStarted(false);
    setIsChatEnded(false);
    setOffHoursStep("NONE");
    setUserName("");
    setUserEmail("");
    setUserPhone("");
    setUserInquiries([]);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isChatEnded) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen, isChatEnded]);

  // Automated greeting sequence with exactly 3s dancing dots
  const startGreetingFlow = useCallback(() => {
    resetChatState();
    setFlowStarted(true);
    setIsTyping(true);

    const inOffice = checkIsOfficeHours();
    setIsOffHours(!inOffice);

    // Strictly 3.0 seconds dancing dots animation before greeting drops
    const timer = setTimeout(() => {
      setIsTyping(false);

      if (!inOffice) {
        // Off-Hours Automated Flow
        setOffHoursStep("AWAIT_NAME");
        setMessages([
          {
            id: "msg-off-hours-1",
            sender: "bot",
            text: "Hello! 👋 Welcome to WAMARK Nigeria Limited.\n\nOur main offices are currently closed (Office hours: Mon–Fri, 8:00 AM – 5:00 PM WAT). However, our standby support team can assist you right away!\n\nTo get started, please tell us your Name:",
            time: getCurrentTime(),
            options: [
              { label: "🛑 End Chat", action: "end_chat" },
            ],
          },
        ]);
      } else {
        // In-Office Hours Flow
        setOffHoursStep("NONE");
        setMessages([
          {
            id: "msg-welcome",
            sender: "bot",
            text: "Hello! 👋 Welcome to WAMARK Nigeria Limited.\n\nWe are currently online and ready to help. What security, surveillance, or oil & gas solution can we assist you with today?",
            time: getCurrentTime(),
            options: [
              { label: "🏢 Access Control & Security", action: "opt_access" },
              { label: "📹 CCTV & Surveillance", action: "opt_cctv" },
              { label: "🛢️ Oil & Gas Facility Services", action: "opt_oilgas" },
              { label: "🛡️ TSCM & Countermeasures", action: "opt_tscm" },
              { label: "🛑 End Chat", action: "end_chat" },
            ],
          },
        ]);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [resetChatState]);

  // Initial open trigger
  useEffect(() => {
    if (isOpen && !flowStarted) {
      const cleanup = startGreetingFlow();
      return cleanup;
    }
  }, [isOpen, flowStarted, startGreetingFlow]);

  // Handle End Chat with auto-close after 3 seconds & clear content
  const handleEndChat = useCallback(() => {
    if (isChatEnded) return;

    setIsTyping(true);
    setIsChatEnded(true);

    // Brief typing dots before bot replies
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `user-end-${Date.now()}`,
          sender: "user",
          text: "End Chat",
          time: getCurrentTime(),
        },
        {
          id: `bot-goodbye-${Date.now()}`,
          sender: "bot",
          text: "Thanks for reaching out today. See you next time! 👋",
          time: getCurrentTime(),
        },
      ]);

      // Exactly 3 seconds delay before chat box closes itself and content is cleared
      autoCloseTimerRef.current = setTimeout(() => {
        onClose();
        resetChatState();
      }, 3000);
    }, 1200);
  }, [isChatEnded, onClose, resetChatState]);

  // Handle Transfer Chat via WhatsApp
  const handleTransferToWhatsApp = (customMsg?: string) => {
    const inquiryLog = userInquiries.length > 0 
      ? userInquiries.join("\n• ") 
      : customMsg || "Inquiry from website chat";

    let prefilledText = "";
    if (userName || userEmail || userPhone) {
      prefilledText = `*WAMARK NIGERIA - CLIENT INQUIRY*\n` +
        `• Name: ${userName || "Client"}\n` +
        `• Email: ${userEmail || "Not provided"}\n` +
        `• Phone: ${userPhone || "Not provided"}\n` +
        `• Status: ${isOffHours ? "Off-Hours Lead" : "Live Chat Transfer"}\n\n` +
        `*Inquiry Details:*\n• ${inquiryLog}\n\nPlease assist me promptly.`;
    } else {
      prefilledText = `Hello WAMARK Support, I would like to make an inquiry from your website:\n\n• ${inquiryLog}\n\nPlease assist me with details and pricing.`;
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(prefilledText)}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-transfer-${Date.now()}`,
        sender: "user",
        text: "Transfer Chat",
        time: getCurrentTime(),
      },
      {
        id: `bot-transfer-ack-${Date.now()}`,
        sender: "bot",
        text: "Opening WhatsApp with your inquiry and details pre-filled... 🚀",
        time: getCurrentTime(),
      },
    ]);

    setTimeout(() => {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }, 600);
  };

  // Handle user response
  const handleSendMessage = (textToSend?: string) => {
    if (isChatEnded) return;

    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const newMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setIsTyping(true);

    // -------------------------------------------------------------
    // OFF-HOURS STEP-BY-STEP SEQUENCE (Name -> Email -> Phone -> Transfer)
    // -------------------------------------------------------------
    if (isOffHours && offHoursStep !== "NONE") {
      if (offHoursStep === "AWAIT_NAME") {
        setUserName(text);
        setOffHoursStep("AWAIT_EMAIL");

        // 3 seconds typing delay
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-email-${Date.now()}`,
              sender: "bot",
              text: `Nice to meet you, ${text}! ✨\n\nCould you please share your Email Address so we can send you quotation details?`,
              time: getCurrentTime(),
              options: [
                { label: "🛑 End Chat", action: "end_chat" },
              ],
            },
          ]);
        }, 3000);
        return;
      }

      if (offHoursStep === "AWAIT_EMAIL") {
        setUserEmail(text);
        setOffHoursStep("AWAIT_PHONE");

        // 3 seconds typing delay (customized with name)
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-phone-${Date.now()}`,
              sender: "bot",
              text: `Thank you, ${userName || "there"}! Lastly, please provide your Phone Number (or WhatsApp Number):`,
              time: getCurrentTime(),
              options: [
                { label: "🛑 End Chat", action: "end_chat" },
              ],
            },
          ]);
        }, 3000);
        return;
      }

      if (offHoursStep === "AWAIT_PHONE") {
        setUserPhone(text);
        setOffHoursStep("READY_TO_TRANSFER");

        // 3 seconds typing delay (customized with name and Transfer Chat button)
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-ready-${Date.now()}`,
              sender: "bot",
              text: `Thank you, ${userName}! All your information has been confirmed. 👍\n\nPlease click the button below to Transfer Chat to our standby WhatsApp line:`,
              time: getCurrentTime(),
              options: [
                { label: "🚀 Transfer Chat", action: "transfer_chat" },
                { label: "🛑 End Chat", action: "end_chat" },
              ],
            },
          ]);
        }, 3000);
        return;
      }
    }

    // -------------------------------------------------------------
    // REGULAR IN-OFFICE HOURS FLOW
    // -------------------------------------------------------------
    setUserInquiries((prev) => [...prev, text]);

    // 3 seconds typing delay before bot replies
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "Thank you for reaching out! Would you like to transfer this conversation directly to our live WhatsApp support line (+234 803 112 4296)?",
          time: getCurrentTime(),
          options: [
            { label: "🚀 Transfer Chat", action: "transfer_chat" },
            { label: "❌ No, stay here", action: "transfer_no" },
            { label: "🛑 End Chat", action: "end_chat" },
          ],
        },
      ]);
    }, 3000);
  };

  // Handle option button clicks
  const handleOptionClick = (option: { label: string; action: string }) => {
    if (option.action === "end_chat") {
      handleEndChat();
      return;
    }

    if (option.action === "transfer_chat" || option.action === "transfer_yes") {
      handleTransferToWhatsApp(option.label);
    } else if (option.action === "transfer_no") {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: "user",
          text: option.label,
          time: getCurrentTime(),
        },
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "No problem! Feel free to ask any other questions or email us directly at info@wamarkng.com.",
          time: getCurrentTime(),
          options: [
            { label: "🚀 Transfer Chat", action: "transfer_chat" },
            { label: "🛑 End Chat", action: "end_chat" },
          ],
        },
      ]);
    } else {
      handleSendMessage(option.label);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`wa-chat-window ${isBttActive ? "btt-active" : ""}`}
      role="dialog"
      aria-label="WhatsApp Live Chat"
    >
      {/* WhatsApp Header */}
      <div className="wa-chat-header">
        <div className="wa-header-left">
          <div className="wa-avatar-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/wamark-logo-white.webp"
              alt="WAMARK Avatar"
              className="wa-avatar"
            />
            <span
              className={`wa-online-dot ${isOffHours ? "off-hours" : ""}`}
              aria-label={isOffHours ? "Standby Support" : "Online"}
            />
          </div>
          <div className="wa-header-info">
            <div className="wa-header-title">
              <strong>WAMARK Nigeria</strong>
              <span className="wa-verified-badge" title="Verified Support">
                ✓
              </span>
            </div>
            <span className="wa-header-status">
              {isChatEnded
                ? "Closing session..."
                : isOffHours
                ? "Standby Support (Off-Hours)"
                : "Typically replies in a minute"}
            </span>
          </div>
        </div>

        <div className="wa-header-actions">
          {!isChatEnded && (
            <button
              type="button"
              className="wa-end-chat-btn"
              onClick={handleEndChat}
              title="End Chat"
            >
              End Chat
            </button>
          )}
          <button
            type="button"
            className="wa-header-close"
            onClick={() => {
              onClose();
              resetChatState();
            }}
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* WhatsApp Chat Body */}
      <div className="wa-chat-body">
        <div className="wa-date-chip">Today</div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`wa-msg-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}
          >
            <div className={`wa-msg-bubble ${msg.sender === "user" ? "wa-bubble-user" : "wa-bubble-bot"}`}>
              <p className="wa-msg-text">{msg.text}</p>
              
              {/* Option action buttons */}
              {msg.options && msg.options.length > 0 && !isChatEnded && (
                <div className="wa-options-grid">
                  {msg.options.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      className={`wa-opt-btn ${
                        opt.action === "end_chat"
                          ? "opt-end-chat"
                          : opt.action === "transfer_chat"
                          ? "opt-transfer-chat"
                          : ""
                      }`}
                      onClick={() => handleOptionClick(opt)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="wa-msg-meta">
                <span className="wa-msg-time">{msg.time}</span>
                {msg.sender === "user" && (
                  <span className="wa-check-marks" title="Delivered">
                    ✓✓
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Dancing Typing Dots Animation (3s delay) */}
        {isTyping && (
          <div className="wa-msg-row bot-row">
            <div className="wa-msg-bubble wa-bubble-bot wa-typing-bubble">
              <span className="wa-dot" />
              <span className="wa-dot" />
              <span className="wa-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Strip (if active, in-office, and first step) */}
      {!isChatEnded && !isOffHours && userInquiries.length === 0 && !isTyping && (
        <div className="wa-suggestions-bar">
          {quickSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              className="wa-sug-pill"
              onClick={() => handleSendMessage(sug)}
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Box */}
      <form
        className="wa-chat-footer"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          ref={inputRef}
          type={offHoursStep === "AWAIT_EMAIL" ? "email" : offHoursStep === "AWAIT_PHONE" ? "tel" : "text"}
          placeholder={
            isChatEnded
              ? "Chat ended, closing..."
              : offHoursStep === "AWAIT_NAME"
              ? "Type your name..."
              : offHoursStep === "AWAIT_EMAIL"
              ? "Type your email address..."
              : offHoursStep === "AWAIT_PHONE"
              ? "Type your phone/WhatsApp number..."
              : "Type a message..."
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isChatEnded}
          className="wa-input"
          aria-label="Chat input"
        />
        <button
          type="submit"
          className="wa-send-btn"
          disabled={isChatEnded || !inputValue.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
