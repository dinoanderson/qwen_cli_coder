/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { BaseTool, ToolResult } from './tools.js';
import { getMcpRegistry, McpServerCatalogEntry } from '../services/mcpRegistry.js';
import { MCPServerConfig } from '../config/config.js';

/**
 * Parameters for the AddMcpServerTool
 */
export interface AddMcpServerParams {
  /**
   * Server identifier or search query. Can be:
   * - Exact server ID (e.g., 'duckduckgo-search')
   * - Search query (e.g., 'web search', 'github')
   * - Capability description (e.g., 'I need to search the web')
   */
  server: string;

  /**
   * Installation scope
   * @default 'user'
   */
  scope?: 'user' | 'workspace';

  /**
   * Whether to automatically install dependencies
   * @default true
   */
  autoInstall?: boolean;

  /**
   * Whether to trust the server by default (skip confirmations)
   * @default false
   */
  trusted?: boolean;

  /**
   * Custom environment variables for the server
   */
  environment?: Record<string, string>;

  /**
   * Force reinstall if server already exists
   * @default false
   */
  force?: boolean;
}

/**
 * Tool for dynamically adding MCP servers to the system
 */
export class AddMcpServerTool extends BaseTool<AddMcpServerParams, ToolResult> {
  static readonly Name = 'add_mcp_server';

  constructor() {
    super(
      AddMcpServerTool.Name,
      'Add MCP Server',
      'Dynamically install and configure MCP (Model Context Protocol) servers to extend functionality. Use this tool when users request new capabilities like web search, GitHub integration, database access, etc.',
      {
        type: 'object',
        properties: {
          server: {
            type: 'string',
            description: 'Server identifier or capability description (e.g., "duckduckgo-search", "web search", "github integration")'
          },
          scope: {
            type: 'string',
            enum: ['user', 'workspace'],
            description: 'Installation scope - user (global) or workspace (project-specific)',
            default: 'user'
          },
          autoInstall: {
            type: 'boolean',
            description: 'Whether to automatically install dependencies',
            default: true
          },
          trusted: {
            type: 'boolean',
            description: 'Whether to trust the server by default (skip confirmations)',
            default: false
          },
          environment: {
            type: 'object',
            description: 'Custom environment variables for the server',
            additionalProperties: {
              type: 'string'
            }
          },
          force: {
            type: 'boolean',
            description: 'Force reinstall if server already exists',
            default: false
          }
        },
        required: ['server']
      },
      true, // isOutputMarkdown
      true  // canUpdateOutput
    );
  }

  validateToolParams(params: AddMcpServerParams): string | null {
    if (!params.server || params.server.trim().length === 0) {
      return 'Server identifier or capability description is required';
    }

    if (params.scope && !['user', 'workspace'].includes(params.scope)) {
      return 'Scope must be either "user" or "workspace"';
    }

    return null;
  }

  getDescription(params: AddMcpServerParams): string {
    return `Installing MCP server for: "${params.server}" (scope: ${params.scope || 'user'})`;
  }

  async shouldConfirmExecute(): Promise<false> {
    // MCP server installation is generally safe and reversible
    return false;
  }

  async execute(
    params: AddMcpServerParams,
    abortSignal: AbortSignal,
    updateOutput?: (chunk: string) => void
  ): Promise<ToolResult> {
    const registry = getMcpRegistry();
    const scope = params.scope || 'user';
    const autoInstall = params.autoInstall !== false;
    
    updateOutput?.('🔍 Searching for MCP server...\n');

    // Find the server in the registry
    let server = registry.getServer(params.server);
    
    if (!server) {
      // Try searching by capability or description
      const searchResults = registry.searchServers(params.server);
      if (searchResults.length === 0) {
        return {
          llmContent: [{ text: `❌ No MCP server found matching "${params.server}". Use the search_mcp_servers tool to discover available servers.` }],
          returnDisplay: `No MCP server found matching "${params.server}"`
        };
      }
      
      // Use the best match (first result)
      server = searchResults[0];
      updateOutput?.(`📦 Found server: **${server.name}** - ${server.description}\n`);
    } else {
      updateOutput?.(`📦 Server found: **${server.name}** - ${server.description}\n`);
    }

    // Check if server is already installed
    const isInstalled = await this.isServerInstalled(server.id, scope);
    if (isInstalled && !params.force) {
      return {
        llmContent: [{ text: `✅ MCP server "${server.name}" is already installed. Use force=true to reinstall.` }],
        returnDisplay: `Server "${server.name}" is already installed`
      };
    }

    // Install dependencies if needed
    if (autoInstall && server.installMethod !== 'binary') {
      updateOutput?.('⬇️ Installing server package...\n');
      const installResult = await this.installServerPackage(server, updateOutput);
      if (!installResult.success) {
        return {
          llmContent: [{ text: `❌ Failed to install server package: ${installResult.error}` }],
          returnDisplay: `Installation failed: ${installResult.error}`
        };
      }
    }

    // Configure the server in settings
    updateOutput?.('⚙️ Configuring server settings...\n');
    const configResult = await this.configureServer(server, scope, params.environment, params.trusted);
    if (!configResult.success) {
      return {
        llmContent: [{ text: `❌ Failed to configure server: ${configResult.error}` }],
        returnDisplay: `Configuration failed: ${configResult.error}`
      };
    }

    updateOutput?.('✅ Server installation completed!\n');

    const successMessage = this.buildSuccessMessage(server, scope);
    
    return {
      llmContent: [{ text: successMessage }],
      returnDisplay: `Successfully installed ${server.name}`
    };
  }

