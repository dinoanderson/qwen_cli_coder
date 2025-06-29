/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { HistoryItem, MessageType } from '../types.js';
import { Config, QWEN_MODELS } from '@qwen/qwen-cli-core';

export function useModelCommand(
  settings: LoadedSettings,
  config: Config | null,
  setModelError: (error: string | null) => void,
  addItem: (item: Omit<HistoryItem, 'id'>, timestamp: number) => void,
) {
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);

  const openModelDialog = useCallback(() => {
    setIsModelDialogOpen(true);
  }, []);

  const handleModelSelect = useCallback(
    async (model: string | undefined, scope: SettingScope) => {
      setIsModelDialogOpen(false);
      
      if (!model) {
        // User cancelled
        return;
      }

      try {
        const previousModel = config?.getModel() || 'Unknown';
        
        if (model === previousModel) {
          addItem({
            type: MessageType.INFO,
            text: `Already using model: ${model}`,
          }, Date.now());
          return;
        }
        
        // Validate model exists
        if (!(model in QWEN_MODELS)) {
          const availableModels = Object.keys(QWEN_MODELS).join(', ');
          setModelError(`Unknown model: ${model}. Available models: ${availableModels}`);
          addItem({
            type: MessageType.ERROR,
            text: `Unknown model: ${model}. Available models: ${availableModels}`,
          }, Date.now());
          return;
        }
        
        // Switch model
        config?.setModel(model);
        const modelInfo = QWEN_MODELS[model as keyof typeof QWEN_MODELS];
        
        // Add success message
        const contextInfo = `Context: ${modelInfo.contextWindow.toLocaleString()} tokens`;
        const outputInfo = `Output: ${modelInfo.maxOutputTokens.toLocaleString()} tokens`;
        const visionInfo = modelInfo.isVisionModel ? ' | Vision: ✅' : '';
        
        addItem({
          type: MessageType.INFO,
          text: `Switched from ${previousModel} to ${model}\n\n${modelInfo.displayName}\n${contextInfo} | ${outputInfo}${visionInfo}`,
        }, Date.now());
        
        // Clear any previous errors
        setModelError(null);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setModelError(`Failed to switch model: ${errorMessage}`);
        addItem({
          type: MessageType.ERROR,
          text: `Failed to switch model: ${errorMessage}`,
        }, Date.now());
      }
    },
    [config, setModelError, addItem],
  );

  const handleModelHighlight = useCallback(
    (model: string | undefined) => {
      // Optional: could show preview of model here
      // For now, we just clear any existing errors
      if (model) {
        setModelError(null);
      }
    },
    [setModelError],
  );

  return {
    isModelDialogOpen,
    openModelDialog,
    handleModelSelect,
    handleModelHighlight,
  };
}