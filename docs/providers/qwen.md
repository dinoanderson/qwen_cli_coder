# Qwen Provider Documentation

## Overview

The Qwen provider enables integration with Alibaba Cloud's Qwen AI models through the DashScope API. This provider offers an alternative to Google's Gemini models with comparable capabilities and features.

## Features

- **Multiple Model Options**: Access to various Qwen models optimized for different use cases
- **Streaming Support**: Real-time response generation
- **Function Calling**: Full support for tools and function calling
- **Thinking Mode**: Optional feature to display the model's reasoning process
- **International Endpoint**: Automatic configuration for global accessibility
- **Multimodal Support**: Vision-language capabilities with qwen-vl-plus model

## Setup

### 1. Authentication

Qwen uses API key authentication through DashScope. To get started:

1. Visit [DashScope Console](https://dashscope.console.aliyun.com/)
2. Create an account or sign in
3. Generate an API key
4. Set the environment variable:
   ```bash
   export QWEN_API_KEY="your_api_key_here"
   # OR
   export DASHSCOPE_API_KEY="your_api_key_here"
   ```

### 2. Select Qwen Provider

When starting Gemini CLI, select "Qwen/DashScope API Key" from the authentication options.

## Available Models

| Model | Context Window | Max Output | Description |
|-------|----------------|------------|-------------|
| `qwen-plus-2025-04-28` | 131,072 tokens | 8,192 tokens | Latest stable Qwen Plus model (default) |
| `qwen-plus` | 131,072 tokens | 8,192 tokens | Rolling latest version of Qwen Plus |
| `qwen-max` | 32,768 tokens | 8,192 tokens | Most capable model for complex tasks |
| `qwen-turbo` | 8,192 tokens | 1,500 tokens | Fast and efficient model |
| `qwen-vl-plus` | 32,768 tokens | 8,192 tokens | Multimodal model for vision and language |

## Configuration Options

### Environment Variables

- **`QWEN_API_KEY`** / **`DASHSCOPE_API_KEY`**: Your DashScope API key (required)
- **`QWEN_BASE_URL`**: Override the API endpoint (default: `https://dashscope-intl.aliyuncs.com/api/v1`)
- **`QWEN_ENABLE_THINKING`**: Enable thinking mode to show reasoning process (default: `false`)

### Example `.env` file

```bash
# Qwen Configuration
QWEN_API_KEY=sk-your-api-key-here
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1
QWEN_ENABLE_THINKING=true
```

## Usage Examples

### Basic Usage

```bash
# Start interactive mode with Qwen
gemini

# Use a specific Qwen model
gemini --model qwen-max "Explain quantum computing"

# Enable thinking mode for a session
QWEN_ENABLE_THINKING=true gemini
```

### Non-Interactive Mode

```bash
# Quick question
gemini "Write a Python hello world program"

# Use with piping
echo "Explain this code" | gemini

# Process files
gemini "Analyze this file" < script.py
```

## Technical Details

### API Endpoints

The Qwen provider uses DashScope's text generation API:
- **Generation**: `/services/aigc/text-generation/generation`
- **Embeddings**: `/services/embeddings/text-embedding/text-embedding`

### Request/Response Mapping

The provider automatically handles conversion between Gemini's format and Qwen's API format:

1. **Message Roles**: 
   - Gemini's `model` → Qwen's `assistant`
   - Supports `system`, `user`, `assistant`, and `function` roles

2. **Streaming**: 
   - Converts DashScope's SSE format to Gemini's streaming response format
   - Supports incremental output with proper delta handling

3. **Function Calling**:
   - Maps Gemini's tool declarations to Qwen's function format
   - Handles function call responses transparently

### Token Counting

Since Qwen doesn't provide a dedicated token counting endpoint, the provider estimates token count using a character-based approximation (1 token ≈ 4 characters).

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   Error: QWEN_API_KEY or DASHSCOPE_API_KEY environment variable not found
   ```
   **Solution**: Ensure your API key is set in the environment or `.env` file.

2. **Connection Issues**
   ```
   Error: Failed to connect to DashScope API
   ```
   **Solution**: Check your internet connection and verify the base URL is correct for your region.

3. **Model Not Available**
   ```
   Error: Model 'qwen-xxx' is not available
   ```
   **Solution**: Verify the model name and check if your account has access to the requested model.

### Regional Considerations

For users in mainland China, you may need to use the domestic endpoint:
```bash
export QWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1
```

## Differences from Gemini

While the integration aims to be seamless, there are some differences:

1. **Model Names**: Different naming conventions (e.g., `qwen-plus` vs `gemini-pro`)
2. **Token Limits**: Qwen models may have different context windows
3. **Features**: Some Gemini-specific features may not have direct equivalents
4. **Response Format**: Minor differences in thinking mode output format

## Advanced Features

### Thinking Mode

When enabled, Qwen models can show their reasoning process:

```bash
QWEN_ENABLE_THINKING=true gemini "Solve this logic puzzle..."
```

The thinking process appears in a special format before the final answer.

### Multimodal Capabilities

The `qwen-vl-plus` model supports vision tasks:

```bash
gemini --model qwen-vl-plus "Describe this image" < image.png
```

## Performance Considerations

- **Latency**: International endpoint may have higher latency for some regions
- **Rate Limits**: Check DashScope documentation for current rate limits
- **Cost**: Different models have different pricing tiers

## Support and Resources

- [DashScope Documentation](https://help.aliyun.com/zh/dashscope/)
- [Qwen GitHub Repository](https://github.com/QwenLM)
- [API Reference](https://help.aliyun.com/zh/dashscope/developer-reference/)

For issues specific to the Gemini CLI integration, please report them to the Gemini CLI repository.