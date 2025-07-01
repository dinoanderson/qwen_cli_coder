/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '../styles/Header.css';

export interface HeaderProps {
  model?: string;
  isConnected: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  model,
  isConnected,
  onToggleSidebar,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <div className="app-title">
          <span className="app-icon">🤖</span>
          <span className="app-name">Qwen Assistant</span>
        </div>
      </div>
      
      <div className="header-center">
        {model && (
          <div className="model-info">
            <span className="model-label">Model:</span>
            <span className="model-name">{model}</span>
          </div>
        )}
      </div>
      
      <div className="header-right">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
};