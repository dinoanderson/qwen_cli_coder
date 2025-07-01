/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple markdown-like rendering for now
  // In a full implementation, you'd use a proper markdown library like react-markdown
  
  const renderContent = (text: string): JSX.Element[] => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push(
            <pre key={`code-${index}`} className="code-block">
              <code className={`language-${codeBlockLanguage}`}>
                {codeBlockContent.join('\n')}
              </code>
            </pre>
          );
          codeBlockContent = [];
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          // Start code block
          codeBlockLanguage = line.slice(3).trim();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={index}>{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index}>{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={index}>{line.slice(4)}</h3>);
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={index}>{renderInlineFormatting(line.slice(2))}</li>);
      }
      // Inline code
      else if (line.includes('`')) {
        elements.push(<p key={index}>{renderInlineFormatting(line)}</p>);
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(<p key={index}>{renderInlineFormatting(line)}</p>);
      }
      // Empty lines
      else {
        elements.push(<br key={index} />);
      }
    });

    return elements;
  };

  const renderInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let currentText = text;
    let keyCounter = 0;

    // Handle inline code
    currentText = currentText.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__CODE_${keyCounter}__`;
      parts.push(<code key={`code-${keyCounter++}`} className="inline-code">{code}</code>);
      return placeholder;
    });

    // Handle bold
    currentText = currentText.replace(/\*\*([^*]+)\*\*/g, (match, bold) => {
      const placeholder = `__BOLD_${keyCounter}__`;
      parts.push(<strong key={`bold-${keyCounter++}`}>{bold}</strong>);
      return placeholder;
    });

    // Handle italic
    currentText = currentText.replace(/\*([^*]+)\*/g, (match, italic) => {
      const placeholder = `__ITALIC_${keyCounter}__`;
      parts.push(<em key={`italic-${keyCounter++}`}>{italic}</em>);
      return placeholder;
    });

    // Split by placeholders and rebuild
    const textParts = currentText.split(/(__\w+_\d+__)/);
    const result: (string | JSX.Element)[] = [];
    
    textParts.forEach((part, index) => {
      if (part.startsWith('__') && part.endsWith('__')) {
        const matchingElement = parts.find((_, i) => part.includes(`_${i}__`));
        if (matchingElement) {
          result.push(matchingElement);
        }
      } else if (part) {
        result.push(part);
      }
    });

    return result.length > 0 ? result : [text];
  };

  return (
    <div className="markdown-content">
      {renderContent(content)}
    </div>
  );
};