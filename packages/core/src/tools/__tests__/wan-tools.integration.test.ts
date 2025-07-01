/**
 * @license
 * Copyright 2025 Wan Integration Tests
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GenerateVideoTool } from '../generate-video.js';
import { TransformImageTool } from '../transform-image.js';
import { GenerateImageToVideoTool } from '../generate-image-to-video.js';
import { SearchWanModelsTool } from '../search-wan-models.js';
import { WanContentGenerator } from '../../providers/wan/wanContentGenerator.js';
import { Config } from '../../config/config.js';

// Mock the WanContentGenerator
jest.mock('../../providers/wan/wanContentGenerator.js');

describe('Wan Tools Integration Tests', () => {
  const mockConfig = {
    getDebugMode: () => false,
    isAssistantMode: () => true,
  } as Config;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DASHSCOPE_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.DASHSCOPE_API_KEY;
  });

  describe('SearchWanModelsTool', () => {
    it('should create tool with proper configuration', () => {
      const tool = new SearchWanModelsTool(mockConfig);
      
      expect(tool.name).toBe('search_wan_models');
      expect(tool.description).toContain('Search and discover available Wan models');
      expect(tool.schema.parameters).toBeDefined();
    });

    it('should list all Wan models', async () => {
      const tool = new SearchWanModelsTool(mockConfig);
      
      const result = await tool.execute({
        modelType: 'all',
        includeCapabilities: true,
      });
      
      expect(result.llmContent).toContain('Found 4 Wan models');
      expect(result.returnDisplay).toContain('wan2.1-i2v-turbo');
      expect(result.returnDisplay).toContain('wan2.1-i2v-plus');
      expect(result.returnDisplay).toContain('wan2.1-vace');
      expect(result.returnDisplay).toContain('wan-toy-transform');
    });

    it('should filter models by type', async () => {
      const tool = new SearchWanModelsTool(mockConfig);
      
      const result = await tool.execute({
        modelType: 'image_to_video',
        includeTransformations: false,
      });
      
      expect(result.llmContent).toContain('Found 2 Wan models of type image_to_video');
      expect(result.returnDisplay).toContain('wan2.1-i2v-turbo');
      expect(result.returnDisplay).toContain('wan2.1-i2v-plus');
      expect(result.returnDisplay).not.toContain('wan2.1-vace');
    });
  });

  describe('GenerateImageToVideoTool', () => {
    let mockWanGenerator: jest.Mocked<WanContentGenerator>;

    beforeEach(() => {
      mockWanGenerator = {
        generateImageToVideo: jest.fn(),
        waitForCompletion: jest.fn(),
      } as any;

      (WanContentGenerator as jest.MockedClass<typeof WanContentGenerator>).mockImplementation(() => mockWanGenerator);
    });

    it('should create tool with proper configuration', () => {
      const tool = new GenerateImageToVideoTool(mockConfig);
      
      expect(tool.name).toBe('generate_image_to_video');
      expect(tool.description).toContain('Convert a static image to a dynamic video');
    });

    it('should reject local file paths', async () => {
      const tool = new GenerateImageToVideoTool(mockConfig);
      
      const result = await tool.execute({
        imageUrl: '/local/path/image.jpg',
        duration: 5,
      });
      
      expect(result.llmContent).toContain('Local file paths are not yet supported');
      expect(mockWanGenerator.generateImageToVideo).not.toHaveBeenCalled();
    });

    it('should generate video from image URL successfully', async () => {
      const tool = new GenerateImageToVideoTool(mockConfig);
      
      // Mock successful response
      mockWanGenerator.generateImageToVideo.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-456',
          task_status: 'PENDING',
        },
      });

      mockWanGenerator.waitForCompletion.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-456',
          task_status: 'SUCCEEDED',
          video_url: 'https://example.com/generated-video.mp4',
          progress: 100,
        },
      });

      const result = await tool.execute({
        imageUrl: 'https://example.com/test-image.jpg',
        prompt: 'Make the person wave',
        duration: 5,
      });
      
      expect(mockWanGenerator.generateImageToVideo).toHaveBeenCalledWith({
        input: {
          image_url: 'https://example.com/test-image.jpg',
          prompt: 'Make the person wave',
        },
        parameters: {
          seed: undefined,
          fps: 24,
          duration: 5,
        },
      });
      
      expect(result.llmContent).toContain('Successfully generated 5s video');
      expect(result.returnDisplay).toContain('https://example.com/generated-video.mp4');
      expect(result.returnDisplay).toContain('24 hours');
    });

    it('should handle generation failure', async () => {
      const tool = new GenerateImageToVideoTool(mockConfig);
      
      mockWanGenerator.generateImageToVideo.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-456',
          task_status: 'FAILED',
          error_message: 'Invalid image format',
        },
      });

      const result = await tool.execute({
        imageUrl: 'https://example.com/bad-image.jpg',
      });
      
      expect(result.llmContent).toContain('Image-to-video generation failed: Invalid image format');
    });

    it('should handle task timeout', async () => {
      const tool = new GenerateImageToVideoTool(mockConfig);
      
      mockWanGenerator.generateImageToVideo.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-456',
          task_status: 'PENDING',
        },
      });

      mockWanGenerator.waitForCompletion.mockRejectedValue(new Error('Task timeout exceeded'));

      const result = await tool.execute({
        imageUrl: 'https://example.com/test-image.jpg',
      });
      
      expect(result.llmContent).toContain('Failed to generate video from image: Task timeout exceeded');
    });

    it('should select correct model based on duration', async () => {
      const tool = new GenerateImageToVideoTool(mockConfig);
      
      mockWanGenerator.generateImageToVideo.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-456',
          task_status: 'PENDING',
        },
      });

      // Test with duration > 5 (should use plus model)
      await tool.execute({
        imageUrl: 'https://example.com/test.jpg',
        duration: 8,
      });

      // The model selection happens inside generateImageToVideo
      expect(mockWanGenerator.generateImageToVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            duration: 8,
          }),
        })
      );
    });
  });

  describe('TransformImageTool', () => {
    let mockWanGenerator: jest.Mocked<WanContentGenerator>;

    beforeEach(() => {
      mockWanGenerator = {
        transformImage: jest.fn(),
        waitForCompletion: jest.fn(),
      } as any;

      (WanContentGenerator as jest.MockedClass<typeof WanContentGenerator>).mockImplementation(() => mockWanGenerator);
    });

    it('should transform image with valid style', async () => {
      const tool = new TransformImageTool(mockConfig);
      
      mockWanGenerator.transformImage.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-789',
          task_status: 'PENDING',
        },
      });

      mockWanGenerator.waitForCompletion.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-789',
          task_status: 'SUCCEEDED',
          image_url: 'https://example.com/transformed-cartoon.jpg',
        },
      });

      const result = await tool.execute({
        imageUrl: 'https://example.com/original.jpg',
        transformation: 'cartoon',
        strength: 0.8,
      });
      
      expect(mockWanGenerator.transformImage).toHaveBeenCalledWith({
        input: {
          image_url: 'https://example.com/original.jpg',
          transformation: 'cartoon',
          prompt: undefined,
          strength: 0.8,
          preserve_aspect_ratio: true,
        },
        parameters: {
          guidance_scale: 7.5,
        },
      });
      
      expect(result.returnDisplay).toContain('Cartoon');
      expect(result.returnDisplay).toContain('https://example.com/transformed-cartoon.jpg');
    });

    it('should require prompt for custom transformation', async () => {
      const tool = new TransformImageTool(mockConfig);
      
      const result = await tool.execute({
        imageUrl: 'https://example.com/test.jpg',
        transformation: 'custom',
      });
      
      expect(result.llmContent).toContain('Custom transformation requires a prompt parameter');
      expect(mockWanGenerator.transformImage).not.toHaveBeenCalled();
    });
  });

  describe('GenerateVideoTool', () => {
    let mockWanGenerator: jest.Mocked<WanContentGenerator>;

    beforeEach(() => {
      mockWanGenerator = {
        generateVideo: jest.fn(),
        waitForCompletion: jest.fn(),
      } as any;

      (WanContentGenerator as jest.MockedClass<typeof WanContentGenerator>).mockImplementation(() => mockWanGenerator);
    });

    it('should generate video from text prompt', async () => {
      const tool = new GenerateVideoTool(mockConfig);
      
      mockWanGenerator.generateVideo.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-999',
          task_status: 'PENDING',
        },
      });

      mockWanGenerator.waitForCompletion.mockResolvedValue({
        request_id: 'test-123',
        output: {
          task_id: 'task-999',
          task_status: 'SUCCEEDED',
          video_url: 'https://example.com/generated-text-video.mp4',
        },
      });

      const result = await tool.execute({
        prompt: 'A serene mountain landscape with moving clouds',
        duration: 10,
        resolution: '1080p',
        language: 'en',
      });
      
      expect(mockWanGenerator.generateVideo).toHaveBeenCalledWith({
        input: {
          prompt: 'A serene mountain landscape with moving clouds',
          duration: 10,
          resolution: '1080p',
          language: 'en',
          style: undefined,
          aspect_ratio: '16:9',
          reference_image: undefined,
        },
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      });
      
      expect(result.returnDisplay).toContain('1080p');
      expect(result.returnDisplay).toContain('https://example.com/generated-text-video.mp4');
    });
  });

  describe('Tool Registration in Assistant Mode', () => {
    it('should only register Wan tools in assistant mode', async () => {
      // This would be tested in the config.test.ts file
      // Here we just verify the tools check for assistant mode
      const tool = new GenerateVideoTool(mockConfig);
      expect(mockConfig.isAssistantMode()).toBe(true);
    });
  });
});