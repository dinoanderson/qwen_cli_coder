/**
 * @license
 * Copyright 2025 Wan Integration
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WanConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface WanVideoGenerationRequest {
  model: string;
  input: {
    prompt: string;
    duration?: number;
    resolution?: string;
    fps?: number;
    aspect_ratio?: string;
    language?: 'en' | 'zh' | 'bilingual';
    style?: string;
    reference_image?: string;
  };
  parameters?: {
    seed?: number;
    guidance_scale?: number;
    num_inference_steps?: number;
  };
}

// Image-to-Video request format from API documentation
export interface WanImageToVideoRequest {
  model: string;
  input: {
    image_url: string;
    prompt?: string;  // Optional text prompt to guide video generation
  };
  parameters?: {
    seed?: number;
    fps?: number;
    duration?: number;  // Video duration in seconds
  };
}

export interface WanImageTransformRequest {
  model: string;
  input: {
    image_url: string;
    prompt?: string;
    transformation: string;
    strength?: number;
    preserve_aspect_ratio?: boolean;
  };
  parameters?: {
    seed?: number;
    guidance_scale?: number;
  };
}

export interface WanVideoEditRequest {
  model: string;
  input: {
    video_url: string;
    edit_prompt: string;
    start_time?: number;
    end_time?: number;
    text_overlays?: Array<{
      text: string;
      position: 'top' | 'bottom' | 'center';
      start_time: number;
      duration: number;
      style?: Record<string, any>;
    }>;
  };
  parameters?: {
    preserve_audio?: boolean;
    output_format?: string;
  };
}

export interface WanGenerationResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    video_url?: string;
    image_url?: string;
    duration?: number;
    resolution?: string;
    error_message?: string;
  };
  usage?: {
    video_seconds?: number;
    image_count?: number;
    total_tokens?: number;
  };
}

export interface WanTaskStatusResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    progress?: number;
    video_url?: string;
    image_url?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
  };
}

export interface WanModelInfo {
  model_name: string;
  model_type: 'video_generation' | 'image_transform' | 'video_edit' | 'image_to_video';
  description: string;
  supported_languages: string[];
  max_duration?: number;
  supported_resolutions?: string[];
  supported_transformations?: string[];
  pricing?: {
    per_second?: number;
    per_image?: number;
  };
}

export const WAN_MODELS = {
  // Image-to-Video models from API documentation
  IMAGE_TO_VIDEO_TURBO: 'wan2.1-i2v-turbo',
  IMAGE_TO_VIDEO_PLUS: 'wan2.1-i2v-plus',
  // Legacy models (may need verification)
  VIDEO_GENERATION: 'wan2.1-vace',
  IMAGE_TRANSFORM: 'wan-toy-transform',
} as const;

export const WAN_TRANSFORMATIONS = {
  TOY: 'fluffy_toy',
  CARTOON: 'cartoon',
  OIL_PAINTING: 'oil_painting',
  WATERCOLOR: 'watercolor',
  ANIME: 'anime',
  SKETCH: 'sketch',
  PIXAR: 'pixar_style',
  CYBERPUNK: 'cyberpunk',
} as const;

export const WAN_VIDEO_RESOLUTIONS = {
  '720p': '1280x720',
  '1080p': '1920x1080',
  '4k': '3840x2160',
} as const;

export const WAN_ASPECT_RATIOS = {
  '16:9': '16:9',
  '9:16': '9:16',  // vertical for social media
  '1:1': '1:1',    // square
  '4:3': '4:3',
} as const;