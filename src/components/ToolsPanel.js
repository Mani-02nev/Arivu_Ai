import React, { useState } from 'react';
import './ToolsPanel.css';

const ToolsPanel = ({ isOpen, onClose, onSelectTool, isPro }) => {
  const tools = [
    {
      id: 'web-search',
      name: 'Web Search',
      icon: 'bi-search',
      description: 'Search the web for real-time information',
      available: true
    },
    {
      id: 'deep-learning',
      name: 'Deep Learning',
      icon: 'bi-cpu',
      description: 'Advanced AI analysis and insights',
      available: isPro
    },
    {
      id: 'study-mode',
      name: 'Study Mode',
      icon: 'bi-book',
      description: 'Educational explanations and learning',
      available: true
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="tools-overlay" onClick={onClose}>
      <div className="tools-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tools-header">
          <h3>AI Tools</h3>
          <button className="tools-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="tools-grid">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`tool-card ${!tool.available ? 'disabled' : ''}`}
              onClick={() => {
                if (tool.available) {
                  onSelectTool(tool.id);
                  onClose();
                } else {
                  alert('This tool is only available in Pro version!');
                }
              }}
            >
              <div className="tool-icon">
                <i className={`bi ${tool.icon}`}></i>
                {!tool.available && (
                  <span className="pro-badge">PRO</span>
                )}
              </div>
              <h4>{tool.name}</h4>
              <p>{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPanel;

