/**
 * @license
 * Copyright 2025 Wan Integration Test
 * SPDX-License-Identifier: Apache-2.0
 */

import { WanContentGenerator } from '../providers/wan/wanContentGenerator.js';
import { GenerateImageToVideoTool } from '../tools/generate-image-to-video.js';
import { SearchWanModelsTool } from '../tools/search-wan-models.js';

describe('Wan Integration Tests', () => {
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    process.env.DASHSCOPE_API_KEY = mockApiKey;
  });

  afterEach(() => {
    delete process.env.DASHSCOPE_API_KEY;
  });

  describe('WanContentGenerator', () => {
    it('should create instance with proper configuration', () => {
      const generator = new WanContentGenerator({
        apiKey: mockApiKey,
        baseUrl: 'https://dashscope-intl.aliyuncs.com/api/v1',
      });
      
      expect(generator).toBeDefined();
    });

    it('should have generateImageToVideo method', () => {
      const generator = new WanContentGenerator({
        apiKey: mockApiKey,
      });
      
      expect(generator.generateImageToVideo).toBeDefined();
      expect(typeof generator.generateImageToVideo).toBe('function');
    });
  });

  describe('SearchWanModelsTool', () => {
    it('should list all Wan models', async () => {
      const tool = new SearchWanModelsTool();
      
      const result = await tool.execute({
        modelType: 'all',
        includeCapabilities: true,
      });
      
      expect(result.llmContent).toContain('Found 4 Wan models');
      expect(result.returnDisplay).toContain('wan2.1-i2v-turbo');
      expect(result.returnDisplay).toContain('wan2.1-i2v-plus');
    });

    it('should filter models by type', async () => {
      const tool = new SearchWanModelsTool();
      
      const result = await tool.execute({
        modelType: 'image_to_video',
      });
      
      expect(result.llmContent).toContain('Found 2 Wan models of type image_to_video');
    });
  });

  describe('GenerateImageToVideoTool', () => {
    it('should have proper schema', () => {
      const tool = new GenerateImageToVideoTool();
      
      expect(tool.name).toBe('generate_image_to_video');
      expect(tool.description).toContain('Convert a static image to a dynamic video');
      expect(tool.schema.parameters).toBeDefined();
    });

    it('should reject local file paths', async () => {
      const tool = new GenerateImageToVideoTool();
      
      const result = await tool.execute({
        imageUrl: '/local/path/image.jpg',
      });
      
      expect(result.llmContent).toContain('Local file paths are not yet supported');
    });
  });
});