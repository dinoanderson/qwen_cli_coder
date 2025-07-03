#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Qwen CLI
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script to analyze collected telemetry data for prompt tuning insights
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

// Configuration
const logsDir = path.join(homedir(), '.qwen/tmp');
const outputFile = 'prompt-analysis.json';

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
    return { dir, mtime: stats.mtime };
  });
  
  logsWithTime.sort((a, b) => b.mtime - a.mtime);
  const latest = logsWithTime[0].dir;
  
  return path.join(logsDir, latest, 'otel', 'collector.log');
};

// Parse logs
const analyzeLogs = (logPath) => {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  
  const sessions = {};
  let currentAttributes = null;
  let inAttributes = false;
  
  lines.forEach(line => {
    try {
      // Handle OTEL collector debug format
      if (line.includes('LogRecord #')) {
        // Start of a new log record
        currentAttributes = {};
        inAttributes = false;
      } else if (line.includes('Attributes:')) {
        inAttributes = true;
      } else if (inAttributes && line.includes('->')) {
        // Parse attribute line format: "     -> session.id: Str(value)"
        const match = line.match(/\s*->\s*([^:]+):\s*(?:Str\(([^)]+)\)|Int\((\d+)\)|Empty\(\))/);
        if (match) {
          const key = match[1].trim();
          const value = match[2] || match[3] || '';
          currentAttributes[key] = match[3] ? parseInt(match[3]) : value;
        }
      } else if (line.includes('Trace ID:') && currentAttributes) {
        // End of attributes section, process the record
        const sessionId = currentAttributes['session.id'] || 'unknown';
        
        if (!sessions[sessionId]) {
          sessions[sessionId] = {
            prompts: [],
            responses: [],
            tools: [],
            totalTokens: 0,
            duration: 0,
            startTime: null,
            endTime: null
          };
        }
        
        const session = sessions[sessionId];
        const timestamp = currentAttributes['event.timestamp'] || new Date().toISOString();
        
        // Update session time range
        if (!session.startTime || timestamp < session.startTime) {
          session.startTime = timestamp;
        }
        if (!session.endTime || timestamp > session.endTime) {
          session.endTime = timestamp;
        }
        
        // Process different event types
        const eventName = currentAttributes['event.name'];
        
        switch (eventName) {
          case 'qwen_cli.user_prompt':
            session.prompts.push({
              text: currentAttributes.prompt || '',
              length: currentAttributes.prompt_length || 0,
              timestamp: timestamp
            });
            break;
            
          case 'qwen_cli.api_request':
            // Store request text for correlation with response
            session.lastRequestText = currentAttributes.request_text || '';
            break;
            
          case 'qwen_cli.api_response':
            const responseText = currentAttributes.response_text || '';
            session.responses.push({
              model: currentAttributes.model || 'unknown',
              inputTokens: currentAttributes.input_token_count || 0,
              outputTokens: currentAttributes.output_token_count || 0,
              cachedTokens: currentAttributes.cached_content_token_count || 0,
              thoughtTokens: currentAttributes.thoughts_token_count || 0,
              duration: currentAttributes.duration_ms || 0,
              timestamp,
              responseText,
              requestText: session.lastRequestText || ''
            });
            
            session.totalTokens += (currentAttributes.input_token_count || 0) + (currentAttributes.output_token_count || 0);
            break;
            
          case 'qwen_cli.tool_call':
            session.tools.push({
              name: currentAttributes.function_name || 'unknown',
              args: currentAttributes.function_args || {},
              success: currentAttributes.success !== false,
              duration: currentAttributes.duration_ms || 0,
              decision: currentAttributes.decision || null,
              timestamp
            });
            break;
        }
        
        currentAttributes = null;
        inAttributes = false;
      }
      
      // Also handle JSON format (if any)
      if (line.startsWith('{')) {
        const data = JSON.parse(line);
        // Process JSON formatted logs (fallback)
        // ... existing JSON processing code ...
      }
    } catch (e) {
      // Skip unparseable lines
    }
  });
  
  // Calculate session durations
  Object.values(sessions).forEach(session => {
    if (session.startTime && session.endTime) {
      session.duration = new Date(session.endTime) - new Date(session.startTime);
    }
  });
  
  return sessions;
};

