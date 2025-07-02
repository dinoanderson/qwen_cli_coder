/**
 * @license
 * Copyright 2025 Qwen Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GenerateContentParameters,
  GenerateContentResponse,
  Content,
  Part,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  UsageMetadata,
  FunctionCall,
  FunctionResponse,
  FinishReason,
  Tool,
  ContentUnion,
} from '@google/genai';
import {
  QwenGenerateRequest,
  QwenGenerateResponse,
  QwenMessage,
  QwenTokenCountRequest,
  QwenTokenCountResponse,
  QwenEmbedRequest,
  QwenEmbedResponse,
  QwenStreamResponse,
} from './qwenTypes.js';

/**
 * Convert Gemini content to Qwen messages
 */
export function toQwenMessages(contents: Content[]): QwenMessage[] {
  const messages: QwenMessage[] = [];
  
  for (const content of contents) {
    const role = content.role === 'model' ? 'assistant' : content.role as 'user' | 'system';
    
    if (!content.parts) {
      continue;
    }
    
    for (const part of content.parts) {
      if ('text' in part && part.text !== undefined) {
        messages.push({
          role,
          content: part.text,
        });
      } else if ('functionCall' in part && part.functionCall !== undefined) {
        messages.push({
          role: 'assistant',
          content: '',
          function_call: {
            name: part.functionCall.name || '',
            arguments: JSON.stringify(part.functionCall.args || {}),
          },
        });
      } else if ('functionResponse' in part && part.functionResponse !== undefined) {
        messages.push({
          role: 'function',
          content: JSON.stringify(part.functionResponse.response || {}),
        });
      }
    }
  }
  
  return messages;
}

/**
 * Convert Gemini GenerateContentParameters to Qwen request
 */
export function toQwenGenerateRequest(
  params: GenerateContentParameters,
  enableThinking: boolean = false,
): QwenGenerateRequest {
  
  const messages = toQwenMessages(params.contents as Content[]);
  
  // Add system instruction as first message if provided
  if (params.config?.systemInstruction) {
    let systemContent: string;
    if (typeof params.config.systemInstruction === 'string') {
      systemContent = params.config.systemInstruction;
    } else {
      // Handle Content object - extract text from parts
      const content = params.config.systemInstruction as Content;
      systemContent = content.parts?.map(part => 
        'text' in part ? part.text : ''
      ).join('') || '';
    }
    
    const systemMessage: QwenMessage = {
      role: 'system',
      content: systemContent,
    };
    messages.unshift(systemMessage);
  }
  
  const request: QwenGenerateRequest = {
    model: params.model,
    messages,
    stream: false,
    extra_body: {
      enable_thinking: enableThinking,
    },
  };
  
  if (params.config?.temperature !== undefined) {
    request.temperature = params.config.temperature;
  }
  
  if (params.config?.topP !== undefined) {
    request.top_p = params.config.topP;
  }
  
  if (params.config?.maxOutputTokens !== undefined) {
    request.max_tokens = params.config.maxOutputTokens;
  }
  
  // Convert tools to functions
  if (params.config?.tools && params.config.tools.length > 0) {
    request.functions = params.config.tools.flatMap((tool: any) => 
      tool.functionDeclarations?.map((func: any) => ({
        name: func.name,
        description: func.description || '',
        parameters: func.parameters || {},
      })) || []
    );
  }
  
  return request;
}

/**
 * Convert Qwen response to Gemini GenerateContentResponse
 */
export function fromQwenGenerateResponse(
  qwenResponse: QwenGenerateResponse,
): GenerateContentResponse {
  const candidates = qwenResponse.choices.map(choice => {
    const parts: Part[] = [];
    
    if (choice.message.content) {
      parts.push({ text: choice.message.content });
    }
    
    if (choice.message.function_call) {
      parts.push({
        functionCall: {
          name: choice.message.function_call.name,
          args: JSON.parse(choice.message.function_call.arguments),
        },
      });
    }
    
    return {
      content: {
        role: choice.message.role === 'assistant' ? 'model' : 'user',
        parts,
      },
      finishReason: (choice.finish_reason as FinishReason) || undefined,
      index: choice.index,
    };
  });
  
  const usageMetadata: UsageMetadata | undefined = qwenResponse.usage ? {
    promptTokenCount: qwenResponse.usage.prompt_tokens,
    candidatesTokenCount: qwenResponse.usage.completion_tokens,
    totalTokenCount: qwenResponse.usage.total_tokens,
    // Qwen doesn't provide these fields, so default to 0
    cachedContentTokenCount: 0,
    toolUsePromptTokenCount: 0,
    thoughtsTokenCount: 0,
  } as UsageMetadata : undefined;
  
  return {
    candidates,
    usageMetadata,
  } as GenerateContentResponse;
}

