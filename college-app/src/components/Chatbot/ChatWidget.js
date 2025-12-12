import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Toggle chat widget
  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);

    if (next && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          sender: 'bot',
          text: 'Hi 👋 Type ANY university name and I will fetch real deadlines, documents, fees, and requirements.',
        },
      ]);
    }
  };

  // Add messages
  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text }]);
  };

  const addBotMessage = (text) => {
    setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text }]);
  };

  // MAIN FUNCTION → CALLS BACKEND AI AGENT - FIXED VERSION
  const fetchUniversityInfo = async (universityName) => {
    console.log(`Frontend: Sending request for "${universityName}"`);
    
    try {
      const response = await fetch("http://localhost:5001/api/university-info", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ universityName: universityName }), // FIXED: Changed key
      });

      console.log("Frontend: Response status:", response.status);
      
      const data = await response.json();
      console.log("Frontend: Response data:", data);

      if (!response.ok) {
        console.error("Frontend: Backend error response:", data);
        return `❌ ${data.error || "Unable to fetch data. Please try again."}`;
      }

      if (data.success && data.information) {
        return data.information;
      } else {
        return "No information available.";
      }
    } catch (err) {
      console.error("Frontend: Fetch error:", err);
      return "⚠️ Server error. Please check backend connection.";
    }
  };

  // Submit message
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = currentInput.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);

    if (!selectedUniversity) {
      setSelectedUniversity(trimmed);
    }

    setCurrentInput('');
    setIsTyping(true);

    // CALL BACKEND → AI Agent → Bedrock Claude 3 Sonnet
    const reply = await fetchUniversityInfo(trimmed);

    addBotMessage(reply);
    setIsTyping(false);
  };

  const handleChangeUniversity = () => {
    setSelectedUniversity(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'bot',
        text: 'Sure! Type another university name.',
      },
    ]);
  };

  return (
    <>
      <button className="chat-toggle-btn" onClick={handleToggle}>💬</button>

      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <div>
              <div className="chat-title">University Chatbot</div>
              <div className="chat-subtitle">Real university details using AI</div>
            </div>
            <button className="chat-close-btn" onClick={handleToggle}>✕</button>
          </div>

          <div className="chat-body">
            {/* Selected University */}
            <div className="uni-banner">
              <span className="uni-label">Current university:</span>
              <span className="uni-value">
                {selectedUniversity || 'Not selected – type a name below'}
              </span>

              {selectedUniversity && (
                <button className="uni-change-btn" onClick={handleChangeUniversity}>
                  Change
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((m) => (
                <div key={m.id} className={`msg-row ${m.sender === 'user' ? 'right' : 'left'}`}>
                  <div className={`msg-bubble ${m.sender}`}>
                    {m.text.split('\n').map((line, idx) => (
                      <p key={idx} className="msg-line">{line}</p>
                    ))}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="msg-row left">
                  <div className="msg-bubble bot typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-bar" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Type university name..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
              />
              <button type="submit" disabled={!currentInput.trim()}>Send</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;