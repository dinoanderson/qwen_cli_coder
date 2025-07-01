/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';

export interface McpMenuDialogProps {
  onSelect: (action: string | null) => void;
}

interface MenuOption {
  label: string;
  value: string;
  description: string;
  shortcut: string;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    label: '🔍 Browse Servers',
    value: 'browse',
    description: 'Browse MCP servers by category (development, search, database, etc.)',
    shortcut: 'b',
  },
  {
    label: '🔎 Search Servers',
    value: 'search',
    description: 'Search for MCP servers by name, description, or capabilities',
    shortcut: 's',
  },
  {
    label: '📦 Install Server',
    value: 'install',
    description: 'Install an MCP server with guided configuration',
    shortcut: 'i',
  },
  {
    label: '📋 List Current Servers',
    value: 'list',
    description: 'Show currently configured MCP servers and their tools',
    shortcut: 'l',
  },
];

export function McpMenuDialog({ onSelect }: McpMenuDialogProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleMenuSelect = useCallback((item: { value: string; label: string; description: string }) => {
    onSelect(item.value);
  }, [onSelect]);

  const handleMenuHighlight = useCallback((item: { value: string; label: string; description: string }) => {
    const index = MENU_OPTIONS.findIndex(opt => opt.value === item.value);
    setSelectedIndex(index);
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onSelect(null);
      return;
    }

    // Handle shortcut keys
    const option = MENU_OPTIONS.find(opt => opt.shortcut === input.toLowerCase());
    if (option) {
      onSelect(option.value);
      return;
    }

    // Handle return key to select current option
    if (key.return) {
      onSelect(MENU_OPTIONS[selectedIndex].value);
      return;
    }
  });

  const selectedOption = MENU_OPTIONS[selectedIndex];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={Colors.AccentBlue} paddingX={1} paddingY={1}>
        <Box flexDirection="column" width="100%">
          {/* Header */}
          <Box marginBottom={1}>
            <Text bold color={Colors.AccentBlue}>
              🛠️ MCP Server Management
            </Text>
          </Box>
          
          {/* Description */}
          <Box marginBottom={1}>
            <Text color={Colors.Gray}>
              Choose an action to manage MCP (Model Context Protocol) servers
            </Text>
          </Box>
          
          <Box flexDirection="row" width="100%">
            {/* Menu Options */}
            <Box flexDirection="column" width="60%" marginRight={2}>
              <Box marginBottom={1}>
                <Text bold color={Colors.AccentGreen}>
                  Available Actions:
                </Text>
              </Box>
              <Box height={8} borderStyle="single" borderColor={Colors.AccentBlue}>
                <RadioButtonSelect
                  items={MENU_OPTIONS.map(option => ({
                    label: `${option.label} (${option.shortcut})`,
                    value: option,
                    description: option.description,
                  }))}
                  onSelect={handleMenuSelect}
                  onHighlight={handleMenuHighlight}
                  isFocused={true}
                  initialIndex={selectedIndex}
                />
              </Box>
            </Box>
            
            {/* Details Panel */}
            <Box flexDirection="column" width="40%">
              <Box marginBottom={1}>
                <Text bold color={Colors.AccentYellow}>
                  Action Details:
                </Text>
              </Box>
              <Box 
                height={8} 
                borderStyle="single" 
                borderColor={Colors.AccentYellow}
                padding={1}
              >
                <Box flexDirection="column">
                  <Text bold color={Colors.AccentGreen}>
                    {selectedOption.label}
                  </Text>
                  <Box marginTop={1}>
                    <Text wrap="wrap" color={Colors.Foreground}>
                      {selectedOption.description}
                    </Text>
                  </Box>
                  <Box marginTop={1}>
                    <Text color={Colors.AccentBlue}>
                      💡 Shortcut: Press '{selectedOption.shortcut}' key
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* What is MCP? Section */}
          <Box marginTop={1} borderStyle="single" borderColor={Colors.AccentPurple} padding={1}>
            <Box flexDirection="column">
              <Text bold color={Colors.AccentPurple}>
                💡 What is MCP?
              </Text>
              <Text color={Colors.Gray}>
                Model Context Protocol (MCP) servers extend Qwen CLI with specialized tools like web search, 
                database access, file operations, and more. Each server provides specific capabilities 
                that enhance your AI assistant's functionality.
              </Text>
            </Box>
          </Box>
          
          {/* Footer */}
          <Box marginTop={1}>
            <Text color={Colors.Gray}>
              ↑↓ = Navigate • Enter = Select • Shortcuts: b/s/i/l • Esc = Cancel
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}