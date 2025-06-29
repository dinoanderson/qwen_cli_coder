/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { SlashCommand } from '../hooks/slashCommandProcessor.js';
import { t, getCurrentLanguage } from '../../utils/i18n.js';

interface Help {
  commands: SlashCommand[];
}

export const Help: React.FC<Help> = ({ commands }) => {
  const currentLang = getCurrentLanguage();
  
  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      borderColor={Colors.Gray}
      borderStyle="round"
      padding={1}
    >
      {/* Basics */}
      <Text bold color={Colors.Foreground}>
        {t('helpContent.basics')}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          {t('helpContent.addContext')}
        </Text>
        : {t('helpContent.addContextDesc')}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          {t('helpContent.shellMode')}
        </Text>
        : {t('helpContent.shellModeDesc')}
      </Text>
      <Box height={1} />

      {/* Commands */}
      <Text bold color={Colors.Foreground}>
        {t('helpContent.slashCommands')}
      </Text>
      {commands
        .filter((command) => command.description)
        .map((command: SlashCommand) => (
          <Text key={command.name} color={Colors.Foreground}>
            <Text bold color={Colors.AccentPurple}>
              {' '}
              /{command.name}
            </Text>
            {command.description && ' - ' + command.description}
          </Text>
        ))}
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          {' '}
          !{' '}
        </Text>
        - {currentLang === 'zh' ? '命令行指令' : 'shell command'}
      </Text>

      <Box height={1} />

      {/* Shortcuts */}
      <Text bold color={Colors.Foreground}>
        {t('helpContent.keyboardShortcuts')}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          Enter
        </Text>{' '}
        - {currentLang === 'zh' ? '发送消息' : 'Send message'}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          Shift+Enter
        </Text>{' '}
        - {currentLang === 'zh' ? '换行' : 'New line'}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          Up/Down
        </Text>{' '}
        - {currentLang === 'zh' ? '浏览历史记录' : 'Cycle through your prompt history'}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          Alt+Left/Right
        </Text>{' '}
        - {currentLang === 'zh' ? '按词移动光标' : 'Jump through words in the input'}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          Esc
        </Text>{' '}
        - {currentLang === 'zh' ? '取消操作' : 'Cancel operation'}
      </Text>
      <Text color={Colors.Foreground}>
        <Text bold color={Colors.AccentPurple}>
          Ctrl+C
        </Text>{' '}
        - {currentLang === 'zh' ? '退出应用' : 'Quit application'}
      </Text>
    </Box>
  );
};
