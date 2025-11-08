import React from 'react';
import './Header.css';

const Header = ({ onToggleSidebar, onDownloadChat, onClear, user }) => {
  return (
    <div className="chat-header">
      <div className="header-content">
        <div className="header-left-group">
          <button 
            className="sidebar-toggle-btn" 
            onClick={onToggleSidebar}
            title="Toggle sidebar"
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
        <div className="header-center">
          <h1 className="gradient-title">Arivu AI</h1>
          <p className="subtitle">Powered by MANI on Gemini</p>
        </div>
        <div className="header-right">
          {user && (
            <div className="header-right-menu">
              <div className="user-profile-top">
                <div className="user-avatar-top">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} />
                  ) : (
                    <i className="bi bi-person-fill"></i>
                  )}
                </div>
                <div className="header-actions-top">
                  <button 
                    className="btn-download-top" 
                    onClick={onDownloadChat}
                    title="Download chat as PDF"
                  >
                    <i className="bi bi-download"></i>
                  </button>
                  <button 
                    className="btn-clear-top" 
                    onClick={onClear}
                    title="Clear chat"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;

