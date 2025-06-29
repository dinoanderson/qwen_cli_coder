#!/usr/bin/env node

// Test content generator creation
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file
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
if (envFile) {
  dotenv.config({ path: envFile });
}

import { createContentGenerator, AuthType } from './packages/core/dist/src/core/contentGenerator.js';

async function testContentGenerator() {
  console.log('🧪 Testing Content Generator Creation...');
  
  const hasQwenKey = !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
  console.log('✅ Qwen API key available:', hasQwenKey);
  
  if (!hasQwenKey) {
    console.error('❌ No API key found');
    return;
  }
  
  try {
    console.log('🔧 Creating content generator...');
    const contentGeneratorConfig = {
      authType: AuthType.USE_QWEN_DASHSCOPE,
    };
    
    const contentGenerator = await createContentGenerator(contentGeneratorConfig);
    console.log('✅ Content generator created successfully');
    console.log('🔍 Content generator type:', contentGenerator.constructor.name);
    
  } catch (error) {
    console.error('❌ Error creating content generator:', error.message);
    console.error('Full error:', error);
  }
}

testContentGenerator();