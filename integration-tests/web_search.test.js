/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import { strict as assert } from 'assert';
import { TestRig } from './test-helper.js';

test('should be able to search the web using DuckDuckGo MCP server', async (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  // This test requires DuckDuckGo MCP server to be configured
  // Use /setup-mcp websearch to configure if needed
  const prompt = `what planet do we live on`;
  const result = await rig.run(prompt);

  assert.ok(result.toLowerCase().includes('earth'));
});
