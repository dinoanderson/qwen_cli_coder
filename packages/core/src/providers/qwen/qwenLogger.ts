/**
 * @license
 * Copyright 2025 Qwen Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

const LOG_DIR = path.join(homedir(), '.qwen', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'qwen-api.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export interface QwenApiLog {
  timestamp: string;
  type: 'request' | 'response' | 'error';
  endpoint: string;
  method: string;
  requestId?: string;
  data: any;
}

export class QwenApiLogger {
  private static instance: QwenApiLogger;
  private enabled: boolean;
  private logToConsole: boolean;
  private logToFile: boolean;

  private constructor() {
    // Check environment variables for logging configuration
    this.enabled = process.env.QWEN_API_LOG === 'true' || process.env.QWEN_API_LOG === '1';
    this.logToConsole = process.env.QWEN_API_LOG_CONSOLE !== 'false';
    this.logToFile = process.env.QWEN_API_LOG_FILE !== 'false';
  }

  static getInstance(): QwenApiLogger {
    if (!QwenApiLogger.instance) {
      QwenApiLogger.instance = new QwenApiLogger();
    }
    return QwenApiLogger.instance;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  logRequest(endpoint: string, method: string, requestBody: any): void {
    if (!this.enabled) return;

    const log: QwenApiLog = {
      timestamp: new Date().toISOString(),
      type: 'request',
      endpoint,
      method,
      data: requestBody,
    };

    this.writeLog(log);
  }

  logResponse(endpoint: string, method: string, responseData: any, requestId?: string): void {
    if (!this.enabled) return;

    const log: QwenApiLog = {
      timestamp: new Date().toISOString(),
      type: 'response',
      endpoint,
      method,
      requestId,
      data: responseData,
    };

    this.writeLog(log);
  }

  logError(endpoint: string, method: string, error: any): void {
    if (!this.enabled) return;

    const log: QwenApiLog = {
      timestamp: new Date().toISOString(),
      type: 'error',
      endpoint,
      method,
      data: {
        error: error.message || error,
        stack: error.stack,
      },
    };

    this.writeLog(log);
  }

  private writeLog(log: QwenApiLog): void {
    const logString = JSON.stringify(log, null, 2);

    // Log to console if enabled
    if (this.logToConsole) {
      const prefix = log.type === 'error' ? '❌' : log.type === 'request' ? '📤' : '📥';
      console.log(`\n${prefix} [QWEN API ${log.type.toUpperCase()}] ${log.timestamp}`);
      console.log(`Endpoint: ${log.endpoint}`);
      
      if (log.type === 'request') {
        // Log messages in a readable format
        if (log.data?.input?.messages) {
          console.log('Messages:');
          log.data.input.messages.forEach((msg: any, idx: number) => {
            console.log(`  [${idx}] ${msg.role}: ${msg.content?.substring(0, 100)}${msg.content?.length > 100 ? '...' : ''}`);
          });
        }
        // Log model and parameters
        if (log.data?.model) {
          console.log(`Model: ${log.data.model}`);
        }
        if (log.data?.parameters) {
          console.log('Parameters:', JSON.stringify(log.data.parameters, null, 2));
        }
      } else if (log.type === 'response') {
        // Log response summary
        if (log.data?.output?.text) {
          console.log(`Response: ${log.data.output.text.substring(0, 200)}${log.data.output.text.length > 200 ? '...' : ''}`);
        }
        if (log.data?.usage) {
          console.log('Usage:', log.data.usage);
        }
      } else if (log.type === 'error') {
        console.log('Error:', log.data.error);
      }
      console.log('---');
    }

    // Log to file if enabled
    if (this.logToFile) {
      fs.appendFileSync(LOG_FILE, logString + '\n\n', 'utf8');
    }
  }

  // Utility method to pretty print messages for debugging
  static formatMessages(messages: any[]): string {
    return messages.map((msg, idx) => {
      const role = msg.role || 'unknown';
      const content = msg.content || '';
      const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
      return `[${idx}] ${role}:\n${preview}`;
    }).join('\n\n');
  }
}

// Export singleton instance
export const qwenApiLogger = QwenApiLogger.getInstance();