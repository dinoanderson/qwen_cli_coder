#!/usr/bin/env node

/**
 * Test script for Qwen integration in gemini-cli
 * 
 * Usage:
 * 1. Set QWEN_API_KEY or DASHSCOPE_API_KEY environment variable
 * 2. Run: node test-qwen-integration.js
 */

import { createContentGeneratorConfig, createContentGenerator, AuthType } from './packages/core/dist/index.js';

async function testQwenIntegration() {
  console.log('Testing Qwen integration...\n');

  try {
    // Test 1: Create config
    console.log('1. Creating Qwen content generator config...');
    const config = await createContentGeneratorConfig(
      'qwen-plus',
      AuthType.USE_QWEN_DASHSCOPE
    );
    console.log('✓ Config created:', {
      model: config.model,
      authType: config.authType,
      hasApiKey: !!config.apiKey
    });

    // Test 2: Create generator
    console.log('\n2. Creating Qwen content generator...');
    const generator = await createContentGenerator(config);
    console.log('✓ Generator created');

    // Test 3: Generate content
    console.log('\n3. Testing content generation...');
    const response = await generator.generateContent({
      model: config.model,
      contents: [{
        role: 'user',
        parts: [{ text: 'Hello! Please respond with a simple greeting.' }]
      }]
    });
    console.log('✓ Response received:', response.candidates[0].content.parts[0].text);

    // Test 4: Test streaming
    console.log('\n4. Testing streaming generation...');
    const streamResponse = await generator.generateContentStream({
      model: config.model,
      contents: [{
        role: 'user',
        parts: [{ text: 'Count from 1 to 5.' }]
      }]
    });
    
    process.stdout.write('✓ Streaming response: ');
    for await (const chunk of streamResponse) {
      if (chunk.candidates[0]?.content?.parts[0]?.text) {
        process.stdout.write(chunk.candidates[0].content.parts[0].text);
      }
    }
    console.log('\n');

    // Test 5: Token counting
    console.log('\n5. Testing token counting...');
    const tokenResponse = await generator.countTokens({
      model: config.model,
      contents: [{
        role: 'user',
        parts: [{ text: 'This is a test message for token counting.' }]
      }]
    });
    console.log('✓ Token count:', tokenResponse.totalTokens);

    console.log('\n✅ All tests passed! Qwen integration is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('API key')) {
      console.error('Make sure to set QWEN_API_KEY or DASHSCOPE_API_KEY environment variable');
    }
    process.exit(1);
  }
}

testQwenIntegration();