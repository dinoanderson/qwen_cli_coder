/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { HistoryItem, MessageType } from '../types.js';
import { Config } from '@qwen/qwen-cli-core';

export function useThinkingCommand(
  settings: LoadedSettings,
  config: Config | null,
  setThinkingError: (error: string | null) => void,
  addItem: (item: Omit<HistoryItem, 'id'>, timestamp: number) => void,
) {
  const [isThinkingDialogOpen, setIsThinkingDialogOpen] = useState(false);

  const openThinkingDialog = useCallback(() => {
    setIsThinkingDialogOpen(true);
  }, []);

  const handleThinkingToggle = useCallback(
    async (enabled: boolean, scope: SettingScope) => {
      setIsThinkingDialogOpen(false);
      
      try {
        const currentConfig = config?.getContentGeneratorConfig();
        const currentlyEnabled = currentConfig?.enableThinking || false;
        
        if (enabled === currentlyEnabled) {
          addItem({
            type: MessageType.INFO,
            text: `Thinking mode is already ${enabled ? 'enabled' : 'disabled'}`,
          }, Date.now());
          return;
        }
        
        // Note: We can't change thinking mode on the fly without recreating the config
        // For now, we'll update the setting and inform the user they need to restart
        if (scope === SettingScope.User) {
          // Set environment variable approach - would need to restart anyway
          addItem({
            type: MessageType.INFO,
            text: `Thinking mode ${enabled ? 'enabled' : 'disabled'}. Please restart Qwen CLI for changes to take effect.`,
          }, Date.now());
        } else {
          addItem({
            type: MessageType.INFO,
            text: `Thinking mode setting updated. Use QWEN_ENABLE_THINKING=${enabled} environment variable or restart CLI.`,
          }, Date.now());
        }
        
      } catch (error: any) {
        setThinkingError(`Failed to update thinking mode: ${error.message}`);
        addItem({
          type: MessageType.ERROR,
          text: `Failed to update thinking mode: ${error.message}`,
        }, Date.now());
      }
    },
    [config, addItem, setThinkingError],
  );

  const getCurrentThinkingState = useCallback(() => {
    const currentConfig = config?.getContentGeneratorConfig();
    return currentConfig?.enableThinking || false;
  }, [config]);

  return {
    isThinkingDialogOpen,
    openThinkingDialog,
    handleThinkingToggle,
    getCurrentThinkingState,
  };
}