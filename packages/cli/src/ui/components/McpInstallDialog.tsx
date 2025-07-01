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
import { McpInstallOptions } from '../hooks/useMcpCommand.js';

export interface McpInstallDialogProps {
  onSelect: (serverId: string | null, options?: McpInstallOptions) => void;
  error?: string | null;
}

interface ServerItem {
  label: string;
  value: McpServerCatalogEntry;
  description: string;
}

interface ScopeItem {
  label: string;
  value: 'user' | 'workspace';
  description: string;
}

interface OptionItem {
  label: string;
  value: string;
  description: string;
  checked: boolean;
}

const SCOPE_OPTIONS: ScopeItem[] = [
  {
    label: '👤 User Settings',
    value: 'user',
    description: 'Install globally for your user (~/.qwen/settings.json)',
  },
  {
    label: '📁 Workspace Settings', 
    value: 'workspace',
    description: 'Install only for this project (./.qwen/settings.json)',
  },
];

export function McpInstallDialog({
  onSelect,
  error,
}: McpInstallDialogProps): React.JSX.Element {
  const [focusedSection, setFocusedSection] = useState<'servers' | 'scope' | 'options'>('servers');
  const [selectedServer, setSelectedServer] = useState<McpServerCatalogEntry | null>(null);
  const [selectedScope, setSelectedScope] = useState<'user' | 'workspace'>('user');
  const [installOptions, setInstallOptions] = useState({
    trusted: false,
    autoInstall: true,
  });

  const registry = getMcpRegistry();
  const allServers = registry.getAllServers();
  
  const serverItems: ServerItem[] = allServers.map(server => ({
    label: `${getServerIcon(server)} ${server.name}`,
    value: server,
    description: `${server.description} | ${server.categories.join(', ')}`,
  }));

  const optionItems: OptionItem[] = [
    {
      label: '🚀 Auto Install Dependencies',
      value: 'autoInstall',
      description: 'Automatically install package dependencies',
      checked: installOptions.autoInstall,
    },
    {
      label: '🔒 Trust Server',
      value: 'trusted',
      description: 'Skip confirmation dialogs for this server',
      checked: installOptions.trusted,
    },
  ];

  const handleServerSelect = useCallback((item: ServerItem) => {
    setSelectedServer(item.value);
    setFocusedSection('scope');
  }, []);

  const handleScopeSelect = useCallback((item: ScopeItem) => {
    setSelectedScope(item.value);
    setFocusedSection('options');
  }, []);

  const handleOptionToggle = useCallback((item: OptionItem) => {
    setInstallOptions(prev => ({
      ...prev,
      [item.value]: !prev[item.value as keyof typeof prev],
    }));
  }, []);

  const handleInstall = useCallback(() => {
    if (selectedServer) {
      const options: McpInstallOptions = {
        scope: selectedScope,
        trusted: installOptions.trusted,
        autoInstall: installOptions.autoInstall,
      };
      onSelect(selectedServer.id, options);
    }
  }, [selectedServer, selectedScope, installOptions, onSelect]);

  useInput((input, key) => {
    if (key.escape) {
      onSelect(null);
      return;
    }
    
    if (key.tab || key.rightArrow) {
      if (focusedSection === 'servers' && selectedServer) {
        setFocusedSection('scope');
      } else if (focusedSection === 'scope') {
        setFocusedSection('options');
      } else if (focusedSection === 'options') {
        setFocusedSection('servers');
      }
      return;
    }
    
    if (key.leftArrow) {
      if (focusedSection === 'options') {
        setFocusedSection('scope');
      } else if (focusedSection === 'scope') {
        setFocusedSection('servers');
      } else if (focusedSection === 'servers') {
        setFocusedSection('options');
      }
      return;
    }
    
    if (input === 'i' && selectedServer) {
      handleInstall();
      return;
    }
  });

  const canInstall = selectedServer && selectedScope;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={Colors.AccentBlue} paddingX={1} paddingY={1}>
        <Box flexDirection="column" width="100%">
          {/* Header */}
          <Box marginBottom={1}>
            <Text bold color={Colors.AccentBlue}>
              📦 Install MCP Server
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
              Select a server, choose installation scope, and configure options
            </Text>
          </Box>
          
          <Box flexDirection="row" width="100%">
            {/* Servers Panel */}
            <Box flexDirection="column" width="50%" marginRight={1}>
              <Box marginBottom={1}>
                <Text bold color={focusedSection === 'servers' ? Colors.AccentBlue : Colors.Gray}>
                  🔧 Select Server
                </Text>
              </Box>
              <Box height={10} borderStyle="single" borderColor={focusedSection === 'servers' ? Colors.AccentBlue : Colors.Gray}>
                <RadioButtonSelect
                  items={serverItems.map(item => ({ ...item, value: item }))}
                  onSelect={handleServerSelect}
                  isFocused={focusedSection === 'servers'}
                  initialIndex={selectedServer ? serverItems.findIndex(item => item.value === selectedServer) : 0}
                />
              </Box>
            </Box>
            
            {/* Configuration Panel */}
            <Box flexDirection="column" width="50%">
              {/* Scope Selection */}
              <Box marginBottom={1}>
                <Text bold color={focusedSection === 'scope' ? Colors.AccentBlue : Colors.Gray}>
                  📍 Installation Scope
                </Text>
              </Box>
              <Box height={4} borderStyle="single" borderColor={focusedSection === 'scope' ? Colors.AccentBlue : Colors.Gray}>
                <RadioButtonSelect
                  items={SCOPE_OPTIONS.map(item => ({ ...item, value: item }))}
                  onSelect={handleScopeSelect}
                  isFocused={focusedSection === 'scope'}
                  initialIndex={SCOPE_OPTIONS.findIndex(item => item.value === selectedScope)}
                />
              </Box>
              
              {/* Options */}
              <Box marginTop={1} marginBottom={1}>
                <Text bold color={focusedSection === 'options' ? Colors.AccentBlue : Colors.Gray}>
                  ⚙️ Options
                </Text>
              </Box>
              <Box height={4} borderStyle="single" borderColor={focusedSection === 'options' ? Colors.AccentBlue : Colors.Gray}>
                <Box padding={1} flexDirection="column">
                  {optionItems.map((option, index) => (
                    <Box key={option.value} marginBottom={index < optionItems.length - 1 ? 1 : 0}>
                      <Text 
                        color={focusedSection === 'options' ? Colors.AccentBlue : Colors.Gray}
                      >
                        {option.checked ? '☑️' : '☐'} {option.label}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* Selected Server Details */}
          {selectedServer && (
            <Box marginTop={1} borderStyle="single" borderColor={Colors.AccentGreen} padding={1}>
              <Box flexDirection="column">
                <Text bold color={Colors.AccentGreen}>
                  📦 {selectedServer.name}
                </Text>
                <Text>
                  {selectedServer.description}
                </Text>
                <Box marginTop={1}>
                  <Text color={Colors.AccentBlue}>
                    🏷️  Categories: {selectedServer.categories.join(', ')}
                  </Text>
                </Box>
                <Box>
                  <Text color={Colors.AccentYellow}>
                    ⚡ Capabilities: {selectedServer.capabilities.join(', ')}
                  </Text>
                </Box>
                <Box>
                  <Text color={Colors.Gray}>
                    📥 Package: {selectedServer.packageName} ({selectedServer.installMethod})
                  </Text>
                </Box>
                {selectedServer.prerequisites && (
                  <Box>
                    <Text color={Colors.AccentRed}>
                      ⚠️  Prerequisites: {selectedServer.prerequisites.join(', ')}
                    </Text>
                  </Box>
                )}
                {selectedServer.env && Object.keys(selectedServer.env).length > 0 && (
                  <Box>
                    <Text color={Colors.AccentYellow}>
                      🔐 Environment Variables: {Object.keys(selectedServer.env).join(', ')}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          {/* Install Button / Instructions */}
          <Box marginTop={1} borderStyle="single" borderColor={canInstall ? Colors.AccentGreen : Colors.Gray} padding={1}>
            {canInstall ? (
              <Box flexDirection="column">
                <Text bold color={Colors.AccentGreen}>
                  ✅ Ready to Install
                </Text>
                <Text color={Colors.Gray}>
                  Installing "{selectedServer.name}" to {selectedScope} settings
                  {installOptions.trusted && ' (trusted)'}
                  {!installOptions.autoInstall && ' (manual dependencies)'}
                </Text>
                <Box marginTop={1}>
                  <Text color={Colors.AccentYellow}>
                    Press 'i' to install or Enter to confirm selection
                  </Text>
                </Box>
              </Box>
            ) : (
              <Text color={Colors.Gray}>
                Select a server and configuration to enable installation
              </Text>
            )}
          </Box>
          
          {/* Footer */}
          <Box marginTop={1}>
            <Text color={Colors.Gray}>
              {canInstall ? 
                'i = Install • Tab/← → = Navigate sections • Esc = Cancel' :
                'Tab/← → = Navigate sections • ↑↓ = Select items • Esc = Cancel'
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