import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  chats, 
  currentChatId,
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onSettings,
  user,
  onLogout
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {isMobile && (
            <button className="sidebar-toggle-btn" onClick={onToggle} title="Close sidebar">
              <i className="bi bi-x-lg"></i>
            </button>
          )}
          <button className="new-chat-btn" onClick={onNewChat}>
            <i className="bi bi-plus-lg"></i>
            <span>New Chat</span>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="recent-chats">
            <h3 className="recent-chats-title">Recent Chats</h3>
            <div className="chats-list">
              {chats.length === 0 ? (
                <div className="no-chats">No recent chats</div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="chat-item-content">
                      <i className="bi bi-chat-dots"></i>
                      <span className="chat-title">{chat.title || 'New Chat'}</span>
                    </div>
                    <button
                      className="delete-chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      title="Delete chat"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="settings-btn" onClick={onSettings}>
            <i className="bi bi-gear"></i>
            <span>Settings</span>
          </button>
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} />
                ) : (
                  <i className="bi bi-person-fill"></i>
                )}
              </div>
              <div className="user-details">
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
              <button className="logout-btn" onClick={onLogout} title="Logout">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

