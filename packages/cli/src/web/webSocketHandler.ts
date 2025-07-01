/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocket } from 'ws';
import { Config, QwenEventType, ServerQwenStreamEvent, Turn } from '@qwen/qwen-cli-core';
import { LoadedSettings } from '../config/settings.js';
import { SessionManager, SessionFile } from './sessionManager.js';

export interface WebSocketMessage {
  type: 'user_message' | 'system_message' | 'error' | 'config_update' | 'file_upload' | 'file_list' | 'file_remove';
  data: any;
  id?: string;
  timestamp?: string;
}

export interface UserMessage {
  text: string;
  sessionId?: string;
  fileIds?: string[];
}

export interface FileUploadData {
  sessionId: string;
  filename: string;
  mimetype: string;
  data: string; // Base64 encoded
}

export class WebSocketHandler {
  private config: Config;
  private settings: LoadedSettings;
  private clients: Map<WebSocket, string> = new Map(); // WebSocket -> sessionId
  private sessionManager: SessionManager;

  constructor(config: Config, settings: LoadedSettings) {
    this.config = config;
    this.settings = settings;
    this.sessionManager = new SessionManager();
  }

  public handleConnection(ws: WebSocket): void {
    // Create session for this connection
    const session = this.sessionManager.createSession();
    this.clients.set(ws, session.id);
    
    // Send initial config to client
    this.sendToClient(ws, {
      type: 'system_message',
      data: {
        type: 'welcome',
        config: {
          model: this.config.getModel(),
          debugMode: this.config.getDebugMode(),
          assistantMode: this.config.getAssistantMode(),
        },
        sessionId: session.id,
        supportedFileTypes: this.sessionManager.getSupportedFileTypes()
      },
      timestamp: new Date().toISOString(),
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        this.sendError(ws, 'Invalid message format', error);
      }
    });

