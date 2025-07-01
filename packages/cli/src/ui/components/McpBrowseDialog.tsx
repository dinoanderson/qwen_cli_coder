/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { McpServerCatalogEntry, getMcpRegistry } from '@qwen/qwen-cli-core';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';

export interface McpBrowseDialogProps {
  onSelect: (server: McpServerCatalogEntry | null) => void;
  error?: string | null;
}

interface CategoryItem {
  label: string;
  value: string;
  description?: string;
}

interface ServerItem {
  label: string;
  value: McpServerCatalogEntry;
  description: string;
}

export function McpBrowseDialog({
  onSelect,
  error,
}: McpBrowseDialogProps): React.JSX.Element {
  const [focusedSection, setFocusedSection] = useState<'categories' | 'servers'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [highlightedServer, setHighlightedServer] = useState<McpServerCatalogEntry | null>(null);

  const registry = getMcpRegistry();
  
  // Get all categories
  const allServers = registry.getAllServers();
  const categories = new Set<string>();
  allServers.forEach(server => server.categories.forEach(cat => categories.add(cat)));
  
  const categoryItems: CategoryItem[] = [
    { label: '📂 All Servers', value: 'all', description: `View all ${allServers.length} available servers` },
    ...Array.from(categories).sort().map(category => {
      const count = registry.getServersByCategory(category).length;
      const icon = getCategoryIcon(category);
      return {
        label: `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        value: category,
        description: `${count} server${count !== 1 ? 's' : ''} in this category`,
      };
    }),
  ];

  // Get servers for selected category
  const servers = selectedCategory === 'all' || !selectedCategory
    ? allServers
    : registry.getServersByCategory(selectedCategory);
    
  const serverItems: ServerItem[] = servers.map(server => ({
    label: `${getServerIcon(server)} ${server.name}`,
    value: server,
    description: `${server.description} | ${server.capabilities.join(', ')}`,
  }));

  const handleCategorySelect = useCallback((item: CategoryItem) => {
    setSelectedCategory(item.value);
    setFocusedSection('servers');
  }, []);

  const handleServerSelect = useCallback((item: ServerItem) => {
    onSelect(item.value);
  }, [onSelect]);

  const handleServerHighlight = useCallback((item: ServerItem | null) => {
    setHighlightedServer(item?.value || null);
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onSelect(null);
      return;
    }
    
    if (key.tab) {
      if (focusedSection === 'categories' && selectedCategory) {
        setFocusedSection('servers');
      } else {
        setFocusedSection('categories');
      }
      return;
    }
    
    if (key.leftArrow && focusedSection === 'servers') {
      setFocusedSection('categories');
      return;
    }
    
    if (key.rightArrow && focusedSection === 'categories' && selectedCategory) {
      setFocusedSection('servers');
      return;
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={Colors.AccentBlue} paddingX={1} paddingY={1}>
        <Box flexDirection="column" width="100%">
          {/* Header */}
          <Box marginBottom={1}>
            <Text bold color={Colors.AccentBlue}>
              🔍 Browse MCP Servers
            </Text>
          </Box>
          
          {/* Error display */}
          {error && (
            <Box marginBottom={1}>
              <Text color={Colors.AccentRed}>❌ {error}</Text>
            </Box>
          )}
          
          {/* Instructions */}
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              Use ↑↓ to navigate, Enter to select, Tab to switch sections, Escape to cancel
            </Text>
          </Box>
          
          <Box flexDirection="row" width="100%">
            {/* Categories Panel */}
            <Box flexDirection="column" width="40%" marginRight={2}>
              <Box marginBottom={1}>
                <Text bold color={focusedSection === 'categories' ? Colors.AccentBlue : Colors.Gray}>
                  📋 Categories
                </Text>
              </Box>
              <Box height={12} borderStyle="single" borderColor={focusedSection === 'categories' ? Colors.AccentBlue : Colors.Gray}>
                <RadioButtonSelect
                  items={categoryItems.map(item => ({ ...item, value: item }))}
                  onSelect={handleCategorySelect}
                  isFocused={focusedSection === 'categories'}
                />
              </Box>
            </Box>
            
            {/* Servers Panel */}
            <Box flexDirection="column" width="60%">
              <Box marginBottom={1}>
                <Text bold color={focusedSection === 'servers' ? Colors.AccentBlue : Colors.Gray}>
                  🔧 Servers {selectedCategory && `(${selectedCategory})`}
                </Text>
              </Box>
              <Box height={12} borderStyle="single" borderColor={focusedSection === 'servers' ? Colors.AccentBlue : Colors.Gray}>
                {selectedCategory ? (
                  <RadioButtonSelect
                    items={serverItems.map(item => ({ ...item, value: item }))}
                    onSelect={handleServerSelect}
                    onHighlight={handleServerHighlight}
                    isFocused={focusedSection === 'servers'}
                  />
                ) : (
                  <Box padding={1}>
                    <Text color={Colors.Gray}>
                      ← Select a category to view servers
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
          
          {/* Server Details Panel */}
          {highlightedServer && (
            <Box marginTop={1} borderStyle="single" borderColor={Colors.AccentGreen} padding={1}>
              <Box flexDirection="column">
                <Text bold color={Colors.AccentGreen}>
                  📦 {highlightedServer.name}
                </Text>
                <Text color={Colors.Gray}>
                  ID: {highlightedServer.id}
                </Text>
                <Text>
                  {highlightedServer.description}
                </Text>
                <Box marginTop={1}>
                  <Text color={Colors.AccentBlue}>
                    🏷️  Categories: {highlightedServer.categories.join(', ')}
                  </Text>
                </Box>
                <Box>
                  <Text color={Colors.AccentYellow}>
                    ⚡ Capabilities: {highlightedServer.capabilities.join(', ')}
                  </Text>
                </Box>
                <Box>
                  <Text color={Colors.Gray}>
                    📥 Install: {highlightedServer.installMethod} • {highlightedServer.packageName}
                  </Text>
                </Box>
                {highlightedServer.prerequisites && (
                  <Box>
                    <Text color={Colors.AccentRed}>
                      ⚠️  Prerequisites: {highlightedServer.prerequisites.join(', ')}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          {/* Footer */}
          <Box marginTop={1}>
            <Text color={Colors.Gray}>
              💡 Select a server to view details and installation options
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    search: '🔍',
    web: '🌐',
    development: '💻',
    git: '🔧',
    collaboration: '👥',
    database: '🗄️',
    sql: '📊',
    data: '📈',
    communication: '💬',
    team: '👨‍👩‍👧‍👦',
    cloud: '☁️',
    storage: '💾',
    google: '🔵',
    memory: '🧠',
    knowledge: '📚',
    persistence: '💿',
    filesystem: '📁',
    utility: '🔨',
  };
  return icons[category.toLowerCase()] || '📦';
}

function getServerIcon(server: McpServerCatalogEntry): string {
  // Icon based on primary category or name
  if (server.categories.includes('search')) return '🔍';
  if (server.categories.includes('development')) return '💻';
  if (server.categories.includes('database')) return '🗄️';
  if (server.categories.includes('communication')) return '💬';
  if (server.categories.includes('cloud')) return '☁️';
  if (server.categories.includes('memory')) return '🧠';
  if (server.categories.includes('filesystem')) return '📁';
  if (server.name.toLowerCase().includes('github')) return '🐙';
  if (server.name.toLowerCase().includes('google')) return '🔵';
  if (server.name.toLowerCase().includes('slack')) return '💬';
  if (server.name.toLowerCase().includes('postgres')) return '🐘';
  return '🔧';
}