/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bundleDir = join(root, 'bundle');

// Create the bundle directory if it doesn't exist
if (!existsSync(bundleDir)) {
  mkdirSync(bundleDir);
}

// Copy specific shell files to the root of the bundle directory
copyFileSync(
  join(root, 'packages/core/src/tools/shell.md'),
  join(bundleDir, 'shell.md'),
);
copyFileSync(
  join(root, 'packages/core/src/tools/shell.json'),
  join(bundleDir, 'shell.json'),
);

// Find and copy all .sb files from packages to the root of the bundle directory
const sbFiles = glob.sync('packages/**/*.sb', { cwd: root });
for (const file of sbFiles) {
  copyFileSync(join(root, file), join(bundleDir, basename(file)));
}

// Copy web assets for assistant mode
const webAssetsDir = join(root, 'packages/cli/dist/src/web');
if (existsSync(webAssetsDir)) {
  // Copy index.html
  const indexHtmlPath = join(webAssetsDir, 'index.html');
  if (existsSync(indexHtmlPath)) {
    copyFileSync(indexHtmlPath, join(bundleDir, 'index.html'));
    console.log('Copied index.html to bundle/');
  }
  
  // Copy CSS files
  const cssDir = join(webAssetsDir, 'styles');
  if (existsSync(cssDir)) {
    const cssFiles = glob.sync('*.css', { cwd: cssDir });
    for (const cssFile of cssFiles) {
      copyFileSync(join(cssDir, cssFile), join(bundleDir, cssFile));
    }
    console.log(`Copied ${cssFiles.length} CSS files to bundle/`);
  }
}

console.log('Assets copied to bundle/');
