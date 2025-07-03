/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { shortenPath } from './paths.js';

// Utility to quickly compute length

describe('shortenPath', () => {
  it('returns original path when shorter than limit', () => {
    const p = '/tmp/a.txt';
    expect(shortenPath(p, 20)).toBe(p);
  });

  it('shortens long paths and ensures result does not exceed max length', () => {
    const p = '/Users/testuser/projects/someproject/src/components/Button/index.tsx';
    const maxLen = 35;
    const shortened = shortenPath(p, maxLen);
    expect(shortened.length).toBeLessThanOrEqual(maxLen);
    // Should keep file name at end
    expect(shortened.endsWith('index.tsx')).toBe(true);
  });

  it('handles single segment paths', () => {
    const p = '/singleextremelylongfilename.txt';
    const maxLen = 20;
    const shortened = shortenPath(p, maxLen);
    expect(shortened.length).toBeLessThanOrEqual(maxLen);
    expect(shortened.endsWith('name.txt')).toBe(true);
  });
});
