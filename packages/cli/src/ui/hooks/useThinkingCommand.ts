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
        const qwenClient = config?.getQwenClient();
        const currentlyEnabled = qwenClient?.getEnableThinking() || false;
        
        if (enabled === currentlyEnabled) {
          addItem({
            type: MessageType.INFO,
            text: `Thinking mode is already ${enabled ? 'enabled' : 'disabled'}`,
          }, Date.now());
          return;
        }
        
        // Dynamically update thinking mode without restart
        if (qwenClient && qwenClient.setEnableThinking) {
          qwenClient.setEnableThinking(enabled);
          
          // Also update the settings for persistence
          settings.setValue(scope, 'enableThinking', enabled);
          
          addItem({
            type: MessageType.INFO,
            text: `Thinking mode ${enabled ? 'enabled' : 'disabled'} successfully. Changes take effect immediately.`,
          }, Date.now());
        } else {
          // Fallback: update settings and request restart
          settings.setValue(scope, 'enableThinking', enabled);
          addItem({
            type: MessageType.INFO,
            text: `Thinking mode setting updated. Please restart Qwen CLI for changes to take effect.`,
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
    [config, addItem, setThinkingError, settings],
  );

  const getCurrentThinkingState = useCallback(() => {
    const qwenClient = config?.getQwenClient();
    return qwenClient?.getEnableThinking() || false;
  }, [config]);

  return {
    isThinkingDialogOpen,
    openThinkingDialog,
    handleThinkingToggle,
    getCurrentThinkingState,
  };
}