import React from 'react';
import './LoadingIndicator.css';

const LoadingIndicator = () => {
  return (
    <div className="message-wrapper ai">
      <div className="message loading">
        <div className="message-avatar">
          <i className="bi bi-robot"></i>
        </div>
        <div className="message-content">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;

