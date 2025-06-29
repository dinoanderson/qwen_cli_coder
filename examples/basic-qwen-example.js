#!/usr/bin/env node

import { QwenContentGenerator } from './packages/core/dist/src/providers/qwen/qwenContentGenerator.js';

async function testQwenIntegration() {
  console.log('🧪 Testing Qwen Integration...');
  
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found. Set DASHSCOPE_API_KEY or QWEN_API_KEY');
    return;
  }
  
  const qwen = new QwenContentGenerator({
    apiKey,
    baseUrl: 'https://dashscope-intl.aliyuncs.com/api/v1',
    model: 'qwen-plus',
    enableThinking: false,
  });
  
  try {
    console.log('📤 Testing simple text generation...');
    const response = await qwen.generateContent({
      model: 'qwen-plus',
      contents: [{
        role: 'user',
        parts: [{ text: 'What is 2+2?' }]
      }]
    });
    
    console.log('✅ Response received:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testQwenIntegration();