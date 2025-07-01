/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import '../styles/MessageInput.css';

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter = new line (default behavior)
        return;
      } else {
        // Enter = send message
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setMessage(prev => 
          prev + (prev ? '\n\n' : '') + 
          `📎 **${file.name}**\n\`\`\`\n${content}\n\`\`\``
        );
      };
      reader.readAsText(file);
    });
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="message-input">
      <div className="input-container">
        <div className="input-actions">
          <label className="file-upload-button" title="Upload file">
            📎
            <input
              type="file"
              multiple
              accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.json,.yaml,.yml,.css,.html,.xml,.csv"
              onChange={handleFileUpload}
              disabled={disabled}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="message-textarea"
        />
        
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="send-button"
          title="Send message (Enter)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854 8.354a.5.5 0 0 0 0-.708L9.207 1a.5.5 0 1 0-.707.707L14.293 7.5H.5a.5.5 0 0 0 0 1h13.793L8.5 14.293a.5.5 0 0 0 .707.707l6.647-6.646z"/>
          </svg>
        </button>
      </div>
      
      <div className="input-help">
        <small>
          Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
        </small>
      </div>
    </div>
  );
};