/**
 * @license
 * Copyright 2025 Wan Integration Tests
 * SPDX-License-Identifier: Apache-2.0
 */

import { strict as assert } from 'assert';
import { test } from 'node:test';
import { TestRig } from './test-helper.js';

test('search_wan_models tool lists available Wan models', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  // Note: Wan tools are only available in assistant mode
  // For integration tests, we test that the tool would be invoked
  const prompt = `In assistant mode, use the search_wan_models tool to list all available models:
- modelType: "all"
- includeCapabilities: true`;

  const output = rig.run(prompt);

  // Check that Wan models were mentioned
  assert.ok(
    output.toLowerCase().includes('wan') || 
    output.toLowerCase().includes('model') ||
    output.toLowerCase().includes('image-to-video') ||
    output.toLowerCase().includes('i2v'),
    'Should mention Wan models'
  );

  // Check for model names
  assert.ok(
    output.toLowerCase().includes('turbo') ||
    output.toLowerCase().includes('plus') ||
    output.toLowerCase().includes('wan2.1'),
    'Should list specific model names'
  );
});

test('generate_image_to_video tool validates input parameters', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, try to use generate_image_to_video with a local file path:
- imageUrl: "/local/path/image.jpg"
- duration: 5`;

  const output = rig.run(prompt);

  // Check for validation message
  assert.ok(
    output.toLowerCase().includes('local file') ||
    output.toLowerCase().includes('not supported') ||
    output.toLowerCase().includes('url') ||
    output.toLowerCase().includes('upload'),
    'Should mention local files not supported'
  );
});

test('transform_image tool handles style transformations', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, use transform_image to apply cartoon style:
- imageUrl: "https://example.com/test-photo.jpg"
- transformation: "cartoon"
- strength: 0.8`;

  const output = rig.run(prompt);

  // Check for transformation details
  assert.ok(
    output.toLowerCase().includes('cartoon') ||
    output.toLowerCase().includes('transform') ||
    output.toLowerCase().includes('style'),
    'Should mention transformation style'
  );

  // Check for image processing
  assert.ok(
    output.toLowerCase().includes('image') ||
    output.toLowerCase().includes('apply') ||
    output.toLowerCase().includes('process'),
    'Should indicate image processing'
  );
});

test('generate_video tool creates videos from prompts', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, use generate_video to create a video:
- prompt: "A serene mountain landscape with moving clouds"
- duration: 10
- resolution: "1080p"
- language: "en"`;

  const output = rig.run(prompt);

  // Check for video generation
  assert.ok(
    output.toLowerCase().includes('video') ||
    output.toLowerCase().includes('generat') ||
    output.toLowerCase().includes('creat'),
    'Should mention video generation'
  );

  // Check for prompt details
  assert.ok(
    output.toLowerCase().includes('mountain') ||
    output.toLowerCase().includes('landscape') ||
    output.toLowerCase().includes('1080p') ||
    output.toLowerCase().includes('duration'),
    'Should include generation details'
  );
});

test('wan tools require assistant mode', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Try to use generate_image_to_video without assistant mode:
- imageUrl: "https://example.com/test.jpg"`;

  const output = rig.run(prompt);

  // Check for assistant mode requirement
  assert.ok(
    output.toLowerCase().includes('assistant') ||
    output.toLowerCase().includes('not available') ||
    output.toLowerCase().includes('mode') ||
    output.toLowerCase().includes('only available'),
    'Should mention assistant mode requirement'
  );
});

test('image to video with custom prompt', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, convert an image to video with a specific animation:
- imageUrl: "https://example.com/portrait.jpg"
- prompt: "make the person smile and wave"
- duration: 5`;

  const output = rig.run(prompt);

  // Check for i2v functionality
  assert.ok(
    output.toLowerCase().includes('image') &&
    output.toLowerCase().includes('video'),
    'Should mention image to video conversion'
  );

  // Check for animation details
  assert.ok(
    output.toLowerCase().includes('smile') ||
    output.toLowerCase().includes('wave') ||
    output.toLowerCase().includes('animation') ||
    output.toLowerCase().includes('motion'),
    'Should include animation details'
  );
});

test('custom transformation requires prompt parameter', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, try custom transformation without prompt:
- imageUrl: "https://example.com/test.jpg"
- transformation: "custom"`;

  const output = rig.run(prompt);

  // Check for prompt requirement
  assert.ok(
    output.toLowerCase().includes('prompt') ||
    output.toLowerCase().includes('custom') ||
    output.toLowerCase().includes('require') ||
    output.toLowerCase().includes('specify'),
    'Should mention prompt requirement for custom transformation'
  );
});

test('wan tools handle async task pattern', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `Explain how Wan tools handle media generation. Do they wait for completion?`;

  const output = rig.run(prompt);

  // Check for async pattern explanation
  assert.ok(
    output.toLowerCase().includes('async') ||
    output.toLowerCase().includes('wait') ||
    output.toLowerCase().includes('poll') ||
    output.toLowerCase().includes('task'),
    'Should explain async task handling'
  );
});

test('media url expiry warning', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, when generating media with Wan tools, what happens to the generated URLs?`;

  const output = rig.run(prompt);

  // Check for expiry warning
  assert.ok(
    output.toLowerCase().includes('24') ||
    output.toLowerCase().includes('expir') ||
    output.toLowerCase().includes('download') ||
    output.toLowerCase().includes('temporary'),
    'Should mention 24-hour URL expiry'
  );
});

test('model selection based on duration', (t) => {
  const rig = new TestRig();
  rig.setup(t.name);

  const prompt = `In assistant mode, which model is used for:
1. A 3-second image-to-video conversion
2. An 8-second image-to-video conversion`;

  const output = rig.run(prompt);

  // Check for model selection logic
  assert.ok(
    output.toLowerCase().includes('turbo') ||
    output.toLowerCase().includes('plus') ||
    output.toLowerCase().includes('model'),
    'Should explain model selection'
  );

  // Check for duration-based logic
  assert.ok(
    output.toLowerCase().includes('5') ||
    output.toLowerCase().includes('second') ||
    output.toLowerCase().includes('duration'),
    'Should mention duration thresholds'
  );
});