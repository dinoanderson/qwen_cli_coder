/**
 * @license
 * Copyright 2025 Wan Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, ToolResult } from './tools.js';
import { z } from 'zod';
import { WanContentGenerator } from '../providers/wan/wanContentGenerator.js';
import { WAN_VIDEO_RESOLUTIONS, WAN_ASPECT_RATIOS } from '../providers/wan/wanTypes.js';

export interface GenerateVideoParams {
  prompt: string;
  duration?: number;
  resolution?: string;
  language?: string;
  style?: string;
  aspectRatio?: string;
  referenceImage?: string;
}

const GenerateVideoParamsSchema = z.object({
  prompt: z.string().describe('Text description of the video to generate'),
  duration: z.number().min(1).max(60).optional().describe('Video duration in seconds (1-60)'),
  resolution: z.enum(['720p', '1080p', '4k']).optional().describe('Video resolution'),
  language: z.enum(['en', 'zh', 'bilingual']).optional().describe('Language for text effects'),
  style: z.string().optional().describe('Video style (e.g., "cinematic", "cartoon", "realistic")'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']).optional().describe('Aspect ratio'),
  referenceImage: z.string().optional().describe('URL or path to reference image'),
});

export class GenerateVideoTool extends BaseTool<GenerateVideoParams, ToolResult> {
  static readonly Name = 'generate_video';

  name = GenerateVideoTool.Name;
  description = 'Generate a video from text description using Alibaba Wan model. Supports bilingual text effects and various styles.';

  get schema() {
    return {
      name: this.name,
      description: this.description,
      parameters: GenerateVideoParamsSchema.shape as any,
    };
  }

  private wanGenerator: WanContentGenerator | null = null;

  private getWanGenerator(): WanContentGenerator {
    if (!this.wanGenerator) {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
      if (!apiKey) {
        throw new Error('DASHSCOPE_API_KEY or QWEN_API_KEY environment variable is required for Wan video generation');
      }

      this.wanGenerator = new WanContentGenerator({
        apiKey,
        baseUrl: process.env.WAN_BASE_URL || process.env.QWEN_BASE_URL,
      });
    }
    return this.wanGenerator;
  }

  async execute(
    params: GenerateVideoParams,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    try {
      const wan = this.getWanGenerator();

      // Start video generation
      const response = await wan.generateVideo({
        input: {
          prompt: params.prompt,
          duration: params.duration || 10,
          resolution: params.resolution || '1080p',
          language: (params.language as 'en' | 'zh' | 'bilingual') || 'en',
          style: params.style,
          aspect_ratio: params.aspectRatio || '16:9',
          reference_image: params.referenceImage,
        },
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      });

      if (response.output.task_status === 'FAILED') {
        const errorMessage = `Video generation failed: ${response.output.error_message || 'Unknown error'}`;
        return {
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        };
      }

      const taskId = response.output.task_id;

      // Poll for completion
      let lastStatus: string = response.output.task_status;
      let progress = 0;

      const finalStatus = await wan.waitForCompletion(taskId, (status) => {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        lastStatus = status.output.task_status;
        progress = status.output.progress || 0;

        // Log progress for debugging
        console.log(`Video generation progress: ${progress}% - Status: ${lastStatus}`);
      });

      if (finalStatus.output.task_status === 'SUCCEEDED') {
        const videoUrl = finalStatus.output.video_url;
        const duration = params.duration || 10;
        const resolution = params.resolution || '1080p';

        const displayContent = `
## Video Generated Successfully! 🎬

**Prompt:** ${params.prompt}
**Duration:** ${duration} seconds
**Resolution:** ${resolution}
**Language:** ${params.language || 'en'}
${params.style ? `**Style:** ${params.style}` : ''}
${params.aspectRatio ? `**Aspect Ratio:** ${params.aspectRatio}` : ''}

**Video URL:** ${videoUrl}

You can download the video from the URL above or use it in your applications.
        `.trim();

        return {
          llmContent: `Generated video successfully. URL: ${videoUrl}`,
          returnDisplay: displayContent,
        };
      } else {
        const errorMessage = `Video generation failed: ${finalStatus.output.error_message || 'Unknown error'}`;
        return {
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        };
      }
    } catch (error) {
      if (signal?.aborted) {
        return {
          llmContent: 'Video generation was cancelled',
          returnDisplay: 'Video generation was cancelled',
        };
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullError = `Failed to generate video: ${errorMessage}`;
      return {
        llmContent: fullError,
        returnDisplay: fullError,
      };
    }
  }
}