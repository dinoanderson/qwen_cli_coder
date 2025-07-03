/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config } from '../config/config.js';
import {
  BaseTool,
  ToolResult,
  ToolCallConfirmationDetails,
  ToolExecuteConfirmationDetails,
  ToolConfirmationOutcome,
} from './tools.js';
import { SchemaValidator } from '../utils/schemaValidator.js';
import { getErrorMessage } from '../utils/errors.js';
import { spawn } from 'child_process';
import stripAnsi from 'strip-ansi';

export interface SubAgentToolParams {
  task: string;
  context?: string;
  timeout?: number;
  priority?: 'low' | 'medium' | 'high';
  working_directory?: string;
}

const DEFAULT_TIMEOUT_MS = 60000; // 1 minute
const OUTPUT_UPDATE_INTERVAL_MS = 1000;

export class SubAgentTool extends BaseTool<SubAgentToolParams, ToolResult> {
  static Name: string = 'spawn_sub_agent';
  private whitelist: Set<string> = new Set();

  constructor(private readonly config: Config) {
    const toolDisplayName = 'Sub-Agent';

    const toolDescription = `Spawn a sub-agent to handle a specific task in parallel.

This tool creates a new Qwen CLI instance running in non-interactive mode to complete a delegated task.
The sub-agent runs independently and can use all available tools to complete its assigned task.

**When to Use (Single Task):**
- Single, well-defined task that needs isolation
- Task that requires its own context or working directory
- When you need just one agent, not multiple

**For Multiple Tasks:**
- Use delegate_task instead - it's optimized for multiple parallel operations
- delegate_task provides better coordination and result aggregation

Use this tool when you want to:
- Delegate a single independent task
- Run an isolated operation with specific context
- Execute a task in a different working directory

The sub-agent will have access to:
- All available tools (file operations, shell commands, web search, etc.)
- The current working directory and project context
- Any additional context you provide

Results from the sub-agent will be streamed back in real-time.

Important considerations:
- Sub-agents run independently and cannot directly communicate with each other
- Each sub-agent has its own isolated execution environment
- Tasks should be well-defined and self-contained
- Consider timeout limits for long-running tasks
- For multiple tasks, prefer delegate_task for better efficiency`;

    const toolParameterSchema: Record<string, unknown> = {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task description/prompt for the sub-agent to execute. Should be clear and specific.',
        },
        context: {
          type: 'string',
          description: 'Optional additional context to provide to the sub-agent (file paths, background info, etc.)',
        },
        timeout: {
          type: 'number',
          description: 'Maximum execution time in seconds (default: 60)',
          minimum: 5,
          maximum: 300,
        },
        priority: {
          type: 'string',
          description: 'Task priority for scheduling when multiple sub-agents are running',
          enum: ['low', 'medium', 'high'],
        },
        working_directory: {
          type: 'string',
          description: 'Working directory for the sub-agent (relative to project root)',
        },
      },
      required: ['task'],
    };

    super(
      SubAgentTool.Name,
      toolDisplayName,
      toolDescription,
      toolParameterSchema,
      true, // output is markdown
      true, // output can be updated
    );
  }

  getDescription(params: SubAgentToolParams): string {
    let description = `Sub-agent task: ${params.task.substring(0, 100)}${params.task.length > 100 ? '...' : ''}`;
    
    if (params.working_directory) {
      description += ` [in ${params.working_directory}]`;
    }
    
    if (params.priority) {
      description += ` (priority: ${params.priority})`;
    }
    
    if (params.timeout) {
      description += ` (timeout: ${params.timeout}s)`;
    }
    
    return description;
  }

  validateToolParams(params: SubAgentToolParams): string | null {
    if (
      !SchemaValidator.validate(
        this.parameterSchema as Record<string, unknown>,
        params,
      )
    ) {
      return `Parameters failed schema validation.`;
    }

    if (!params.task.trim()) {
      return 'Task description cannot be empty.';
    }

    if (params.task.length < 10) {
      return 'Task description must be at least 10 characters long.';
    }

    if (params.timeout && (params.timeout < 5 || params.timeout > 300)) {
      return 'Timeout must be between 5 and 300 seconds.';
    }

    if (params.working_directory) {
      if (path.isAbsolute(params.working_directory)) {
        return 'Working directory cannot be absolute. Must be relative to the project root directory.';
      }
      const directory = path.resolve(
        this.config.getTargetDir(),
        params.working_directory,
      );
      if (!fs.existsSync(directory)) {
        return 'Working directory must exist.';
      }
    }

    return null;
  }

  async shouldConfirmExecute(
    params: SubAgentToolParams,
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false> {
    if (this.validateToolParams(params)) {
      return false; // skip confirmation, execute call will fail immediately
    }

    // Check if sub-agents are whitelisted
    if (this.whitelist.has('sub_agent')) {
      return false; // already approved
    }

    const confirmationDetails: ToolExecuteConfirmationDetails = {
      type: 'exec',
      title: 'Confirm Sub-Agent Spawn',
      command: `Spawn sub-agent: ${params.task.substring(0, 50)}${params.task.length > 50 ? '...' : ''}`,
      rootCommand: 'sub_agent',
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          this.whitelist.add('sub_agent');
        }
      },
    };
    return confirmationDetails;
  }

  private async findQwenExecutable(): Promise<string> {
    // Try to find the qwen executable
    const possiblePaths = [
      path.join(this.config.getTargetDir(), 'bundle', 'qwen.js'),
      path.join(this.config.getTargetDir(), 'packages', 'cli', 'dist', 'index.js'),
      path.join(process.cwd(), 'bundle', 'qwen.js'),
      path.join(process.cwd(), 'packages', 'cli', 'dist', 'index.js'),
    ];

    for (const execPath of possiblePaths) {
      if (fs.existsSync(execPath)) {
        return execPath;
      }
    }

    // Fall back to global qwen command if available
    return 'qwen';
  }

  private buildPrompt(params: SubAgentToolParams): string {
    let prompt = params.task;
    
    if (params.context) {
      prompt = `Context: ${params.context}\n\nTask: ${prompt}`;
    }
    
    // Add working directory info if specified
    if (params.working_directory) {
      prompt += `\n\nNote: Execute this task in the directory: ${params.working_directory}`;
    }
    
    return prompt;
  }

  async execute(
    params: SubAgentToolParams,
    abortSignal: AbortSignal,
    updateOutput?: (chunk: string) => void,
  ): Promise<ToolResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      return {
        llmContent: [
          `Sub-agent task rejected: ${params.task}`,
          `Reason: ${validationError}`,
        ].join('\n'),
        returnDisplay: `Error: ${validationError}`,
      };
    }

    if (abortSignal.aborted) {
      return {
        llmContent: 'Sub-agent task was cancelled by user before it could start.',
        returnDisplay: 'Sub-agent task cancelled by user.',
      };
    }

    const qwenExecutable = await this.findQwenExecutable();
    const prompt = this.buildPrompt(params);
    const timeout = (params.timeout || 60) * 1000; // Convert to milliseconds
    const workingDir = params.working_directory 
      ? path.resolve(this.config.getTargetDir(), params.working_directory)
      : this.config.getTargetDir();

    // Prepare environment variables (copy current env and ensure auth is available)
    const env = { ...process.env };
    
    // Build command arguments
    const args = qwenExecutable === 'qwen' 
      ? ['-p', prompt] 
      : ['node', qwenExecutable, '-p', prompt];

    const command = args[0];
    const commandArgs = args.slice(1);

    let output = '';
    let errorOutput = '';
    let hasStarted = false;
    let lastUpdateTime = 0;

    return new Promise<ToolResult>((resolve) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!hasStarted) {
          resolve({
            llmContent: `Sub-agent task timed out after ${params.timeout || 60} seconds without starting.`,
            returnDisplay: 'Sub-agent task timed out before starting.',
          });
        } else {
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 5000); // Force kill after 5s
        }
      }, timeout);

      // Spawn the sub-agent process
      const child = spawn(command, commandArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: workingDir,
        env,
        detached: false,
      });

      // Handle process startup
      child.on('spawn', () => {
        hasStarted = true;
        if (updateOutput) {
          updateOutput(`🤖 Sub-agent started: ${params.task.substring(0, 60)}${params.task.length > 60 ? '...' : ''}\n\n`);
        }
      });

      // Handle stdout
      child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        output += chunk;
        
        // Update output at intervals to avoid overwhelming the UI
        const now = Date.now();
        if (updateOutput && (now - lastUpdateTime) > OUTPUT_UPDATE_INTERVAL_MS) {
          lastUpdateTime = now;
          updateOutput(stripAnsi(chunk));
        }
      });

      // Handle stderr
      child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        errorOutput += chunk;
        
        // Update output for errors immediately
        if (updateOutput) {
          updateOutput(`⚠️ ${stripAnsi(chunk)}`);
        }
      });

      // Handle process completion
      child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        clearTimeout(timeoutHandle);
        
        const cleanOutput = stripAnsi(output);
        const cleanErrorOutput = stripAnsi(errorOutput);
        
        if (abortSignal.aborted) {
          resolve({
            llmContent: 'Sub-agent task was cancelled by user.',
            returnDisplay: 'Sub-agent task cancelled.',
          });
          return;
        }

        if (code === 0) {
          // Success
          const successMessage = `✅ Sub-agent completed successfully\n\n**Task:** ${params.task}\n\n**Output:**\n${cleanOutput}`;
          resolve({
            llmContent: successMessage,
            returnDisplay: cleanOutput || 'Sub-agent completed successfully (no output)',
          });
        } else {
          // Error
          const errorMessage = signal 
            ? `❌ Sub-agent terminated by signal ${signal}`
            : `❌ Sub-agent failed with exit code ${code}`;
          
          const fullErrorOutput = [
            errorMessage,
            `**Task:** ${params.task}`,
            cleanOutput ? `**Output:** ${cleanOutput}` : '',
            cleanErrorOutput ? `**Error Output:** ${cleanErrorOutput}` : '',
          ].filter(Boolean).join('\n\n');

          resolve({
            llmContent: fullErrorOutput,
            returnDisplay: `Sub-agent failed: ${cleanErrorOutput || 'Unknown error'}`,
          });
        }
      });

      // Handle spawn errors
      child.on('error', (error: Error) => {
        clearTimeout(timeoutHandle);
        const errorMessage = `Failed to spawn sub-agent: ${getErrorMessage(error)}`;
        resolve({
          llmContent: errorMessage,
          returnDisplay: errorMessage,
        });
      });

      // Handle abort signal
      abortSignal.addEventListener('abort', () => {
        clearTimeout(timeoutHandle);
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 2000);
      });
    });
  }
}