#!/usr/bin/env node

/**
 * Direct DashScope API Testing Script
 * This script tests different request formats to understand how DashScope expects function calls
 */

import fetch from 'node-fetch';

const API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
const BASE_URL = 'https://dashscope-intl.aliyuncs.com/api/v1';

if (!API_KEY) {
  console.error('❌ No API key found. Set DASHSCOPE_API_KEY or QWEN_API_KEY environment variable.');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Test function definition (same as in QWEN examples)
const testFunction = {
  name: 'get_current_weather',
  description: 'Get the current weather in a given location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g. San Francisco, CA',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit']
      },
    },
    required: ['location'],
  },
};

async function testRequest(testName, requestBody) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('📤 Request body:');
  console.log(JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error response:');
      console.log(error);
      return;
    }

    const data = await response.json();
    console.log('✅ Success response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if the response contains function calls
    if (data.output?.tool_calls) {
      console.log('🔧 Function calls detected!');
    } else if (data.output?.choices?.[0]?.message?.function_call) {
      console.log('🔧 Function call detected (OpenAI format)!');
    } else {
      console.log('📝 Regular text response, no function calls');
    }
    
  } catch (error) {
    console.log('❌ Request failed:');
    console.log(error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting DashScope API Function Calling Tests');
  console.log(`🔑 Using API key: ${API_KEY.substring(0, 10)}...`);

  const baseMessage = {
    role: 'user',
    content: "What's the weather like in San Francisco? Please use the get_current_weather function."
  };

  // Test 1: Current implementation format (functions at top level)
  await testRequest('Current Implementation (functions at top level)', {
    model: 'qwen-plus',
    parameters: {
      temperature: 0,
    },
    input: {
      messages: [baseMessage],
    },
    functions: [testFunction],
  });

  // Test 2: OpenAI-style tools format
  await testRequest('OpenAI-style tools format', {
    model: 'qwen-plus',
    parameters: {
      temperature: 0,
    },
    input: {
      messages: [baseMessage],
    },
    tools: [{
      type: 'function',
      function: testFunction,
    }],
  });

  // Test 3: Functions inside input
  await testRequest('Functions inside input', {
    model: 'qwen-plus',
    parameters: {
      temperature: 0,
    },
    input: {
      messages: [baseMessage],
      functions: [testFunction],
    },
  });

  // Test 4: Functions inside parameters
  await testRequest('Functions inside parameters', {
    model: 'qwen-plus',
    parameters: {
      temperature: 0,
      functions: [testFunction],
    },
    input: {
      messages: [baseMessage],
    },
  });

  // Test 5: Without functions (baseline)
  await testRequest('Baseline (no functions)', {
    model: 'qwen-plus',
    parameters: {
      temperature: 0,
    },
    input: {
      messages: [{
        role: 'user',
        content: "What's the weather like in San Francisco?"
      }],
    },
  });

  // Test 6: Try compatible mode endpoint
  console.log('\n🔄 Testing OpenAI-compatible endpoint...');
  try {
    const compatResponse = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [baseMessage],
        tools: [{
          type: 'function',
          function: testFunction,
        }],
        temperature: 0,
      }),
    });

    console.log(`📊 Compatible mode status: ${compatResponse.status}`);
    if (compatResponse.ok) {
      const compatData = await compatResponse.json();
      console.log('✅ Compatible mode response:');
      console.log(JSON.stringify(compatData, null, 2));
    } else {
      const error = await compatResponse.text();
      console.log('❌ Compatible mode error:');
      console.log(error);
    }
  } catch (error) {
    console.log('❌ Compatible mode failed:');
    console.log(error.message);
  }

  console.log('\n✨ Tests completed!');
}

runTests().catch(console.error);