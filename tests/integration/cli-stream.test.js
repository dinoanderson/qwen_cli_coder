#!/usr/bin/env node

// Test the CLI's stream processing without the UI
import { loadCliConfig } from './packages/cli/dist/src/config/config.js';
import { loadSettings } from './packages/cli/dist/src/config/settings.js';

async function testCliStream() {
  console.log('🧪 Testing CLI Stream Processing...');
  
  try {
    // Load CLI configuration
    const workspaceRoot = process.cwd();
    const settings = loadSettings(workspaceRoot);
    const config = await loadCliConfig(settings.merged, [], 'test-session');
    
    // Get the Gemini client
    const geminiClient = config.getGeminiClient();
    console.log('✅ CLI config loaded');
    console.log('🔍 geminiClient:', geminiClient ? 'exists' : 'undefined');
    console.log('🔍 selectedAuthType:', settings.merged.selectedAuthType);
    
    // Try to manually call refreshAuth like the UI would
    if (settings.merged.selectedAuthType) {
      console.log('🔧 Manually calling refreshAuth...');
      await config.refreshAuth(settings.merged.selectedAuthType);
      console.log('✅ refreshAuth completed');
      
      const newGeminiClient = config.getGeminiClient();
      console.log('🔍 geminiClient after refresh:', newGeminiClient ? 'exists' : 'undefined');
    }
    
    // Test sending a simple message
    console.log('📤 Sending test message...');
    const finalGeminiClient = config.getGeminiClient();
    if (!finalGeminiClient) {
      console.error('❌ No geminiClient available after refresh');
      return;
    }
    const stream = finalGeminiClient.sendMessageStream([{ text: 'Hello, what is 2+2?' }], new AbortController().signal);
    
    console.log('🔄 Processing stream events...');
    let eventCount = 0;
    
    try {
      for await (const event of stream) {
        eventCount++;
        console.log(`📦 Event ${eventCount}:`, event.type);
        
        // Show event details
        if (event.type === 'content') {
          console.log('  📝 Content:', event.value);
        } else if (event.type === 'error') {
          console.log('  ❌ Error:', event.value);
        } else if (event.type === 'toolCallRequest') {
          console.log('  🔧 Tool call:', event.value?.name);
        } else {
          console.log('  📄 Event value:', event.value ? JSON.stringify(event.value).substring(0, 100) : '(no value)');
        }
        
        // Add a timeout safety
        if (eventCount > 50) {
          console.log('⚠️ Too many events, breaking...');
          break;
        }
      }
    } catch (streamError) {
      console.error('❌ Stream error:', streamError.message);
      console.error('Full stream error:', streamError);
    }
    
    console.log('✅ Stream completed successfully with', eventCount, 'events');
    
  } catch (error) {
    console.error('❌ CLI stream error:', error.message);
    console.error('Full error:', error);
  }
}

testCliStream();