// Generate report
const generateReport = (sessions) => {
  const report = {
    summary: {
      totalSessions: Object.keys(sessions).length,
      totalPrompts: 0,
      totalResponses: 0,
      totalToolCalls: 0,
      totalTokensUsed: 0,
      averagePromptLength: 0,
      averageResponseTime: 0,
      averageTokensPerPrompt: 0
    },
    toolUsage: {},
    modelUsage: {},
    promptPatterns: {
      byLength: {
        short: 0,      // < 50 chars
        medium: 0,     // 50-200 chars
        long: 0,       // 200-500 chars
        veryLong: 0    // > 500 chars
      },
      byHour: {},
      commonStarters: {}
    },
    sessions: []
  };
  
  // Analyze all sessions
  Object.entries(sessions).forEach(([id, session]) => {
    report.summary.totalPrompts += session.prompts.length;
    report.summary.totalResponses += session.responses.length;
    report.summary.totalToolCalls += session.tools.length;
    report.summary.totalTokensUsed += session.totalTokens;
    
    // Tool usage statistics
    session.tools.forEach(tool => {
      if (!report.toolUsage[tool.name]) {
        report.toolUsage[tool.name] = {
          count: 0,
          successCount: 0,
          totalDuration: 0,
          decisions: {}
        };
      }
      
      const toolStats = report.toolUsage[tool.name];
      toolStats.count++;
      if (tool.success) toolStats.successCount++;
      toolStats.totalDuration += tool.duration;
      
      if (tool.decision) {
        toolStats.decisions[tool.decision] = (toolStats.decisions[tool.decision] || 0) + 1;
      }
    });
    
    // Model usage statistics
    session.responses.forEach(response => {
      if (!report.modelUsage[response.model]) {
        report.modelUsage[response.model] = {
          count: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalDuration: 0
        };
      }
      
      const modelStats = report.modelUsage[response.model];
      modelStats.count++;
      modelStats.totalInputTokens += response.inputTokens;
      modelStats.totalOutputTokens += response.outputTokens;
      modelStats.totalDuration += response.duration;
    });
    
    // Analyze prompt patterns
    session.prompts.forEach(prompt => {
      // Length categories
      if (prompt.length < 50) report.promptPatterns.byLength.short++;
      else if (prompt.length < 200) report.promptPatterns.byLength.medium++;
      else if (prompt.length < 500) report.promptPatterns.byLength.long++;
      else report.promptPatterns.byLength.veryLong++;
      
      // Time patterns
      const hour = new Date(prompt.timestamp).getHours();
      report.promptPatterns.byHour[hour] = (report.promptPatterns.byHour[hour] || 0) + 1;
      
      // Common starters (first 20 chars)
      if (prompt.text) {
        const starter = prompt.text.substring(0, 20).toLowerCase().trim();
        report.promptPatterns.commonStarters[starter] = 
          (report.promptPatterns.commonStarters[starter] || 0) + 1;
      }
    });
    
    // Add session details
    report.sessions.push({
      id,
      duration: Math.round(session.duration / 1000), // seconds
      promptCount: session.prompts.length,
      responseCount: session.responses.length,
      toolCallCount: session.tools.length,
      totalTokens: session.totalTokens,
      averagePromptLength: session.prompts.length > 0 
        ? Math.round(session.prompts.reduce((sum, p) => sum + p.length, 0) / session.prompts.length)
        : 0,
      tools: [...new Set(session.tools.map(t => t.name))],
      models: [...new Set(session.responses.map(r => r.model))],
      prompts: session.prompts.map(p => ({
        text: p.text,
        length: p.length,
        timestamp: p.timestamp
      })),
      conversations: session.prompts.map((prompt, index) => ({
        prompt: prompt.text,
        response: session.responses[index] ? {
          text: session.responses[index].responseText,
          model: session.responses[index].model,
          duration: session.responses[index].duration,
          tokens: {
            input: session.responses[index].inputTokens,
            output: session.responses[index].outputTokens
          }
        } : null
      })).filter(conv => conv.response !== null)
    });
  });
  
  // Calculate averages
  if (report.summary.totalPrompts > 0) {
    const totalPromptLength = Object.values(sessions)
      .flatMap(s => s.prompts)
      .reduce((sum, p) => sum + p.length, 0);
    report.summary.averagePromptLength = Math.round(totalPromptLength / report.summary.totalPrompts);
    
    report.summary.averageTokensPerPrompt = Math.round(
      report.summary.totalTokensUsed / report.summary.totalPrompts
    );
  }
  
  if (report.summary.totalResponses > 0) {
    const totalResponseTime = Object.values(sessions)
      .flatMap(s => s.responses)
      .reduce((sum, r) => sum + r.duration, 0);
    report.summary.averageResponseTime = Math.round(totalResponseTime / report.summary.totalResponses);
  }
  
  // Sort common starters by frequency
  report.promptPatterns.topStarters = Object.entries(report.promptPatterns.commonStarters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([starter, count]) => ({ starter, count }));
  
  delete report.promptPatterns.commonStarters; // Remove the full list
  
  return report;
};

