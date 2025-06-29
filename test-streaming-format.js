#!/usr/bin/env node

/**
 * Test to compare CLI streaming request vs working request format
 */

const API_KEY = process.env.DASHSCOPE_API_KEY;
const BASE_URL = 'https://dashscope-intl.aliyuncs.com/api/v1';

async function testStreamingFormat() {
  console.log('🔍 Testing Streaming Request Format...\n');
  
  if (!API_KEY) {
    console.error('❌ DASHSCOPE_API_KEY not set');
    process.exit(1);
  }

  // Test 1: Working non-streaming format (from our successful test)
  console.log('✅ Test 1: Known working non-streaming format...');
  const workingRequest = {
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
  };
  
  console.log('Working request body:', JSON.stringify(workingRequest, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workingRequest),
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('✅ Non-streaming successful:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data.output.text.slice(0, 50) + '...');
    }
  } catch (error) {
    console.log('❌ Non-streaming failed:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: CLI-style streaming format (what our code generates)
  console.log('🚀 Test 2: CLI streaming format (what we send)...');
  
  // This mimics exactly what our CLI generates
  const cliRequest = {
    model: 'qwen-plus',
    messages: [{
      role: 'user',
      content: 'Hello, world!'
    }],
    stream: true,
    extra_body: {
      enable_thinking: false
    },
    parameters: {
      temperature: undefined,
      top_p: undefined,
      max_tokens: undefined,
      enable_thinking: false,
      incremental_output: true
    },
    input: {
      messages: [{
        role: 'user',
        content: 'Hello, world!'
      }]
    }
  };
  
  console.log('CLI request body:', JSON.stringify(cliRequest, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify(cliRequest),
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('CLI streaming response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ CLI streaming error:', errorText);
    } else {
      console.log('✅ CLI streaming successful - checking response...');
      // Try to read a bit of the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      setTimeout(() => {
        reader.cancel();
        console.log('Stream reading cancelled after timeout');
      }, 3000);
      
      try {
        const { value } = await reader.read();
        const text = decoder.decode(value);
        console.log('First chunk received:', text.slice(0, 100));
      } catch (streamError) {
        console.log('Stream reading error:', streamError.message);
      }
    }
  } catch (error) {
    console.log('❌ CLI streaming failed:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Simplified streaming format
  console.log('🧪 Test 3: Simplified streaming format...');
  
  const simplifiedStreamingRequest = {
    model: 'qwen-plus',
    input: {
      messages: [{
        role: 'user',
        content: 'Hello, world!'
      }]
    },
    parameters: {
      max_tokens: 50,
      incremental_output: true
    }
  };
  
  console.log('Simplified streaming request:', JSON.stringify(simplifiedStreamingRequest, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify(simplifiedStreamingRequest),
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('Simplified streaming status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Simplified streaming error:', errorText);
    } else {
      console.log('✅ Simplified streaming successful!');
    }
  } catch (error) {
    console.log('❌ Simplified streaming failed:', error.message);
  }
}

testStreamingFormat().catch(console.error);