/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { 
  Language, 
  setLanguage, 
  LANGUAGE_NAMES, 
  getCurrentLanguage,
  initializeTranslations 
} from '../../utils/i18n.js';
import { HistoryItem, MessageType } from '../types.js';

export function useLanguageCommand(
  settings: LoadedSettings,
  setLanguageError: (error: string | null) => void,
  addItem: (item: Omit<HistoryItem, 'id'>, timestamp: number) => void,
  refreshStatic: () => void,
) {
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);

  const openLanguageDialog = useCallback(() => {
    setIsLanguageDialogOpen(true);
  }, []);

  const handleLanguageSelect = useCallback(
    async (language: Language | undefined, scope: SettingScope) => {
      setIsLanguageDialogOpen(false);
      
      if (!language) {
        // User cancelled
        return;
      }

      try {
        const previousLang = getCurrentLanguage();
        const previousLangName = LANGUAGE_NAMES[previousLang];
        
        // Update the language
        setLanguage(language);
        const newLangName = LANGUAGE_NAMES[language];
        
        // Save language setting
        settings.setValue(scope, 'language', language);
        
        // Reinitialize translations
        await initializeTranslations();
        
        // Add success message
        addItem({
          type: MessageType.INFO,
          text: `Language changed from ${previousLangName} (${previousLang}) to ${newLangName} (${language})`,
        }, Date.now());
        
        // Clear any previous errors
        setLanguageError(null);
        
        // Refresh the UI to update all translated text
        setTimeout(() => {
          refreshStatic();
        }, 100);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setLanguageError(`Failed to change language: ${errorMessage}`);
        addItem({
          type: MessageType.ERROR,
          text: `Failed to change language: ${errorMessage}`,
        }, Date.now());
      }
    },
    [settings, setLanguageError, addItem, refreshStatic],
  );

  const handleLanguageHighlight = useCallback(
    (language: Language | undefined) => {
      // Optional: could show preview of language here
      // For now, we just clear any existing errors
      if (language) {
        setLanguageError(null);
      }
    },
    [setLanguageError],
  );

  return {
    isLanguageDialogOpen,
    openLanguageDialog,
    handleLanguageSelect,
    handleLanguageHighlight,
  };
}