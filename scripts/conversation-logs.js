#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Qwen CLI
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script to display telemetry logs in a human-readable conversation format
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

// Color helper functions
const color = (text, ...codes) => codes.join('') + text + colors.reset;
const bold = (text) => color(text, colors.bold);
const dim = (text) => color(text, colors.dim);
const red = (text) => color(text, colors.red);
const green = (text) => color(text, colors.green);
const yellow = (text) => color(text, colors.yellow);
const blue = (text) => color(text, colors.blue);
const magenta = (text) => color(text, colors.magenta);
const cyan = (text) => color(text, colors.cyan);
const gray = (text) => color(text, colors.gray);
const white = (text) => color(text, colors.white);

// Configuration
const logsDir = path.join(homedir(), '.qwen/tmp');

// Command line arguments
const args = process.argv.slice(2);
const options = {
  output: 'console', // console, markdown, json
  sessionId: null,
  tail: false,
  search: null,
  last: null, // last N sessions
  format: 'detailed' // detailed, compact
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--output':
    case '-o':
      options.output = args[++i] || 'console';
      break;
    case '--session':
    case '-s':
      options.sessionId = args[++i];
      break;
    case '--tail':
    case '-t':
      options.tail = true;
      break;
    case '--search':
      options.search = args[++i];
      break;
    case '--last':
    case '-l':
      options.last = parseInt(args[++i]) || 10;
      break;
    case '--format':
    case '-f':
      options.format = args[++i] || 'detailed';
      break;
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
  }
}

function showHelp() {
  console.log(`
${bold(cyan('Qwen CLI Conversation Logs Viewer'))}

${bold('Usage:')}
  node conversation-logs.js [options]

${bold('Options:')}
  -o, --output <type>     Output format: console (default), markdown, json
  -s, --session <id>      Show specific session ID
  -t, --tail              Follow log file in real-time
  -l, --last <n>          Show last N sessions (default: all)
  -f, --format <type>     Display format: detailed (default), compact
  --search <term>         Search for term in conversations
  -h, --help              Show this help

${bold('Examples:')}
  # View all conversations in console
  node conversation-logs.js

  # Export last 5 sessions to markdown
  node conversation-logs.js -l 5 -o markdown > conversations.md

  # Follow logs in real-time
  node conversation-logs.js --tail

  # Search for specific content
  node conversation-logs.js --search "function"

  # View specific session
  node conversation-logs.js -s "9e8e480d-2410-4315-8337-65196d1ef5cb"
`);
}

// Find latest log file
const findLatestLog = () => {
  if (!fs.existsSync(logsDir)) {
    throw new Error(`Telemetry directory not found: ${logsDir}`);
  }

  const dirs = fs.readdirSync(logsDir);
  const otelDirs = dirs.filter(d => {
    const logPath = path.join(logsDir, d, 'otel', 'collector.log');
    return fs.existsSync(logPath);
  });
  
  if (otelDirs.length === 0) {
    throw new Error('No telemetry logs found. Make sure telemetry is running.');
  }
  
  // Get most recent by modification time
  const logsWithTime = otelDirs.map(dir => {
    const logPath = path.join(logsDir, dir, 'otel', 'collector.log');
    const stats = fs.statSync(logPath);
    return { dir, mtime: stats.mtime, path: logPath };
  });
  
  logsWithTime.sort((a, b) => b.mtime - a.mtime);
  return logsWithTime[0].path;
};

// Parse log entry
const parseLogEntry = (lines, startIndex) => {
  const entry = {
    timestamp: null,
    sessionId: null,
    eventType: null,
    attributes: {}
  };
  
  let i = startIndex;
  let inAttributes = false;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.includes('LogRecord #')) {
      // Start of entry
    } else if (line.includes('ObservedTimestamp:')) {
      const match = line.match(/ObservedTimestamp: (.+)/);
      if (match) entry.timestamp = new Date(match[1]);
    } else if (line.includes('Attributes:')) {
      inAttributes = true;
    } else if (inAttributes && line.includes('->')) {
      // Parse attribute - handle both single-line and multi-line strings
      const match = line.match(/\s*->\s*([^:]+):\s*(?:Str\((.*)|(Int\((\d+)\)|Empty\(\)))/);
      if (match) {
        const key = match[1].trim();
        let value = '';
        
        if (match[3] !== undefined) {
          // Int or Empty value
          value = match[3].includes('Int') ? parseInt(match[3].match(/\d+/)[0]) : '';
        } else if (match[2] !== undefined) {
          // String value - could be single or multi-line
          let strContent = match[2];
          
          if (strContent.endsWith(')')) {
            // Single line string, remove the closing )
            value = strContent.slice(0, -1);
          } else {
            // Multi-line string, collect all lines until we find the closing )
            let j = i + 1;
            let multiLineValue = strContent;
            while (j < lines.length && !lines[j].includes('Trace ID:') && !lines[j].includes('->')) {
              if (lines[j].trim() === ')') {
                // Found the end of the multi-line string
                i = j; // Update index to continue from here
                break;
              } else {
                multiLineValue += '\n' + lines[j];
              }
              j++;
            }
            value = multiLineValue;
          }
        }
        
        entry.attributes[key] = value;
        
        if (key === 'session.id') entry.sessionId = value;
        if (key === 'event.name') entry.eventType = value;
      }
    } else if (line.includes('Trace ID:')) {
      // End of entry
      break;
    }
    i++;
  }
  
  return { entry, nextIndex: i + 1 };
};

