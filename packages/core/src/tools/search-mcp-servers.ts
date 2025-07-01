/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, ToolResult } from './tools.js';
import { getMcpRegistry, McpServerCatalogEntry } from '../services/mcpRegistry.js';

/**
 * Parameters for the SearchMcpServersTool
 */
export interface SearchMcpServersParams {
  /**
   * Search query - can be empty to list all servers
   */
  query?: string;

  /**
   * Category filter
   */
  category?: string;

  /**
   * Required capabilities filter
   */
  capabilities?: string[];

  /**
   * Maximum number of results to return
   * @default 10
   */
  limit?: number;

  /**
   * Whether to show detailed information
   * @default false
   */
  detailed?: boolean;
}

/**
 * Tool for searching and browsing available MCP servers
 */
export class SearchMcpServersTool extends BaseTool<SearchMcpServersParams, ToolResult> {
  static readonly Name = 'search_mcp_servers';

  constructor() {
    super(
      SearchMcpServersTool.Name,
      'Search MCP Servers',
      'Search and browse available MCP (Model Context Protocol) servers. Use this to discover servers that provide specific capabilities like web search, GitHub integration, database access, etc.',
      {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for server name, description, or capabilities (leave empty to list all servers)'
          },
          category: {
            type: 'string',
            description: 'Filter by category (e.g., "search", "development", "database", "communication")'
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by required capabilities (e.g., ["web_search", "github_api"])'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10,
            minimum: 1,
            maximum: 50
          },
          detailed: {
            type: 'boolean',
            description: 'Whether to show detailed information for each server',
            default: false
          }
        }
      },
      true, // isOutputMarkdown
      false // canUpdateOutput
    );
  }

  validateToolParams(params: SearchMcpServersParams): string | null {
    if (params.limit && (params.limit < 1 || params.limit > 50)) {
      return 'Limit must be between 1 and 50';
    }
    return null;
  }

  getDescription(params: SearchMcpServersParams): string {
    if (params.query) {
      return `Searching MCP servers for: "${params.query}"`;
    } else if (params.category) {
      return `Browsing MCP servers in category: "${params.category}"`;
    } else {
      return 'Browsing all available MCP servers';
    }
  }

  async shouldConfirmExecute(): Promise<false> {
    // Search is read-only and safe
    return false;
  }

  async execute(params: SearchMcpServersParams): Promise<ToolResult> {
    const registry = getMcpRegistry();
    const limit = params.limit || 10;
    const detailed = params.detailed || false;

    let servers: McpServerCatalogEntry[];

    // Apply filters
    if (params.query) {
      servers = registry.searchServers(params.query);
    } else if (params.category) {
      servers = registry.getServersByCategory(params.category);
    } else if (params.capabilities && params.capabilities.length > 0) {
      servers = registry.getRecommendedServers(params.capabilities);
    } else {
      servers = registry.getAllServers();
    }

    // Apply limit
    const limitedServers = servers.slice(0, limit);
    const hasMore = servers.length > limit;

    // Build response
    let response = this.buildServerList(limitedServers, detailed, params);
    
    if (hasMore) {
      response += `\n\n*Showing ${limit} of ${servers.length} results. Use a more specific query or increase the limit to see more.*`;
    }

    if (limitedServers.length === 0) {
      response = this.buildNoResultsMessage(params);
    }

    return {
      llmContent: [{ text: response }],
      returnDisplay: `Found ${limitedServers.length} MCP servers`
    };
  }

  private buildServerList(
    servers: McpServerCatalogEntry[], 
    detailed: boolean, 
    params: SearchMcpServersParams
  ): string {
    let response = `# Available MCP Servers\n\n`;
    
    if (params.query) {
      response = `# MCP Servers matching "${params.query}"\n\n`;
    } else if (params.category) {
      response = `# MCP Servers in "${params.category}" category\n\n`;
    }

    response += `Found **${servers.length}** servers:\n\n`;

    servers.forEach((server, index) => {
      response += `## ${index + 1}. ${server.name}\n`;
      response += `**ID:** \`${server.id}\`\n`;
      response += `**Description:** ${server.description}\n`;
      
      if (detailed) {
        response += `**Categories:** ${server.categories.join(', ')}\n`;
        response += `**Capabilities:** ${server.capabilities.join(', ')}\n`;
        response += `**Install Method:** ${server.installMethod}\n`;
        
        if (server.prerequisites && server.prerequisites.length > 0) {
          response += `**Prerequisites:** ${server.prerequisites.join(', ')}\n`;
        }
        
        if (server.env && Object.keys(server.env).length > 0) {
          response += `**Environment Variables:** ${Object.keys(server.env).join(', ')}\n`;
        }
        
        if (server.homepage) {
          response += `**Homepage:** [${server.homepage}](${server.homepage})\n`;
        }
      }

      response += `\n*To install:* Use \`add_mcp_server\` with server="${server.id}"\n\n`;
    });

    response += `---\n\n`;
    response += `💡 **Tips:**\n`;
    response += `- Use \`add_mcp_server\` tool to install any of these servers\n`;
    response += `- Set \`detailed=true\` for more information about each server\n`;
    response += `- Filter by category or capabilities for more targeted results\n`;

    return response;
  }

  private buildNoResultsMessage(params: SearchMcpServersParams): string {
    let message = `# No MCP Servers Found\n\n`;
    
    if (params.query) {
      message += `No servers found matching query: "${params.query}"\n\n`;
    } else if (params.category) {
      message += `No servers found in category: "${params.category}"\n\n`;
    } else if (params.capabilities) {
      message += `No servers found with capabilities: ${params.capabilities.join(', ')}\n\n`;
    }

    message += `**Available categories:**\n`;
    const registry = getMcpRegistry();
    const allServers = registry.getAllServers();
    const categories = new Set<string>();
    allServers.forEach(server => server.categories.forEach(cat => categories.add(cat)));
    
    Array.from(categories).sort().forEach(category => {
      message += `- ${category}\n`;
    });

    message += `\n**Try:**\n`;
    message += `- Search with a broader query\n`;
    message += `- Browse by category\n`;
    message += `- Use \`search_mcp_servers\` without filters to see all available servers\n`;

    return message;
  }
}