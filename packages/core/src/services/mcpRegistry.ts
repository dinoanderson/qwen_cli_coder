/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP Server Registry - Catalog of available MCP servers with installation metadata
 */

export interface McpServerCatalogEntry {
  /** Server identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of server capabilities */
  description: string;
  /** Installation method */
  installMethod: 'npm' | 'pip' | 'cargo' | 'binary' | 'docker';
  /** Package/binary name for installation */
  packageName: string;
  /** Command to run the server */
  command: string;
  /** Arguments to pass to the command */
  args: string[];
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Categories/tags for discovery */
  categories: string[];
  /** Server capabilities */
  capabilities: string[];
  /** Whether server is trusted by default */
  trusted?: boolean;
  /** Additional environment variables needed */
  env?: Record<string, string>;
  /** Prerequisites or dependencies */
  prerequisites?: string[];
  /** Homepage/documentation URL */
  homepage?: string;
}

/**
 * Built-in catalog of popular MCP servers
 */
export const MCP_SERVER_CATALOG: Record<string, McpServerCatalogEntry> = {
  'duckduckgo-search': {
    id: 'duckduckgo-search',
    name: 'DuckDuckGo Search',
    description: 'Privacy-focused web search using DuckDuckGo. Enables searching the web for current information, news, and research.',
    installMethod: 'npm',
    packageName: '@oevortex/ddg_search',
    command: 'npx',
    args: ['-y', '@oevortex/ddg_search'],
    timeout: 30000,
    categories: ['search', 'web', 'research'],
    capabilities: ['web_search', 'current_events', 'research'],
    trusted: true,
    homepage: 'https://www.npmjs.com/package/@oevortex/ddg_search'
  },
  
  'github-mcp': {
    id: 'github-mcp',
    name: 'GitHub MCP',
    description: 'Interact with GitHub repositories, issues, pull requests, and actions. Perfect for code review and project management.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    timeout: 30000,
    categories: ['development', 'git', 'collaboration'],
    capabilities: ['github_api', 'repository_management', 'issue_tracking', 'pull_requests'],
    prerequisites: ['GitHub personal access token required'],
    env: { 'GITHUB_PERSONAL_ACCESS_TOKEN': 'required' },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github'
  },

  'filesystem-mcp': {
    id: 'filesystem-mcp',
    name: 'Filesystem MCP',
    description: 'Enhanced file system operations with safety checks. Provides secure file reading, writing, and directory operations.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    timeout: 30000,
    categories: ['filesystem', 'utility'],
    capabilities: ['file_operations', 'directory_management', 'safe_file_access'],
    trusted: true,
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem'
  },

  'brave-search': {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Independent web search using Brave Search API. Alternative to Google with privacy focus.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    timeout: 30000,
    categories: ['search', 'web', 'research'],
    capabilities: ['web_search', 'independent_search', 'privacy_focused'],
    prerequisites: ['Brave Search API key required'],
    env: { 'BRAVE_API_KEY': 'required' },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search'
  },

  'postgres-mcp': {
    id: 'postgres-mcp',
    name: 'PostgreSQL MCP',
    description: 'Connect to PostgreSQL databases for querying and data analysis. Supports complex SQL operations.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-postgres',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    timeout: 30000,
    categories: ['database', 'sql', 'data'],
    capabilities: ['database_queries', 'sql_execution', 'data_analysis'],
    prerequisites: ['PostgreSQL connection string required'],
    env: { 'POSTGRES_CONNECTION_STRING': 'required' },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres'
  },

  'slack-mcp': {
    id: 'slack-mcp',
    name: 'Slack MCP',
    description: 'Interact with Slack workspaces, send messages, and manage channels. Great for team collaboration.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    timeout: 30000,
    categories: ['communication', 'collaboration', 'team'],
    capabilities: ['slack_messaging', 'channel_management', 'team_communication'],
    prerequisites: ['Slack bot token required'],
    env: { 'SLACK_BOT_TOKEN': 'required' },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack'
  },

  'google-drive-mcp': {
    id: 'google-drive-mcp',
    name: 'Google Drive MCP',
    description: 'Access and manage Google Drive files and folders. Upload, download, and organize cloud storage.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-gdrive',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gdrive'],
    timeout: 30000,
    categories: ['cloud', 'storage', 'google'],
    capabilities: ['file_storage', 'cloud_sync', 'document_management'],
    prerequisites: ['Google Drive API credentials required'],
    env: { 'GOOGLE_DRIVE_CREDENTIALS': 'required' },
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive'
  },

  'memory-mcp': {
    id: 'memory-mcp',
    name: 'Memory MCP',
    description: 'Persistent memory and knowledge management. Store and retrieve information across sessions.',
    installMethod: 'npm',
    packageName: '@modelcontextprotocol/server-memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    timeout: 30000,
    categories: ['memory', 'knowledge', 'persistence'],
    capabilities: ['persistent_memory', 'knowledge_storage', 'session_continuity'],
    trusted: true,
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory'
  }
};

