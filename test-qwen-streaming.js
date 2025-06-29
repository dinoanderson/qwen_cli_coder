#!/usr/bin/env node

import { QwenContentGenerator } from './packages/core/dist/src/providers/qwen/qwenContentGenerator.js';

async function testStreaming() {
  console.log('🧪 Testing Qwen Streaming...');
  
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found');
    return;
  }
  
  const qwen = new QwenContentGenerator({
    apiKey,
    baseUrl: 'https://dashscope-intl.aliyuncs.com/api/v1',
    model: 'qwen-plus',
    enableThinking: false,
  });
  
  try {
    console.log('📤 Testing streaming response...');
    const streamGenerator = await qwen.generateContentStream({
      model: 'qwen-plus',
      contents: [{
        role: 'user',
        parts: [{ text: 'Count from 1 to 5' }]
      }]
    });
    
    console.log('🔄 Processing stream...');
    for await (const chunk of streamGenerator) {
      console.log('📦 Chunk received:', JSON.stringify(chunk, null, 2));
    }
    console.log('✅ Stream completed successfully');
    
  } catch (error) {
    console.error('❌ Streaming error:', error.message);
    console.error('Full error:', error);
  }
}

testStreaming();