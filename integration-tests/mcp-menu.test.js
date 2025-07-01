/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { TestRig } from './test-helper.js';

test('add_mcp_server tool installs duckduckgo search server', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the add_mcp_server tool to install a web search server:
- server: "duckduckgo-search" 
- scope: "user"
- autoInstall: true
- trusted: false`;

  const output = rig.run(prompt);

  // Check that MCP server installation was attempted
  assert.ok(
    output.toLowerCase().includes('duckduckgo') || 
    output.toLowerCase().includes('search') ||
    output.toLowerCase().includes('mcp'),
    'Should mention MCP server installation'
  );

  // Check for successful installation indicators
  assert.ok(
    output.toLowerCase().includes('install') || 
    output.toLowerCase().includes('configur') ||
    output.toLowerCase().includes('added'),
    'Should show installation progress'
  );
});

test('search_mcp_servers tool finds servers by keyword', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the search_mcp_servers tool to find search-related servers:
- query: "search"
- category: "search"
- limit: 5`;

  const output = rig.run(prompt);

  // Check that server search was performed
  assert.ok(
    output.toLowerCase().includes('search') ||
    output.toLowerCase().includes('found') ||
    output.toLowerCase().includes('server'),
    'Should show search results'
  );

  // Check for server details
  assert.ok(
    output.toLowerCase().includes('duckduckgo') ||
    output.toLowerCase().includes('web') ||
    output.includes('capabilities'),
    'Should show server details'
  );
});

test('search_mcp_servers tool filters by category', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the search_mcp_servers tool to find development tools:
- query: ""
- category: "development"
- limit: 3`;

  const output = rig.run(prompt);

  // Check for development-related servers
  assert.ok(
    output.toLowerCase().includes('development') ||
    output.toLowerCase().includes('github') ||
    output.toLowerCase().includes('git') ||
    output.toLowerCase().includes('code'),
    'Should show development servers'
  );
});

test('add_mcp_server tool validates server exists', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the add_mcp_server tool with non-existent server:
- server: "non-existent-server-12345"
- scope: "user"
- autoInstall: true`;

  const output = rig.run(prompt);

  // Should handle unknown servers gracefully
  assert.ok(
    output.toLowerCase().includes('not found') ||
    output.toLowerCase().includes('could not be found') ||
    output.toLowerCase().includes('search for available') ||
    output.toLowerCase().includes('unknown') ||
    output.toLowerCase().includes('invalid') ||
    output.toLowerCase().includes('error'),
    'Should handle non-existent server with helpful response'
  );
});

test('add_mcp_server tool handles workspace scope', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the add_mcp_server tool for workspace installation:
- server: "file-manager"
- scope: "workspace"
- autoInstall: true
- trusted: true`;

  const output = rig.run(prompt);

  // Check for workspace-specific installation
  assert.ok(
    output.toLowerCase().includes('workspace') ||
    output.toLowerCase().includes('.qwen') ||
    output.toLowerCase().includes('project'),
    'Should mention workspace scope'
  );

  // Check for file manager server
  assert.ok(
    output.toLowerCase().includes('file') ||
    output.toLowerCase().includes('manager'),
    'Should reference file manager server'
  );
});

test('search_mcp_servers tool returns comprehensive server info', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the search_mcp_servers tool to get detailed information:
- query: "postgres"
- category: "database"
- limit: 2
- includeDetails: true`;

  const output = rig.run(prompt);

  // Check for detailed server information
  assert.ok(
    output.toLowerCase().includes('postgres') ||
    output.toLowerCase().includes('database'),
    'Should find postgres server'
  );

  // Check for server metadata
  assert.ok(
    output.includes('description') ||
    output.includes('capabilities') ||
    output.includes('install') ||
    output.includes('npm') ||
    output.includes('pip'),
    'Should include server details'
  );
});

test('add_mcp_server tool handles multiple server types', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  // Test with a Python-based server
  const prompt = `Use the add_mcp_server tool to install a Python server:
- server: "memory-server"
- scope: "user"
- autoInstall: true
- trusted: false`;

  const output = rig.run(prompt);

  // Should handle different package managers
  assert.ok(
    output.toLowerCase().includes('memory') ||
    output.toLowerCase().includes('python') ||
    output.toLowerCase().includes('pip') ||
    output.toLowerCase().includes('install'),
    'Should handle Python-based server installation'
  );
});

test('mcp tools integration workflow', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Follow this workflow:
1. First, use search_mcp_servers to find communication servers with query "slack"
2. Then use add_mcp_server to install the first available communication server with user scope`;

  const output = rig.run(prompt);

  // Check for workflow execution
  assert.ok(
    output.toLowerCase().includes('search') ||
    output.toLowerCase().includes('find'),
    'Should perform search step'
  );

  assert.ok(
    output.toLowerCase().includes('install') ||
    output.toLowerCase().includes('add'),
    'Should perform installation step'
  );

  // Check for communication/slack content
  assert.ok(
    output.toLowerCase().includes('slack') ||
    output.toLowerCase().includes('communication'),
    'Should find communication servers'
  );
});

test('search_mcp_servers handles empty results gracefully', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the search_mcp_servers tool with very specific query:
- query: "extremely-specific-nonexistent-functionality-12345"
- category: "nonexistent"
- limit: 10`;

  const output = rig.run(prompt);

  // Should handle empty results gracefully
  assert.ok(
    output.toLowerCase().includes('no servers') ||
    output.toLowerCase().includes('not found') ||
    output.toLowerCase().includes('empty') ||
    output.toLowerCase().includes('0 servers') ||
    output.toLowerCase().includes('no results'),
    'Should handle empty search results gracefully'
  );
});

test('add_mcp_server tool provides installation feedback', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the add_mcp_server tool and provide detailed feedback:
- server: "duckduckgo-search"
- scope: "user"
- autoInstall: true
- trusted: false`;

  const output = rig.run(prompt);

  // Check for installation steps
  assert.ok(
    output.toLowerCase().includes('installing') ||
    output.toLowerCase().includes('downloading') ||
    output.toLowerCase().includes('configuring') ||
    output.toLowerCase().includes('success'),
    'Should provide installation feedback'
  );

  // Check for configuration details
  assert.ok(
    output.toLowerCase().includes('settings') ||
    output.toLowerCase().includes('config') ||
    output.toLowerCase().includes('.qwen'),
    'Should mention configuration'
  );
});