/**
 * MCP Registry Service for discovering and managing server installations
 */
export class McpRegistryService {
  private static instance: McpRegistryService;
  private catalog: Record<string, McpServerCatalogEntry>;

  private constructor() {
    this.catalog = { ...MCP_SERVER_CATALOG };
  }

  public static getInstance(): McpRegistryService {
    if (!McpRegistryService.instance) {
      McpRegistryService.instance = new McpRegistryService();
    }
    return McpRegistryService.instance;
  }

  /**
   * Get all available servers
   */
  public getAllServers(): McpServerCatalogEntry[] {
    return Object.values(this.catalog);
  }

  /**
   * Get server by ID
   */
  public getServer(id: string): McpServerCatalogEntry | null {
    return this.catalog[id] || null;
  }

  /**
   * Search servers by capability or keyword
   */
  public searchServers(query: string): McpServerCatalogEntry[] {
    const searchTerm = query.toLowerCase();
    return Object.values(this.catalog).filter(server =>
      server.name.toLowerCase().includes(searchTerm) ||
      server.description.toLowerCase().includes(searchTerm) ||
      server.categories.some(cat => cat.toLowerCase().includes(searchTerm)) ||
      server.capabilities.some(cap => cap.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get servers by category
   */
  public getServersByCategory(category: string): McpServerCatalogEntry[] {
    return Object.values(this.catalog).filter(server =>
      server.categories.includes(category.toLowerCase())
    );
  }

  /**
   * Get recommended servers for specific capabilities
   */
  public getRecommendedServers(capabilities: string[]): McpServerCatalogEntry[] {
    const capabilitySet = new Set(capabilities.map(c => c.toLowerCase()));
    return Object.values(this.catalog)
      .filter(server => 
        server.capabilities.some(cap => capabilitySet.has(cap.toLowerCase()))
      )
      .sort((a, b) => {
        // Sort by number of matching capabilities (descending)
        const aMatches = a.capabilities.filter(cap => capabilitySet.has(cap.toLowerCase())).length;
        const bMatches = b.capabilities.filter(cap => capabilitySet.has(cap.toLowerCase())).length;
        return bMatches - aMatches;
      });
  }

  /**
   * Add a custom server to the catalog
   */
  public addCustomServer(server: McpServerCatalogEntry): void {
    this.catalog[server.id] = server;
  }

  /**
   * Remove a server from the catalog
   */
  public removeServer(id: string): boolean {
    if (this.catalog[id]) {
      delete this.catalog[id];
      return true;
    }
    return false;
  }

  /**
   * Get installation command for a server
   */
  public getInstallCommand(serverId: string): { command: string; args: string[] } | null {
    const server = this.getServer(serverId);
    if (!server) return null;

    switch (server.installMethod) {
      case 'npm':
        return {
          command: 'npm',
          args: ['install', '-g', server.packageName]
        };
      case 'pip':
        return {
          command: 'pip',
          args: ['install', server.packageName]
        };
      case 'cargo':
        return {
          command: 'cargo',
          args: ['install', server.packageName]
        };
      default:
        return {
          command: server.command,
          args: server.args
        };
    }
  }
}

/**
 * Get the singleton instance of the MCP Registry Service
 */
export function getMcpRegistry(): McpRegistryService {
  return McpRegistryService.getInstance();
}