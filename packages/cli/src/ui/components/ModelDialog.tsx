/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { Colors } from '../colors.js';
import { QWEN_MODELS, QwenModelConfig } from '@qwen/qwen-cli-core';
import { SettingScope } from '../../config/settings.js';

interface ModelDialogProps {
  onSelect: (model: string | undefined, scope: SettingScope) => void;
  onHighlight: (model: string | undefined) => void;
  currentModel?: string;
}

export const ModelDialog: React.FC<ModelDialogProps> = ({
  onSelect,
  onHighlight,
  currentModel,
}) => {
  const [selectedScope] = useState<SettingScope>(SettingScope.User);

  // Prepare model items for the radio button select
  const modelItems = Object.entries(QWEN_MODELS).map(([key, model]: [string, QwenModelConfig]) => ({
    label: `${key} - ${model.displayName}`,
    value: key,
    modelKey: key,
    modelName: model.displayName,
    description: `Context: ${model.contextWindow.toLocaleString()} tokens | Output: ${model.maxOutputTokens.toLocaleString()} tokens${model.isVisionModel ? ' | Vision: ✅' : ''}`,
  }));

  const [selectInputKey, setSelectInputKey] = useState(Date.now());

  const handleModelSelect = (model: string) => {
    onSelect(model, selectedScope);
    setSelectInputKey(Date.now()); // Reset the select component
  };

  const handleModelHighlight = (model: string) => {
    onHighlight(model);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={Colors.Foreground}>
        🤖 Model Selection
      </Text>
      
      <Box height={1} />
      
      <Text color={Colors.Foreground}>
        Current model: <Text bold color={Colors.AccentPurple}>{currentModel || 'Unknown'}</Text>
      </Text>
      
      <Box height={1} />
      
      <Text color={Colors.Foreground}>
        Choose a new model:
      </Text>
      
      <Box height={1} />

      <RadioButtonSelect
        key={selectInputKey}
        items={modelItems}
        onSelect={handleModelSelect}
        onHighlight={handleModelHighlight}
      />

      <Box height={1} />
      
      <Text color={Colors.Gray} dimColor>
        ↑/↓ Navigate • Enter to select • Esc to cancel
      </Text>
    </Box>
  );
};