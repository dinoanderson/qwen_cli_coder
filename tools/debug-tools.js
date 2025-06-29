import { QwenContentGenerator } from './packages/core/src/providers/qwen/qwenContentGenerator.js';

async function testTools() {
  console.log('=== Testing Tool Integration ===');
  
  const config = {
    apiKey: process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY,
    model: 'qwen-plus',
    enableThinking: false
  };
  
  const generator = new QwenContentGenerator(config);
  
  // Create a simple test tool
  const testTool = {
    functionDeclarations: [{
      name: 'test_function',
      description: 'A test function to verify tools work',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'A test message'
          }
        },
        required: ['message']
      }
    }]
  };
  
  const request = {
    model: 'qwen-plus',
    contents: [{
      role: 'user',
      parts: [{ text: 'Please call the test_function with the message "Hello Tools"' }]
    }],
    config: {
      tools: [testTool],
      temperature: 0
    }
  };
  
  try {
    console.log('Making API call with tools...');
    const response = await generator.generateContent(request);
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTools();