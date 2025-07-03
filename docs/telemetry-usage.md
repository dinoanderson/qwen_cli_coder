# Telemetry Usage Guide for Prompt Tuning

This guide explains how to use the telemetry system in Qwen CLI to capture and analyze API interactions for prompt tuning purposes.

## Overview

The telemetry system captures:
- **User prompts**: Exact text sent by users
- **API requests**: Full context sent to the Qwen API
- **API responses**: Complete responses from the model
- **Tool calls**: Function executions and their results
- **Performance metrics**: Response times and token usage

## Quick Start

### 1. Enable Telemetry

Telemetry is already configured in `.qwen/settings.json`:

```json
{
  "telemetry": {
    "enabled": true,
    "target": "local",
    "logPrompts": true,
    "otlpEndpoint": "http://localhost:4317"
  }
}
```

### 2. Start the Telemetry Collector

Run the telemetry setup script:

```bash
npm run telemetry
```

This will:
- Download and configure the OpenTelemetry collector
- Start collecting telemetry data locally
- Display real-time logs in debug mode

### 3. Use Qwen CLI

Run any Qwen CLI commands as normal:

```bash
# Interactive mode
npm start

# Non-interactive mode
node bundle/qwen.js -p "Your prompt here"
```

### 4. Analyze Collected Data

After running some commands, analyze the telemetry:

```bash
node scripts/analyze-prompts.js
```

This generates:
- Summary statistics
- Prompt patterns analysis
- Model usage metrics
- Full conversation logs in `prompt-analysis.json`

## Understanding the Data

### Session Structure

Each session contains:
- **id**: Unique session identifier
- **duration**: Total session time in seconds
- **prompts**: All user inputs with timestamps
- **responses**: All API responses with performance data
- **conversations**: Paired prompts and responses

### Example Output

```json
{
  "sessions": [{
    "id": "9e8e480d-2410-4315-8337-65196d1ef5cb",
    "conversations": [{
      "prompt": "Hello, please respond with a simple greeting",
      "response": {
        "text": "Hello! How can I assist you today?",
        "model": "qwen3-235b-a22b",
        "duration": 3510,
        "tokens": {
          "input": 0,
          "output": 0
        }
      }
    }]
  }]
}
```

## Prompt Tuning Workflow

### 1. Capture Baseline Performance

Run your existing prompts and capture metrics:
- Response quality
- Response time
- Token usage
- Success rate for tool calls

### 2. Identify Patterns

The analysis script helps identify:
- Common prompt starters
- Prompt length distribution
- Peak usage hours
- Frequently used tools

### 3. Test Variations

Create prompt variations and test:
```bash
# Test different phrasings
node bundle/qwen.js -p "List all TypeScript files"
node bundle/qwen.js -p "Show me TypeScript files in the project"
node bundle/qwen.js -p "Find *.ts files"
```

### 4. Compare Results

Analyze the results to find:
- Which prompts get better responses
- Which prompts execute faster
- Which prompts use fewer tokens

### 5. Document Best Practices

Based on your analysis, document:
- Effective prompt patterns
- Optimal prompt lengths
- Best practices for tool usage

## Advanced Analysis

### Export for External Analysis

The `prompt-analysis.json` file can be imported into:
- Jupyter notebooks for data science analysis
- Excel/Google Sheets for visualization
- Custom analysis scripts

### Custom Metrics

Extend the analysis script to track:
- Specific tool success rates
- Response quality scores
- Custom performance metrics

### Batch Testing

Create test suites for systematic evaluation:

```javascript
// test-prompts.js
const prompts = [
  "Find all TODO comments",
  "Search for TODO markers in code",
  "grep TODO comments"
];

for (const prompt of prompts) {
  // Run and capture results
}
```

## Privacy and Security

- Telemetry data is stored locally only
- No data is sent to external services
- Sensitive information in prompts is captured, so secure your telemetry logs
- Delete telemetry data with: `rm -rf ~/.qwen/tmp/*`

## Troubleshooting

### No Data Captured

1. Ensure telemetry is enabled in settings
2. Check collector is running: `ps aux | grep otelcol`
3. Verify OTLP endpoint matches settings

### Parser Errors

The analysis script handles:
- OTEL collector debug format
- Direct JSON logs
- Multiple log formats

If you see parsing errors, check the collector.log format.

## Best Practices

1. **Consistent Testing**: Test prompts at similar times to avoid variance
2. **Multiple Runs**: Run each prompt multiple times for reliable metrics
3. **Context Matters**: Test prompts with different file contexts
4. **Document Findings**: Keep a log of what works best

## Next Steps

- Review the [Telemetry Technical Documentation](./telemetry.md)
- Explore [Multi-Agent System](./multi-agent-system.md) for parallel testing
- Check [Integration Tests](./integration-tests.md) for automated testing