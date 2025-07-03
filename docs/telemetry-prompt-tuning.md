# Telemetry-Based Prompt Tuning Guide

This guide explains how to use Qwen CLI's telemetry system to collect and analyze prompts for prompt engineering and tuning purposes.

## Overview

Qwen CLI's telemetry system can capture all user prompts and AI responses, providing valuable data for:
- Analyzing prompt effectiveness
- Identifying patterns in successful interactions
- Building prompt libraries
- Fine-tuning prompt strategies
- Debugging conversation flows

## Quick Start

### 1. Automated Setup

Use the dedicated prompt tuning telemetry script:

```bash
node scripts/telemetry-prompt-tuning.js
```

This script will:
- Enable telemetry with prompt logging
- Start local telemetry collection
- Provide real-time access to traces and logs

### 2. Manual Setup

Alternatively, configure telemetry manually:

#### Enable in Settings

Add to `.qwen/settings.json`:

```json
{
  "telemetry": {
    "enabled": true,
    "target": "local",
    "logPrompts": true
  }
}
```

#### Start Telemetry Collection

```bash
npm run telemetry -- --target=local
```

## Data Collection

### What Gets Logged

When `logPrompts: true` is set, the following data is collected:

1. **User Prompts**
   - Full prompt text
   - Prompt length
   - Timestamp
   - Session ID

2. **API Interactions**
   - Model used
   - Request/response timing
   - Token usage (input/output/cached/thinking)
   - Response text

3. **Tool Calls**
   - Tool name and arguments
   - Execution duration
   - Success/failure status
   - User decisions (accept/reject/modify)

4. **Session Metadata**
   - Configuration settings
   - Model selection
   - Environment details

### Data Structure

Each logged event includes:
```json
{
  "event.name": "user_prompt",
  "event.timestamp": "2025-01-XX...",
  "session.id": "unique-session-id",
  "prompt": "Full user prompt text",
  "prompt_length": 123
}
```

## Accessing Telemetry Data

### 1. Jaeger UI (Visual Traces)

Access at: http://localhost:16686

- View conversation flows as traces
- Analyze timing and dependencies
- Export traces as JSON for analysis

### 2. Raw Logs

Location: `~/.qwen/tmp/<projectHash>/otel/collector.log`

Format: Structured JSON logs with all telemetry events

### 3. Programmatic Access

Example script to parse telemetry logs:

```javascript
const fs = require('fs');
const path = require('path');

// Read collector logs
const logPath = path.join(process.env.HOME, '.qwen/tmp/<hash>/otel/collector.log');
const logs = fs.readFileSync(logPath, 'utf-8').split('\n');

// Parse prompt events
const prompts = logs
  .filter(line => line.includes('user_prompt'))
  .map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  })
  .filter(Boolean);

// Analyze prompts
console.log(`Total prompts: ${prompts.length}`);
```

## Prompt Analysis Workflows

### 1. Export Session Data

After a session, export data for analysis:

```bash
# Copy logs
cp ~/.qwen/tmp/*/otel/collector.log ./session-logs.json

# Export traces from Jaeger
# Use Jaeger UI > Search > Your session > Export as JSON
```

### 2. Analyze Prompt Patterns

Look for:
- Common prompt structures
- Successful vs unsuccessful patterns
- Token efficiency
- Tool usage correlation

### 3. Build Prompt Templates

Based on analysis, create reusable templates:

```javascript
// Example: Effective code generation prompt template
const codeGenTemplate = `
Task: {task_description}
Context: {relevant_context}
Requirements:
- {requirement_1}
- {requirement_2}
Expected output format: {format_spec}
`;
```

## Privacy and Security

### Data Storage

- All telemetry data is stored locally by default
- No data is sent externally unless you configure GCP target
- Logs are stored in your home directory

### Disabling Prompt Logging

To collect only metadata (no prompt content):

```json
{
  "telemetry": {
    "enabled": true,
    "logPrompts": false
  }
}
```

### Cleanup

Remove telemetry data:

```bash
rm -rf ~/.qwen/tmp/*/otel/
```

## Advanced Configuration

### Custom OTLP Endpoint

Send telemetry to your own backend:

```json
{
  "telemetry": {
    "enabled": true,
    "otlpEndpoint": "http://your-collector:4317"
  }
}
```

### Environment Variables

```bash
# Override endpoint
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"

# Temporary telemetry with CLI flags
node bundle/qwen.js --telemetry --telemetry-log-prompts -p "test prompt"
```

## Best Practices

1. **Session Organization**
   - Use consistent session patterns
   - Tag sessions with project/experiment names
   - Export data after each session

2. **Prompt Engineering**
   - Test variations systematically
   - Track token usage for cost optimization
   - Document successful patterns