    ws.on('close', async () => {
      const sessionId = this.clients.get(ws);
      if (sessionId) {
        await this.sessionManager.removeSession(sessionId);
      }
      this.clients.delete(ws);
      if (this.config.getDebugMode()) {
        console.log('WebSocket client disconnected');
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
    switch (message.type) {
      case 'user_message':
        await this.handleUserMessage(ws, message.data as UserMessage);
        break;
      case 'file_upload':
        await this.handleFileUpload(ws, message.data as FileUploadData);
        break;
      case 'file_list':
        await this.handleFileList(ws);
        break;
      case 'file_remove':
        await this.handleFileRemove(ws, message.data);
        break;
      case 'config_update':
        this.handleConfigUpdate(message.data);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleUserMessage(ws: WebSocket, userMessage: UserMessage): Promise<void> {
    try {
      if (!userMessage.text || userMessage.text.trim() === '') {
        this.sendError(ws, 'Empty message not allowed');
        return;
      }

      const sessionId = this.clients.get(ws);
      if (!sessionId) {
        this.sendError(ws, 'Session not found');
        return;
      }

      // Send acknowledgment
      this.sendToClient(ws, {
        type: 'system_message',
        data: {
          type: 'processing',
          message: 'Processing your request...'
        },
        timestamp: new Date().toISOString(),
      });

      // Get Qwen client and process the message
      const qwenClient = this.config.getQwenClient();
      const turn = new Turn(qwenClient.getChat());
      
      // Build message parts including file references
      const parts: any[] = [];
      
      // Add file references if any
      if (userMessage.fileIds && userMessage.fileIds.length > 0) {
        for (const fileId of userMessage.fileIds) {
          const file = this.sessionManager.getFile(sessionId, fileId);
          if (file) {
            // Add file reference to the message
            parts.push({
              text: `[File: ${file.originalName} (${file.mimetype}, ${this.formatFileSize(file.size)})]`
            });
            
            // For text files, we could include content
            if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json') {
              try {
                const fs = await import('node:fs');
                const content = await fs.promises.readFile(file.path, 'utf-8');
                parts.push({
                  text: `\nFile content:\n\`\`\`\n${content.substring(0, 10000)}\n\`\`\`\n`
                });
              } catch (err) {
                console.error('Error reading file content:', err);
              }
            }
          }
        }
      }
      
      // Add user text
      parts.push({ text: userMessage.text.trim() });
      
      // Create abort controller for cancellation support
      const abortController = new AbortController();
      
      // Process the turn and stream responses
      for await (const event of turn.run(parts, abortController.signal)) {
        await this.handleQwenEvent(ws, event);
      }

      // Send completion message
      this.sendToClient(ws, {
        type: 'system_message',
        data: {
          type: 'completed',
          message: 'Response completed'
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.sendError(ws, 'Error processing message', error);
    }
  }

  private async handleQwenEvent(ws: WebSocket, event: ServerQwenStreamEvent): Promise<void> {
    switch (event.type) {
      case QwenEventType.Content:
        this.sendToClient(ws, {
          type: 'system_message',
          data: {
            type: 'content',
            content: event.value
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case QwenEventType.ToolCallRequest:
        this.sendToClient(ws, {
          type: 'system_message',
          data: {
            type: 'tool_call_request',
            toolCall: event.value
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case QwenEventType.ToolCallResponse:
        this.sendToClient(ws, {
          type: 'system_message',
          data: {
            type: 'tool_call_response',
            toolResponse: event.value
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case QwenEventType.Error:
        this.sendError(ws, 'Qwen processing error', event.value.error);
        break;

      case QwenEventType.UsageMetadata:
        this.sendToClient(ws, {
          type: 'system_message',
          data: {
            type: 'usage_metadata',
            usage: event.value
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case QwenEventType.Thought:
        this.sendToClient(ws, {
          type: 'system_message',
          data: {
            type: 'thought',
            thought: event.value
          },
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        if (this.config.getDebugMode()) {
          console.log('Unhandled Qwen event type:', event.type);
        }
    }
  }

  private handleConfigUpdate(configUpdate: any): void {
    // Handle configuration updates from web interface
    // This could include changing models, debug mode, etc.
    if (this.config.getDebugMode()) {
      console.log('Config update received:', configUpdate);
    }
    
    // Broadcast config changes to all clients
    this.broadcastToAllClients({
      type: 'config_update',
      data: configUpdate,
      timestamp: new Date().toISOString(),
    });
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, message: string, error?: any): void {
    const errorMessage: WebSocketMessage = {
      type: 'error',
      data: {
        message,
        error: error?.message || error,
        stack: this.config.getDebugMode() ? error?.stack : undefined
      },
      timestamp: new Date().toISOString(),
    };
    
    this.sendToClient(ws, errorMessage);
  }

  private broadcastToAllClients(message: WebSocketMessage): void {
    this.clients.forEach((_sessionId, client) => {
      this.sendToClient(client, message);
    });
  }

  private async handleFileUpload(ws: WebSocket, fileData: FileUploadData): Promise<void> {
    try {
      const sessionId = this.clients.get(ws);
      if (!sessionId) {
        this.sendError(ws, 'Session not found');
        return;
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData.data, 'base64');
      
      // Add file to session
      const file = await this.sessionManager.addFile(
        sessionId,
        buffer,
        fileData.filename,
        fileData.mimetype
      );

      // Send success response
      this.sendToClient(ws, {
        type: 'system_message',
        data: {
          type: 'file_uploaded',
          file: {
            id: file.id,
            name: file.originalName,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: file.uploadedAt
          }
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.sendError(ws, 'Error uploading file', error);
    }
  }

  private async handleFileList(ws: WebSocket): Promise<void> {
    try {
      const sessionId = this.clients.get(ws);
      if (!sessionId) {
        this.sendError(ws, 'Session not found');
        return;
      }

      const files = this.sessionManager.getSessionFiles(sessionId);
      
      this.sendToClient(ws, {
        type: 'system_message',
        data: {
          type: 'file_list',
          files: files.map(f => ({
            id: f.id,
            name: f.originalName,
            size: f.size,
            mimetype: f.mimetype,
            uploadedAt: f.uploadedAt
          }))
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.sendError(ws, 'Error listing files', error);
    }
  }

  private async handleFileRemove(ws: WebSocket, data: { fileId: string }): Promise<void> {
    try {
      const sessionId = this.clients.get(ws);
      if (!sessionId) {
        this.sendError(ws, 'Session not found');
        return;
      }

      const success = await this.sessionManager.removeFile(sessionId, data.fileId);
      
      this.sendToClient(ws, {
        type: 'system_message',
        data: {
          type: 'file_removed',
          fileId: data.fileId,
          success
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.sendError(ws, 'Error removing file', error);
    }
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  public async close(): Promise<void> {
    // Clean up all sessions
    for (const sessionId of this.clients.values()) {
      await this.sessionManager.removeSession(sessionId);
    }
    
    // Close all WebSocket connections
    this.clients.forEach((_sessionId, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    
    this.clients.clear();
    
    // Clean up session manager
    await this.sessionManager.cleanup();
  }
}