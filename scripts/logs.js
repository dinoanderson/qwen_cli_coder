#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Qwen CLI
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shortcut script for viewing conversation logs
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'conversation-logs.js');

// Pass all arguments to the main script
const child = spawn('node', [scriptPath, ...process.argv.slice(2)], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code || 0);
});