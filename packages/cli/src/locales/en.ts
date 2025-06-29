/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Translations } from '../utils/i18n.js';

export const enTranslations: Translations = {
  // General UI
  help: 'Help',
  theme: 'Theme',
  auth: 'Authentication',
  settings: 'Settings',
  version: 'Version',
  exit: 'Exit',
  quit: 'Quit',
  clear: 'Clear',
  
  // Commands
  commands: {
    help: {
      name: 'help',
      description: 'for help on qwen-cli',
    },
    clear: {
      name: 'clear',
      description: 'clear the screen and conversation history',
    },
    theme: {
      name: 'theme',
      description: 'change the theme',
    },
    auth: {
      name: 'auth',
      description: 'change the auth method',
    },
    stats: {
      name: 'stats',
      description: 'check session stats',
    },
    about: {
      name: 'about',
      description: 'show version info',
    },
    model: {
      name: 'model',
      description: 'switch between Qwen models or list available models',
    },
    memory: {
      name: 'memory',
      description: 'manage memory. Usage: /memory <show|refresh|add> [text for add]',
    },
    tools: {
      name: 'tools',
      description: 'list available Qwen CLI tools',
    },
    mcp: {
      name: 'mcp',
      description: 'list configured MCP servers and tools',
    },
    chat: {
      name: 'chat',
      description: 'Manage conversation history. Usage: /chat <list|save|resume> [tag]',
    },
    lang: {
      name: 'lang',
      description: 'switch language or show current language',
    },
    compress: {
      name: 'compress',
      description: 'Compresses the context by replacing it with a summary.',
    },
    quit: {
      name: 'quit',
      description: 'exit the cli',
    },
    docs: {
      name: 'docs',
      description: 'open full Qwen CLI documentation in your browser',
    },
    editor: {
      name: 'editor',
      description: 'set external editor preference',
    },
    bug: {
      name: 'bug',
      description: 'submit a bug report',
    },
  },
  
  // Messages
  messages: {
    currentLanguage: 'Current language: {language}',
    languageChanged: 'Language changed to: {language}',
    availableLanguages: 'Available languages: {languages}',
    unknownLanguage: 'Unknown language: {language}. Available languages: {available}',
    currentModel: 'Current model: {model}',
    switchedModel: 'Switched from {previous} to {current}',
    unknownModel: 'Unknown model: {model}',
    availableModels: 'Available models: {models}',
    usage: 'Usage: {usage}',
    noInputProvided: 'No input provided via stdin.',
    openingDocs: 'Opening documentation in your browser: {url}',
    clearingTerminal: 'Clearing terminal and resetting chat.',
    sessionStats: 'Session Statistics',
    memoryUsage: 'Memory Usage',
    addingToMemory: 'Attempting to save to memory: "{text}"',
    unknownCommand: 'Unknown command: {command}',
    errorMessage: 'Error: {error}',
    infoMessage: 'Info: {info}',
  },
  
  // Help content
  helpContent: {
    basics: 'Basics:',
    addContext: 'Add context',
    addContextDesc: 'Use @ to specify files for context (e.g., @src/myFile.ts) to target specific files or folders.',
    shellMode: 'Shell mode',
    shellModeDesc: 'Execute shell commands via ! (e.g., !ls -la)',
    slashCommands: 'Slash Commands:',
    slashCommandsDesc: 'Use / commands for CLI functionality',
    tips: 'Tips:',
    keyboardShortcuts: 'Keyboard Shortcuts:',
  },
};