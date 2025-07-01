/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '../styles/StreamingIndicator.css';

export const StreamingIndicator: React.FC = () => {
  return (
    <div className="message-bubble assistant">
      <div className="message-header">
        <div className="message-author">
          <span className="message-icon">🤖</span>
          <span className="message-label">Qwen Assistant</span>
        </div>
      </div>
      
      <div className="message-content">
        <div className="streaming-indicator">
          <div className="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="thinking-text">Thinking...</span>
        </div>
      </div>
    </div>
  );
};