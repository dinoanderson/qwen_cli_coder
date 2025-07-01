/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { TestRig } from './test-helper.js';

test('mcp server management workflow with tools', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Help me set up MCP servers for web development. I need:
1. A web search capability for research
2. A file management system
3. A database connection tool

Please search for and install appropriate MCP servers for these needs.`;

  const output = rig.run(prompt);

  // Check that the assistant understands MCP server management
  assert.ok(
    output.toLowerCase().includes('mcp') ||
    output.toLowerCase().includes('server'),
    'Should understand MCP server context'
  );

  // Check for web development related servers
  assert.ok(
    output.toLowerCase().includes('search') ||
    output.toLowerCase().includes('file') ||
    output.toLowerCase().includes('database') ||
    output.toLowerCase().includes('web'),
    'Should address web development needs'
  );

  // Check for tool usage indicators
  assert.ok(
    output.toLowerCase().includes('search_mcp_servers') ||
    output.toLowerCase().includes('add_mcp_server') ||
    output.includes('tool'),
    'Should use MCP management tools'
  );
});

test('mcp server discovery and installation flow', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `I want to add DuckDuckGo search to my Qwen CLI. Please:
1. Search for DuckDuckGo MCP servers
2. Install the best option with user scope
3. Tell me what capabilities it provides`;

  const output = rig.run(prompt);

  // Check for search phase
  assert.ok(
    output.toLowerCase().includes('duckduckgo') ||
    output.toLowerCase().includes('search'),
    'Should search for DuckDuckGo servers'
  );

  // Check for installation phase
  assert.ok(
    output.toLowerCase().includes('install') ||
    output.toLowerCase().includes('add') ||
    output.toLowerCase().includes('configur'),
    'Should perform installation'
  );

  // Check for capabilities description
  assert.ok(
    output.toLowerCase().includes('web search') ||
    output.toLowerCase().includes('search the web') ||
    output.toLowerCase().includes('capabilities') ||
    output.toLowerCase().includes('tools'),
    'Should describe server capabilities'
  );
});

test('mcp server category exploration', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Show me what MCP servers are available in the "development" category. 
I'm interested in GitHub integration and code analysis tools.`;

  const output = rig.run(prompt);

  // Check for category search
  assert.ok(
    output.toLowerCase().includes('development') ||
    output.toLowerCase().includes('category'),
    'Should search development category'
  );

  // Check for GitHub/development tools
  assert.ok(
    output.toLowerCase().includes('github') ||
    output.toLowerCase().includes('git') ||
    output.toLowerCase().includes('code'),
    'Should find development-related servers'
  );

  // Check for server listing
  assert.ok(
    output.toLowerCase().includes('available') ||
    output.toLowerCase().includes('servers') ||
    output.includes('list'),
    'Should list available servers'
  );
});

test('mcp server installation with custom options', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Install the PostgreSQL MCP server with these requirements:
- Install to workspace scope (not user)
- Mark as trusted 
- Auto-install dependencies
- Set up for local database connection`;

  const output = rig.run(prompt);

  // Check for PostgreSQL server
  assert.ok(
    output.toLowerCase().includes('postgres') ||
    output.toLowerCase().includes('database'),
    'Should reference PostgreSQL server'
  );

  // Check for workspace scope
  assert.ok(
    output.toLowerCase().includes('workspace') ||
    output.toLowerCase().includes('project'),
    'Should use workspace scope'
  );

  // Check for trusted setting
  assert.ok(
    output.toLowerCase().includes('trusted') ||
    output.toLowerCase().includes('trust'),
    'Should configure as trusted'
  );

  // Check for auto-install
  assert.ok(
    output.toLowerCase().includes('auto') ||
    output.toLowerCase().includes('dependencies') ||
    output.toLowerCase().includes('automatic'),
    'Should handle auto-install'
  );
});

test('mcp server error handling and validation', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Try to install an MCP server called "definitely-does-not-exist-server-12345". 
How does the system handle this?`;

  const output = rig.run(prompt);

  // Check for error handling
  assert.ok(
    output.toLowerCase().includes('not found') ||
    output.toLowerCase().includes('does not exist') ||
    output.toLowerCase().includes('invalid') ||
    output.toLowerCase().includes('error') ||
    output.toLowerCase().includes('unknown'),
    'Should handle non-existent server gracefully'
  );

  // Check for helpful guidance
  assert.ok(
    output.toLowerCase().includes('available') ||
    output.toLowerCase().includes('search') ||
    output.toLowerCase().includes('try') ||
    output.toLowerCase().includes('alternative'),
    'Should provide helpful guidance'
  );
});

test('mcp server comprehensive search with filtering', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Search for MCP servers that can help with:
- Cloud storage (AWS, Google Cloud, etc.)
- Communication (Slack, Discord, etc.) 
- Database operations (MySQL, MongoDB, etc.)

Limit to 2 servers per category and show their installation methods.`;

  const output = rig.run(prompt);

  // Check for cloud storage
  assert.ok(
    output.toLowerCase().includes('cloud') ||
    output.toLowerCase().includes('aws') ||
    output.toLowerCase().includes('storage'),
    'Should find cloud storage servers'
  );

  // Check for communication
  assert.ok(
    output.toLowerCase().includes('slack') ||
    output.toLowerCase().includes('discord') ||
    output.toLowerCase().includes('communication'),
    'Should find communication servers'
  );

  // Check for database
  assert.ok(
    output.toLowerCase().includes('mysql') ||
    output.toLowerCase().includes('mongodb') ||
    output.toLowerCase().includes('database'),
    'Should find database servers'
  );

  // Check for installation methods
  assert.ok(
    output.toLowerCase().includes('npm') ||
    output.toLowerCase().includes('pip') ||
    output.toLowerCase().includes('install'),
    'Should show installation methods'
  );
});

test('mcp server capabilities and prerequisites', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Before installing any MCP servers, show me:
1. What the Slack MCP server can do
2. What prerequisites it needs
3. What environment variables are required
4. Whether it should be trusted or not`;

  const output = rig.run(prompt);

  // Check for capabilities description
  assert.ok(
    output.toLowerCase().includes('slack') &&
    (output.toLowerCase().includes('capabilities') ||
     output.toLowerCase().includes('can do') ||
     output.toLowerCase().includes('features')),
    'Should describe Slack server capabilities'
  );

  // Check for prerequisites
  assert.ok(
    output.toLowerCase().includes('prerequisite') ||
    output.toLowerCase().includes('require') ||
    output.toLowerCase().includes('need'),
    'Should mention prerequisites'
  );

  // Check for environment variables
  assert.ok(
    output.toLowerCase().includes('environment') ||
    output.toLowerCase().includes('variable') ||
    output.toLowerCase().includes('config') ||
    output.includes('env'),
    'Should mention environment configuration'
  );

  // Check for trust recommendation
  assert.ok(
    output.toLowerCase().includes('trust') ||
    output.toLowerCase().includes('security') ||
    output.toLowerCase().includes('safe'),
    'Should provide trust guidance'
  );
});