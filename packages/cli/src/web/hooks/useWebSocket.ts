/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  id?: string;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  onMessage: (data: any) => void;
  onConfigUpdate: (config: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export interface UseWebSocketReturn {
  sendMessage: (message: WebSocketMessage) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: any;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    onMessage,
    onConfigUpdate,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      onConnect?.();
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        if (message.type === 'system_message') {
          onMessage(message.data);
        } else if (message.type === 'config_update') {
          onConfigUpdate(message.data);
        } else if (message.type === 'error') {
          console.error('WebSocket error:', message.data);
          onMessage(message.data);
        } else {
          onMessage(message.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected');
      onDisconnect?.();
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          connect();
        }, delay);
      } else {
        setConnectionStatus('error');
      }
    };

    wsRef.current.onerror = (error) => {
      setConnectionStatus('error');
      onError?.(error);
    };
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  };

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Manual reconnect function
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttempts.current = 0;
    connect();
  };

  return {
    sendMessage,
    connectionStatus,
    lastMessage,
  };
}