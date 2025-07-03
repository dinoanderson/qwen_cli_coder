/**
 * @license
 * Copyright 2025 Qwen CLI
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Integration tests for automatic parallelization behavior
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { TestRig } from './test-helper.js';

test('automatically parallelizes multiple function searches', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  // Create mock files with functions
  rig.createFile('auth.js', `
function checkAuth(user) {
  return user.isAuthenticated;
}

function validateAuth(token) {
  return token && token.length > 0;
}
`);

  rig.createFile('user.js', `
function getUserData(userId) {
  return database.users.find(u => u.id === userId);
}

function updateUserData(userId, data) {
  database.users.update(userId, data);
}
`);

  const prompt = `Find all implementations of getUserData and checkAuth functions in the codebase`;
  const output = rig.run(prompt);

  // Should use delegate_task for parallel search
  assert.ok(
    output.includes('delegate_task') || 
    output.includes('parallel') ||
    output.includes('simultaneously'),
    'Should automatically parallelize the search for multiple functions'
  );

  // Should find both functions
  assert.ok(
    output.includes('getUserData') && output.includes('checkAuth'),
    'Should find both functions'
  );
});

test('automatically parallelizes multiple file analysis', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  // Create test log files
  rig.createFile('logs/error.log', 'ERROR: Database connection failed\nERROR: Authentication timeout');
  rig.createFile('logs/access.log', 'GET /api/users 200\nPOST /api/login 401');
  rig.createFile('logs/performance.log', 'Query took 5000ms\nAPI response time: 2000ms');

  const prompt = `Analyze all log files in the logs directory for issues`;
  const output = rig.run(prompt);

  // Should use parallel execution
  assert.ok(
    output.includes('delegate_task') || 
    output.includes('parallel') ||
    output.includes('simultaneously') ||
    output.includes('concurrently'),
    'Should automatically parallelize log file analysis'
  );

  // Should analyze all log types
  assert.ok(
    output.includes('error') || output.includes('ERROR'),
    'Should analyze error logs'
  );
});

test('automatically parallelizes research tasks', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Research best practices for React performance optimization and Next.js deployment strategies`;
  const output = rig.run(prompt);

  // Should recognize this as parallel research
  assert.ok(
    output.includes('simultaneously') ||
    output.includes('parallel') ||
    output.includes('delegate_task') ||
    output.includes('both topics'),
    'Should automatically parallelize research on multiple topics'
  );

  // Should cover both topics
  assert.ok(
    (output.includes('React') || output.includes('react')) &&
    (output.includes('Next.js') || output.includes('deployment')),
    'Should research both topics'
  );
});

test('automatically parallelizes test coverage checks', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  // Create mock test files
  rig.createFile('tests/user.test.js', 'test("validateUser", () => { /* test */ })');
  rig.createFile('tests/payment.test.js', 'test("processPayment", () => { /* test */ })');

  const prompt = `Check if the functions validateUser, processPayment, and sendEmail are properly tested`;
  const output = rig.run(prompt);

  // Should parallelize the search
  assert.ok(
    output.includes('parallel') ||
    output.includes('delegate_task') ||
    output.includes('simultaneously') ||
    output.includes('concurrently'),
    'Should automatically parallelize test coverage checks'
  );
});

test('uses delegate_task for multiple independent operations', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Create a user model, authentication middleware, and API documentation`;
  const output = rig.run(prompt);

  // Should recognize these as independent tasks
  assert.ok(
    output.includes('delegate_task') ||
    output.includes('parallel') ||
    output.includes('simultaneously'),
    'Should use delegate_task for multiple independent operations'
  );
});

test('aggregates results after parallel execution', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Compare the implementation patterns in auth.js, user.js, and payment.js`;
  const output = rig.run(prompt);

  // Should use parallel analysis
  assert.ok(
    output.includes('parallel') ||
    output.includes('simultaneously') ||
    output.includes('delegate_task'),
    'Should parallelize file analysis'
  );

  // Should aggregate results
  assert.ok(
    output.includes('aggregate') ||
    output.includes('combin') ||
    output.includes('summar') ||
    output.includes('compar'),
    'Should aggregate results after parallel analysis'
  );
});

test('recognizes sequential dependencies and avoids parallelization', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `First build the project, then run tests, and finally deploy to production`;
  const output = rig.run(prompt);

  // Should recognize sequential nature
  assert.ok(
    output.includes('sequential') ||
    output.includes('step by step') ||
    output.includes('after') ||
    output.includes('then'),
    'Should recognize sequential dependencies'
  );

  // Should NOT use parallel execution
  assert.ok(
    !output.includes('parallel execution') &&
    !output.includes('executionMode: "parallel"'),
    'Should not parallelize dependent tasks'
  );
});

test('automatically uses sub_agent for single isolated task', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Create a comprehensive README file for this project`;
  const output = rig.run(prompt);

  // For a single task, might use sub_agent or just do it directly
  assert.ok(
    output.includes('README') ||
    output.includes('documentation'),
    'Should handle single task appropriately'
  );

  // Should not unnecessarily parallelize a single task
  assert.ok(
    !output.includes('delegate_task') ||
    output.includes('spawn_sub_agent') ||
    output.includes('single task'),
    'Should not use delegate_task for a single task'
  );
});

test('parallelizes codebase-wide searches efficiently', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Find all TODO comments, FIXME tags, and deprecated functions across the entire codebase`;
  const output = rig.run(prompt);

  // Should parallelize the different searches
  assert.ok(
    output.includes('parallel') ||
    output.includes('delegate_task') ||
    output.includes('simultaneously') ||
    output.includes('concurrently'),
    'Should parallelize multiple pattern searches'
  );

  // Should search for all patterns
  assert.ok(
    output.includes('TODO') ||
    output.includes('FIXME') ||
    output.includes('deprecated'),
    'Should search for all requested patterns'
  );
});

test('handles mixed parallel and sequential operations intelligently', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Analyze the current code structure, then refactor the authentication system and update the documentation`;
  const output = rig.run(prompt);

  // Should recognize the mixed nature
  assert.ok(
    output.includes('first') ||
    output.includes('then') ||
    output.includes('after analyzing'),
    'Should recognize sequential dependency for analysis first'
  );

  // Might parallelize the refactoring and documentation update
  assert.ok(
    output.includes('refactor') &&
    output.includes('documentation'),
    'Should handle both refactoring and documentation tasks'
  );
});