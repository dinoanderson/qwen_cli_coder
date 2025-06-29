#!/usr/bin/env node

/**
 * Simple test to check Qwen streaming response format
 */

const API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;

if (!API_KEY) {
  console.error('No API key found. Set DASHSCOPE_API_KEY or QWEN_API_KEY');
  process.exit(1);
}

async function testStreaming() {
  const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable',
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      parameters: {
        temperature: 0,
        incremental_output: true,
      },
      input: {
        messages: [{
          role: 'user',
          content: 'What is 2+2?'
        }],
      },
    }),
  });

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  console.log('Response headers:', response.headers);
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5);
        if (data === '[DONE]' || data.trim() === '') {
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          console.log('\n=== SSE Chunk ===');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.error('Parse error:', e.message, 'for line:', line);
        }
      }
    }
  }
}

testStreaming().catch(console.error);