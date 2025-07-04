/**
 * @license
 * Copyright 2025 Qwen Integration
 * SPDX-License-Identifier: Apache-2.0
 */

// Qwen API Request Types
export interface QwenMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface QwenGenerateRequest {
  model: string;
  messages: QwenMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  functions?: QwenFunction[]; // Legacy format
  tools?: QwenTool[]; // New format
  extra_body?: {
    enable_thinking?: boolean;
  };
}

export interface QwenFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface QwenTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

// Qwen API Response Types
export interface QwenGenerateResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: QwenChoice[];
  usage?: QwenUsage;
}

export interface QwenChoice {
  index: number;
  message: QwenMessage;
  finish_reason: string | null;
  delta?: QwenMessage;
}

export interface QwenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Qwen Streaming Response
export interface QwenStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: QwenStreamChoice[];
  usage?: QwenUsage;
}

export interface QwenStreamChoice {
  index: number;
  delta: {
    role?: string;
    content?: string;
    reasoning_content?: string;
    function_call?: {
      name?: string;
      arguments?: string;
    };
  };
  finish_reason: string | null;
}

// Token counting
export interface QwenTokenCountRequest {
  model: string;
  messages: QwenMessage[];
}

export interface QwenTokenCountResponse {
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Embedding
export interface QwenEmbedRequest {
  model: string;
  input: string | string[];
}

export interface QwenEmbedResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Configuration
export interface QwenConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  enableThinking?: boolean;
}