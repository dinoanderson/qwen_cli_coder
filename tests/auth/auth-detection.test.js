#!/usr/bin/env node

// Simple test to verify env vars and auth detection
console.log('🔍 Testing Auth Detection...');
console.log('Environment variables:');
console.log('- QWEN_API_KEY:', process.env.QWEN_API_KEY ? 'SET' : 'NOT SET');
console.log('- DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY ? 'SET' : 'NOT SET');

// Test the same logic that gemini.tsx uses
const hasQwenKey = !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
console.log('- hasQwenKey:', hasQwenKey);

// Let's also check if .env files are being loaded
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to find and load .env file like the CLI does
function findEnvFile(startDir) {
  let currentDir = path.resolve(startDir);
  while (true) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

const envFile = findEnvFile(process.cwd());
console.log('📄 .env file found:', envFile);

if (envFile) {
  console.log('🔄 Loading .env file...');
  dotenv.config({ path: envFile });
  console.log('After loading .env:');
  console.log('- QWEN_API_KEY:', process.env.QWEN_API_KEY ? 'SET' : 'NOT SET');
  console.log('- DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY ? 'SET' : 'NOT SET');
  const hasQwenKeyAfter = !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
  console.log('- hasQwenKey after .env:', hasQwenKeyAfter);
}