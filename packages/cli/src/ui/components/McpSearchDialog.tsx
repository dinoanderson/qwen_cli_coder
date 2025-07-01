/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { McpServerCatalogEntry, getMcpRegistry } from '@qwen/qwen-cli-core';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { TextInput } from './shared/TextInput.js';

export interface McpSearchDialogProps {
  onSelect: (server: McpServerCatalogEntry | null, query?: string) => void;
  error?: string | null;
}

interface ServerItem {
  label: string;
  value: McpServerCatalogEntry;
  description: string;
}

const EXAMPLE_SEARCHES = [
  'web search',
  'github',
  'database',
  'slack',
  'file system',
  'memory',
  'google drive',
  'postgres'
];

export function McpSearchDialog({
  onSelect,
  error,
}: McpSearchDialogProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedSection, setFocusedSection] = useState<'search' | 'results'>('search');
  const [highlightedServer, setHighlightedServer] = useState<McpServerCatalogEntry | null>(null);
  const [searchResults, setSearchResults] = useState<McpServerCatalogEntry[]>([]);

  const registry = getMcpRegistry();

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = registry.searchServers(searchQuery);
      setSearchResults(results);
      if (results.length > 0 && focusedSection === 'search') {
        // Auto-focus results if we have them
        setFocusedSection('results');
      }
    } else {
      setSearchResults([]);
      setHighlightedServer(null);
    }
  }, [searchQuery, registry, focusedSection]);

  const serverItems: ServerItem[] = searchResults.map(server => ({
    label: `${getServerIcon(server)} ${server.name}`,
    value: server,
    description: `${server.description} | Categories: ${server.categories.join(', ')}`,
  }));

  const handleSearchSubmit = useCallback(() => {
    if (searchResults.length === 1) {
      // If only one result, auto-select it
      onSelect(searchResults[0], searchQuery);
    } else if (searchResults.length > 1) {
      // Multiple results, focus the results section
      setFocusedSection('results');
    }
  }, [searchResults, searchQuery, onSelect]);

  const handleServerSelect = useCallback((item: ServerItem) => {
    onSelect(item.value, searchQuery);
  }, [onSelect, searchQuery]);

  const handleServerHighlight = useCallback((item: ServerItem | null) => {
    setHighlightedServer(item?.value || null);
  }, []);

  const handleExampleSearch = useCallback((example: string) => {
    setSearchQuery(example);
    setFocusedSection('search');
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onSelect(null);
      return;
    }
    
    if (key.tab) {
      if (focusedSection === 'search' && searchResults.length > 0) {
        setFocusedSection('results');
      } else {
        setFocusedSection('search');
      }
      return;
    }
    
    if (key.downArrow && focusedSection === 'search' && searchResults.length > 0) {
      setFocusedSection('results');
      return;
    }
    
    if (key.upArrow && focusedSection === 'results') {
      setFocusedSection('search');
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
              🔍 Search MCP Servers
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
              Enter keywords to search for servers (capabilities, categories, names)
            </Text>
          </Box>
          
          {/* Search Input */}
          <Box marginBottom={1} borderStyle="single" borderColor={focusedSection === 'search' ? Colors.AccentBlue : Colors.Gray}>
            <Box padding={1} width="100%">
              <Box marginRight={2}>
                <Text color={Colors.AccentBlue}>🔎 Search:</Text>
              </Box>
              <TextInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                placeholder="e.g., web search, github, database..."
                focus={focusedSection === 'search'}
              />
            </Box>
          </Box>
          
          {/* Example Searches */}
          {!searchQuery && (
            <Box marginBottom={1} borderStyle="single" borderColor={Colors.Gray}>
              <Box padding={1} flexDirection="column">
                <Text bold color={Colors.AccentYellow}>💡 Popular searches:</Text>
                <Box flexDirection="row" flexWrap="wrap">
                  {EXAMPLE_SEARCHES.map((example, index) => (
                    <Box key={example} marginRight={1} marginTop={index >= 4 ? 1 : 0}>
                      <Text 
                        color={Colors.AccentCyan}
                        dimColor={false}
                      >
                        #{example}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Search Results */}
          {searchQuery && (
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text bold color={focusedSection === 'results' ? Colors.AccentBlue : Colors.Gray}>
                  📦 Results for "{searchQuery}" ({searchResults.length} found)
                </Text>
              </Box>
              
              {searchResults.length > 0 ? (
                <Box height={8} borderStyle="single" borderColor={focusedSection === 'results' ? Colors.AccentBlue : Colors.Gray}>
                  <RadioButtonSelect
                    items={serverItems.map(item => ({ ...item, value: item }))}
                    onSelect={handleServerSelect}
                    onHighlight={handleServerHighlight}
                    isFocused={focusedSection === 'results'}
                  />
                </Box>
              ) : (
                <Box borderStyle="single" borderColor={Colors.Gray} padding={1}>
                  <Text color={Colors.Gray}>
                    No servers found matching "{searchQuery}". Try different keywords or browse all servers with /mcp browse
                  </Text>
                </Box>
              )}
            </Box>
          )}
          
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
              {focusedSection === 'search' ? 
                '↵ Enter to search • ↓ to results • Tab to switch sections • Esc to cancel' :
                '↵ Enter to select • ↑ to search • Tab to switch sections • Esc to cancel'
              }
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
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