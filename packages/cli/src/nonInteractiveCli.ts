/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Config,
  ToolCallRequestInfo,
  executeToolCall,
  ToolRegistry,
  shutdownTelemetry,
  isTelemetrySdkInitialized,
  QwenEventType,
} from '@qwen/qwen-cli-core';
import {
  Content,
  Part,
  FunctionCall,
  GenerateContentResponse,
} from '@google/genai';

import { parseAndFormatApiError } from './ui/utils/errorParsing.js';

function getResponseText(response: GenerateContentResponse): string | null {
  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (
      candidate.content &&
      candidate.content.parts &&
      candidate.content.parts.length > 0
    ) {
      // We are running in headless mode so we don't need to return thoughts to STDOUT.
      const thoughtPart = candidate.content.parts[0];
      if (thoughtPart?.thought) {
        return null;
      }
      return candidate.content.parts
        .filter((part) => part.text)
        .map((part) => part.text)
        .join('');
    }
  }
  return null;
}

export async function runNonInteractive(
  config: Config,
  input: string,
): Promise<void> {
  if (config.getDebugMode()) {
    console.error('[DEBUG] Starting non-interactive mode with input:', input.substring(0, 50));
  }
  
  // Handle EPIPE errors when the output is piped to a command that closes early.
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') {
      // Exit gracefully if the pipe is closed.
      process.exit(0);
    }
  });

  const qwenClient = config.getQwenClient();
  const toolRegistry: ToolRegistry = await config.getToolRegistry();
  
  if (config.getDebugMode()) {
    console.error('[DEBUG] Got clients, starting message stream...');
  }
  
  const abortController = new AbortController();
  let currentMessages: Content[] = [{ role: 'user', parts: [{ text: input }] }];

  try {
    while (true) {
      const functionCalls: FunctionCall[] = [];

      if (config.getDebugMode()) {
        console.error('[DEBUG] Creating response stream...');
      }
      
      const responseStream = qwenClient.sendMessageStream(
        currentMessages[0]?.parts || [{ text: input }], // Ensure parts are always provided
        abortController.signal
      );
      
      if (config.getDebugMode()) {
        console.error('[DEBUG] Processing response stream...');
      }

      let eventCount = 0;
      for await (const event of responseStream) {
        eventCount++;
        if (config.getDebugMode()) {
          console.error(`[DEBUG] Event ${eventCount}: ${event.type}`);
        }
        
        if (abortController.signal.aborted) {
          console.error('Operation cancelled.');
          return;
        }
        
        if (event.type === QwenEventType.Content) {
          process.stdout.write(event.value);
        } else if (event.type === QwenEventType.ToolCallRequest) {
          const functionCall = event.value;
          if (functionCall) {
            functionCalls.push(functionCall);
          }
        } else if (event.type === QwenEventType.Error) {
          console.error('Error:', event.value);
          process.exit(1);
        }
      }
      
      if (config.getDebugMode()) {
        console.error(`[DEBUG] Stream completed with ${eventCount} events, ${functionCalls.length} function calls`);
      }

      if (functionCalls.length > 0) {
        const toolResponseParts: Part[] = [];

        for (const fc of functionCalls) {
          const callId = fc.id ?? `${fc.name}-${Date.now()}`;
          const requestInfo: ToolCallRequestInfo = {
            callId,
            name: fc.name as string,
            args: (fc.args ?? {}) as Record<string, unknown>,
            isClientInitiated: false,
          };

          const toolResponse = await executeToolCall(
            config,
            requestInfo,
            toolRegistry,
            abortController.signal,
          );

          if (toolResponse.error) {
            console.error(
              `Error executing tool ${fc.name}: ${toolResponse.resultDisplay || toolResponse.error.message}`,
            );
            process.exit(1);
          }

          if (toolResponse.responseParts) {
            const parts = Array.isArray(toolResponse.responseParts)
              ? toolResponse.responseParts
              : [toolResponse.responseParts];
            for (const part of parts) {
              if (typeof part === 'string') {
                toolResponseParts.push({ text: part });
              } else if (part) {
                toolResponseParts.push(part);
              }
            }
          }
        }
        currentMessages = [{ role: 'tool', parts: toolResponseParts }];
      } else {
        process.stdout.write('\n'); // Ensure a final newline
        break;
      }
    }
  } catch (error) {
    console.error(
      parseAndFormatApiError(
        error,
        config.getContentGeneratorConfig().authType,
      ),
    );
    process.exit(1);
  } finally {
    if (isTelemetrySdkInitialized()) {
      await shutdownTelemetry();
    }
  }
  
  // Force exit to prevent hanging due to open MCP connections
  process.exit(0);
}
