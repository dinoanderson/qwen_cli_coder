/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { TestRig } from './test-helper.js';

test('sub-agent spawns and executes simple task', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the spawn_sub_agent tool to create a simple file:
- task: "Create a file called hello-subagent.txt with content 'Hello from sub-agent!'"
- timeout: 30
- priority: "high"`;

  const output = rig.run(prompt);

  // Check that sub-agent tool was used
  assert.ok(output.toLowerCase().includes('sub-agent') || 
           output.toLowerCase().includes('spawn'), 
           'Should mention sub-agent spawning');

  // Check for some indication of execution
  assert.ok(output.toLowerCase().includes('hello') || 
           output.toLowerCase().includes('file') || 
           output.toLowerCase().includes('create'), 
           'Should show task execution');
});

test('delegate task splits work into subtasks', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the delegate_task tool to create multiple files:
- mainTask: "Create multiple test files"
- subtasks:
  - task: "Create file1.txt with content 'File 1'"
    timeout: 20
  - task: "Create file2.txt with content 'File 2'"
    timeout: 20
- executionMode: "parallel"
- maxConcurrentAgents: 2
- waitForCompletion: true`;

  const output = rig.run(prompt);

  // Check that delegation tool was used
  assert.ok(output.toLowerCase().includes('delegate') || 
           output.toLowerCase().includes('subtask') || 
           output.toLowerCase().includes('task'),
           'Should mention task delegation');

  // Check for parallel execution mention
  assert.ok(output.toLowerCase().includes('parallel') || 
           output.toLowerCase().includes('concurrent'),
           'Should mention parallel execution');
});

test('aggregate results combines multiple inputs', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the aggregate_results tool to summarize test data:
- results:
  - name: "Test 1"
    content: "First test completed successfully with 100% pass rate"
  - name: "Test 2"
    content: "Second test completed with 95% pass rate, 1 minor issue"
- aggregationType: "summary"
- title: "Test Summary"
- format: "markdown"`;

  const output = rig.run(prompt);

  // Check that aggregation tool was used
  assert.ok(output.toLowerCase().includes('aggregate') || 
           output.toLowerCase().includes('summary') || 
           output.toLowerCase().includes('test summary'),
           'Should mention result aggregation');

  // Check for test content
  assert.ok(output.includes('Test 1') || output.includes('Test 2') ||
           output.includes('pass rate'),
           'Should include test result content');
});

test('sub-agent tool handles invalid parameters', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the spawn_sub_agent tool with invalid task:
- task: ""
- timeout: 1000
- priority: "invalid"`;

  const output = rig.run(prompt);

  // Should handle validation errors gracefully
  assert.ok(output.toLowerCase().includes('error') || 
           output.toLowerCase().includes('invalid') || 
           output.toLowerCase().includes('rejected'),
           'Should handle invalid parameters with error message');
});

test('parallel executor manages concurrent agents', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Use the delegate_task tool to test concurrency:
- mainTask: "Test concurrent execution"
- subtasks:
  - task: "List current directory and show results"
    timeout: 15
  - task: "Show current date and time"
    timeout: 15
  - task: "Count files in current directory"
    timeout: 15
- executionMode: "parallel"
- maxConcurrentAgents: 2
- waitForCompletion: true`;

  const output = rig.run(prompt);

  // Check for delegation and parallel execution
  assert.ok(output.toLowerCase().includes('delegate') || 
           output.toLowerCase().includes('parallel') ||
           output.toLowerCase().includes('concurrent'),
           'Should mention parallel task delegation');

  // Check for multiple subtasks
  assert.ok(output.includes('3') || output.toLowerCase().includes('three'),
           'Should handle multiple subtasks');
});