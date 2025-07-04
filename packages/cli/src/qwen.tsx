/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'ink';
import { AppWrapper } from './ui/App.js';
import { loadCliConfig } from './config/config.js';
import { readStdin } from './utils/readStdin.js';
import { basename } from 'node:path';
import v8 from 'node:v8';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { start_sandbox } from './utils/sandbox.js';
import {
  LoadedSettings,
  loadSettings,
  SettingScope,
} from './config/settings.js';
import { themeManager } from './ui/themes/theme-manager.js';
import { getStartupWarnings } from './utils/startupWarnings.js';
import { runNonInteractive } from './nonInteractiveCli.js';
import { loadExtensions, Extension } from './config/extension.js';
import { cleanupCheckpoints } from './utils/cleanup.js';
import {
  ApprovalMode,
  Config,
  EditTool,
  ShellTool,
  WriteFileTool,
  sessionId,
  logUserPrompt,
  AuthType,
} from '@qwen/qwen-cli-core';
import { validateAuthMethod } from './config/auth.js';
import { setMaxSizedBoxDebugging } from './ui/components/shared/MaxSizedBox.js';
import { initializeLanguage, initializeTranslations } from './utils/i18n.js';
import { initializeQwenDirectories } from './utils/qwenInit.js';
import { WebServer } from './web/webServer.js';
import open from 'open';

function getNodeMemoryArgs(config: Config): string[] {
  const totalMemoryMB = os.totalmem() / (1024 * 1024);
  const heapStats = v8.getHeapStatistics();
  const currentMaxOldSpaceSizeMb = Math.floor(
    heapStats.heap_size_limit / 1024 / 1024,
  );

  // Set target to 50% of total memory
  const targetMaxOldSpaceSizeInMB = Math.floor(totalMemoryMB * 0.5);
  if (config.getDebugMode()) {
    console.debug(
      `Current heap size ${currentMaxOldSpaceSizeMb.toFixed(2)} MB`,
    );
  }

  if (process.env.QWEN_CLI_NO_RELAUNCH) {
    return [];
  }

  if (targetMaxOldSpaceSizeInMB > currentMaxOldSpaceSizeMb) {
    if (config.getDebugMode()) {
      console.debug(
        `Need to relaunch with more memory: ${targetMaxOldSpaceSizeInMB.toFixed(2)} MB`,
      );
    }
    return [`--max-old-space-size=${targetMaxOldSpaceSizeInMB}`];
  }

  return [];
}

async function relaunchWithAdditionalArgs(additionalArgs: string[]) {
  const nodeArgs = [...additionalArgs, ...process.argv.slice(1)];
  const newEnv = { ...process.env, QWEN_CLI_NO_RELAUNCH: 'true' };

  const child = spawn(process.execPath, nodeArgs, {
    stdio: 'inherit',
    env: newEnv,
  });

  await new Promise((resolve) => child.on('close', resolve));
  process.exit(0);
}

async function launchAssistantMode(
  config: Config,
  settings: LoadedSettings,
  startupWarnings: string[] = []
): Promise<void> {
  console.log('🤖 Starting Qwen Assistant in web mode...');
  
  const serverConfig = {
    port: parseInt(process.env.QWEN_ASSISTANT_PORT || '3000'),
    host: process.env.QWEN_ASSISTANT_HOST || 'localhost',
  };
  
  try {
    const webServer = new WebServer(config, settings, serverConfig);
    await webServer.start(serverConfig);
    
    const url = webServer.getUrl(serverConfig);
    console.log(`🌐 Opening browser at ${url}`);
    
    // Open browser automatically
    try {
      await open(url);
    } catch (error) {
      console.log(`Could not open browser automatically. Please visit: ${url}`);
    }
    
    // Keep the process alive
    console.log('Press Ctrl+C to stop the assistant');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n📴 Shutting down Qwen Assistant...');
      await webServer.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n📴 Shutting down Qwen Assistant...');
      await webServer.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Qwen Assistant:', error);
    process.exit(1);
  }
}

export async function main() {
  const workspaceRoot = process.cwd();
  const settings = loadSettings(workspaceRoot);

  await cleanupCheckpoints();
  if (settings.errors.length > 0) {
    for (const error of settings.errors) {
      let errorMessage = `Error in ${error.path}: ${error.message}`;
      if (!process.env.NO_COLOR) {
        errorMessage = `\x1b[31m${errorMessage}\x1b[0m`;
      }
      console.error(errorMessage);
      console.error(`Please fix ${error.path} and try again.`);
    }
    process.exit(1);
  }

  const extensions = loadExtensions(workspaceRoot);
  const config = await loadCliConfig(settings.merged, extensions, sessionId);

  // set default fallback to available API keys
  // this has to go after load cli because thats where the env is set
  if (!settings.merged.selectedAuthType) {
    // Use Qwen if available
    if (process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY) {
      settings.setValue(
        SettingScope.User,
        'selectedAuthType',
        AuthType.USE_QWEN_DASHSCOPE,
      );
    }
  }

  setMaxSizedBoxDebugging(config.getDebugMode());

  // Initialize Qwen directories and configuration
  await initializeQwenDirectories(workspaceRoot);

  // Initialize language settings
  initializeLanguage(settings.merged.language);
  await initializeTranslations();

  // Initialize centralized FileDiscoveryService
  config.getFileService();
  if (config.getCheckpointingEnabled()) {
    try {
      await config.getGitService();
    } catch {
      // For now swallow the error, later log it.
    }
  }

  if (settings.merged.theme) {
    if (!themeManager.setActiveTheme(settings.merged.theme)) {
      // If the theme is not found during initial load, log a warning and continue.
      // The useThemeCommand hook in App.tsx will handle opening the dialog.
      console.warn(`Warning: Theme "${settings.merged.theme}" not found.`);
    }
  }

  const memoryArgs = settings.merged.autoConfigureMaxOldSpaceSize
    ? getNodeMemoryArgs(config)
    : [];

  // hop into sandbox if we are outside and sandboxing is enabled
  if (!process.env.SANDBOX) {
    const sandboxConfig = config.getSandbox();
    if (sandboxConfig) {
      if (settings.merged.selectedAuthType) {
        // Validate authentication here because the sandbox will interfere with the Oauth2 web redirect.
        const err = validateAuthMethod(settings.merged.selectedAuthType);
        if (err) {
          console.error(err);
          process.exit(1);
        }
        await config.refreshAuth(settings.merged.selectedAuthType);
      }
      await start_sandbox(sandboxConfig, memoryArgs);
      process.exit(0);
    } else {
      // Not in a sandbox and not entering one, so relaunch with additional
      // arguments to control memory usage if needed.
      if (memoryArgs.length > 0) {
        await relaunchWithAdditionalArgs(memoryArgs);
        process.exit(0);
      }
    }
  }
  let input = config.getQuestion();
  const startupWarnings = await getStartupWarnings();

  // Check for assistant mode first
  if (config.getAssistantMode()) {
    // Initialize authentication for assistant mode
    if (settings.merged.selectedAuthType) {
      await config.refreshAuth(settings.merged.selectedAuthType);
    }
    
    // Launch web interface instead of terminal
    await launchAssistantMode(config, settings, startupWarnings);
    return;
  }

  // Render UI, passing necessary config values. Check that there is no command line question.
  if (process.stdin.isTTY && input?.length === 0) {
    // Initialize authentication for interactive mode
    if (settings.merged.selectedAuthType) {
      await config.refreshAuth(settings.merged.selectedAuthType);
    }
    
    setWindowTitle(basename(workspaceRoot), settings);
    render(
      <React.StrictMode>
        <AppWrapper
          config={config}
          settings={settings}
          startupWarnings={startupWarnings}
        />
      </React.StrictMode>,
      { exitOnCtrlC: false },
    );
    return;
  }
  // If not a TTY, read from stdin
  // This is for cases where the user pipes input directly into the command
  if (!process.stdin.isTTY) {
    input += await readStdin();
  }
  if (!input) {
    console.error('No input provided via stdin.');
    process.exit(1);
  }

  logUserPrompt(config, {
    'event.name': 'user_prompt',
    'event.timestamp': new Date().toISOString(),
    prompt: input,
    prompt_length: input.length,
  });

  // Non-interactive mode handled by runNonInteractive
  const nonInteractiveConfig = await loadNonInteractiveConfig(
    config,
    extensions,
    settings,
  );

  await runNonInteractive(nonInteractiveConfig, input);
  process.exit(0);
}

function setWindowTitle(title: string, settings: LoadedSettings) {
  if (!settings.merged.hideWindowTitle) {
    const appName = 'Qwen CLI';
    process.stdout.write(`\x1b]2; ${appName} - ${title} \x07`);

    process.on('exit', () => {
      process.stdout.write(`\x1b]2;\x07`);
    });
  }
}

// --- Global Unhandled Rejection Handler ---
process.on('unhandledRejection', (reason, _promise) => {
  // Log other unexpected unhandled rejections as critical errors
  console.error('=========================================');
  console.error('CRITICAL: Unhandled Promise Rejection!');
  console.error('=========================================');
  console.error('Reason:', reason);
  console.error('Stack trace may follow:');
  if (!(reason instanceof Error)) {
    console.error(reason);
  }
  // Exit for genuinely unhandled errors
  process.exit(1);
});

async function loadNonInteractiveConfig(
  config: Config,
  extensions: Extension[],
  settings: LoadedSettings,
) {
  let finalConfig = config;
  if (config.getApprovalMode() !== ApprovalMode.YOLO) {
    // Everything is not allowed, ensure that only read-only tools are configured.
    const existingExcludeTools = settings.merged.excludeTools || [];
    const interactiveTools = [
      ShellTool.Name,
      EditTool.Name,
      WriteFileTool.Name,
    ];

    const newExcludeTools = [
      ...new Set([...existingExcludeTools, ...interactiveTools]),
    ];

    const nonInteractiveSettings = {
      ...settings.merged,
      excludeTools: newExcludeTools,
    };
    finalConfig = await loadCliConfig(
      nonInteractiveSettings,
      extensions,
      config.getSessionId(),
    );
  }

  return await validateNonInterActiveAuth(
    settings.merged.selectedAuthType,
    finalConfig,
  );
}

async function validateNonInterActiveAuth(
  selectedAuthType: AuthType | undefined,
  nonInteractiveConfig: Config,
) {
  // making a special case for the cli. many headless environments might not have a settings.json set
  // so if API keys are set, we'll use those.
  const hasQwenKey = !!(process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY);
  
  if (!selectedAuthType && !hasQwenKey) {
    console.error(
      'Please set an Auth method in your .qwen/settings.json OR specify DASHSCOPE_API_KEY/QWEN_API_KEY env variable before running',
    );
    process.exit(1);
  }

  // Default to Qwen if available
  if (!selectedAuthType) {
    selectedAuthType = AuthType.USE_QWEN_DASHSCOPE;
  }
  
  const err = validateAuthMethod(selectedAuthType);
  if (err != null) {
    console.error(err);
    process.exit(1);
  }

  await nonInteractiveConfig.refreshAuth(selectedAuthType);
  return nonInteractiveConfig;
}