  private async isServerInstalled(serverId: string, scope: string): Promise<boolean> {
    const settingsPath = this.getSettingsPath(scope);
    if (!fs.existsSync(settingsPath)) {
      return false;
    }

    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return settings.mcpServers && settings.mcpServers[serverId];
    } catch {
      return false;
    }
  }

  private async installServerPackage(
    server: McpServerCatalogEntry, 
    updateOutput?: (chunk: string) => void
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (server.installMethod === 'binary') {
        resolve({ success: true });
        return;
      }

      const installCmd = getMcpRegistry().getInstallCommand(server.id);
      if (!installCmd) {
        resolve({ success: false, error: 'No installation command available' });
        return;
      }

      updateOutput?.(`Running: ${installCmd.command} ${installCmd.args.join(' ')}\n`);

      const child = spawn(installCmd.command, installCmd.args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        updateOutput?.(chunk);
      });

      child.stderr?.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        updateOutput?.(chunk);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ 
            success: false, 
            error: `Installation failed with code ${code}: ${errorOutput}`
          });
        }
      });

      child.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `Failed to start installation: ${error.message}`
        });
      });
    });
  }

  private async configureServer(
    server: McpServerCatalogEntry,
    scope: string,
    customEnv?: Record<string, string>,
    trusted?: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const settingsPath = this.getSettingsPath(scope);
      const settingsDir = path.dirname(settingsPath);

      // Ensure directory exists
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }

      // Load existing settings
      let settings: any = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      }

      // Initialize mcpServers if it doesn't exist
      if (!settings.mcpServers) {
        settings.mcpServers = {};
      }

      // Create server configuration
      const serverConfig: MCPServerConfig = {
        command: server.command,
        args: server.args,
        timeout: server.timeout,
        trust: trusted || server.trusted,
        env: { ...server.env, ...customEnv }
      };

      // Add description for better UX
      if (server.description) {
        (serverConfig as any).description = server.description;
      }

      // Add server to settings
      settings.mcpServers[server.id] = serverConfig;

      // Save settings
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getSettingsPath(scope: string): string {
    if (scope === 'workspace') {
      return path.join(process.cwd(), '.qwen', 'settings.json');
    } else {
      return path.join(homedir(), '.qwen', 'settings.json');
    }
  }

  private buildSuccessMessage(server: McpServerCatalogEntry, scope: string): string {
    let message = `✅ **Successfully installed ${server.name}**\n\n`;
    message += `**Description:** ${server.description}\n\n`;
    message += `**Capabilities:**\n`;
    server.capabilities.forEach(cap => {
      message += `- ${cap.replace(/_/g, ' ')}\n`;
    });
    
    message += `\n**Installation Details:**\n`;
    message += `- Scope: ${scope}\n`;
    message += `- Server ID: ${server.id}\n`;
    
    if (server.prerequisites && server.prerequisites.length > 0) {
      message += `\n**Prerequisites:**\n`;
      server.prerequisites.forEach(prereq => {
        message += `- ${prereq}\n`;
      });
    }

    if (server.env && Object.keys(server.env).length > 0) {
      message += `\n**Environment Variables Needed:**\n`;
      Object.keys(server.env).forEach(envVar => {
        message += `- ${envVar}: ${server.env![envVar]}\n`;
      });
    }

    message += `\n**Next Steps:**\n`;
    message += `- The server will be automatically discovered and loaded\n`;
    message += `- Use \`/mcp\` to check server status\n`;
    message += `- Use \`/tools\` to see available tools\n`;
    
    if (server.homepage) {
      message += `- Documentation: [${server.homepage}](${server.homepage})\n`;
    }

    return message;
  }
}