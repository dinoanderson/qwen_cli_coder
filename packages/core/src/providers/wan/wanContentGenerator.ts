/**
 * @license
 * Copyright 2025 Wan Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WanConfig,
  WanVideoGenerationRequest,
  WanImageToVideoRequest,
  WanImageTransformRequest,
  WanGenerationResponse,
  WanTaskStatusResponse,
  WAN_MODELS,
} from './wanTypes.js';

export class WanContentGenerator {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: WanConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://dashscope-intl.aliyuncs.com/api/v1';
    
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateVideo(request: Omit<WanVideoGenerationRequest, 'model'>): Promise<WanGenerationResponse> {
    const fullRequest: WanVideoGenerationRequest = {
      model: WAN_MODELS.VIDEO_GENERATION,
      ...request,
    };

    const response = await fetch(`${this.baseUrl}/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(fullRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wan API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async generateImageToVideo(request: Omit<WanImageToVideoRequest, 'model'>): Promise<WanGenerationResponse> {
    const fullRequest: WanImageToVideoRequest = {
      model: request.parameters?.duration && request.parameters.duration > 5 
        ? WAN_MODELS.IMAGE_TO_VIDEO_PLUS 
        : WAN_MODELS.IMAGE_TO_VIDEO_TURBO,
      ...request,
    };

    const response = await fetch(`${this.baseUrl}/services/aigc/multimodal-generation/generation`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(fullRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wan API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async transformImage(request: Omit<WanImageTransformRequest, 'model'>): Promise<WanGenerationResponse> {
    const fullRequest: WanImageTransformRequest = {
      model: WAN_MODELS.IMAGE_TRANSFORM,
      ...request,
    };

    const response = await fetch(`${this.baseUrl}/services/aigc/image-generation/generation`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(fullRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wan API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }


  async checkTaskStatus(taskId: string): Promise<WanTaskStatusResponse> {
    // According to API docs, we need to use GET with task_id as query parameter
    const url = new URL(`${this.baseUrl}/services/aigc/multimodal-generation/generation`);
    url.searchParams.append('task_id', taskId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wan API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async *pollTaskStatus(
    taskId: string, 
    options: { interval?: number; timeout?: number } = {}
  ): AsyncGenerator<WanTaskStatusResponse> {
    const interval = options.interval || 2000; // 2 seconds
    const timeout = options.timeout || 300000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.checkTaskStatus(taskId);
      yield status;

      if (status.output.task_status === 'SUCCEEDED' || status.output.task_status === 'FAILED') {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Task timeout exceeded');
  }

  async waitForCompletion(taskId: string, onProgress?: (status: WanTaskStatusResponse) => void): Promise<WanTaskStatusResponse> {
    for await (const status of this.pollTaskStatus(taskId)) {
      if (onProgress) {
        onProgress(status);
      }
      
      if (status.output.task_status === 'SUCCEEDED' || status.output.task_status === 'FAILED') {
        return status;
      }
    }

    throw new Error('Task failed to complete');
  }
}