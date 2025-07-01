/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../../colors.js';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  focus?: boolean;
  width?: number;
}

export function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  focus = false,
  width,
}: TextInputProps): React.JSX.Element {
  const [cursorOffset, setCursorOffset] = useState(0);

  useInput((input, key) => {
    if (!focus) return;

    if (key.return) {
      onSubmit?.();
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorOffset > 0) {
        const newValue = value.slice(0, value.length - cursorOffset - 1) + value.slice(value.length - cursorOffset);
        onChange(newValue);
        setCursorOffset(Math.max(0, cursorOffset));
      }
      return;
    }

    if (key.leftArrow) {
      setCursorOffset(Math.min(value.length, cursorOffset + 1));
      return;
    }

    if (key.rightArrow) {
      setCursorOffset(Math.max(0, cursorOffset - 1));
      return;
    }

    if ((key as any).home) {
      setCursorOffset(value.length);
      return;
    }

    if ((key as any).end) {
      setCursorOffset(0);
      return;
    }

    // Handle regular character input
    if (input && !key.ctrl && !key.meta) {
      const insertPosition = value.length - cursorOffset;
      const newValue = value.slice(0, insertPosition) + input + value.slice(insertPosition);
      onChange(newValue);
      // Keep cursor in same relative position
    }
  }, { isActive: focus });

  const displayValue = value || placeholder;
  const showCursor = focus && cursorOffset === 0;
  const cursorPosition = value.length - cursorOffset;

  return (
    <Box width={width}>
      <Text color={focus ? Colors.Foreground : Colors.Gray}>
        {value ? (
          showCursor ? (
            <>
              {value}
              <Text backgroundColor={Colors.Foreground} color={Colors.Background}>
                {' '}
              </Text>
            </>
          ) : (
            <>
              {value.slice(0, cursorPosition)}
              {cursorOffset > 0 && (
                <Text backgroundColor={Colors.Foreground} color={Colors.Background}>
                  {value[cursorPosition] || ' '}
                </Text>
              )}
              {value.slice(cursorPosition + 1)}
            </>
          )
        ) : (
          <Text color={Colors.Gray} dimColor>
            {placeholder}
            {focus && (
              <Text backgroundColor={Colors.Foreground} color={Colors.Background}>
                {' '}
              </Text>
            )}
          </Text>
        )}
      </Text>
    </Box>
  );
}