/**
 * Convert Qwen streaming response to Gemini GenerateContentResponse
 */
export function fromQwenStreamResponse(
  qwenResponse: QwenStreamResponse,
): GenerateContentResponse {
  
  const candidates = qwenResponse.choices.map(choice => {
    const parts: Part[] = [];
    
    // Handle reasoning content as thought parts
    if (choice.delta.reasoning_content) {
      // Format reasoning content with bold subject pattern expected by Turn.ts
      const formattedThought = `**Thinking** ${choice.delta.reasoning_content}`;
      parts.push({ 
        text: formattedThought,
        thought: true 
      });
    }
    
    if (choice.delta.content) {
      parts.push({ text: choice.delta.content });
    }
    
    if (choice.delta.function_call) {
      const functionCall: FunctionCall = {
        name: choice.delta.function_call.name || '',
        args: {},
      };
      
      if (choice.delta.function_call.arguments) {
        try {
          functionCall.args = JSON.parse(choice.delta.function_call.arguments);
        } catch {
          // If parsing fails, keep empty args
        }
      }
      
      parts.push({ functionCall });
    }
    
    return {
      content: {
        role: choice.delta.role === 'assistant' ? 'model' : 'user',
        parts,
      },
      finishReason: (choice.finish_reason as FinishReason) || undefined,
      index: choice.index,
    };
  });
  
  // Extract function calls to top level for Turn class processing
  const functionCalls: FunctionCall[] = [];
  for (const choice of qwenResponse.choices) {
    if (choice.delta.function_call) {
      const functionCall: FunctionCall = {
        name: choice.delta.function_call.name || '',
        args: {},
      };
      
      if (choice.delta.function_call.arguments) {
        try {
          functionCall.args = JSON.parse(choice.delta.function_call.arguments);
        } catch (e) {
          // If parsing fails, keep empty args
        }
      }
      
      functionCalls.push(functionCall);
    }
  }
  
  // Add usage metadata if present in streaming response
  const usageMetadata: UsageMetadata | undefined = qwenResponse.usage ? {
    promptTokenCount: qwenResponse.usage.prompt_tokens,
    candidatesTokenCount: qwenResponse.usage.completion_tokens,
    totalTokenCount: qwenResponse.usage.total_tokens,
    // Qwen doesn't provide these fields, so default to 0
    cachedContentTokenCount: 0,
    toolUsePromptTokenCount: 0,
    thoughtsTokenCount: 0,
  } as UsageMetadata : undefined;

  return {
    candidates,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    usageMetadata,
  } as GenerateContentResponse;
}

/**
 * Convert CountTokensParameters to Qwen token count request
 */
export function toQwenTokenCountRequest(
  params: CountTokensParameters,
): QwenTokenCountRequest {
  return {
    model: params.model,
    messages: toQwenMessages(params.contents as Content[]),
  };
}

/**
 * Convert Qwen token count response to CountTokensResponse
 */
export function fromQwenTokenCountResponse(
  qwenResponse: QwenTokenCountResponse,
): CountTokensResponse {
  return {
    totalTokens: qwenResponse.usage.total_tokens,
  };
}

/**
 * Convert EmbedContentParameters to Qwen embed request
 */
export function toQwenEmbedRequest(
  params: EmbedContentParameters,
): QwenEmbedRequest {
  // Extract text from content
  const texts: string[] = [];
  
  if ('content' in params && params.content && typeof params.content === 'object' && 'parts' in params.content && Array.isArray(params.content.parts)) {
    for (const part of params.content.parts) {
      if ('text' in part && part.text) {
        texts.push(part.text);
      }
    }
  }
  
  return {
    model: params.model,
    input: texts.length === 1 ? texts[0] : texts,
  };
}

/**
 * Convert Qwen embed response to EmbedContentResponse
 */
export function fromQwenEmbedResponse(
  qwenResponse: QwenEmbedResponse,
): EmbedContentResponse {
  // Return the first embedding if available
  const embedding = qwenResponse.data[0]?.embedding || [];
  
  return {
    embeddings: [{
      values: embedding,
    }],
  };
}