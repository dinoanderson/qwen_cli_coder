/**
 * @license  
 * Copyright 2025 Wan Mock Integration Tests
 * SPDX-License-Identifier: Apache-2.0
 * 
 * These tests use mocked responses and can run in CI/CD without API keys
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { spawn } from 'child_process';
import * as path from 'path';

const CLI_PATH = path.join(__dirname, '../packages/cli/dist/index.js');

// Mock the fetch function globally
global.fetch = jest.fn();

describe('Wan Tools Mock Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const runCLIWithMocks = (command: string, mockResponses: any[]): Promise<{ stdout: string; stderr: string }> => {
    return new Promise((resolve) => {
      // Set up mock responses
      let responseIndex = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        const response = mockResponses[responseIndex++];
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response)),
        });
      });

      const args = command.split(' ').filter(Boolean);
      const child = spawn('node', [CLI_PATH, ...args], {
        env: {
          ...process.env,
          DASHSCOPE_API_KEY: 'mock-api-key',
          NO_COLOR: '1',
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', () => {
        resolve({ stdout, stderr });
      });
    });
  };

  describe('Image to Video Generation Flow', () => {
    it('should handle the complete async task flow', async () => {
      const mockResponses = [
        // Initial task creation response
        {
          request_id: 'mock-req-123',
          output: {
            task_id: 'mock-task-456',
            task_status: 'PENDING',
          },
        },
        // First status check - still processing
        {
          request_id: 'mock-req-123',
          output: {
            task_id: 'mock-task-456',
            task_status: 'RUNNING',
            progress: 50,
          },
        },
        // Final status check - completed
        {
          request_id: 'mock-req-123',
          output: {
            task_id: 'mock-task-456',
            task_status: 'SUCCEEDED',
            progress: 100,
            video_url: 'https://mock-cdn.example.com/video-123.mp4',
          },
        },
      ];

      const { stdout } = await runCLIWithMocks(
        '--assistant -p "generate_image_to_video imageUrl: https://example.com/test.jpg duration: 5"',
        mockResponses
      );

      // Verify the flow
      expect(global.fetch).toHaveBeenCalledTimes(3);
      
      // First call should be POST to create task
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/services/aigc/multimodal-generation/generation'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-api-key',
          }),
        })
      );

      // Subsequent calls should be GET for status
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('task_id=mock-task-456'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      // Output should contain success message
      expect(stdout).toContain('Successfully generated');
      expect(stdout).toContain('https://mock-cdn.example.com/video-123.mp4');
    });

    it('should handle task failure gracefully', async () => {
      const mockResponses = [
        {
          request_id: 'mock-req-789',
          output: {
            task_id: 'mock-task-999',
            task_status: 'FAILED',
            error_message: 'Invalid image format: Image must be JPEG or PNG',
          },
        },
      ];

      const { stdout } = await runCLIWithMocks(
        '--assistant -p "generate_image_to_video imageUrl: https://example.com/bad.gif"',
        mockResponses
      );

      expect(stdout).toContain('generation failed');
      expect(stdout).toContain('Invalid image format');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress during generation', async () => {
      const mockResponses = [
        {
          output: { task_id: 'test-1', task_status: 'PENDING' },
        },
        {
          output: { task_id: 'test-1', task_status: 'RUNNING', progress: 25 },
        },
        {
          output: { task_id: 'test-1', task_status: 'RUNNING', progress: 50 },
        },
        {
          output: { task_id: 'test-1', task_status: 'RUNNING', progress: 75 },
        },
        {
          output: {
            task_id: 'test-1',
            task_status: 'SUCCEEDED',
            progress: 100,
            video_url: 'https://example.com/done.mp4',
          },
        },
      ];

      const { stdout } = await runCLIWithMocks(
        '--assistant -p "generate_image_to_video imageUrl: https://example.com/test.jpg"',
        mockResponses
      );

      // Should have made 5 API calls (1 create + 4 status checks)
      expect(global.fetch).toHaveBeenCalledTimes(5);
      expect(stdout).toContain('Successfully generated');
    });
  });

  describe('Model Selection', () => {
    it('should use turbo model for short videos', async () => {
      const mockResponses = [
        {
          output: { task_id: 'test-1', task_status: 'PENDING' },
        },
        {
          output: {
            task_id: 'test-1',
            task_status: 'SUCCEEDED',
            video_url: 'https://example.com/video.mp4',
          },
        },
      ];

      await runCLIWithMocks(
        '--assistant -p "generate_image_to_video imageUrl: https://example.com/test.jpg duration: 3"',
        mockResponses
      );

      // Check that turbo model was used (duration <= 5)
      const createCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(createCall[1].body);
      expect(requestBody.model).toBe('wan2.1-i2v-turbo');
    });

    it('should use plus model for long videos', async () => {
      const mockResponses = [
        {
          output: { task_id: 'test-2', task_status: 'PENDING' },
        },
        {
          output: {
            task_id: 'test-2',
            task_status: 'SUCCEEDED',
            video_url: 'https://example.com/video.mp4',
          },
        },
      ];

      await runCLIWithMocks(
        '--assistant -p "generate_image_to_video imageUrl: https://example.com/test.jpg duration: 8"',
        mockResponses
      );

      // Check that plus model was used (duration > 5)
      const createCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(createCall[1].body);
      expect(requestBody.model).toBe('wan2.1-i2v-plus');
    });
  });
});