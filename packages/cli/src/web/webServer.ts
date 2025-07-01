/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Config } from '@qwen/qwen-cli-core';
import { LoadedSettings } from '../config/settings.js';
import { WebSocketHandler } from './webSocketHandler.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WebServerConfig {
  port: number;
  host: string;
}

export class WebServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer | null = null;
  private config: Config;
  private settings: LoadedSettings;
  private webSocketHandler: WebSocketHandler;
  private upload: multer.Multer;

  constructor(
    config: Config,
    settings: LoadedSettings,
    serverConfig: WebServerConfig = { port: 3000, host: 'localhost' }
  ) {
    this.config = config;
    this.settings = settings;
    this.app = express();
    this.webSocketHandler = new WebSocketHandler(config, settings);
    
    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.server = createServer(this.app);
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      // Add CSP headers for inline styles and scripts
      res.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:;");
      next();
    });
    
    // Serve static files from web directory (current directory since we're already in web/)
    this.app.use(express.static(__dirname));
  }

  private setupRoutes(): void {
    // API routes
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/config', (req, res) => {
      res.json({
        model: this.config.getModel(),
        debugMode: this.config.getDebugMode(),
        approvalMode: this.config.getApprovalMode(),
        assistantMode: this.config.getAssistantMode(),
      });
    });

    // File upload endpoint
    this.app.post('/api/upload', this.upload.single('file') as any, async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' });
        }

        const sessionId = req.body.sessionId || req.query.sessionId;
        if (!sessionId) {
          return res.status(400).json({ error: 'Session ID required' });
        }

        // This endpoint is provided for future use or direct HTTP uploads
        // Currently, file uploads are handled via WebSocket
        res.json({
          message: 'File upload endpoint available',
          note: 'Please use WebSocket for file uploads in the current implementation'
        });
      } catch (error) {
        res.status(500).json({ error: 'File upload failed' });
      }
    });

    // Serve the main application for all other routes
    this.app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'index.html'));
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ server: this.server });
    
    this.wss.on('connection', (ws, request) => {
      if (this.config.getDebugMode()) {
        console.log('WebSocket client connected from:', request.socket.remoteAddress);
      }
      
      this.webSocketHandler.handleConnection(ws);
    });
  }

  public async start(serverConfig: WebServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(serverConfig.port, serverConfig.host, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🚀 Qwen Assistant running at http://${serverConfig.host}:${serverConfig.port}`);
          resolve();
        }
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }
      
      this.server.close(() => {
        console.log('✓ Web server stopped');
        resolve();
      });
    });
  }

  public getUrl(serverConfig: WebServerConfig): string {
    return `http://${serverConfig.host}:${serverConfig.port}`;
  }
}