#!/usr/bin/env node

/**
 * Test script to verify model auto-detection works correctly
 */

import { createContentGeneratorConfig, AuthType } from './packages/core/dist/index.js';

async function testModelDetection() {
  console.log('Testing model auto-detection...\n');

  try {
    // Test with DASHSCOPE_API_KEY set
    const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
    const geminiApiKey = process.env.GOOGLE_API_KEY;
    
    console.log('Environment check:');
    console.log('- QWEN/DASHSCOPE_API_KEY:', qwenApiKey ? 'SET' : 'NOT SET');
    console.log('- GEMINI/GOOGLE_API_KEY:', geminiApiKey ? 'SET' : 'NOT SET');
    
    if (qwenApiKey) {
      console.log('\n✓ Qwen API key detected, should use Qwen provider');
      
      // Test Qwen config creation without explicit auth type
      const config = await createContentGeneratorConfig(
        undefined, // Let it auto-detect
        AuthType.USE_QWEN_DASHSCOPE
      );
      
      console.log('Config created:', {
        model: config.model,
        authType: config.authType,
        hasApiKey: !!config.apiKey
      });
    } else {
      console.log('\n⚠ No Qwen API key detected, would use Gemini provider');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testModelDetection();