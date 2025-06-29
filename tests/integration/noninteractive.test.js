#!/usr/bin/env node

// Minimal test of non-interactive flow
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

async function testNonInteractiveMinimal() {
  console.log('🧪 Testing Non-Interactive Flow (Minimal)...');
  
  try {
    // Load CLI configuration
    const workspaceRoot = process.cwd();
    const settings = loadSettings(workspaceRoot);
    
    // Set auth type manually if needed
    if (!settings.merged.selectedAuthType) {
      const hasQwenKey = !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
      if (hasQwenKey) {
        settings.merged.selectedAuthType = AuthType.USE_QWEN_DASHSCOPE;
      }
    }
    
    const config = await loadCliConfig(settings.merged, [], 'test-session');
    console.log('✅ CLI config loaded');
    
    // Refresh auth
    if (settings.merged.selectedAuthType) {
      await config.refreshAuth(settings.merged.selectedAuthType);
      console.log('✅ Auth refreshed');
    }
    
    // Get client and test basic access
    const qwenClient = config.getGeminiClient();
    console.log('✅ Got GeminiClient');
    
    // Get tool registry 
    const toolRegistry = await config.getToolRegistry();
    console.log('✅ Got tool registry');
    
    // Try a simple message stream
    console.log('🔄 Testing sendMessageStream...');
    const abortController = new AbortController();
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('⏰ Timeout reached, aborting...');
      abortController.abort();
    }, 5000);
    
    try {
      const responseStream = qwenClient.sendMessageStream(
        [{ text: 'Hello, what is 2+2?' }],
        abortController.signal
      );
      
      console.log('✅ Stream created, processing events...');
      let eventCount = 0;
      
      for await (const event of responseStream) {
        eventCount++;
        console.log(`📦 Event ${eventCount}: ${event.type}`);
        
        if (event.type === 'content') {
          console.log('📝 Content:', event.value.substring(0, 50));
        }
        
        // Stop after a few events for testing
        if (eventCount >= 3) {
          console.log('🛑 Stopping after 3 events for test');
          abortController.abort();
          break;
        }
      }
      
      console.log('✅ Stream processing completed');
      
    } catch (streamError) {
      if (abortController.signal.aborted) {
        console.log('✅ Stream aborted as expected');
      } else {
        console.error('❌ Stream error:', streamError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in non-interactive test:', error.message);
    console.error('Full error:', error);
  }
}

testNonInteractiveMinimal();