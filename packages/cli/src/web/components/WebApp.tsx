/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Config } from '@qwen/qwen-cli-core';
import { LoadedSettings } from '../../config/settings.js';
import { ChatContainer } from './ChatContainer.js';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import '../styles/WebApp.css';

export interface WebAppProps {
  config?: Config;
  settings?: LoadedSettings;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCall?: any;
  usage?: any;
}

export interface AppConfig {
  model: string;
  debugMode: boolean;
  assistantMode: boolean;
  approvalMode: string;
}

export const WebApp: React.FC<WebAppProps> = ({ config, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { sendMessage, connectionStatus } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConfigUpdate: handleConfigUpdate,
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
  });

  function handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'welcome':
        setAppConfig(data.config);
        addSystemMessage('Connected to Qwen Assistant');
        break;
      
      case 'content':
        if (data.content) {
          setCurrentStreamingMessage(prev => prev + data.content);
          setIsStreaming(true);
        }
        break;
      
      case 'completed':
        if (currentStreamingMessage) {
          addMessage({
            id: generateId(),
            type: 'assistant',
            content: currentStreamingMessage,
            timestamp: new Date(),
          });
          setCurrentStreamingMessage('');
        }
        setIsStreaming(false);
        break;
      
      case 'tool_call_request':
        addMessage({
          id: generateId(),
          type: 'tool',
          content: `🔧 Using tool: ${data.toolCall.name}`,
          timestamp: new Date(),
          toolCall: data.toolCall,
        });
        break;
      
      case 'tool_call_response':
        // Tool responses are usually handled internally
        // We can show a brief notification or update the tool message
        break;
      
      case 'usage_metadata':
        // Update the last assistant message with usage info
        setMessages(prev => {
          const updated = [...prev];
          const lastAssistantIndex = updated.map((m, i) => ({ m, i })).filter(({ m }) => m.type === 'assistant').pop()?.i ?? -1;
          if (lastAssistantIndex >= 0) {
            updated[lastAssistantIndex] = {
              ...updated[lastAssistantIndex],
              usage: data.usage
            };
          }
          return updated;
        });
        break;
      
      case 'thought':
        // Show thinking indicator (optional)
        console.log('Assistant thinking:', data.thought);
        break;
      
      case 'processing':
        setIsStreaming(true);
        break;
    }
  }

  function handleConfigUpdate(config: AppConfig) {
    setAppConfig(config);
  }

  function addMessage(message: ChatMessage) {
    setMessages(prev => [...prev, message]);
  }

  function addSystemMessage(content: string) {
    addMessage({
      id: generateId(),
      type: 'system',
      content,
      timestamp: new Date(),
    });
  }

  function handleSendMessage(content: string) {
    // Add user message to UI
    addMessage({
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
    });

    // Send to backend via WebSocket
    sendMessage({
      type: 'user_message',
      data: { text: content },
    });
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Load initial config if not provided via props
  useEffect(() => {
    if (!config && !appConfig) {
      fetch('/api/config')
        .then(res => res.json())
        .then(setAppConfig)
        .catch(console.error);
    }
  }, [config, appConfig]);

  return (
    <div className="web-app">
      <Header 
        model={appConfig?.model}
        isConnected={isConnected}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="app-body">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          config={appConfig}
        />
        
        <ChatContainer
          messages={messages}
          currentStreamingMessage={currentStreamingMessage}
          isStreaming={isStreaming}
          isConnected={isConnected}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};