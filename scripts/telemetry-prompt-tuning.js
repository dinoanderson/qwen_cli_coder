#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Qwen CLI
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Telemetry setup script for prompt tuning
 * This script configures and starts telemetry collection specifically for
 * capturing prompts and responses for prompt engineering and tuning purposes.
 */

import { execSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const SETTINGS_DIRECTORY_NAME = '.qwen';
const WORKSPACE_SETTINGS_PATH = join(
  projectRoot,
  SETTINGS_DIRECTORY_NAME,
  'settings.json',
);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function ensureSettingsFile() {
  const settingsDir = join(projectRoot, SETTINGS_DIRECTORY_NAME);
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }

  if (!existsSync(WORKSPACE_SETTINGS_PATH)) {
    const defaultSettings = {
      telemetry: {
        enabled: true,
        target: 'local',
        logPrompts: true,
      },
    };
    writeFileSync(
      WORKSPACE_SETTINGS_PATH,
      JSON.stringify(defaultSettings, null, 2),
      'utf-8',
    );
    log('✅ Created default settings file', colors.green);
  }
}

function updateTelemetrySettings(enable = true) {
  try {
    let settings = {};
    if (existsSync(WORKSPACE_SETTINGS_PATH)) {
      const content = readFileSync(WORKSPACE_SETTINGS_PATH, 'utf-8');
      settings = JSON.parse(content.replace(/\/\/[^\n]*/g, ''));
    }

    settings.telemetry = {
      ...settings.telemetry,
      enabled: enable,
      target: 'local',
      logPrompts: true,
    };

    writeFileSync(
      WORKSPACE_SETTINGS_PATH,
      JSON.stringify(settings, null, 2),
      'utf-8',
    );

    if (enable) {
      log('✅ Telemetry enabled with prompt logging', colors.green);
    } else {
      log('✅ Telemetry disabled', colors.yellow);
    }
    return true;
  } catch (error) {
    log(`❌ Error updating settings: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🔬 Qwen CLI Telemetry for Prompt Tuning\n', colors.bright + colors.cyan);
  
  log('This tool helps you collect prompts and responses for analysis and tuning.', colors.cyan);
  log('All data is stored locally and can be exported for analysis.\n');

  // Ensure settings file exists
  ensureSettingsFile();

  // Update settings to enable telemetry
  if (!updateTelemetrySettings(true)) {
    process.exit(1);
  }

  log('\n📊 Starting telemetry collection...', colors.magenta);
  log('This will:', colors.cyan);
  log('  • Download and start Jaeger for trace visualization');
  log('  • Start OpenTelemetry collector for data aggregation');
  log('  • Enable prompt logging in your workspace');
  log('  • Store all telemetry data locally\n');

  // Get project hash for unique storage
  const projectHash = execSync('git rev-parse HEAD 2>/dev/null || echo "no-git"')
    .toString()
    .trim()
    .substring(0, 8);

  const telemetryDir = join(
    process.env.HOME || process.env.USERPROFILE || '',
    '.qwen',
    'tmp',
    projectHash,
    'otel',
  );

  log(`📁 Telemetry data will be stored in:`, colors.yellow);
  log(`   ${telemetryDir}\n`);

  // Run the local telemetry script
  const telemetryProcess = spawn('node', [join(projectRoot, 'scripts', 'local_telemetry.js')], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Set up graceful shutdown
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  log('\n🎯 Telemetry is now running!', colors.bright + colors.green);
  log('\nYou can now:', colors.cyan);
  log('  1. Open a new terminal and run Qwen CLI commands');
  log('  2. View traces at http://localhost:16686 (Jaeger UI)');
  log(`  3. Access raw logs at ${telemetryDir}/collector.log`);
  log('\n📝 Export options:', colors.magenta);
  log('  • Traces: Export from Jaeger UI as JSON');
  log('  • Logs: Copy collector.log for analysis');
  log('  • Metrics: Available in OTLP format\n');
  
  log('Press Ctrl+C to stop telemetry collection...', colors.yellow);

  // Handle shutdown
  process.on('SIGINT', async () => {
    log('\n\n🛑 Shutting down telemetry...', colors.yellow);
    
    telemetryProcess.kill('SIGTERM');
    
    // Ask if user wants to disable telemetry
    const answer = await new Promise((resolve) => {
      rl.question(
        `\n${colors.cyan}Would you like to disable telemetry in settings? (y/N): ${colors.reset}`,
        resolve,
      );
    });

    if (answer.toLowerCase() === 'y') {
      updateTelemetrySettings(false);
    }

    log('\n✅ Telemetry collection stopped', colors.green);
    log(`📊 Your telemetry data is preserved at: ${telemetryDir}`, colors.cyan);
    
    rl.close();
    process.exit(0);
  });

  // Keep the process alive
  await new Promise(() => {});
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});