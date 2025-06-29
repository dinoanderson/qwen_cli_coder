# Examples

This directory contains example files and configurations for the Qwen CLI.

## Files

- `qwen-api-test.js` - Example of using the Qwen API directly
- `gemini-api-test.js` - Example of using the Gemini API (for compatibility testing)

## Usage

These examples demonstrate how to:

- Make API calls to different providers
- Handle streaming responses
- Configure authentication
- Test different model capabilities

## Running Examples

```bash
# Test Qwen API integration
DASHSCOPE_API_KEY=your-key node examples/qwen-api-test.js

# Test Gemini API integration (if configured)
GEMINI_API_KEY=your-key node examples/gemini-api-test.js
```

## Configuration

Examples may require API keys to be configured in environment variables or `.env` files.