#!/usr/bin/env node

// Test refreshAuth
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

import { loadCliConfig } from './packages/cli/dist/src/config/config.js';
import { loadSettings } from './packages/cli/dist/src/config/settings.js';
import { AuthType } from './packages/core/dist/src/core/contentGenerator.js';

async function testRefreshAuth() {
  console.log('🧪 Testing RefreshAuth...');
  
  try {
    // Load CLI configuration
    const workspaceRoot = process.cwd();
    const settings = loadSettings(workspaceRoot);
    console.log('✅ Settings loaded');
    
    // Set auth type manually if needed
    if (!settings.merged.selectedAuthType) {
      const hasQwenKey = !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
      if (hasQwenKey) {
        console.log('🔧 Setting auth type to Qwen');
        settings.merged.selectedAuthType = AuthType.USE_QWEN_DASHSCOPE;
      }
    }
    
    console.log('🔍 Selected auth type:', settings.merged.selectedAuthType);
    
    const config = await loadCliConfig(settings.merged, [], 'test-session');
    console.log('✅ CLI config loaded');
    
    if (settings.merged.selectedAuthType) {
      console.log('🔧 Calling refreshAuth...');
      await config.refreshAuth(settings.merged.selectedAuthType);
      console.log('✅ refreshAuth completed');
      
      const geminiClient = config.getGeminiClient();
      console.log('🔍 GeminiClient after refresh:', geminiClient ? 'exists' : 'undefined');
    } else {
      console.log('⚠️ No auth type set');
    }
    
  } catch (error) {
    console.error('❌ Error in refreshAuth test:', error.message);
    console.error('Full error:', error);
  }
}

testRefreshAuth();