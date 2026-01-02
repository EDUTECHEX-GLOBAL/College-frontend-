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

    if (next) {
      // OPENING: start a fresh conversation every time
      setMessages([
        {
          id: Date.now(),
          sender: 'bot',
          text:
            'Hi 👋 Type ANY university name or question and I will fetch deadlines, documents, fees, and requirements.',
        },
      ]);
      setSelectedUniversity(null);
      setCurrentInput('');
      setIsTyping(false);
    } else {
      // CLOSING: clear current state (optional but explicit)
      setMessages([]);
      setSelectedUniversity(null);
      setCurrentInput('');
      setIsTyping(false);
    }
  };

  // Add messages
  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text }]);
  };

  const addBotMessage = (text) => {
    setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text }]);
  };

  /**
   * NEW: General chat endpoint – uses smart auto context (university / general)
   * Backend route: POST http://localhost:5001/api/chat-response
   * Body: { message: string, context: 'auto' }
   */
  const fetchChatResponse = async (userMessage) => {
    console.log(`Frontend: Sending chat request "${userMessage}"`);

    try {
    const response = await fetch(
  ' http://localhost:5001/api/university-info/chat-response',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: 'auto',
        }),
      });

      console.log('Frontend: Response status:', response.status);

      const data = await response.json();
      console.log('Frontend: Response data:', data);

      if (!response.ok) {
        console.error('Frontend: Backend error response:', data);
        return `❌ ${data.error || 'Unable to fetch data. Please try again.'}`;
      }

      // New endpoint returns `response` as the main text field
      if (data.success && data.response) {
        return data.response;
      }

      // Legacy compatibility (in case backend still sends `information`)
      if (data.success && data.information) {
        return data.information;
      }

      return 'No information available.';
    } catch (err) {
      console.error('Frontend: Fetch error:', err);
      return '⚠️ Server error. Please check backend connection.';
    }
  };

  // Submit message
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = currentInput.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);

    // Only treat as "selected university" on the first message
    if (!selectedUniversity) {
      setSelectedUniversity(trimmed);
    }

    setCurrentInput('');
    setIsTyping(true);

    // Call general chat backend (auto-detects university vs general)
    const reply = await fetchChatResponse(trimmed);

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
        text: 'Sure! Type another university name or question.',
      },
    ]);
  };

  return (
    <>
      <button className="chat-toggle-btn" onClick={handleToggle}>
        💬
      </button>

      {/* Keep widget always mounted; just hide/show with CSS */}
      <div className={`chat-widget ${isOpen ? 'open' : 'closed'}`}>
        <div className="chat-header">
          <div>
            <div className="chat-title">University Chatbot</div>
            <div className="chat-subtitle">Real university details using AI</div>
          </div>
          <button className="chat-close-btn" onClick={handleToggle}>
            ✕
          </button>
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
              <div
                key={m.id}
                className={`msg-row ${m.sender === 'user' ? 'right' : 'left'}`}
              >
                <div className={`msg-bubble ${m.sender}`}>
                  {m.text.split('\n').map((line, idx) => (
                    <p key={idx} className="msg-line">
                      {line}
                    </p>
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
              placeholder="Type university name or question..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
            />
            <button type="submit" disabled={!currentInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
