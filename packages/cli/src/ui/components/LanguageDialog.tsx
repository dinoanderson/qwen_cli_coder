/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, Language, getCurrentLanguage } from '../../utils/i18n.js';

interface LanguageDialogProps {
  /** Callback function when a language is selected */
  onSelect: (language: Language | undefined, scope: SettingScope) => void;

  /** Callback function when a language is highlighted */
  onHighlight: (language: Language | undefined) => void;
  
  /** The settings object */
  settings: LoadedSettings;
}

export function LanguageDialog({
  onSelect,
  onHighlight,
  settings,
}: LanguageDialogProps): React.JSX.Element {
  const [selectedScope, setSelectedScope] = useState<SettingScope>(
    SettingScope.User,
  );

  // Generate language items
  const languageItems = SUPPORTED_LANGUAGES.map((lang) => ({
    label: `${LANGUAGE_NAMES[lang]} (${lang})`,
    value: lang,
    languageCode: lang,
    languageName: LANGUAGE_NAMES[lang],
  }));

  const [selectInputKey, setSelectInputKey] = useState(Date.now());

  const currentLanguage = getCurrentLanguage();
  const currentLanguageName = LANGUAGE_NAMES[currentLanguage];

  const handleLanguageSelect = (language: Language) => {
    onSelect(language, selectedScope);
    setSelectInputKey(Date.now()); // Reset the select component
  };

  const handleLanguageHighlight = (language: Language) => {
    onHighlight(language);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={Colors.Foreground}>
        🌐 Language Selection
      </Text>
      
      <Box height={1} />
      
      <Text color={Colors.Foreground}>
        Current language: <Text bold color={Colors.AccentPurple}>{currentLanguageName} ({currentLanguage})</Text>
      </Text>
      
      <Box height={1} />
      
      <Text color={Colors.Foreground}>
        Choose a new language:
      </Text>
      
      <Box height={1} />

      <RadioButtonSelect
        key={selectInputKey}
        items={languageItems}
        onSelect={handleLanguageSelect}
        onHighlight={handleLanguageHighlight}
      />

      <Box height={1} />
      
      <Text color={Colors.Gray} dimColor>
        ↑/↓ Navigate • Enter to select • Esc to cancel
      </Text>
    </Box>
  );
}