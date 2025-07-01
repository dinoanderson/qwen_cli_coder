/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './WebApp.js';
import { MessageBubble } from './MessageBubble.js';
import { MessageInput } from './MessageInput.js';
import { StreamingIndicator } from './StreamingIndicator.js';
import '../styles/ChatContainer.css';

export interface ChatContainerProps {
  messages: ChatMessage[];
  currentStreamingMessage: string;
  isStreaming: boolean;
  isConnected: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  currentStreamingMessage,
  isStreaming,
  isConnected,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamingMessage, shouldAutoScroll]);

  // Check if user has scrolled up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    setShouldAutoScroll(isAtBottom);
  };

  return (
    <div className="chat-container">
      <div className="messages-area" onScroll={handleScroll}>
        {messages.length === 0 && !isStreaming ? (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>🤖 Qwen Assistant</h1>
              <p>Hello! I'm your AI coding assistant powered by Qwen. I can help you with:</p>
              <ul>
                <li>🔍 Code analysis and debugging</li>
                <li>✏️ Writing and editing files</li>
                <li>🔧 Running shell commands</li>
                <li>📚 Searching and reading documentation</li>
                <li>🌐 Web research and data fetching</li>
              </ul>
              <p>Ask me anything about your code or project!</p>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isStreaming && currentStreamingMessage && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  type: 'assistant',
                  content: currentStreamingMessage,
                  timestamp: new Date(),
                  isStreaming: true,
                }}
              />
            )}
            
            {isStreaming && !currentStreamingMessage && (
              <StreamingIndicator />
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={!isConnected || isStreaming}
          placeholder={
            !isConnected
              ? "Connecting..."
              : isStreaming
              ? "Assistant is responding..."
              : "Ask me anything about your code..."
          }
        />
        
        {!isConnected && (
          <div className="connection-status">
            <span className="connection-indicator offline">
              ⚠️ Not connected to assistant
            </span>
          </div>
        )}
      </div>
    </div>
  );
};