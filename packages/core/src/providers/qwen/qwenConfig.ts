/**
 * @license
 * Copyright 2025 Qwen Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import { QwenConfig } from './qwenTypes.js';

/**
 * Default configuration for Qwen
 */
export const DEFAULT_QWEN_CONFIG: Partial<QwenConfig> = {
  baseUrl: 'https://dashscope-intl.aliyuncs.com/api/v1',
  model: 'qwen-plus',
  enableThinking: false,
};

/**
 * Qwen model capabilities
 */
export const QWEN_MODEL_CAPABILITIES = {
  'qwen-plus': {
    supportsTools: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsThinking: true,
  },
  'qwen3-235b-a22b': {
    supportsTools: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsThinking: true,
  },
  'qwen-max': {
    supportsTools: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsThinking: true,
  },
  'qwen-turbo': {
    supportsTools: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsThinking: false,
  },
  'qwen-vl-plus': {
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsThinking: false,
  },
};

/**
 * Get the international endpoint for regions that require it
 */
export function getQwenEndpoint(region?: string): string {
  // For most international users, use the international endpoint
  return process.env.QWEN_BASE_URL || DEFAULT_QWEN_CONFIG.baseUrl!;
}