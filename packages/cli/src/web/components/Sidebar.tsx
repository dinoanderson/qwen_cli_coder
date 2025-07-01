/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppConfig } from './WebApp.js';
import '../styles/Sidebar.css';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, config }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Settings</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="sidebar-content">
          {config && (
            <div className="config-section">
              <h4>Configuration</h4>
              <div className="config-item">
                <label>Model:</label>
                <span>{config.model}</span>
              </div>
              <div className="config-item">
                <label>Debug Mode:</label>
                <span>{config.debugMode ? 'On' : 'Off'}</span>
              </div>
              <div className="config-item">
                <label>Approval Mode:</label>
                <span>{config.approvalMode}</span>
              </div>
            </div>
          )}
          
          <div className="actions-section">
            <h4>Actions</h4>
            <button className="action-button">
              🗑️ Clear Chat
            </button>
            <button className="action-button">
              📋 Export Chat
            </button>
            <button className="action-button">
              ⚙️ Settings
            </button>
          </div>
          
          <div className="info-section">
            <h4>About</h4>
            <p>
              Qwen Assistant Web Interface<br/>
              Powered by Qwen AI Models
            </p>
          </div>
        </div>
      </div>
    </>
  );
};