# Telemetry Conversation Logs

The conversation logs script provides a human-readable view of all interactions captured by the telemetry system. This makes it easy to review conversations, debug issues, and analyze usage patterns.

## Quick Start

```bash
# View all conversations
npm run logs

# View last 5 conversations
npm run logs -- -l 5

# Follow logs in real-time
npm run logs:tail

# Export to markdown
npm run logs:export
```

## Features

### 1. Console Display
Beautiful terminal output with:
- Color-coded messages (user prompts in green, responses in blue)
- Timestamps for each interaction
- Response times and durations
- Tool execution details
- Session information

### 2. Multiple Output Formats
- **Console**: Colored terminal output (default)
- **Markdown**: Export for documentation or sharing
- **JSON**: Structured data for programmatic analysis

### 3. Filtering Options
- **By Session**: View specific session ID
- **By Count**: Show last N sessions
- **By Search**: Find conversations containing specific text
- **Real-time**: Follow new conversations as they happen

## Usage Examples

### Basic Viewing
```bash
# View all conversations in your terminal
node scripts/conversation-logs.js

# Or use the npm script
npm run logs
```

### Export to Markdown
```bash
# Export last 10 sessions to markdown
node scripts/conversation-logs.js -l 10 -o markdown > conversations.md

# Export all conversations
npm run logs:export
```

### Search Conversations
```bash
# Find all conversations mentioning "function"
node scripts/conversation-logs.js --search "function"

# Search in specific format
node scripts/conversation-logs.js --search "error" -f detailed
```

### Real-time Monitoring
```bash
# Watch for new conversations
node scripts/conversation-logs.js --tail

# Or use the npm script
npm run logs:tail
```

### View Specific Session
```bash
# View a specific session by ID
node scripts/conversation-logs.js -s "9e8e480d-2410-4315-8337-65196d1ef5cb"
```

## Output Format Examples

### Console Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session: 9e8e480d-2410-4315-8337-65196d1ef5cb
Started: 2:26:27 PM 7/3/2025
Duration: 7s
────────────────────────────────────────────────────────────────────────────────

👤 User [2:26:27 PM 7/3/2025]:
Hello, please respond with a simple greeting

🤖 Qwen (qwen3-235b-a22b) [3.5s]:
Hello! How can I assist you today?
```

### Markdown Output
```markdown
## Session: 9e8e480d-2410-4315-8337-65196d1ef5cb

- **Started:** 2:26:27 PM 7/3/2025
- **Duration:** 7s

### 👤 User [2:26:27 PM 7/3/2025]

Hello, please respond with a simple greeting

### 🤖 Qwen (qwen3-235b-a22b) [3.5s]

Hello! How can I assist you today?
```

### JSON Output
```json
[
  {
    "sessionId": "9e8e480d-2410-4315-8337-65196d1ef5cb",
    "startTime": "2025-07-03T14:26:27.154Z",
    "endTime": "2025-07-03T14:26:33.860Z",
    "duration": 6706,
    "messages": [
      {
        "type": "prompt",
        "timestamp": "2025-07-03T14:26:27.154Z",
        "text": "Hello, please respond with a simple greeting",
        "length": 44
      },
      {
        "type": "response",
        "timestamp": "2025-07-03T14:26:33.860Z",
        "text": "Hello! How can I assist you today?",
        "model": "qwen3-235b-a22b",
        "duration": 3510
      }
    ]
  }
]
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output format: console, markdown, json | console |
| `--session` | `-s` | Show specific session ID | all |
| `--tail` | `-t` | Follow log file in real-time | false |
| `--last` | `-l` | Show last N sessions | all |
| `--format` | `-f` | Display format: detailed, compact | detailed |
| `--search` | | Search for term in conversations | none |
| `--help` | `-h` | Show help | |

## Understanding the Data

### Message Types

1. **Prompts** (👤)
   - User input with timestamp
   - Shows exact text sent to the AI

2. **Responses** (🤖)
   - AI responses with model name
   - Response time in seconds or milliseconds
   - Full response text

3. **Tool Calls** (🔧)
   - Tool name and execution time
   - Success/failure status
   - Arguments (in detailed format)

### Session Information
- **Session ID**: Unique identifier for each conversation
- **Duration**: Total time from first prompt to last response
- **Start Time**: When the conversation began

## Integration with Analysis Tools

The conversation logs work alongside other telemetry tools:

1. **Use with analyze-prompts.js**: 
   ```bash
   # First analyze patterns
   npm run telemetry:analyze
   
   # Then view specific conversations
   npm run logs -- --search "pattern"
   ```

2. **Export for External Analysis**:
   ```bash
   # Export to JSON for data science tools
   node scripts/conversation-logs.js -o json > conversations.json
   ```

3. **Combine with grep/filtering**:
   ```bash
   # Find all failed tool calls
   npm run logs | grep "❌ Failed"
   ```

## Tips

1. **Performance**: For large log files, use `-l` to limit output
2. **Real-time Debugging**: Use `--tail` while testing to see live interactions
3. **Documentation**: Export to markdown for sharing or documentation
4. **Analysis**: Use JSON output for programmatic analysis

## Troubleshooting

### No Conversations Found
- Ensure telemetry is enabled in settings
- Check that the collector is running: `npm run telemetry`
- Verify you've run some commands with Qwen CLI

### Missing Data
- Response text might be empty if telemetry was partially configured
- Tool arguments might be hidden in compact format (use `-f detailed`)

### Performance Issues
- Large log files can be slow to parse
- Use `--last` to limit the number of sessions
- Consider archiving old telemetry data