// Parse conversations from log
const parseConversations = (logPath) => {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  const sessions = {};
  
  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes('LogRecord #')) {
      const { entry, nextIndex } = parseLogEntry(lines, i);
      
      if (entry.sessionId && entry.eventType) {
        if (!sessions[entry.sessionId]) {
          sessions[entry.sessionId] = {
            id: entry.sessionId,
            events: [],
            startTime: null,
            endTime: null
          };
        }
        
        const session = sessions[entry.sessionId];
        session.events.push(entry);
        
        if (!session.startTime || entry.timestamp < session.startTime) {
          session.startTime = entry.timestamp;
        }
        if (!session.endTime || entry.timestamp > session.endTime) {
          session.endTime = entry.timestamp;
        }
      }
      
      i = nextIndex;
    } else {
      i++;
    }
  }
  
  // Convert to conversations
  const conversations = [];
  
  for (const sessionId in sessions) {
    const session = sessions[sessionId];
    const conversation = {
      sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.endTime - session.startTime,
      messages: []
    };
    
    // Group events into messages
    let currentRequest = null;
    
    for (const event of session.events) {
      switch (event.eventType) {
        case 'qwen_cli.user_prompt':
          conversation.messages.push({
            type: 'prompt',
            timestamp: event.timestamp,
            text: event.attributes.prompt || event.attributes.text || '',
            length: event.attributes.prompt_length || 0
          });
          break;
          
        case 'qwen_cli.api_request':
          currentRequest = {
            model: event.attributes.model,
            requestText: event.attributes.request_text || ''
          };
          break;
          
        case 'qwen_cli.api_response':
          const responseText = event.attributes.response_text || '';
          let displayText = responseText;
          let isToolCall = false;
          
          // Check if this is a tool call response (JSON format)
          if (responseText.trim().startsWith('[') && responseText.trim().endsWith(']')) {
            try {
              const toolCalls = JSON.parse(responseText);
              if (Array.isArray(toolCalls) && toolCalls.length > 0 && toolCalls[0].name) {
                displayText = `🔧 Called ${toolCalls.length} tool(s): ${toolCalls.map(t => t.name).join(', ')}`;
                isToolCall = true;
              }
            } catch (e) {
              // Not valid JSON, treat as regular text
              isToolCall = false;
            }
          }
          
          // Only add non-empty responses
          if (displayText.trim()) {
            conversation.messages.push({
              type: 'response',
              timestamp: event.timestamp,
              text: displayText,
              model: event.attributes.model || 'unknown',
              duration: event.attributes.duration_ms || 0,
              requestContext: currentRequest,
              isToolCall: isToolCall
            });
          }
          currentRequest = null;
          break;
          
        case 'qwen_cli.tool_call':
          const toolArgs = event.attributes.function_args || '{}';
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(toolArgs);
          } catch (e) {
            parsedArgs = { raw: toolArgs };
          }
          
          conversation.messages.push({
            type: 'tool',
            timestamp: event.timestamp,
            name: event.attributes.function_name || 'unknown',
            args: parsedArgs,
            success: event.attributes.success !== false,
            duration: event.attributes.duration_ms || 0
          });
          break;
      }
    }
    
    conversations.push(conversation);
  }
  
  // Sort by start time
  conversations.sort((a, b) => b.startTime - a.startTime);
  
  return conversations;
};

// Format duration
const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};

// Format timestamp
const formatTime = (date) => {
  return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
};

