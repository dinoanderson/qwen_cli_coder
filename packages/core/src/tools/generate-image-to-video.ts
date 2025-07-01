/**
 * @license
 * Copyright 2025 Wan Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, ToolResult } from './tools.js';
import { z } from 'zod';
import { WanContentGenerator } from '../providers/wan/wanContentGenerator.js';

export interface GenerateImageToVideoParams {
  imageUrl: string;
  prompt?: string;
  duration?: number;
  fps?: number;
  seed?: number;
}

const GenerateImageToVideoParamsSchema = z.object({
  imageUrl: z.string().describe('URL of the source image to convert to video'),
  prompt: z.string().optional().describe('Optional text prompt to guide video generation'),
  duration: z.number().min(1).max(10).optional().describe('Video duration in seconds (1-5 for turbo, 1-10 for plus)'),
  fps: z.number().min(8).max(30).optional().describe('Frames per second (default: 24)'),
  seed: z.number().optional().describe('Random seed for reproducible results'),
});

export class GenerateImageToVideoTool extends BaseTool<GenerateImageToVideoParams, ToolResult> {
  static readonly Name = 'generate_image_to_video';

  name = GenerateImageToVideoTool.Name;
  description = 'Convert a static image to a dynamic video using Alibaba Wan image-to-video models. Creates smooth, realistic video from a single image.';

  get schema() {
    return {
      name: this.name,
      description: this.description,
      parameters: GenerateImageToVideoParamsSchema.shape as any,
    };
  }

  private wanGenerator: WanContentGenerator | null = null;

  private getWanGenerator(): WanContentGenerator {
    if (!this.wanGenerator) {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
      if (!apiKey) {
        throw new Error('DASHSCOPE_API_KEY or QWEN_API_KEY environment variable is required for Wan image-to-video generation');
      }

      this.wanGenerator = new WanContentGenerator({
        apiKey,
        baseUrl: process.env.WAN_BASE_URL || process.env.QWEN_BASE_URL,
      });
    }
    return this.wanGenerator;
  }

  async execute(
    params: GenerateImageToVideoParams,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    try {
      const wan = this.getWanGenerator();

      // Validate image URL
      if (!params.imageUrl.startsWith('http://') && !params.imageUrl.startsWith('https://')) {
        return {
          llmContent: 'Local file paths are not yet supported. Please provide a URL to an image.',
          returnDisplay: 'Local file paths are not yet supported. Please provide a URL to an image.',
        };
      }

      // Determine which model to use based on duration
      const duration = params.duration || 5;
      const modelType = duration > 5 ? 'plus' : 'turbo';

      // Start image-to-video generation
      const response = await wan.generateImageToVideo({
        input: {
          image_url: params.imageUrl,
          prompt: params.prompt,
        },
        parameters: {
          seed: params.seed,
          fps: params.fps || 24,
          duration: duration,
        },
      });

      if (response.output.task_status === 'FAILED') {
        const errorMessage = `Image-to-video generation failed: ${response.output.error_message || 'Unknown error'}`;
        return {
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        };
      }

      const taskId = response.output.task_id;

      // Poll for completion
      let lastProgress = 0;
      const finalStatus = await wan.waitForCompletion(taskId, (status) => {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // Log progress for debugging
        const progress = status.output.progress || 0;
        if (progress > lastProgress) {
          console.log(`Image-to-video generation progress: ${progress}%`);
          lastProgress = progress;
        }
      });

      if (finalStatus.output.task_status === 'SUCCEEDED') {
        const videoUrl = finalStatus.output.video_url;

        const displayContent = `
## Video Generated Successfully! 🎬

**Source Image:** ${params.imageUrl}
${params.prompt ? `**Prompt:** ${params.prompt}` : ''}
**Duration:** ${duration} seconds
**FPS:** ${params.fps || 24}
**Model:** Wan 2.1 I2V ${modelType}

**Generated Video URL:** ${videoUrl}

⚠️ **Note:** The video URL will expire in 24 hours. Please download it if you need permanent access.

You can view the video in your browser or download it for use in your projects.
        `.trim();

        return {
          llmContent: `Successfully generated ${duration}s video from image. URL: ${videoUrl}`,
          returnDisplay: displayContent,
        };
      } else {
        const errorMessage = `Image-to-video generation failed: ${finalStatus.output.error_message || 'Unknown error'}`;
        return {
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        };
      }
    } catch (error) {
      if (signal?.aborted) {
        return {
          llmContent: 'Image-to-video generation was cancelled',
          returnDisplay: 'Image-to-video generation was cancelled',
        };
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullError = `Failed to generate video from image: ${errorMessage}`;
      return {
        llmContent: fullError,
        returnDisplay: fullError,
      };
    }
  }
}