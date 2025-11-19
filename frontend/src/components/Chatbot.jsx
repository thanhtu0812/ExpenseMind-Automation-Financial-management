import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import chatbotIcon from "./assets/images/chatbot.png";
import bgImage from "./assets/images/anh-may-dep-cute.jpg";
import "../styles/Chatbot.css";

export const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quickActions] = useState([
    "Chi tiêu tuần này thế nào?",
    "Gợi ý tiết kiệm",
    "Thêm khoản chi mới",
    "Xem báo cáo tháng",
  ]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        navigate("/login");
        return;
      }
      setIsAuthenticated(true);
    };

    checkAuthentication();
  }, [navigate]);

  // Khởi tạo conversation chỉ khi đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    const initConversation = async () => {
      if (!conversationId) {
        const newConvId = `conv_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        setConversationId(newConvId);

        // Welcome
        setMessages([
          {
            id: 1,
            text: "Xin chào! Tôi là AI ExpenseMind - trợ lý quản lý chi tiêu của bạn. Tôi có thể giúp bạn phân tích chi tiêu, thêm giao dịch mới và đưa ra gợi ý tiết kiệm!",
            isBot: true,
            timestamp: new Date(),
          },
        ]);
      }
    };
    initConversation();
  }, [isAuthenticated]);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    // Kiểm tra lại authentication trước khi gửi tin nhắn
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!inputMessage.trim() || !conversationId) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationId,
          userId: localStorage.getItem("userId"),
        }),
      });

      // Kiểm tra nếu response là 401 (Unauthorized)
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.message,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);

        if (data.action === "add_transaction") {
          console.log("Chuyển đến trang thêm giao dịch");
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
        isBot: true,
        isError: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    // Kiểm tra authentication trước khi thực hiện quick action
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setInputMessage(action);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const userMessage = {
        id: Date.now(),
        text: `Đang xử lý hình ảnh: ${file.name}`,
        isBot: false,
        timestamp: new Date(),
        imageUrl: imageUrl,
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsLoading(true);
      await processReceiptImage(file);
      setIsLoading(false);

      e.target.value = "";
    }
  };

  const processReceiptImage = async (file) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", userId);
    formData.append("conversationId", conversationId);

    try {
      const response = await fetch("/api/chatbot/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.message,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);

        window.dispatchEvent(new Event("transactionAdded"));
        localStorage.setItem("transactionRefresh", Date.now().toString());
        console.log("Transaction refresh trigger saved to localStorage");
      } else {
        throw new Error(data.error || "Failed to process image.");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Xin lỗi, tôi gặp sự cố khi xử lý hình ảnh của bạn. Vui lòng thử lại.",
        isBot: true,
        isError: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Hiển thị loading hoặc không hiển thị gì nếu chưa xác thực
  if (!isAuthenticated) {
    return (
      <div className="chatbot" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="chatbot-loading">
          <p>Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot" style={{ backgroundImage: `url(${bgImage})` }}>
      <h2 className="welcome-text">Welcome to AI ExpenseMind!</h2>

      <div className="chatbot-main-container">
        <div className="chatbot-header">
          <button className="back-button" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </button>
          <div className="header-center">
            <img
              src={chatbotIcon}
              alt="AI ExpenseMind"
              className="header-chatbot-icon"
            />
            <h1 className="chatbot-title">Talk with AI ExpenseMind</h1>
          </div>
          <div className="header-spacer"></div>
        </div>

        <div className="chatbot-container">
          <div className="messages-area">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.isBot ? "bot-message" : "user-message"
                } ${message.isError ? "error-message" : ""}`}
              >
                {message.isBot && (
                  <div className="bot-avatar">
                    <img src={chatbotIcon} alt="AI" />
                  </div>
                )}
                <div className="message-content">
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Uploaded preview"
                      className="message-image-preview"
                    />
                  )}
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message">
                <div className="bot-avatar">
                  <img src={chatbotIcon} alt="AI" />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-section">
            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action-button"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="input-container">
              <div className="input-area">
                <input
                  type="text"
                  placeholder="Nhập câu hỏi về chi tiêu của bạn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="message-input"
                  disabled={isLoading}
                />
              </div>
              <div className="action-buttons">
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <Send size={20} />
                </button>
                <button
                  className="attachment-button"
                  onClick={handleAttachmentClick}
                  disabled={isLoading}
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="chatbot-footer">
        @Copyright 2025 - AI ExpenseMind
      </footer>
    </div>
  );
};

export default Chatbot;
