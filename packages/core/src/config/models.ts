/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

// Qwen model configurations
export const DEFAULT_QWEN_MODEL = 'qwen-turbo-latest';

export interface QwenModelConfig {
  name: string;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  thinkingWindow?: number;
  description: string;
  isVisionModel?: boolean;
  pricing?: {
    input: number;
    output: number;
    outputThinking?: number;
  };
  rateLimits?: {
    qpm: number;
    tpm: number;
  };
}

export const QWEN_MODELS: Record<string, QwenModelConfig> = {
  'qwen-turbo-latest': {
    name: 'qwen-turbo-latest',
    displayName: 'Qwen Turbo Latest',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    thinkingWindow: 131072,
    description: 'Fast, cost-effective LLM (dynamic updates)',
    pricing: {
      input: 0.05,           // $0.05 per million tokens
      output: 0.2,           // $0.2 per million tokens
      outputThinking: 1.0,   // $1 per million tokens
    },
    rateLimits: {
      qpm: 600,              // Queries per minute
      tpm: 5000000,          // Tokens per minute
    },
  },
  'qwen3-235b-a22b': {
    name: 'qwen3-235b-a22b',
    displayName: 'Qwen3 235B A22B',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    thinkingWindow: 131072,
    description: 'Qwen3, the latest generation LLM',
    pricing: {
      input: 0.7,            // $0.7 per million tokens
      output: 2.8,           // $2.8 per million tokens
      outputThinking: 8.4,   // $8.4 per million tokens
    },
    rateLimits: {
      qpm: 600,              // Queries per minute
      tpm: 1000000,          // Tokens per minute
    },
  },
  'qwen-vl-plus-latest': {
    name: 'qwen-vl-plus-latest',
    displayName: 'Qwen VL Plus Latest',
    contextWindow: 32000,
    maxOutputTokens: 2000,
    description: '[Vision-Language Model] with dynamic updates',
    isVisionModel: true,
    pricing: {
      input: 0.21,           // $0.21 per million tokens
      output: 0.63,          // $0.63 per million tokens
    },
    rateLimits: {
      qpm: 1200,             // Queries per minute
      tpm: 1000000,          // Tokens per minute
    },
  },
};
