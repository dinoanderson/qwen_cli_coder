/**
 * @license
 * Copyright 2025 Wan Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, ToolResult } from './tools.js';
import { z } from 'zod';
import { WanModelInfo, WAN_MODELS, WAN_TRANSFORMATIONS } from '../providers/wan/wanTypes.js';

export interface SearchWanModelsParams {
  modelType?: string;
  includeTransformations?: boolean;
  includeCapabilities?: boolean;
}

const SearchWanModelsParamsSchema = z.object({
  modelType: z.enum(['video_generation', 'image_transform', 'image_to_video', 'all']).optional()
    .describe('Type of Wan models to search for'),
  includeTransformations: z.boolean().optional()
    .describe('Include available transformation styles'),
  includeCapabilities: z.boolean().optional()
    .describe('Include detailed model capabilities'),
});

export class SearchWanModelsTool extends BaseTool<SearchWanModelsParams, ToolResult> {
  static readonly Name = 'search_wan_models';

  name = SearchWanModelsTool.Name;
  description = 'Search and discover available Wan models, their capabilities, and supported transformations.';

  get schema() {
    return {
      name: this.name,
      description: this.description,
      parameters: SearchWanModelsParamsSchema.shape as any,
    };
  }

  async execute(
    params: SearchWanModelsParams,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    try {
      const modelType = params.modelType || 'all';
      
      const models: WanModelInfo[] = [
        {
          model_name: WAN_MODELS.IMAGE_TO_VIDEO_TURBO,
          model_type: 'image_to_video',
          description: 'Fast image-to-video generation model (up to 5 seconds)',
          supported_languages: ['en', 'zh'],
          max_duration: 5,
        },
        {
          model_name: WAN_MODELS.IMAGE_TO_VIDEO_PLUS,
          model_type: 'image_to_video',
          description: 'High-quality image-to-video generation model (up to 10 seconds)',
          supported_languages: ['en', 'zh'],
          max_duration: 10,
        },
        {
          model_name: WAN_MODELS.VIDEO_GENERATION,
          model_type: 'video_generation',
          description: 'Text-to-video generation model',
          supported_languages: ['en', 'zh', 'bilingual'],
          max_duration: 60,
          supported_resolutions: ['720p', '1080p', '4k'],
        },
        {
          model_name: WAN_MODELS.IMAGE_TRANSFORM,
          model_type: 'image_transform',
          description: 'Image transformation model for artistic style transfer',
          supported_languages: ['en', 'zh'],
          supported_transformations: Object.values(WAN_TRANSFORMATIONS),
        },
      ];

      // Filter models based on type
      const filteredModels = modelType === 'all' 
        ? models 
        : models.filter(m => m.model_type === modelType);

      let displayContent = '## Available Wan Models\n\n';

      for (const model of filteredModels) {
        displayContent += `### ${model.model_name}\n`;
        displayContent += `**Type:** ${model.model_type}\n`;
        displayContent += `**Description:** ${model.description}\n`;
        displayContent += `**Languages:** ${model.supported_languages.join(', ')}\n`;
        
        if (model.max_duration) {
          displayContent += `**Max Duration:** ${model.max_duration} seconds\n`;
        }
        
        if (params.includeCapabilities) {
          if (model.supported_resolutions) {
            displayContent += `**Resolutions:** ${model.supported_resolutions.join(', ')}\n`;
          }
          if (model.pricing) {
            displayContent += `**Pricing:** `;
            if (model.pricing.per_second) {
              displayContent += `$${model.pricing.per_second}/second `;
            }
            if (model.pricing.per_image) {
              displayContent += `$${model.pricing.per_image}/image`;
            }
            displayContent += '\n';
          }
        }
        
        if (params.includeTransformations && model.supported_transformations) {
          displayContent += `**Transformations:** ${model.supported_transformations.join(', ')}\n`;
        }
        
        displayContent += '\n';
      }

      const llmSummary = `Found ${filteredModels.length} Wan models${modelType !== 'all' ? ` of type ${modelType}` : ''}`;

      return {
        llmContent: llmSummary,
        returnDisplay: displayContent.trim(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Failed to search Wan models: ${errorMessage}`,
        returnDisplay: `Failed to search Wan models: ${errorMessage}`,
      };
    }
  }
}