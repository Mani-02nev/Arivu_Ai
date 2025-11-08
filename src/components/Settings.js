import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ isOpen, onClose, currentTheme, onThemeChange, isPro, onVersionChange, messageCount, user, onLogout }) => {
  const [settings, setSettings] = useState({
    theme: currentTheme || 'dark',
    fontSize: localStorage.getItem('fontSize') || 'medium',
    autoSave: localStorage.getItem('autoSave') !== 'false',
    version: isPro ? 'pro' : 'normal'
  });

  useEffect(() => {
    setSettings(prev => ({ ...prev, theme: currentTheme || 'dark', version: isPro ? 'pro' : 'normal' }));
  }, [currentTheme, isPro]);

  const handleSave = () => {
    localStorage.setItem('theme', settings.theme);
    localStorage.setItem('fontSize', settings.fontSize);
    localStorage.setItem('autoSave', settings.autoSave);
    onThemeChange(settings.theme);
    if (onVersionChange && settings.version !== (isPro ? 'pro' : 'normal')) {
      onVersionChange(settings.version);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-settings" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-section">
            <h3 className="section-title">Account</h3>
          </div>
          <div className="setting-item version-setting">
            <label>Subscription Plan</label>
            <div className="version-toggle">
              <button
                className={`version-btn ${settings.version === 'normal' ? 'active' : ''}`}
                onClick={() => setSettings({...settings, version: 'normal'})}
              >
                Normal
              </button>
              <button
                className={`version-btn ${settings.version === 'pro' ? 'active' : ''}`}
                onClick={() => setSettings({...settings, version: 'pro'})}
              >
                Pro
              </button>
            </div>
            <div className="version-info">
              {settings.version === 'normal' ? (
                <p className="version-details">
                  • 5 messages limit<br/>
                  • 5 chats only<br/>
                  • No voice assistant
                </p>
              ) : (
                <p className="version-details pro-details">
                  • Unlimited messages<br/>
                  • Unlimited chats<br/>
                  • Voice assistant included<br/>
                  <span className="free-month">✨ First month FREE!</span>
                </p>
              )}
            </div>
            {settings.version === 'normal' && (
              <p className="message-count">Messages used: {messageCount}/5</p>
            )}
          </div>
          
          <div className="settings-section">
            <h3 className="section-title">Appearance</h3>
          </div>
          <div className="setting-item">
            <label>Theme</label>
            <div className="theme-toggle">
              <button
                className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => setSettings({...settings, theme: 'dark'})}
              >
                <i className="bi bi-moon-fill"></i>
                <span>Dark</span>
              </button>
              <button
                className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => setSettings({...settings, theme: 'light'})}
              >
                <i className="bi bi-sun-fill"></i>
                <span>Light</span>
              </button>
            </div>
          </div>
          <div className="setting-item">
            <label>Font Size</label>
            <select 
              value={settings.fontSize} 
              onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
              className="settings-select"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={settings.autoSave}
                onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                className="settings-checkbox"
              />
              <span>Auto-save chats</span>
            </label>
          </div>
          
          {user && (
            <div className="setting-item user-data-setting">
              <label>User Account</label>
              <div className="user-data-box">
                <div className="user-data-avatar">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} />
                  ) : (
                    <i className="bi bi-person-fill"></i>
                  )}
                </div>
                <div className="user-data-info">
                  <p className="user-data-name">{user.name}</p>
                  <p className="user-data-email">{user.email}</p>
                </div>
                <button className="logout-btn-settings" onClick={onLogout} title="Logout">
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </div>
            </div>
          )}
          
          <div className="developer-credit-settings">
            <p className="credit-title">Arivu AI</p>
            <p className="credit-developer">Developed by MANI</p>
          </div>
        </div>
        <div className="settings-footer">
          <button className="save-settings-btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

