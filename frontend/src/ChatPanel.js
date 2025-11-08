import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './ChatPanel.css';

function ChatPanel({ isOpen, onClose }) {
  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mode, setMode] = useState('chat');
  const [totalItemCount, setTotalItemCount] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to UI
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId,
          mode: mode
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update conversation ID
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        // Update total item count
        if (data.totalItemCount !== undefined) {
          setTotalItemCount(data.totalItemCount);
        }

        // Add assistant response
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          sources: data.sources || [],
          followUpQuestions: data.followUpQuestions || [],
          totalItemCount: data.totalItemCount,
          relevantItemCount: data.relevantItemCount,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = (question) => {
    setInputMessage(question);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="chat-overlay">
      <div className="chat-panel">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="chat-icon">💬</span>
            <div>
              <h3>Chat with Synapse</h3>
              <p className="chat-subtitle">
                {totalItemCount !== null
                  ? `${totalItemCount} items in your knowledge base`
                  : 'Ask me about your saved content'}
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Mode Selector */}
        <div className="chat-mode-selector">
          <button
            className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`mode-btn ${mode === 'summarize' ? 'active' : ''}`}
            onClick={() => setMode('summarize')}
          >
            📝 Summarize
          </button>
          <button
            className={`mode-btn ${mode === 'compare' ? 'active' : ''}`}
            onClick={() => setMode('compare')}
          >
            ⚖️ Compare
          </button>
          <button
            className={`mode-btn ${mode === 'quiz' ? 'active' : ''}`}
            onClick={() => setMode('quiz')}
          >
            🎯 Quiz
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-icon">🧠</div>
              <h3>Welcome to Synapse Chat!</h3>
              <p>I can help you with:</p>
              <div className="welcome-suggestions">
                <button onClick={() => setInputMessage("What have I saved recently?")}>
                  What have I saved recently?
                </button>
                <button onClick={() => setInputMessage("Summarize my articles about AI")}>
                  Summarize my articles about AI
                </button>
                <button onClick={() => setInputMessage("Compare the items I saved")}>
                  Compare the items I saved
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🧠'}
              </div>
              <div className="message-content">
                <div className={`message-bubble ${msg.isError ? 'error' : ''}`}>
                  {msg.content}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources">
                    <div className="sources-label">📚 Sources:</div>
                    {msg.sources.map((source, idx) => (
                      <div key={idx} className="source-card">
                        <div className="source-header">
                          <span className="source-type">{source.type || 'item'}</span>
                          <span className="source-relevance">{(source.relevance * 100).toFixed(0)}% match</span>
                        </div>
                        <div className="source-title">{source.title}</div>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="source-link">
                            Open →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Questions */}
                {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <div className="follow-up-questions">
                    <div className="follow-up-label">💡 Try asking:</div>
                    {msg.followUpQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        className="follow-up-btn"
                        onClick={() => handleFollowUp(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🧠</div>
              <div className="message-content">
                <div className="message-bubble loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-form" onSubmit={sendMessage}>
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder={`Ask me anything about your saved content...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
          {conversationId && (
            <button
              type="button"
              className="new-conversation-btn"
              onClick={handleNewConversation}
            >
              ✨ New Conversation
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
