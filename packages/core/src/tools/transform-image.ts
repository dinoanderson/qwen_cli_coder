/**
 * @license
 * Copyright 2025 Wan Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, ToolResult } from './tools.js';
import { z } from 'zod';
import { WanContentGenerator } from '../providers/wan/wanContentGenerator.js';
import { WAN_TRANSFORMATIONS } from '../providers/wan/wanTypes.js';

export interface TransformImageParams {
  imageUrl: string;
  transformation: string;
  prompt?: string;
  strength?: number;
  preserveAspectRatio?: boolean;
}

const TransformImageParamsSchema = z.object({
  imageUrl: z.string().describe('URL or file path of the source image'),
  transformation: z.enum([
    'fluffy_toy',
    'cartoon',
    'oil_painting',
    'watercolor',
    'anime',
    'sketch',
    'pixar_style',
    'cyberpunk',
    'custom',
  ]).describe('Transformation style to apply'),
  prompt: z.string().optional().describe('Additional prompt for custom transformations'),
  strength: z.number().min(0).max(1).optional().describe('Transformation strength (0.0-1.0)'),
  preserveAspectRatio: z.boolean().optional().describe('Whether to preserve original aspect ratio'),
});

export class TransformImageTool extends BaseTool<TransformImageParams, ToolResult> {
  static readonly Name = 'transform_image';

  name = TransformImageTool.Name;
  description = 'Transform an image using Alibaba Wan model. Supports various artistic styles like cartoon, oil painting, anime, etc.';

  get schema() {
    return {
      name: this.name,
      description: this.description,
      parameters: TransformImageParamsSchema.shape as any,
    };
  }

  private wanGenerator: WanContentGenerator | null = null;

  private getWanGenerator(): WanContentGenerator {
    if (!this.wanGenerator) {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
      if (!apiKey) {
        throw new Error('DASHSCOPE_API_KEY or QWEN_API_KEY environment variable is required for Wan image transformation');
      }

      this.wanGenerator = new WanContentGenerator({
        apiKey,
        baseUrl: process.env.WAN_BASE_URL || process.env.QWEN_BASE_URL,
      });
    }
    return this.wanGenerator;
  }

  async execute(
    params: TransformImageParams,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    try {
      const wan = this.getWanGenerator();

      // Validate image URL or convert local path to URL if needed
      let imageUrl = params.imageUrl;
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        // Handle local file paths - in a real implementation, you'd upload to a temporary URL
        return {
          llmContent: 'Local file paths are not yet supported. Please provide a URL to an image.',
          returnDisplay: 'Local file paths are not yet supported. Please provide a URL to an image.',
        };
      }

      // Build transformation prompt
      let transformationName = params.transformation;
      if (params.transformation === 'custom' && !params.prompt) {
        return {
          llmContent: 'Custom transformation requires a prompt parameter',
          returnDisplay: 'Custom transformation requires a prompt parameter',
        };
      }

      // Start image transformation
      const response = await wan.transformImage({
        input: {
          image_url: imageUrl,
          transformation: transformationName,
          prompt: params.prompt,
          strength: params.strength || 0.8,
          preserve_aspect_ratio: params.preserveAspectRatio !== false,
        },
        parameters: {
          guidance_scale: 7.5,
        },
      });

      if (response.output.task_status === 'FAILED') {
        const errorMessage = `Image transformation failed: ${response.output.error_message || 'Unknown error'}`;
        return {
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        };
      }

      const taskId = response.output.task_id;

      // Poll for completion
      const finalStatus = await wan.waitForCompletion(taskId, (status) => {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // Log progress for debugging
        const progress = status.output.progress || 0;
        console.log(`Image transformation progress: ${progress}%`);
      });

      if (finalStatus.output.task_status === 'SUCCEEDED') {
        const transformedImageUrl = finalStatus.output.image_url;

        // Get human-readable transformation name
        const transformationDisplay = {
          'fluffy_toy': 'Fluffy Toy',
          'cartoon': 'Cartoon',
          'oil_painting': 'Oil Painting',
          'watercolor': 'Watercolor',
          'anime': 'Anime',
          'sketch': 'Sketch',
          'pixar_style': 'Pixar Style',
          'cyberpunk': 'Cyberpunk',
          'custom': 'Custom',
        }[params.transformation] || params.transformation;

        const displayContent = `
## Image Transformed Successfully! 🎨

**Original Image:** ${params.imageUrl}
**Transformation:** ${transformationDisplay}
${params.prompt ? `**Custom Prompt:** ${params.prompt}` : ''}
**Strength:** ${params.strength || 0.8}

**Transformed Image URL:** ${transformedImageUrl}

You can download the transformed image from the URL above or use it in your applications.
        `.trim();

        return {
          llmContent: `Image transformed successfully to ${transformationDisplay} style. URL: ${transformedImageUrl}`,
          returnDisplay: displayContent,
        };
      } else {
        const errorMessage = `Image transformation failed: ${finalStatus.output.error_message || 'Unknown error'}`;
        return {
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        };
      }
    } catch (error) {
      if (signal?.aborted) {
        return {
          llmContent: 'Image transformation was cancelled',
          returnDisplay: 'Image transformation was cancelled',
        };
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullError = `Failed to transform image: ${errorMessage}`;
      return {
        llmContent: fullError,
        returnDisplay: fullError,
      };
    }
  }
}