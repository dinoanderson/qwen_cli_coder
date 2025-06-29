# Qwen Integration for Gemini CLI

This document describes how to use Qwen AI models with the Gemini CLI.

## Overview

The Gemini CLI now supports Qwen AI models from Alibaba Cloud through the DashScope API. This integration allows you to use Qwen's advanced language models as an alternative to Google's Gemini models.

## Setup

### 1. Get a Qwen/DashScope API Key

1. Visit [DashScope Console](https://dashscope.console.aliyun.com/)
2. Create an account or sign in
3. Generate an API key

### 2. Configure Environment Variables

Create a `.env` file in the root directory (or update your existing one):

```bash
# Qwen/DashScope Configuration
QWEN_API_KEY=your_qwen_api_key_here
# OR use DASHSCOPE_API_KEY if you prefer:
# DASHSCOPE_API_KEY=your_dashscope_api_key_here

# Optional: For users in certain regions, you may need the international endpoint
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1

# Optional: Enable thinking mode (default: false)
QWEN_ENABLE_THINKING=true
```

### 3. Select Qwen Authentication

When you start the Gemini CLI, you'll see an auth method selection dialog:

```
Select Auth Method
○ Login with Google
○ Gemini API Key
○ Vertex AI
● Qwen/DashScope API Key

(Use Enter to select)
```

Select "Qwen/DashScope API Key" and press Enter.

## Available Models

The following Qwen models are supported:

- **qwen-plus-2025-04-28** (Default) - Latest Qwen Plus model with enhanced capabilities
  - Context window: 131,072 tokens
  - Max output: 8,192 tokens

- **qwen-plus** - Latest rolling version of Qwen Plus
  - Context window: 131,072 tokens
  - Max output: 8,192 tokens

- **qwen-max** - Most capable Qwen model for complex tasks
  - Context window: 32,768 tokens
  - Max output: 8,192 tokens

- **qwen-turbo** - Fast and efficient Qwen model
  - Context window: 8,192 tokens
  - Max output: 1,500 tokens

- **qwen-vl-plus** - Multimodal model for vision and language tasks
  - Context window: 32,768 tokens
  - Max output: 8,192 tokens

## Features

### Thinking Mode

Qwen models support a special "thinking mode" that shows the model's reasoning process. Enable it by setting:

```bash
QWEN_ENABLE_THINKING=true
```

### Tool Usage

Qwen models support function calling and tool usage, similar to Gemini models. All existing tools in the Gemini CLI will work with Qwen models.

### Streaming Responses

Qwen models support streaming responses for real-time output generation.

## Usage Examples

Once configured, you can use the Gemini CLI with Qwen models just like with Gemini:

```bash
# Start interactive mode
gemini

# Non-interactive mode
gemini "Write a hello world program in Python"

# Use a specific Qwen model
gemini --model qwen-max "Explain quantum computing"
```

## Troubleshooting

### API Key Not Found

If you see an error about missing API key:
1. Make sure your `.env` file contains either `QWEN_API_KEY` or `DASHSCOPE_API_KEY`
2. Ensure the `.env` file is in the correct directory
3. Try restarting the CLI

### Region-Specific Issues

If you're experiencing connection issues:
1. Try using the international endpoint by setting:
   ```bash
   QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1
   ```

### Model Not Available

Some models may require special access. Check the DashScope console for model availability in your account.

## Testing the Integration

Run the included test script to verify your setup:

```bash
node test-qwen-integration.js
```

This will test:
- Configuration creation
- Content generation
- Streaming responses
- Token counting

## Differences from Gemini

While the integration aims to be seamless, there are some differences:

1. **Token Counting**: Qwen uses estimation for token counting as it doesn't have a dedicated endpoint
2. **Model Names**: Qwen models use different naming conventions (e.g., qwen-plus vs gemini-pro)
3. **Features**: Some Gemini-specific features may not be available with Qwen models

## Support

For issues specific to Qwen models, consult:
- [DashScope Documentation](https://help.aliyun.com/zh/dashscope/)
- [Qwen GitHub Repository](https://github.com/QwenLM)

For Gemini CLI issues, use the standard support channels.