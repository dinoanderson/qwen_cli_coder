/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { SETTINGS_DIRECTORY_NAME, USER_SETTINGS_DIR, USER_SETTINGS_PATH } from '../config/settings.js';

/**
 * Basic default settings for Qwen CLI
 */
const DEFAULT_SETTINGS = {
  theme: 'Default',
  usageStatisticsEnabled: true,
  autoConfigureMaxOldSpaceSize: true,
  fileFiltering: {
    respectGitIgnore: true,
    enableRecursiveFileSearch: true
  }
};

/**
 * Example settings with DuckDuckGo MCP server configuration
 */
const EXAMPLE_SETTINGS_WITH_MCP = {
  ...DEFAULT_SETTINGS,
  mcpServers: {
    duckduckgo: {
      command: "npx",
      args: ["-y", "@oevortex/ddg_search"],
      timeout: 30000
    }
  }
};

/**
 * Initializes Qwen CLI configuration directories and files
 */
export async function initializeQwenDirectories(workspaceRoot: string): Promise<void> {
  try {
    // 1. Initialize global user directory (~/.qwen)
    await initializeGlobalDirectory();
    
    // 2. Initialize workspace directory (./project/.qwen) 
    await initializeWorkspaceDirectory(workspaceRoot);
    
    // 3. Auto-configure essential MCP servers
    await enableEssentialMcpServers();
    
  } catch (error) {
    console.warn('Warning: Could not fully initialize Qwen directories:', error);
    // Don't fail the CLI startup for directory creation issues
  }
}

/**
 * Auto-configure MCP servers for essential functionality
 */
async function enableEssentialMcpServers(): Promise<void> {
  // Check if we should auto-enable DuckDuckGo search
  if (fs.existsSync(USER_SETTINGS_PATH)) {
    try {
      const settings = JSON.parse(fs.readFileSync(USER_SETTINGS_PATH, 'utf-8'));
      
      // If no MCP servers configured, auto-add DuckDuckGo for search
      if (!settings.mcpServers || Object.keys(settings.mcpServers).length === 0) {
        settings.mcpServers = {
          duckduckgo: {
            command: "npx",
            args: ["-y", "@oevortex/ddg_search"],
            timeout: 30000
          }
        };
        
        fs.writeFileSync(
          USER_SETTINGS_PATH,
          JSON.stringify(settings, null, 2),
          'utf-8'
        );
        console.log('✅ Auto-configured DuckDuckGo search for web functionality');
      }
    } catch (error) {
      console.warn('Warning: Could not auto-configure MCP servers:', error);
    }
  }
}

/**
 * Initialize the global user settings directory
 */
async function initializeGlobalDirectory(): Promise<void> {
  // Create ~/.qwen directory if it doesn't exist
  if (!fs.existsSync(USER_SETTINGS_DIR)) {
    fs.mkdirSync(USER_SETTINGS_DIR, { recursive: true });
    console.log(`Created global Qwen directory: ${USER_SETTINGS_DIR}`);
  }
  
  // Create ~/.qwen/settings.json if it doesn't exist
  if (!fs.existsSync(USER_SETTINGS_PATH)) {
    fs.writeFileSync(
      USER_SETTINGS_PATH,
      JSON.stringify(DEFAULT_SETTINGS, null, 2),
      'utf-8'
    );
    console.log(`Created global settings file: ${USER_SETTINGS_PATH}`);
  }
  
  // Create ~/.qwen/settings.example.json with MCP configuration
  const examplePath = path.join(USER_SETTINGS_DIR, 'settings.example.json');
  if (!fs.existsSync(examplePath)) {
    fs.writeFileSync(
      examplePath,
      JSON.stringify(EXAMPLE_SETTINGS_WITH_MCP, null, 2),
      'utf-8'
    );
    console.log(`Created example settings file: ${examplePath}`);
  }
}

/**
 * Initialize the workspace-specific settings directory
 */
async function initializeWorkspaceDirectory(workspaceRoot: string): Promise<void> {
  const workspaceQwenDir = path.join(workspaceRoot, SETTINGS_DIRECTORY_NAME);
  
  // Create ./.qwen directory if it doesn't exist
  if (!fs.existsSync(workspaceQwenDir)) {
    fs.mkdirSync(workspaceQwenDir, { recursive: true });
    console.log(`Created workspace Qwen directory: ${workspaceQwenDir}`);
  }
  
  // Note: We don't auto-create workspace settings.json as it's project-specific
  // Users can create it manually or through dialog commands when needed
}

/**
 * Check if MCP servers are configured and provide helpful guidance
 */
export function checkMcpConfiguration(): { hasConfiguration: boolean; message?: string } {
  try {
    if (fs.existsSync(USER_SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(USER_SETTINGS_PATH, 'utf-8'));
      if (settings.mcpServers && Object.keys(settings.mcpServers).length > 0) {
        return { hasConfiguration: true };
      }
    }
    
    return {
      hasConfiguration: false,
      message: `No MCP servers configured. To enable web search:

1. Install DuckDuckGo MCP server:
   npm install -g @nickclyde/duckduckgo-mcp-server

2. Copy settings from example:
   cp ~/.qwen/settings.example.json ~/.qwen/settings.json

3. Or add manually to ~/.qwen/settings.json:
   {
     "mcpServers": {
       "duckduckgo": {
         "command": "npx",
         "args": ["-y", "@nickclyde/duckduckgo-mcp-server"]
       }
     }
   }

4. Restart the CLI`
    };
  } catch (error) {
    return {
      hasConfiguration: false,
      message: 'Could not check MCP configuration'
    };
  }
}