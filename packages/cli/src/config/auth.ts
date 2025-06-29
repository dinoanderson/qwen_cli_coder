/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '@qwen/qwen-cli-core';
import { loadEnvironment } from './config.js';

export const validateAuthMethod = (authMethod: string): string | null => {
  loadEnvironment();
  
  if (authMethod === AuthType.USE_QWEN_DASHSCOPE) {
    const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!qwenApiKey) {
      return 'QWEN_API_KEY or DASHSCOPE_API_KEY environment variable not found. Add one to your .env and try again, no reload needed!';
    }
    return null;
  }

  return 'Invalid auth method selected.';
};
