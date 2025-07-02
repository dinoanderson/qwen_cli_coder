/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { Colors } from '../colors.js';
import { QWEN_MODELS, QwenModelConfig, Config } from '@qwen/qwen-cli-core';
import { SettingScope } from '../../config/settings.js';

interface ModelDialogProps {
  onSelect: (model: string | undefined, scope: SettingScope, thinkingEnabled?: boolean) => void;
  onHighlight: (model: string | undefined) => void;
  currentModel?: string;
  config?: Config | null;
}

export const ModelDialog: React.FC<ModelDialogProps> = ({
  onSelect,
  onHighlight,
  currentModel,
  config,
}) => {
  const [selectedScope] = useState<SettingScope>(SettingScope.User);
  const [thinkingEnabled, setThinkingEnabled] = useState(() => {
    // Get current thinking state from config
    const currentConfig = config?.getContentGeneratorConfig();
    return currentConfig?.enableThinking || false;
  });

  // Prepare unified items list combining models and thinking options
  const modelItems = Object.entries(QWEN_MODELS).map(([key, model]: [string, QwenModelConfig]) => ({
    label: `📱 ${key} - ${model.displayName}`,
    value: `model:${key}`,
    description: `Context: ${model.contextWindow.toLocaleString()} tokens | Output: ${model.maxOutputTokens.toLocaleString()} tokens${model.isVisionModel ? ' | Vision: ✅' : ''}${model.thinkingWindow ? ` | Thinking: ${model.thinkingWindow.toLocaleString()} tokens` : ''}`,
  }));

  const thinkingItems = [
    {
      label: '🧠 Thinking Mode: OFF',
      value: 'thinking:false',
      description: 'Standard response mode without thinking tokens',
    },
    {
      label: '🧠 Thinking Mode: ON',
      value: 'thinking:true', 
      description: 'Enable thinking tokens for complex reasoning tasks',
    },
  ];

  // Add separator and combine all items
  const allItems = [
    ...modelItems,
    {
      label: '─────────────────────────',
      value: 'separator',
      description: 'Configuration options',
      disabled: true,
    },
    ...thinkingItems,
  ];

  const [selectInputKey, setSelectInputKey] = useState(Date.now());

  const handleUnifiedSelect = (value: string) => {
    if (value.startsWith('model:')) {
      const modelKey = value.substring(6); // Remove 'model:' prefix
      onSelect(modelKey, selectedScope, thinkingEnabled);
    } else if (value.startsWith('thinking:')) {
      const newThinkingEnabled = value === 'thinking:true';
      setThinkingEnabled(newThinkingEnabled);
      onSelect(currentModel, selectedScope, newThinkingEnabled);
    }
    setSelectInputKey(Date.now()); // Reset the select component
  };

  const handleModelHighlight = (model: string) => {
    onHighlight(model);
  };

  // Calculate initial index based on current selections
  const getInitialIndex = () => {
    // Find current model index
    const currentModelIndex = modelItems.findIndex(item => 
      item.value === `model:${currentModel}`
    );
    if (currentModelIndex !== -1) {
      return currentModelIndex;
    }
    
    // If current model not found, return index of current thinking mode
    const thinkingStartIndex = modelItems.length + 1; // +1 for separator
    return thinkingStartIndex + (thinkingEnabled ? 1 : 0);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={Colors.Foreground}>
        🤖 Model & Thinking Configuration
      </Text>
      
      <Box height={1} />
      
      <Text color={Colors.Foreground}>
        Current model: <Text bold color={Colors.AccentPurple}>{currentModel || 'Unknown'}</Text>
      </Text>
      
      <Text color={Colors.Foreground}>
        Thinking mode: <Text bold color={thinkingEnabled ? Colors.AccentGreen : Colors.AccentRed}>
          {thinkingEnabled ? 'ON' : 'OFF'}
        </Text>
      </Text>
      
      <Box height={1} />
      
      <Text color={Colors.Foreground}>
        Select model or configure thinking mode:
      </Text>
      
      <Box height={1} />

      <RadioButtonSelect
        key={selectInputKey}
        items={allItems}
        onSelect={handleUnifiedSelect}
        onHighlight={handleModelHighlight}
        initialIndex={getInitialIndex()}
      />

      <Box height={1} />
      
      <Text color={Colors.Gray} dimColor>
        ↑/↓ Navigate • Enter to select • Esc to cancel
      </Text>
      
      <Text color={Colors.Gray} dimColor>
        💡 Thinking mode requires CLI restart to take effect
      </Text>
    </Box>
  );
};