/**
 * @license
 * Copyright 2025 Qwen Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThoughtSummary } from '../../core/turn.js';

export interface ThinkingParseResult {
  hasThinking: boolean;
  thinkingContent: string;
  regularContent: string;
  thoughtSummary: ThoughtSummary | null;
}

/**
 * Parses content to extract thinking tokens and regular content
 */
export function parseThinkingContent(content: string): ThinkingParseResult {
  // Match thinking content between <think> and </think> tags
  const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi;
  const matches = content.match(thinkingRegex);
  
  if (!matches) {
    return {
      hasThinking: false,
      thinkingContent: '',
      regularContent: content,
      thoughtSummary: null,
    };
  }

  // Extract all thinking content
  let thinkingContent = '';
  for (const match of matches) {
    const innerContent = match.replace(/<\/?think>/gi, '').trim();
    thinkingContent += innerContent + ' ';
  }
  thinkingContent = thinkingContent.trim();

  // Remove thinking tags from regular content
  const regularContent = content.replace(thinkingRegex, '').trim();

  // Create thought summary
  const thoughtSummary = createThoughtSummary(thinkingContent);

  return {
    hasThinking: true,
    thinkingContent,
    regularContent,
    thoughtSummary,
  };
}

/**
 * Creates a ThoughtSummary from thinking content
 */
function createThoughtSummary(thinkingContent: string): ThoughtSummary {
  // Try to extract a subject from the first sentence or phrase
  const sentences = thinkingContent.split(/[.!?]\s+/);
  const firstSentence = sentences[0]?.trim() || '';
  
  // If the first sentence is short, use it as subject
  let subject = '';
  let description = thinkingContent;
  
  if (firstSentence.length > 0 && firstSentence.length <= 50) {
    subject = firstSentence;
    // Use remaining content as description
    description = thinkingContent.substring(firstSentence.length).replace(/^[.!?]\s*/, '').trim();
    if (!description) {
      description = firstSentence; // Fallback if no remaining content
    }
  } else {
    // For longer content, extract key phrases or use a generic subject
    const words = thinkingContent.split(/\s+/);
    if (words.length <= 10) {
      subject = thinkingContent;
      description = thinkingContent;
    } else {
      subject = words.slice(0, 6).join(' ') + '...';
      description = thinkingContent;
    }
  }

  return {
    subject: subject || 'Thinking...',
    description: description || thinkingContent,
  };
}

/**
 * Checks if content contains thinking tags
 */
export function hasThinkingTags(content: string): boolean {
  return /<think>[\s\S]*?<\/think>/i.test(content);
}

/**
 * Removes thinking tags from content, leaving only regular text
 */
export function stripThinkingTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}