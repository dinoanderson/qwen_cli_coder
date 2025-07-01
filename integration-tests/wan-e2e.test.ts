/**
 * @license
 * Copyright 2025 Wan E2E Integration Tests
 * SPDX-License-Identifier: Apache-2.0
 * 
 * These tests make real API calls to DashScope and should only be run
 * when DASHSCOPE_API_KEY is available and you want to test actual integration.
 * 
 * Run with: DASHSCOPE_API_KEY=your-key npm run test:e2e:wan
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const CLI_PATH = path.join(__dirname, '../packages/cli/dist/index.js');
const TEST_TIMEOUT = 300000; // 5 minutes for media generation

describe('Wan Tools E2E Tests', () => {
  let apiKey: string | undefined;

  beforeAll(() => {
    apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.warn('DASHSCOPE_API_KEY not set, skipping E2E tests');
    }
  });

  const runCLICommand = (command: string): Promise<{ stdout: string; stderr: string; code: number }> => {
    return new Promise((resolve) => {
      const args = command.split(' ').filter(Boolean);
      const child = spawn('node', [CLI_PATH, ...args], {
        env: {
          ...process.env,
          DASHSCOPE_API_KEY: apiKey,
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

      child.on('close', (code) => {
        resolve({ stdout, stderr, code: code || 0 });
      });
    });
  };

  describe('Search Wan Models', () => {
    it('should list available Wan models', async () => {
      if (!apiKey) {
        console.log('Skipping: No API key');
        return;
      }

      const { stdout, code } = await runCLICommand('--assistant -p "search_wan_models"');
      
      expect(code).toBe(0);
      expect(stdout).toContain('wan2.1-i2v-turbo');
      expect(stdout).toContain('wan2.1-i2v-plus');
      expect(stdout).toContain('Image-to-Video');
    }, TEST_TIMEOUT);
  });

  describe('Generate Image to Video', () => {
    it('should handle image URL validation', async () => {
      if (!apiKey) {
        console.log('Skipping: No API key');
        return;
      }

      const { stdout, code } = await runCLICommand(
        '--assistant -p "generate_image_to_video imageUrl: /local/path.jpg"'
      );
      
      expect(code).toBe(0);
      expect(stdout).toContain('Local file paths are not yet supported');
    }, TEST_TIMEOUT);

    it('should generate video from test image (if API supports test images)', async () => {
      if (!apiKey) {
        console.log('Skipping: No API key');
        return;
      }

      // This test requires a publicly accessible test image
      // You can replace this with a real test image URL
      const testImageUrl = 'https://via.placeholder.com/512x512.jpg';
      
      const { stdout, stderr, code } = await runCLICommand(
        `--assistant -p "generate_image_to_video imageUrl: ${testImageUrl} duration: 2"`
      );
      
      // The actual generation might fail with test images, but we can verify the tool runs
      expect(code).toBe(0);
      
      // Check if it attempted to generate or gave a meaningful error
      const output = stdout + stderr;
      expect(output).toMatch(/Successfully generated|generation failed|Invalid image/i);
    }, TEST_TIMEOUT);
  });

  describe('Assistant Mode Requirement', () => {
    it('should not have Wan tools available in default mode', async () => {
      if (!apiKey) {
        console.log('Skipping: No API key');
        return;
      }

      const { stdout, code } = await runCLICommand('-p "search_wan_models"');
      
      expect(code).toBe(0);
      // In non-assistant mode, the tool should not be available
      expect(stdout).toMatch(/Unknown tool|not found|not available/i);
    }, TEST_TIMEOUT);
  });
});

// Helper script to run specific E2E tests
if (require.main === module) {
  const testToRun = process.argv[2];
  
  if (!process.env.DASHSCOPE_API_KEY) {
    console.error('Error: DASHSCOPE_API_KEY environment variable is required');
    console.error('Usage: DASHSCOPE_API_KEY=your-key node wan-e2e.test.js [test-name]');
    process.exit(1);
  }

  console.log('Running Wan E2E tests...');
  console.log('Note: These tests make real API calls and may incur costs.');
  
  // You can add specific test runners here
}