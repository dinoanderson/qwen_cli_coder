/**
 * @license
 * Copyright 2025 Qwen Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ContentGenerator,
} from '../../core/contentGenerator.js';
import {
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
} from '@google/genai';
import {
  QwenConfig,
  QwenGenerateRequest,
  QwenGenerateResponse,
  QwenStreamResponse,
} from './qwenTypes.js';
import {
  toQwenGenerateRequest,
  fromQwenGenerateResponse,
  fromQwenStreamResponse,
  toQwenTokenCountRequest,
  fromQwenTokenCountResponse,
  toQwenEmbedRequest,
  fromQwenEmbedResponse,
} from './qwenMappers.js';

export class QwenContentGenerator implements ContentGenerator {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private enableThinking: boolean;
  private readonly headers: Record<string, string>;

  constructor(config: QwenConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://dashscope-intl.aliyuncs.com/api/v1';
    this.model = config.model;
    this.enableThinking = config.enableThinking || false;
    
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse> {
    const qwenRequest = toQwenGenerateRequest(request, this.enableThinking);
    qwenRequest.model = this.model;
    qwenRequest.stream = false;

    const requestBody = {
      ...qwenRequest,
      parameters: {
        temperature: qwenRequest.temperature,
        top_p: qwenRequest.top_p,
        max_tokens: qwenRequest.max_tokens,
        ...qwenRequest.extra_body,
        // Add result_format when thinking is enabled
        ...(this.enableThinking && { result_format: 'message' }),
        // Use tools if available (new format), fallback to functions (legacy)
        ...(qwenRequest.tools && qwenRequest.tools.length > 0 && {
          tools: qwenRequest.tools,
        }),
        ...(qwenRequest.functions && qwenRequest.functions.length > 0 && !qwenRequest.tools && {
          functions: qwenRequest.functions,
        }),
      },
      input: {
        messages: qwenRequest.messages,
      },
    };


    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(requestBody),
      signal: request.config?.abortSignal,
    });


    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Transform DashScope response to match OpenAI format
    const qwenResponse: QwenGenerateResponse = {
      id: data.request_id || 'qwen-' + Date.now(),
      object: 'chat.completion',
      created: Date.now() / 1000,
      model: this.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.output?.text || data.output?.choices?.[0]?.message?.content || '',
          function_call: data.output?.tool_calls?.[0] ? {
            name: data.output.tool_calls[0].function?.name || '',
            arguments: JSON.stringify(data.output.tool_calls[0].function?.arguments || {}),
          } : data.output?.choices?.[0]?.message?.function_call,
        },
        finish_reason: data.output?.finish_reason || 'stop',
      }],
      usage: data.usage ? {
        prompt_tokens: data.usage.input_tokens || 0,
        completion_tokens: data.usage.output_tokens || 0,
        total_tokens: data.usage.total_tokens || 0,
      } : undefined,
    };

    return fromQwenGenerateResponse(qwenResponse);
  }

  async generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this._generateContentStream(request);
  }

  private async *_generateContentStream(
    request: GenerateContentParameters,
  ): AsyncGenerator<GenerateContentResponse> {
    // Track accumulated function call data
    let accumulatedFunctionCall: { name?: string; arguments?: string } | null = null;
    const qwenRequest = toQwenGenerateRequest(request, this.enableThinking);
    qwenRequest.model = this.model;
    qwenRequest.stream = true;

    const streamRequestBody = {
      ...qwenRequest,
      parameters: {
        temperature: qwenRequest.temperature,
        top_p: qwenRequest.top_p,
        max_tokens: qwenRequest.max_tokens,
        incremental_output: true,
        ...qwenRequest.extra_body,
        // Add result_format when thinking is enabled
        ...(this.enableThinking && { result_format: 'message' }),
        // Use tools if available (new format), fallback to functions (legacy)
        ...(qwenRequest.tools && qwenRequest.tools.length > 0 && {
          tools: qwenRequest.tools,
        }),
        ...(qwenRequest.functions && qwenRequest.functions.length > 0 && !qwenRequest.tools && {
          functions: qwenRequest.functions,
        }),
      },
      input: {
        messages: qwenRequest.messages,
      },
    };


    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify(streamRequestBody),
      signal: request.config?.abortSignal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Handle DashScope SSE format: "data:{json}"
        if (line.startsWith('data:')) {
          const data = line.slice(5); // Remove "data:" prefix
          if (data === '[DONE]' || data.trim() === '') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            
            // Handle DashScope response structure
            if (parsed.output) {
              // Check for choices format (function calls) FIRST
              const choice = parsed.output.choices?.[0];
              // Qwen uses tool_calls array, not function_call
              if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
                const toolCall = choice.message.tool_calls[0]; // Process first tool call
                
                // Accumulate function call data across chunks
                if (!accumulatedFunctionCall) {
                  accumulatedFunctionCall = { name: '', arguments: '' };
                }
                
                // Only update name if it's not empty (DashScope sends empty name after first chunk)
                if (toolCall.function?.name && toolCall.function.name.trim() !== '') {
                  accumulatedFunctionCall.name = toolCall.function.name;
                }
                
                // Always accumulate arguments if present
                if (toolCall.function?.arguments) {
                  accumulatedFunctionCall.arguments = (accumulatedFunctionCall.arguments || '') + toolCall.function.arguments;
                }
                
                // Only yield when we have a complete function call (finish_reason = tool_calls)
                if (choice.finish_reason === 'tool_calls') {
                  
                  const streamResponse: QwenStreamResponse = {
                    id: parsed.request_id || 'qwen-stream-' + Date.now(),
                    object: 'chat.completion.chunk',
                    created: Date.now() / 1000,
                    model: this.model,
                    choices: [{
                      index: 0,
                      delta: {
                        role: 'assistant',
                        content: '',
                        function_call: {
                          name: accumulatedFunctionCall.name || '',
                          arguments: accumulatedFunctionCall.arguments || '{}',
                        },
                      },
                      finish_reason: 'function_call',
                    }],
                  };

                  yield fromQwenStreamResponse(streamResponse);
                  return;
                }
                
                // For non-final function call chunks, skip yielding empty content
                continue;
              }
              
              // Only process text content if no function call was processed
              let textContent = null;
              let reasoningContent = null;
              let finishReason = null;
              
              // Check for direct text output (simple streaming format without tools)
              if (parsed.output.text !== undefined) {
                textContent = parsed.output.text;
                finishReason = parsed.output.finish_reason;
              }
              // Check for choices format (when tools are present)
              else if (choice?.message?.content !== undefined) {
                textContent = choice.message.content;
                finishReason = choice.finish_reason;
              }
              
              // Check for reasoning content when thinking is enabled
              if (choice?.message?.reasoning_content !== undefined) {
                reasoningContent = choice.message.reasoning_content;
              }
              
              // If we have reasoning content, yield it first (before regular content)
              if (reasoningContent !== null) {
                const reasoningResponse: QwenStreamResponse = {
                  id: parsed.request_id || 'qwen-stream-' + Date.now(),
                  object: 'chat.completion.chunk',
                  created: Date.now() / 1000,
                  model: this.model,
                  choices: [{
                    index: 0,
                    delta: {
                      role: 'assistant',
                      content: '', // Empty content for reasoning chunks
                      reasoning_content: reasoningContent,
                    },
                    finish_reason: null, // Don't finish on reasoning chunks
                  }],
                };

                yield fromQwenStreamResponse(reasoningResponse);
              }
              
              // If we have text content, yield it
              if (textContent !== null) {
                const streamResponse: QwenStreamResponse = {
                  id: parsed.request_id || 'qwen-stream-' + Date.now(),
                  object: 'chat.completion.chunk',
                  created: Date.now() / 1000,
                  model: this.model,
                  choices: [{
                    index: 0,
                    delta: {
                      role: 'assistant',
                      content: textContent,
                    },
                    finish_reason: finishReason === 'null' ? null : finishReason,
                  }],
                  // Include usage data from final chunk when stream completes
                  usage: (finishReason && finishReason !== 'null' && parsed.usage) ? {
                    prompt_tokens: parsed.usage.input_tokens || 0,
                    completion_tokens: parsed.usage.output_tokens || 0,
                    total_tokens: parsed.usage.total_tokens || 0,
                  } : undefined,
                };

                yield fromQwenStreamResponse(streamResponse);
                
                // Check for completion
                if (finishReason && finishReason !== 'null') {
                  return;
                }
              }
            }
          } catch (e) {
          }
        }
      }
    }
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    // Qwen doesn't have a direct token counting endpoint
    // We'll estimate based on the request
    const qwenRequest = toQwenTokenCountRequest(request);
    
    // Rough estimation: 1 token ≈ 4 characters
    const textLength = qwenRequest.messages
      .map(msg => msg.content.length)
      .reduce((a, b) => a + b, 0);
    
    const estimatedTokens = Math.ceil(textLength / 4);
    
    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    const qwenRequest = toQwenEmbedRequest(request);
    
    // Use text-embedding model
    const embedModel = 'text-embedding-v3';
    
    const response = await fetch(`${this.baseUrl}/services/embeddings/text-embedding/text-embedding`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: embedModel,
        input: qwenRequest.input,
      }),
      signal: request.config?.abortSignal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen Embedding API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    const qwenEmbedResponse = {
      object: 'list',
      data: data.output?.embeddings?.map((embedding: any, index: number) => ({
        object: 'embedding',
        index,
        embedding: embedding.embedding,
      })) || [],
      model: embedModel,
      usage: data.usage || {},
    };

    return fromQwenEmbedResponse(qwenEmbedResponse);
  }

  /**
   * Set the thinking mode for this content generator.
   * This allows dynamic updates without recreating the generator.
   */
  setEnableThinking(enable: boolean): void {
    this.enableThinking = enable;
  }

  /**
   * Get the current thinking mode status.
   */
  getEnableThinking(): boolean {
    return this.enableThinking;
  }
}