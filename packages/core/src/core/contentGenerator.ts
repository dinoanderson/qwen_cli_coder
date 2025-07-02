/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
} from '@google/genai';
import { DEFAULT_QWEN_MODEL } from '../config/models.js';
import { QwenContentGenerator } from '../providers/qwen/qwenContentGenerator.js';

/**
 * Interface abstracting the core functionalities for generating content and counting tokens.
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;

  // Optional methods for thinking mode control
  setEnableThinking?(enable: boolean): void;
  getEnableThinking?(): boolean;
}

export enum AuthType {
  USE_QWEN_DASHSCOPE = 'qwen-dashscope',
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  vertexai?: boolean;
  authType?: AuthType | undefined;
  qwenBaseUrl?: string;
  enableThinking?: boolean;
};

export async function createContentGeneratorConfig(
  model: string | undefined,
  authType: AuthType | undefined,
  config?: { getModel?: () => string },
  enableThinking?: boolean,
): Promise<ContentGeneratorConfig> {
  
  const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  const qwenBaseUrl = process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/api/v1';

  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_QWEN_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType: AuthType.USE_QWEN_DASHSCOPE,
  };

  if (!qwenApiKey) {
    throw new Error('QWEN_API_KEY or DASHSCOPE_API_KEY environment variable is required');
  }

  contentGeneratorConfig.apiKey = qwenApiKey;
  contentGeneratorConfig.qwenBaseUrl = qwenBaseUrl;
  
  // Priority: environment variable > settings parameter > default false
  const envThinking = process.env.QWEN_ENABLE_THINKING === 'true';
  contentGeneratorConfig.enableThinking = envThinking || enableThinking || false;

  return contentGeneratorConfig;
}

export async function createContentGenerator(
  config: ContentGeneratorConfig,
): Promise<ContentGenerator> {
  if (config.authType === AuthType.USE_QWEN_DASHSCOPE) {
    return new QwenContentGenerator({
      apiKey: config.apiKey || '',
      baseUrl: config.qwenBaseUrl,
      model: config.model,
      enableThinking: config.enableThinking || false,
    });
  }

  throw new Error(
    `Error creating contentGenerator: Unsupported authType: ${config.authType}`,
  );
}
