/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChatMessage } from './WebApp.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import '../styles/MessageBubble.css';

export interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return 'ℹ️';
      case 'tool':
        return '🔧';
      default:
        return '💬';
    }
  };

  const getMessageLabel = (type: string) => {
    switch (type) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Qwen Assistant';
      case 'system':
        return 'System';
      case 'tool':
        return 'Tool';
      default:
        return 'Message';
    }
  };

  return (
    <div className={`message-bubble ${message.type}`}>
      <div className="message-header">
        <div className="message-author">
          <span className="message-icon">{getMessageIcon(message.type)}</span>
          <span className="message-label">{getMessageLabel(message.type)}</span>
        </div>
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
      
      <div className="message-content">
        {message.type === 'user' ? (
          <div className="user-message">
            {message.content}
          </div>
        ) : message.type === 'assistant' ? (
          <div className="assistant-message">
            <MarkdownRenderer content={message.content} />
            {message.isStreaming && (
              <span className="streaming-cursor">▊</span>
            )}
          </div>
        ) : message.type === 'tool' ? (
          <div className="tool-message">
            <div className="tool-info">
              {message.content}
              {message.toolCall && (
                <details className="tool-details">
                  <summary>Tool Details</summary>
                  <pre>{JSON.stringify(message.toolCall, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        ) : (
          <div className="system-message">
            {message.content}
          </div>
        )}
        
        {message.usage && (
          <div className="usage-info">
            <small>
              Tokens: {message.usage.totalTokenCount} 
              ({message.usage.promptTokenCount} prompt + {message.usage.candidatesTokenCount} response)
              {message.usage.apiTimeMs && (
                <> • Time: {Math.round(message.usage.apiTimeMs)}ms</>
              )}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};