// Format file size
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Main execution
const main = async () => {
  console.log('🔍 Analyzing Qwen CLI telemetry logs...\n');
  
  try {
    const logPath = findLatestLog();
    const logStats = fs.statSync(logPath);
    
    console.log(`📁 Found log file: ${logPath}`);
    console.log(`   Size: ${formatSize(logStats.size)}`);
    console.log(`   Modified: ${logStats.mtime.toLocaleString()}\n`);
    
    console.log('⏳ Parsing logs...');
    const sessions = analyzeLogs(logPath);
    
    console.log('📊 Generating report...');
    const report = generateReport(sessions);
    
    // Save full report
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📈 Analysis Summary:');
    console.log(`  • Total sessions: ${report.summary.totalSessions}`);
    console.log(`  • Total prompts: ${report.summary.totalPrompts}`);
    console.log(`  • Total responses: ${report.summary.totalResponses}`);
    console.log(`  • Total tool calls: ${report.summary.totalToolCalls}`);
    console.log(`  • Total tokens used: ${report.summary.totalTokensUsed.toLocaleString()}`);
    console.log(`  • Average prompt length: ${report.summary.averagePromptLength} chars`);
    console.log(`  • Average response time: ${report.summary.averageResponseTime}ms`);
    console.log(`  • Average tokens per prompt: ${report.summary.averageTokensPerPrompt}`);
    
    if (Object.keys(report.toolUsage).length > 0) {
      console.log('\n🔧 Tool Usage:');
      Object.entries(report.toolUsage)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .forEach(([tool, stats]) => {
          const successRate = stats.count > 0 
            ? Math.round((stats.successCount / stats.count) * 100)
            : 0;
          const avgDuration = stats.count > 0
            ? Math.round(stats.totalDuration / stats.count)
            : 0;
          console.log(`  • ${tool}: ${stats.count} calls (${successRate}% success, avg ${avgDuration}ms)`);
        });
    }
    
    if (Object.keys(report.modelUsage).length > 0) {
      console.log('\n🤖 Model Usage:');
      Object.entries(report.modelUsage).forEach(([model, stats]) => {
        const avgDuration = stats.count > 0
          ? Math.round(stats.totalDuration / stats.count)
          : 0;
        console.log(`  • ${model}: ${stats.count} calls`);
        console.log(`    - Input tokens: ${stats.totalInputTokens.toLocaleString()}`);
        console.log(`    - Output tokens: ${stats.totalOutputTokens.toLocaleString()}`);
        console.log(`    - Avg response time: ${avgDuration}ms`);
      });
    }
    
    console.log('\n📝 Prompt Patterns:');
    console.log('  Length distribution:');
    console.log(`    - Short (<50): ${report.promptPatterns.byLength.short}`);
    console.log(`    - Medium (50-200): ${report.promptPatterns.byLength.medium}`);
    console.log(`    - Long (200-500): ${report.promptPatterns.byLength.long}`);
    console.log(`    - Very Long (>500): ${report.promptPatterns.byLength.veryLong}`);
    
    if (report.promptPatterns.topStarters?.length > 0) {
      console.log('\n  Common prompt starters:');
      report.promptPatterns.topStarters.slice(0, 5).forEach(({ starter, count }) => {
        console.log(`    - "${starter}..." (${count} times)`);
      });
    }
    
    console.log(`\n✅ Full report saved to: ${outputFile}`);
    console.log('\n💡 Tips for prompt tuning:');
    console.log('  1. Review successful tool calls for effective prompt patterns');
    console.log('  2. Analyze token usage to optimize for cost and performance');
    console.log('  3. Look for patterns in prompt length vs. response quality');
    console.log('  4. Export specific sessions for detailed analysis');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Telemetry is enabled in .qwen/settings.json');
    console.error('  2. The telemetry collector is running (npm run telemetry)');
    console.error('  3. You have run some Qwen CLI commands to generate logs');
    process.exit(1);
  }
};

// Run the analysis
main();