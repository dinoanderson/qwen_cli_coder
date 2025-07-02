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
  onModelChange?: (model: string) => void,
) {
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);

  const openModelDialog = useCallback(() => {
    setIsModelDialogOpen(true);
  }, []);

  const handleModelSelect = useCallback(
    async (model: string | undefined, scope: SettingScope, thinkingEnabled?: boolean) => {
      setIsModelDialogOpen(false);
      
      if (!model) {
        // User cancelled
        return;
      }

      try {
        const previousModel = config?.getModel() || 'Unknown';
        const currentThinking = config?.getContentGeneratorConfig()?.enableThinking || false;
        const newThinking = thinkingEnabled ?? currentThinking;
        
        // Check if anything actually changed
        if (model === previousModel && newThinking === currentThinking) {
          addItem({
            type: MessageType.INFO,
            text: `Already using model: ${model} with thinking mode ${newThinking ? 'ON' : 'OFF'}`,
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
        
        // Switch model in config
        config?.setModel(model);
        const modelInfo = QWEN_MODELS[model as keyof typeof QWEN_MODELS];
        
        // Persist model setting to disk
        if (model !== previousModel) {
          settings.setValue(scope, 'model', model);
        }
        
        // Handle thinking mode change
        let thinkingMessage = '';
        if (newThinking !== currentThinking) {
          // Persist thinking mode setting to disk
          settings.setValue(scope, 'enableThinking', newThinking);
          thinkingMessage = `\n\n🧠 Thinking mode ${newThinking ? 'enabled' : 'disabled'}. Please restart Qwen CLI for changes to take effect.\nAlternatively, use: QWEN_ENABLE_THINKING=${newThinking} in your environment.`;
        }
        
        // Add success message
        const contextInfo = `Context: ${modelInfo.contextWindow.toLocaleString()} tokens`;
        const outputInfo = `Output: ${modelInfo.maxOutputTokens.toLocaleString()} tokens`;
        const visionInfo = modelInfo.isVisionModel ? ' | Vision: ✅' : '';
        const thinkingInfo = modelInfo.thinkingWindow ? ` | Thinking: ${modelInfo.thinkingWindow.toLocaleString()} tokens` : '';
        
        const changeMessage = model !== previousModel 
          ? `Switched from ${previousModel} to ${model}` 
          : `Configuration updated for ${model}`;
        
        addItem({
          type: MessageType.INFO,
          text: `${changeMessage}\n\n${modelInfo.displayName}\n${contextInfo} | ${outputInfo}${visionInfo}${thinkingInfo}${thinkingMessage}`,
        }, Date.now());
        
        // Clear any previous errors
        setModelError(null);
        
        // Notify App component of model change
        if (model !== previousModel && onModelChange) {
          onModelChange(model);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setModelError(`Failed to update configuration: ${errorMessage}`);
        addItem({
          type: MessageType.ERROR,
          text: `Failed to update configuration: ${errorMessage}`,
        }, Date.now());
      }
    },
    [config, setModelError, addItem, settings, onModelChange],
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