// Display conversation in console
const displayConsole = (conversations) => {
  for (const conv of conversations) {
    console.log(cyan('━'.repeat(80)));
    console.log(bold(yellow(`Session: ${conv.sessionId}`)));
    console.log(gray(`Started: ${formatTime(conv.startTime)}`));
    console.log(gray(`Duration: ${formatDuration(conv.duration)}`));
    
    // Show summary
    const promptCount = conv.messages.filter(m => m.type === 'prompt').length;
    const toolCount = conv.messages.filter(m => m.type === 'tool').length;
    const toolTypes = [...new Set(conv.messages.filter(m => m.type === 'tool').map(m => m.name))];
    
    console.log(gray(`Messages: ${promptCount} prompts, ${toolCount} tools${toolTypes.length > 0 ? ` (${toolTypes.join(', ')})` : ''}`));
    console.log(cyan('─'.repeat(80)));
    
    for (const msg of conv.messages) {
      switch (msg.type) {
        case 'prompt':
          console.log(bold(green(`\n👤 User [${formatTime(msg.timestamp)}]:`)));
          console.log(white(msg.text));
          break;
          
        case 'response':
          if (msg.isToolCall) {
            console.log(bold(magenta(`\n🤖 Qwen (${msg.model}) [${formatDuration(msg.duration)}]:`)));
          } else {
            console.log(bold(blue(`\n🤖 Qwen (${msg.model}) [${formatDuration(msg.duration)}]:`)));
          }
          if (options.format === 'detailed' && msg.requestContext) {
            console.log(gray(`[Context: ${msg.requestContext.requestText.split('\n')[0]}...]`));
          }
          console.log(white(msg.text));
          break;
          
        case 'tool':
          console.log(bold(magenta(`\n🔧 Tool: ${msg.name} [${formatDuration(msg.duration)}]`)));
          if (options.format === 'detailed') {
            console.log(gray(`Args: ${JSON.stringify(msg.args, null, 2)}`));
          } else if (options.format === 'compact') {
            // Show just key info for compact format
            if (msg.args.file_path) {
              console.log(gray(`File: ${msg.args.file_path}`));
            }
            if (msg.args.prompt || msg.args.query) {
              console.log(gray(`Query: ${(msg.args.prompt || msg.args.query).substring(0, 50)}...`));
            }
          }
          console.log(gray(`Status: ${msg.success ? '✅ Success' : '❌ Failed'}`));
          break;
      }
    }
    
    console.log();
  }
};

// Export to markdown
const exportMarkdown = (conversations) => {
  let markdown = '# Qwen CLI Conversation Logs\n\n';
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  for (const conv of conversations) {
    markdown += `## Session: ${conv.sessionId}\n\n`;
    markdown += `- **Started:** ${formatTime(conv.startTime)}\n`;
    markdown += `- **Duration:** ${formatDuration(conv.duration)}\n\n`;
    
    for (const msg of conv.messages) {
      switch (msg.type) {
        case 'prompt':
          markdown += `### 👤 User [${formatTime(msg.timestamp)}]\n\n`;
          markdown += `${msg.text}\n\n`;
          break;
          
        case 'response':
          markdown += `### 🤖 Qwen (${msg.model}) [${formatDuration(msg.duration)}]\n\n`;
          markdown += `${msg.text}\n\n`;
          break;
          
        case 'tool':
          markdown += `### 🔧 Tool: ${msg.name} [${formatDuration(msg.duration)}]\n\n`;
          markdown += `- Status: ${msg.success ? '✅ Success' : '❌ Failed'}\n`;
          if (options.format === 'detailed') {
            markdown += `- Args: \`\`\`json\n${JSON.stringify(msg.args, null, 2)}\n\`\`\`\n`;
          }
          markdown += '\n';
          break;
      }
    }
    
    markdown += '---\n\n';
  }
  
  console.log(markdown);
};

// Main execution
const main = async () => {
  try {
    const logPath = findLatestLog();
    let conversations = parseConversations(logPath);
    
    // Apply filters
    if (options.sessionId) {
      conversations = conversations.filter(c => c.sessionId === options.sessionId);
    }
    
    if (options.search) {
      conversations = conversations.filter(c => 
        c.messages.some(m => 
          m.text && m.text.toLowerCase().includes(options.search.toLowerCase())
        )
      );
    }
    
    if (options.last) {
      conversations = conversations.slice(0, options.last);
    }
    
    // Output
    switch (options.output) {
      case 'console':
        displayConsole(conversations);
        break;
      case 'markdown':
        exportMarkdown(conversations);
        break;
      case 'json':
        console.log(JSON.stringify(conversations, null, 2));
        break;
    }
    
    // Tail mode
    if (options.tail) {
      console.log(yellow('\n📡 Watching for new conversations... (Ctrl+C to stop)\n'));
      
      let lastSize = fs.statSync(logPath).size;
      setInterval(() => {
        const currentSize = fs.statSync(logPath).size;
        if (currentSize > lastSize) {
          // Re-parse and show new conversations
          const newConversations = parseConversations(logPath);
          // Show only new entries (this is simplified, real implementation would track seen events)
          console.log(green('\n🔄 New activity detected!\n'));
          lastSize = currentSize;
        }
      }, 1000);
    }
    
  } catch (error) {
    console.error(red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
};

// Run
main();