3. **Data Management**
   - Regular backup of valuable sessions
   - Clean up old telemetry data
   - Maintain a prompt library

## Troubleshooting

### Telemetry Not Starting

Check:
- Node.js version compatibility
- Port 4317 (OTLP) availability
- Port 16686 (Jaeger) availability

### Missing Prompts

Verify:
- `logPrompts: true` in settings
- Telemetry is running before CLI usage
- Check collector.log for errors

### Performance Impact

Telemetry has minimal overhead, but if needed:
- Disable in production environments
- Use sampling for high-volume testing
- Export and analyze offline

## Example Analysis Script

Here's a complete example for analyzing prompt effectiveness:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const logsDir = path.join(process.env.HOME, '.qwen/tmp');
const outputFile = 'prompt-analysis.json';

// Find latest log file
const findLatestLog = () => {
  const dirs = fs.readdirSync(logsDir);
  const otelDirs = dirs.filter(d => 
    fs.existsSync(path.join(logsDir, d, 'otel', 'collector.log'))
  );
  
  if (otelDirs.length === 0) {
    throw new Error('No telemetry logs found');
  }
  
  // Get most recent
  const latest = otelDirs.sort().pop();
  return path.join(logsDir, latest, 'otel', 'collector.log');
};

// Parse logs
const analyzeLogs = (logPath) => {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  
  const sessions = {};
  
  lines.forEach(line => {
    try {
      const data = JSON.parse(line);
      const sessionId = data.attributes?.['session.id'];
      
      if (!sessionId) return;
      
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          prompts: [],
          responses: [],
          tools: [],
          totalTokens: 0,
          duration: 0
        };
      }
      
      const session = sessions[sessionId];
      
      // Collect different event types
      switch (data.attributes?.['event.name']) {
        case 'user_prompt':
          session.prompts.push({
            text: data.attributes.prompt,
            length: data.attributes.prompt_length,
            timestamp: data.attributes['event.timestamp']
          });
          break;
          
        case 'api_response':
          session.responses.push({
            model: data.attributes.model,
            inputTokens: data.attributes.input_token_count,
            outputTokens: data.attributes.output_token_count,
            duration: data.attributes.duration_ms
          });
          session.totalTokens += (data.attributes.input_token_count || 0) + 
                                (data.attributes.output_token_count || 0);
          break;
          
        case 'tool_call':
          session.tools.push({
            name: data.attributes.function_name,
            success: data.attributes.success,
            duration: data.attributes.duration_ms
          });
          break;
      }
    } catch (e) {
      // Skip unparseable lines
    }
  });
  
  return sessions;
};

// Generate report
const generateReport = (sessions) => {
  const report = {
    totalSessions: Object.keys(sessions).length,
    totalPrompts: 0,
    averagePromptLength: 0,
    totalTokensUsed: 0,
    toolUsage: {},
    sessions: []
  };
  
  Object.entries(sessions).forEach(([id, session]) => {
    report.totalPrompts += session.prompts.length;
    report.totalTokensUsed += session.totalTokens;
    
    session.tools.forEach(tool => {
      report.toolUsage[tool.name] = (report.toolUsage[tool.name] || 0) + 1;
    });
    
    report.sessions.push({
      id,
      promptCount: session.prompts.length,
      totalTokens: session.totalTokens,
      tools: session.tools.map(t => t.name),
      prompts: session.prompts.map(p => ({
        text: p.text,
        length: p.length
      }))
    });
  });
  
  if (report.totalPrompts > 0) {
    const totalLength = Object.values(sessions)
      .flatMap(s => s.prompts)
      .reduce((sum, p) => sum + p.length, 0);
    report.averagePromptLength = Math.round(totalLength / report.totalPrompts);
  }
  
  return report;
};

// Main execution
try {
  console.log('🔍 Analyzing Qwen CLI telemetry logs...\n');
  
  const logPath = findLatestLog();
  console.log(`📁 Found log file: ${logPath}`);
  
  const sessions = analyzeLogs(logPath);
  const report = generateReport(sessions);
  
  // Save report
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 Analysis Summary:');
  console.log(`  • Total sessions: ${report.totalSessions}`);
  console.log(`  • Total prompts: ${report.totalPrompts}`);
  console.log(`  • Average prompt length: ${report.averagePromptLength} chars`);
  console.log(`  • Total tokens used: ${report.totalTokensUsed}`);
  console.log('\n🔧 Tool usage:');
  Object.entries(report.toolUsage).forEach(([tool, count]) => {
    console.log(`  • ${tool}: ${count} calls`);
  });
  
  console.log(`\n✅ Full report saved to: ${outputFile}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
```

Save this as `analyze-prompts.js` and run after collecting telemetry data to get insights into your prompt usage patterns.