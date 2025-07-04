# Testing Qwen API Logging

## How to Enable Logging

Set the following environment variable before running the CLI:

```bash
export QWEN_API_LOG=true
```

Optional: Control where logs appear:
- `QWEN_API_LOG_CONSOLE=true` (default) - Show logs in terminal
- `QWEN_API_LOG_FILE=true` (default) - Save logs to ~/.qwen/logs/qwen-api.log

## Testing the Logger

1. Build the project:
```bash
npm run build
```

2. Run with logging enabled:
```bash
QWEN_API_LOG=true node bundle/qwen.js -p "你好"
```

This will show:
- 📤 Request logs with full message content
- 📥 Response logs with API responses
- ❌ Error logs if any errors occur

## Log File Location

Logs are saved to: `~/.qwen/logs/qwen-api.log`

To view the log file:
```bash
tail -f ~/.qwen/logs/qwen-api.log
```

## What You'll See

The logs will show:
1. The system prompt being sent (Chinese or English based on language setting)
2. User messages
3. Model responses
4. Token usage statistics
5. Any API errors

This helps debug:
- Whether the Chinese system prompt is being used
- What exact messages are sent to Qwen
- How Qwen responds to the prompts