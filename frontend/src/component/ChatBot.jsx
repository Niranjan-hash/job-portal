import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSend, FiX, FiSmile } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import './chatbot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: "👋 Hi! I'm your AI Career Assistant — powered by GPT.\n\nI can help you with:\n• 🔍 Finding jobs (e.g. 'Find React jobs in Chennai')\n• 🎯 Career guidance & skill roadmaps\n• 💡 Tech questions (What is React? Explain APIs)\n• 🎤 Interview preparation\n• 📝 Resume tips\n• 🌍 General knowledge\n\nAsk me anything! 😊" 
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

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo('.chat-window', { opacity: 0, y: 50, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    const updatedMessages = [...messages, { type: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', { 
        message: userMessage,
        history: messages  // Send full conversation history for context
      });
      
      if (response.data.success) {
        setMessages(prev => [...prev, { type: 'bot', text: response.data.response }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <FaRobot size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <h3 style={{ color: '#3b82f6' }}>Career Assistant</h3>
              <p style={{ color: '#60a5fa' }}>Online | Virtual Bot</p>
            </div>
            <button className="close-chat" onClick={() => setIsOpen(false)}>
              <FiX /> X
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
