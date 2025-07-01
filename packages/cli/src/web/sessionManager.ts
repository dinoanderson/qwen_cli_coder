/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';
import { createReadStream, createWriteStream } from 'node:fs';

const streamPipeline = promisify(pipeline);

export interface SessionFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
  path: string;
}

export interface Session {
  id: string;
  createdAt: Date;
  lastAccessedAt: Date;
  files: Map<string, SessionFile>;
  tempDir: string;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private baseDir: string;
  private maxFileSize: number;
  private maxFilesPerSession: number;
  private sessionTimeout: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    baseDir?: string,
    maxFileSize: number = 100 * 1024 * 1024, // 100MB
    maxFilesPerSession: number = 50,
    sessionTimeoutMs: number = 3600000 // 1 hour
  ) {
    this.baseDir = baseDir || path.join(os.tmpdir(), 'qwen-assistant-sessions');
    this.maxFileSize = maxFileSize;
    this.maxFilesPerSession = maxFilesPerSession;
    this.sessionTimeout = sessionTimeoutMs;

    // Ensure base directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Run every minute
  }

  createSession(): Session {
    const sessionId = randomUUID();
    const tempDir = path.join(this.baseDir, sessionId);
    
    // Create session directory
    fs.mkdirSync(tempDir, { recursive: true });

    const session: Session = {
      id: sessionId,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      files: new Map(),
      tempDir
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
    }
    return session;
  }

  async addFile(
    sessionId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string
  ): Promise<SessionFile> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.files.size >= this.maxFilesPerSession) {
      throw new Error(`Maximum files per session (${this.maxFilesPerSession}) exceeded`);
    }

    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size (${this.maxFileSize} bytes)`);
    }

    const fileId = randomUUID();
    const ext = path.extname(originalName);
    const filename = `${fileId}${ext}`;
    const filePath = path.join(session.tempDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, fileBuffer);

    const sessionFile: SessionFile = {
      id: fileId,
      originalName,
      filename,
      mimetype,
      size: fileBuffer.length,
      uploadedAt: new Date(),
      path: filePath
    };

    session.files.set(fileId, sessionFile);
    return sessionFile;
  }

  async addFileFromPath(
    sessionId: string,
    sourcePath: string,
    originalName?: string,
    mimetype?: string
  ): Promise<SessionFile> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.files.size >= this.maxFilesPerSession) {
      throw new Error(`Maximum files per session (${this.maxFilesPerSession}) exceeded`);
    }

    const stats = await fs.promises.stat(sourcePath);
    if (stats.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size (${this.maxFileSize} bytes)`);
    }

    const fileId = randomUUID();
    const name = originalName || path.basename(sourcePath);
    const ext = path.extname(name);
    const filename = `${fileId}${ext}`;
    const filePath = path.join(session.tempDir, filename);

    // Copy file to session directory
    await streamPipeline(
      createReadStream(sourcePath),
      createWriteStream(filePath)
    );

    const sessionFile: SessionFile = {
      id: fileId,
      originalName: name,
      filename,
      mimetype: mimetype || 'application/octet-stream',
      size: stats.size,
      uploadedAt: new Date(),
      path: filePath
    };

    session.files.set(fileId, sessionFile);
    return sessionFile;
  }

  getFile(sessionId: string, fileId: string): SessionFile | undefined {
    const session = this.getSession(sessionId);
    if (!session) {
      return undefined;
    }
    return session.files.get(fileId);
  }

  getSessionFiles(sessionId: string): SessionFile[] {
    const session = this.getSession(sessionId);
    if (!session) {
      return [];
    }
    return Array.from(session.files.values());
  }

  async removeFile(sessionId: string, fileId: string): Promise<boolean> {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const file = session.files.get(fileId);
    if (!file) {
      return false;
    }

    try {
      await fs.promises.unlink(file.path);
      session.files.delete(fileId);
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      return false;
    }
  }

  async removeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      // Remove session directory and all files
      await fs.promises.rm(session.tempDir, { recursive: true, force: true });
      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error('Error removing session:', error);
      return false;
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const lastAccessed = session.lastAccessedAt.getTime();
      if (now - lastAccessed > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.removeSession(sessionId);
      console.log(`Cleaned up expired session: ${sessionId}`);
    }
  }

  async cleanup(): Promise<void> {
    clearInterval(this.cleanupInterval);
    
    // Remove all sessions
    for (const sessionId of this.sessions.keys()) {
      await this.removeSession(sessionId);
    }

    // Remove base directory
    try {
      await fs.promises.rm(this.baseDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up sessions directory:', error);
    }
  }

  getSupportedFileTypes(): string[] {
    return [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      
      // Documents
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/xml',
      
      // Office documents (for display purposes, not parsing)
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Archives (for listing contents)
      'application/zip',
      'application/x-tar',
      'application/gzip'
    ];
  }
}