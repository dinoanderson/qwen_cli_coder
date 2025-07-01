/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { McpServerCatalogEntry, getMcpRegistry } from '@qwen/qwen-cli-core';
import { MessageType } from '../types.js';

export interface UseMcpCommandReturn {
  // Menu dialog state
  isMcpMenuDialogOpen: boolean;
  openMcpMenuDialog: () => void;
  handleMcpMenuSelect: (action: string | null) => void;
  
  // Browse dialog state
  isMcpBrowseDialogOpen: boolean;
  openMcpBrowseDialog: () => void;
  handleMcpBrowseSelect: (server: McpServerCatalogEntry | null) => void;
  
  // Search dialog state  
  isMcpSearchDialogOpen: boolean;
  openMcpSearchDialog: () => void;
  handleMcpSearchSelect: (server: McpServerCatalogEntry | null, query?: string) => void;
  
  // Install dialog state
  isMcpInstallDialogOpen: boolean;
  openMcpInstallDialog: () => void;
  handleMcpInstallSelect: (serverId: string | null, options?: McpInstallOptions) => void;
  
  // Shared state
  mcpServers: McpServerCatalogEntry[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Error handling
  mcpError: string | null;
  setMcpError: (error: string | null) => void;
}

export interface McpInstallOptions {
  scope?: 'user' | 'workspace';
  trusted?: boolean;
  autoInstall?: boolean;
  environment?: Record<string, string>;
}

export const useMcpCommand = (
  settings: LoadedSettings,
  addItem: (itemData: any, baseTimestamp: number) => number,
): UseMcpCommandReturn => {
  // Dialog states
  const [isMcpMenuDialogOpen, setIsMcpMenuDialogOpen] = useState(false);
  const [isMcpBrowseDialogOpen, setIsMcpBrowseDialogOpen] = useState(false);
  const [isMcpSearchDialogOpen, setIsMcpSearchDialogOpen] = useState(false);
  const [isMcpInstallDialogOpen, setIsMcpInstallDialogOpen] = useState(false);
  
  // Shared state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mcpError, setMcpError] = useState<string | null>(null);
  
  // Get servers from registry
  const registry = getMcpRegistry();
  const mcpServers = selectedCategory 
    ? registry.getServersByCategory(selectedCategory)
    : searchQuery
    ? registry.searchServers(searchQuery)
    : registry.getAllServers();

  // Menu dialog handlers
  const openMcpMenuDialog = useCallback(() => {
    setMcpError(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setIsMcpMenuDialogOpen(true);
  }, []);

  const handleMcpMenuSelect = useCallback(
    (action: string | null) => {
      setIsMcpMenuDialogOpen(false);
      if (!action) return;
      
      switch (action) {
        case 'browse':
          setMcpError(null);
          setSelectedCategory(null);
          setSearchQuery('');
          setIsMcpBrowseDialogOpen(true);
          break;
        case 'search':
          setMcpError(null);
          setSelectedCategory(null);
          setSearchQuery('');
          setIsMcpSearchDialogOpen(true);
          break;
        case 'install':
          setMcpError(null);
          setSelectedCategory(null);
          setSearchQuery('');
          setIsMcpInstallDialogOpen(true);
          break;
        case 'list':
          // Show current server list
          addItem({
            type: MessageType.INFO,
            text: 'Current MCP servers will be shown above this menu.',
          }, Date.now());
          break;
        default:
          break;
      }
    },
    [addItem],
  );

  // Browse dialog handlers
  const openMcpBrowseDialog = useCallback(() => {
    setMcpError(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setIsMcpBrowseDialogOpen(true);
  }, []);

  const handleMcpBrowseSelect = useCallback(
    (server: McpServerCatalogEntry | null) => {
      setIsMcpBrowseDialogOpen(false);
      if (server) {
        // Show server details and offer to install
        addItem({
          type: MessageType.INFO,
          text: `**${server.name}**\n\n${server.description}\n\n**Categories:** ${server.categories.join(', ')}\n**Capabilities:** ${server.capabilities.join(', ')}\n\nUse \`/mcp install\` to install this server, or use the \`add_mcp_server\` tool.`,
        }, Date.now());
      }
    },
    [addItem],
  );

  // Search dialog handlers
  const openMcpSearchDialog = useCallback(() => {
    setMcpError(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setIsMcpSearchDialogOpen(true);
  }, []);

  const handleMcpSearchSelect = useCallback(
    (server: McpServerCatalogEntry | null, query?: string) => {
      setIsMcpSearchDialogOpen(false);
      if (server) {
        // Show server details and offer to install
        addItem({
          type: MessageType.INFO, 
          text: `**${server.name}** (found by searching "${query}")\n\n${server.description}\n\n**Installation:** Use \`add_mcp_server\` tool with server="${server.id}" or use \`/mcp install\`.`,
        }, Date.now());
      }
    },
    [addItem],
  );

  // Install dialog handlers
  const openMcpInstallDialog = useCallback(() => {
    setMcpError(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setIsMcpInstallDialogOpen(true);
  }, []);

  const handleMcpInstallSelect = useCallback(
    (serverId: string | null, options?: McpInstallOptions) => {
      setIsMcpInstallDialogOpen(false);
      if (serverId) {
        const server = registry.getServer(serverId);
        if (server) {
          // Create a message that will trigger the add_mcp_server tool
          const installMessage = `Install ${server.name} MCP server`;
          const toolParams = {
            server: serverId,
            scope: options?.scope || 'user',
            trusted: options?.trusted || false,
            autoInstall: options?.autoInstall !== false,
            environment: options?.environment,
          };
          
          addItem({
            type: MessageType.USER,
            text: installMessage,
            toolCall: {
              toolName: 'add_mcp_server',
              params: toolParams,
            },
          }, Date.now());
        }
      }
    },
    [addItem, registry],
  );

  return {
    // Menu dialog
    isMcpMenuDialogOpen,
    openMcpMenuDialog,
    handleMcpMenuSelect,
    
    // Browse dialog
    isMcpBrowseDialogOpen,
    openMcpBrowseDialog,
    handleMcpBrowseSelect,
    
    // Search dialog
    isMcpSearchDialogOpen,
    openMcpSearchDialog,
    handleMcpSearchSelect,
    
    // Install dialog
    isMcpInstallDialogOpen,
    openMcpInstallDialog,
    handleMcpInstallSelect,
    
    // Shared state
    mcpServers,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    
    // Error handling
    mcpError,
    setMcpError,
  };
};