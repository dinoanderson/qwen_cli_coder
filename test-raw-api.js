#!/usr/bin/env node

/**
 * Test raw DashScope API call to isolate issues
 */

const API_KEY = process.env.DASHSCOPE_API_KEY;
const BASE_URL = 'https://dashscope-intl.aliyuncs.com/api/v1';

async function testRawAPI() {
  console.log('🔍 Testing Raw DashScope API Call...\n');
  
  if (!API_KEY) {
    console.error('❌ DASHSCOPE_API_KEY not set');
    process.exit(1);
  }

  console.log('📋 Test Details:');
  console.log('- API Key:', API_KEY ? `${API_KEY.slice(0, 10)}...` : 'NOT SET');
  console.log('- Base URL:', BASE_URL);
  console.log('- Endpoint:', `${BASE_URL}/services/aigc/text-generation/generation`);
  console.log('');

  // Test 1: Simple fetch with timeout
  console.log('🚀 Test 1: Basic API connectivity...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [{
            role: 'user',
            content: 'Hello, world!'
          }]
        },
        parameters: {
          max_tokens: 50
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('✅ Response received!');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('- Response Data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('- Error Response:', errorText);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Request timed out after 10 seconds');
    } else {
      console.log('❌ Network error:', error.message);
      console.log('- Error type:', error.name);
      console.log('- Error stack:', error.stack);
    }
  }
}

testRawAPI().catch(console.error);