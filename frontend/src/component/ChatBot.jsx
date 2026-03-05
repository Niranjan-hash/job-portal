import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiMessageSquare, FiSend, FiX, FiSmile } from 'react-icons/fi';
import './chatbot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: "👋 Hi there! I'm your Job Assistant. How can I help you today? \n\nTry asking for jobs like 'React jobs in Bangalore' or 'How do I apply?'" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', { message: userMessage });
      
      if (response.data.success) {
        setMessages(prev => [...prev, { type: 'bot', text: response.data.response }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <FiMessageSquare />
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <h3>Career Assistant</h3>
              <p>Online | Virtual Bot</p>
            </div>
            <button className="close-chat" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ))}
            {loading && <div className="typing">Assistant is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading}>
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
