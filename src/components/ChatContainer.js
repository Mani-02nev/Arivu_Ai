import React from 'react';
import Message from './Message';
import LoadingIndicator from './LoadingIndicator';
import './ChatContainer.css';

const ChatContainer = ({ messages, isLoading, messagesEndRef, isPro }) => {
  return (
    <div className="chat-container">
      {messages.length === 0 ? (
        <div className="welcome-screen">
          <div className="welcome-icon">
            <i className="bi bi-chat-dots"></i>
          </div>
          <h2>Welcome to Arivu AI</h2>
          <p>Ask me anything! I'm here to help you with intelligent responses.</p>
          <div className="suggestions">
            <div className="suggestion-chip">
              <i className="bi bi-lightbulb"></i>
              <span>Try asking: "What is artificial intelligence?"</span>
            </div>
            <div className="suggestion-chip">
              <i className="bi bi-code-slash"></i>
              <span>Or: "Explain quantum computing"</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((message) => (
            <Message key={message.id} message={message} isPro={isPro} />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;

