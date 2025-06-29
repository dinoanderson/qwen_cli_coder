/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'zh';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'zh'];

// Extend global interface for Qwen language state
interface QwenGlobal {
  __qwenCurrentLanguage?: string;
}

declare const global: QwenGlobal & typeof globalThis;

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  zh: '中文简体',
};

// Global state for current language
let currentLanguage: Language = 'en';

// Translation interface
export interface Translations {
  // General UI
  help: string;
  theme: string;
  auth: string;
  settings: string;
  version: string;
  exit: string;
  quit: string;
  clear: string;
  
  // Commands
  commands: {
    help: {
      name: string;
      description: string;
    };
    clear: {
      name: string;
      description: string;
    };
    theme: {
      name: string;
      description: string;
    };
    auth: {
      name: string;
      description: string;
    };
    stats: {
      name: string;
      description: string;
    };
    about: {
      name: string;
      description: string;
    };
    model: {
      name: string;
      description: string;
    };
    memory: {
      name: string;
      description: string;
    };
    tools: {
      name: string;
      description: string;
    };
    mcp: {
      name: string;
      description: string;
    };
    'setup-mcp': {
      name: string;
      description: string;
    };
    chat: {
      name: string;
      description: string;
    };
    lang: {
      name: string;
      description: string;
    };
    compress: {
      name: string;
      description: string;
    };
    quit: {
      name: string;
      description: string;
    };
    docs: {
      name: string;
      description: string;
    };
    editor: {
      name: string;
      description: string;
    };
    bug: {
      name: string;
      description: string;
    };
  };
  
  // Messages
  messages: {
    currentLanguage: string;
    languageChanged: string;
    availableLanguages: string;
    unknownLanguage: string;
    currentModel: string;
    switchedModel: string;
    unknownModel: string;
    availableModels: string;
    usage: string;
    noInputProvided: string;
    openingDocs: string;
    clearingTerminal: string;
    sessionStats: string;
    memoryUsage: string;
    addingToMemory: string;
    unknownCommand: string;
    errorMessage: string;
    infoMessage: string;
    mcpSetupSuccess: string;
    mcpSetupExists: string;
    mcpSetupFailed: string;
  };
  
  // Help content
  helpContent: {
    basics: string;
    addContext: string;
    addContextDesc: string;
    shellMode: string;
    shellModeDesc: string;
    slashCommands: string;
    slashCommandsDesc: string;
    tips: string;
    keyboardShortcuts: string;
  };
}

// Set the current language
export function setLanguage(lang: Language): void {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    console.log(`[QWEN] Setting language from ${currentLanguage} to ${lang}`);
    currentLanguage = lang;
    // Set global variable for core module access
    if (typeof global !== 'undefined') {
      global.__qwenCurrentLanguage = lang;
      console.log(`[QWEN] Global language variable set to: ${lang}`);
    }
  } else {
    console.warn(`[QWEN] Attempted to set unsupported language: ${lang}`);
  }
}

// Get the current language
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

// Check if a language is supported
export function isLanguageSupported(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
}

// Translation dictionaries
let translations: Record<Language, Translations> = {} as Record<Language, Translations>;

// Load translations dynamically
async function loadTranslations(): Promise<void> {
  if (Object.keys(translations).length === 0) {
    console.log('[QWEN] Loading translations...');
    try {
      const { enTranslations } = await import('../locales/en.js');
      const { zhTranslations } = await import('../locales/zh.js');
      translations = {
        en: enTranslations,
        zh: zhTranslations,
      };
      console.log('[QWEN] Translations loaded successfully');
      console.log('[QWEN] Available translation keys:', Object.keys(enTranslations));
    } catch (error) {
      console.error('[QWEN] Failed to load translations:', error);
      // Fallback to basic translations
      translations = {
        en: {} as Translations,
        zh: {} as Translations,
      };
    }
  } else {
    console.log('[QWEN] Translations already loaded');
  }
}

// Get nested property from object using dot notation
function getNestedProperty(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Translation function with interpolation support
export function t(key: string, params?: Record<string, string>): string {
  // If translations are not loaded yet, trigger loading
  if (Object.keys(translations).length === 0) {
    console.warn(`[QWEN] Translations not loaded yet for key: ${key}, returning key`);
    return key;
  }
  
  const currentTranslations = translations[currentLanguage];
  if (!currentTranslations) {
    console.warn(`[QWEN] No translations available for language: ${currentLanguage}, returning key: ${key}`);
    return key;
  }
  
  let translated = getNestedProperty(currentTranslations, key);
  
  // Debug logging for translation lookup
  if (translated === key) {
    console.warn(`[QWEN] Translation not found for key: ${key} in language: ${currentLanguage}`);
  }
  
  // Handle interpolation
  if (params && typeof translated === 'string') {
    Object.entries(params).forEach(([param, value]) => {
      translated = translated.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
    });
  }
  
  return translated;
}

// Initialize translations
export async function initializeTranslations(): Promise<void> {
  await loadTranslations();
}

// Initialize language from settings or system locale
export function initializeLanguage(settingsLanguage?: string): void {
  if (settingsLanguage && isLanguageSupported(settingsLanguage)) {
    setLanguage(settingsLanguage);
    return;
  }
  
  // Try to detect system locale
  const systemLocale = process.env.LANG || process.env.LC_ALL || 'en';
  if (systemLocale.startsWith('zh')) {
    setLanguage('zh');
  } else {
    setLanguage('en');
  }
}