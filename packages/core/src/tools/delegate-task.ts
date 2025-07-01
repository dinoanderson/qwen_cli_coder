/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from '../config/config.js';
import {
  BaseTool,
  ToolResult,
  ToolCallConfirmationDetails,
  ToolExecuteConfirmationDetails,
  ToolConfirmationOutcome,
} from './tools.js';
import { SchemaValidator } from '../utils/schemaValidator.js';
import { ParallelExecutor, ParallelExecutorOptions } from './parallel-executor.js';
import { SubAgentToolParams } from './sub-agent.js';

export interface DelegateTaskParams {
  mainTask: string;
  subtasks: {
    task: string;
    context?: string;
    priority?: 'low' | 'medium' | 'high';
    timeout?: number;
    working_directory?: string;
  }[];
  executionMode?: 'parallel' | 'sequential';
  maxConcurrentAgents?: number;
  waitForCompletion?: boolean;
  aggregateResults?: boolean;
}

/**
 * DelegateTask tool enables intelligent task splitting and parallel execution.
 * It can break down complex tasks into smaller subtasks and execute them using multiple sub-agents.
 */
export class DelegateTaskTool extends BaseTool<DelegateTaskParams, ToolResult> {
  static Name: string = 'delegate_task';
  private whitelist: Set<string> = new Set();

  constructor(private readonly config: Config) {
    const toolDisplayName = 'Task Delegation';

    const toolDescription = `Delegate and manage complex tasks by splitting them into smaller subtasks that can be executed in parallel or sequentially by sub-agents.

This tool enables sophisticated task management and coordination:

**Use Cases:**
- Break down large, complex tasks into manageable chunks
- Execute multiple independent operations simultaneously
- Coordinate related tasks that can benefit from parallel execution
- Manage resource-intensive workflows efficiently

**Execution Modes:**
- **Parallel**: Execute all subtasks simultaneously (default, faster)
- **Sequential**: Execute subtasks one after another (safer for dependent tasks)

**Features:**
- Intelligent task prioritization and scheduling
- Real-time progress monitoring across all subtasks
- Automatic result aggregation and coordination
- Resource management and concurrency control
- Error handling and retry capabilities

**Best Practices:**
- Make subtasks independent when using parallel mode
- Use clear, specific task descriptions for better results
- Set appropriate timeouts for long-running operations
- Consider priority levels for critical vs. non-critical tasks
- Provide context when subtasks need background information

Each subtask will be executed by an independent Qwen agent with full access to all available tools.`;

    const toolParameterSchema: Record<string, unknown> = {
      type: 'object',
      properties: {
        mainTask: {
          type: 'string',
          description: 'Overall description of the main task being delegated',
        },
        subtasks: {
          type: 'array',
          description: 'Array of subtasks to execute',
          minItems: 1,
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: 'Specific task description for this subtask',
              },
              context: {
                type: 'string',
                description: 'Optional context specific to this subtask',
              },
              priority: {
                type: 'string',
                description: 'Task priority for execution scheduling',
                enum: ['low', 'medium', 'high'],
              },
              timeout: {
                type: 'number',
                description: 'Maximum execution time in seconds for this subtask',
                minimum: 5,
                maximum: 300,
              },
              working_directory: {
                type: 'string',
                description: 'Working directory for this subtask (relative to project root)',
              },
            },
            required: ['task'],
          },
        },
        executionMode: {
          type: 'string',
          description: 'How to execute subtasks: parallel (faster) or sequential (safer)',
          enum: ['parallel', 'sequential'],
          default: 'parallel',
        },
        maxConcurrentAgents: {
          type: 'number',
          description: 'Maximum number of agents to run simultaneously (parallel mode only)',
          minimum: 1,
          maximum: 5,
          default: 3,
        },
        waitForCompletion: {
          type: 'boolean',
          description: 'Whether to wait for all subtasks to complete before returning',
          default: true,
        },
        aggregateResults: {
          type: 'boolean',
          description: 'Whether to combine results from all subtasks into a summary',
          default: true,
        },
      },
      required: ['mainTask', 'subtasks'],
    };

    super(
      DelegateTaskTool.Name,
      toolDisplayName,
      toolDescription,
      toolParameterSchema,
      true, // output is markdown
      true, // output can be updated
    );
  }

  getDescription(params: DelegateTaskParams): string {
    const subtaskCount = params.subtasks.length;
    const mode = params.executionMode || 'parallel';
    let description = `Delegate "${params.mainTask}" into ${subtaskCount} subtasks (${mode} execution)`;
    
    if (params.maxConcurrentAgents && mode === 'parallel') {
      description += ` [max ${params.maxConcurrentAgents} concurrent]`;
    }
    
    return description;
  }

  validateToolParams(params: DelegateTaskParams): string | null {
    if (
      !SchemaValidator.validate(
        this.parameterSchema as Record<string, unknown>,
        params,
      )
    ) {
      return `Parameters failed schema validation.`;
    }

    if (!params.mainTask.trim()) {
      return 'Main task description cannot be empty.';
    }

    if (!params.subtasks || params.subtasks.length === 0) {
      return 'At least one subtask must be provided.';
    }

    if (params.subtasks.length > 10) {
      return 'Maximum of 10 subtasks allowed per delegation.';
    }

    for (let i = 0; i < params.subtasks.length; i++) {
      const subtask = params.subtasks[i];
      if (!subtask.task || !subtask.task.trim()) {
        return `Subtask ${i + 1} description cannot be empty.`;
      }
      if (subtask.task.length < 5) {
        return `Subtask ${i + 1} description must be at least 5 characters long.`;
      }
      if (subtask.timeout && (subtask.timeout < 5 || subtask.timeout > 300)) {
        return `Subtask ${i + 1} timeout must be between 5 and 300 seconds.`;
      }
    }

    if (params.maxConcurrentAgents && (params.maxConcurrentAgents < 1 || params.maxConcurrentAgents > 5)) {
      return 'Max concurrent agents must be between 1 and 5.';
    }

    return null;
  }

  async shouldConfirmExecute(
    params: DelegateTaskParams,
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false> {
    if (this.validateToolParams(params)) {
      return false;
    }

    if (this.whitelist.has('delegate_task')) {
      return false;
    }

    const subtaskCount = params.subtasks.length;
    const mode = params.executionMode || 'parallel';
    const maxConcurrent = params.maxConcurrentAgents || 3;
    
    const confirmationDetails: ToolExecuteConfirmationDetails = {
      type: 'exec',
      title: 'Confirm Task Delegation',
      command: `Delegate "${params.mainTask}" into ${subtaskCount} subtasks (${mode}, max ${maxConcurrent} concurrent)`,
      rootCommand: 'delegate_task',
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          this.whitelist.add('delegate_task');
        }
      },
    };
    return confirmationDetails;
  }

  async execute(
    params: DelegateTaskParams,
    abortSignal: AbortSignal,
    updateOutput?: (chunk: string) => void,
  ): Promise<ToolResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      return {
        llmContent: [
          `Task delegation rejected: ${params.mainTask}`,
          `Reason: ${validationError}`,
        ].join('\n'),
        returnDisplay: `Error: ${validationError}`,
      };
    }

    if (abortSignal.aborted) {
      return {
        llmContent: 'Task delegation was cancelled by user before it could start.',
        returnDisplay: 'Task delegation cancelled by user.',
      };
    }

    const executionMode = params.executionMode || 'parallel';
    const waitForCompletion = params.waitForCompletion !== false;
    const aggregateResults = params.aggregateResults !== false;
    const maxConcurrentAgents = params.maxConcurrentAgents || 3;

    // Initialize progress tracking
    let completedSubtasks = 0;
    const totalSubtasks = params.subtasks.length;
    
    if (updateOutput) {
      updateOutput(`🚀 Starting task delegation: ${params.mainTask}\n`);
      updateOutput(`📋 ${totalSubtasks} subtasks, ${executionMode} execution\n\n`);
    }

    try {
      if (executionMode === 'sequential') {
        return await this.executeSequential(params, abortSignal, updateOutput);
      } else {
        return await this.executeParallel(params, abortSignal, maxConcurrentAgents, updateOutput);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `❌ Task delegation failed: ${errorMessage}`,
        returnDisplay: `Task delegation failed: ${errorMessage}`,
      };
    }
  }

  private async executeSequential(
    params: DelegateTaskParams,
    abortSignal: AbortSignal,
    updateOutput?: (chunk: string) => void,
  ): Promise<ToolResult> {
    const results: ToolResult[] = [];
    const executor = new ParallelExecutor(this.config, { maxConcurrentAgents: 1 });

    if (updateOutput) {
      updateOutput(`🔄 Sequential execution mode - processing subtasks one by one\n\n`);
    }

    for (let i = 0; i < params.subtasks.length; i++) {
      if (abortSignal.aborted) {
        break;
      }

      const subtask = params.subtasks[i];
      const subtaskParams: SubAgentToolParams = {
        task: subtask.task,
        context: subtask.context,
        timeout: subtask.timeout,
        priority: subtask.priority,
        working_directory: subtask.working_directory,
      };

      if (updateOutput) {
        updateOutput(`📝 Starting subtask ${i + 1}/${params.subtasks.length}: ${subtask.task.substring(0, 60)}...\n`);
      }

      const taskId = executor.addTask(subtaskParams);
      
      // Wait for this specific task to complete
      await new Promise<void>((resolve) => {
        const onTaskCompleted = (task: any) => {
          if (task.id === taskId) {
            if (task.result) {
              results.push(task.result);
            }
            executor.off('taskCompleted', onTaskCompleted);
            executor.off('taskFailed', onTaskCompleted);
            resolve();
          }
        };

        executor.on('taskCompleted', onTaskCompleted);
        executor.on('taskFailed', onTaskCompleted);
        
        executor.on('taskProgress', (id: string, output: string) => {
          if (id === taskId && updateOutput) {
            updateOutput(`   ${output}`);
          }
        });
      });

      if (updateOutput) {
        updateOutput(`✅ Subtask ${i + 1} completed\n\n`);
      }
    }

    return this.formatResults(params, results, executor.getExecutionSummary());
  }

  private async executeParallel(
    params: DelegateTaskParams,
    abortSignal: AbortSignal,
    maxConcurrentAgents: number,
    updateOutput?: (chunk: string) => void,
  ): Promise<ToolResult> {
    const executorOptions: ParallelExecutorOptions = {
      maxConcurrentAgents,
      defaultTimeout: 60,
      retryFailedTasks: false,
    };

    const executor = new ParallelExecutor(this.config, executorOptions);
    
    // Set up progress monitoring
    let completedCount = 0;
    const totalCount = params.subtasks.length;

    executor.on('taskStarted', (task) => {
      if (updateOutput) {
        updateOutput(`🔄 Started: ${task.params.task.substring(0, 50)}...\n`);
      }
    });

    executor.on('taskCompleted', (task) => {
      completedCount++;
      if (updateOutput) {
        updateOutput(`✅ Completed (${completedCount}/${totalCount}): ${task.params.task.substring(0, 50)}...\n`);
      }
    });

    executor.on('taskFailed', (task) => {
      completedCount++;
      if (updateOutput) {
        updateOutput(`❌ Failed (${completedCount}/${totalCount}): ${task.params.task.substring(0, 50)}...\n`);
      }
    });

    executor.on('taskProgress', (taskId: string, output: string) => {
      if (updateOutput) {
        updateOutput(`   ${output}`);
      }
    });

    if (updateOutput) {
      updateOutput(`⚡ Parallel execution mode - up to ${maxConcurrentAgents} concurrent agents\n\n`);
    }

    // Add all subtasks to the executor
    for (const subtask of params.subtasks) {
      const subtaskParams: SubAgentToolParams = {
        task: subtask.task,
        context: subtask.context,
        timeout: subtask.timeout,
        priority: subtask.priority,
        working_directory: subtask.working_directory,
      };
      
      executor.addTask(subtaskParams);
    }

    // Wait for completion if requested
    if (params.waitForCompletion !== false) {
      const summary = await executor.waitForCompletion();
      const results = executor.getAggregatedResults();
      
      if (updateOutput) {
        updateOutput(`\n🎯 All subtasks completed!\n`);
      }
      
      return this.formatResults(params, results, summary);
    } else {
      // Return immediately with status
      const status = executor.getStatus();
      return {
        llmContent: `🚀 Task delegation started: ${params.mainTask}\n\n` +
                   `📊 Status: ${status.running} running, ${status.pending} pending\n` +
                   `🔄 Execution continuing in background...`,
        returnDisplay: `Task delegation started with ${params.subtasks.length} subtasks`,
      };
    }
  }

  private formatResults(params: DelegateTaskParams, results: ToolResult[], summary: any): ToolResult {
    const successful = results.length;
    const total = params.subtasks.length;
    const failed = total - successful;

    let output = `## Task Delegation Results\n\n`;
    output += `**Main Task:** ${params.mainTask}\n\n`;
    output += `**Summary:**\n`;
    output += `- ✅ Successful: ${successful}/${total}\n`;
    if (failed > 0) {
      output += `- ❌ Failed: ${failed}\n`;
    }
    output += `- ⏱️ Total Time: ${(summary.totalExecutionTime / 1000).toFixed(1)}s\n`;
    if (summary.averageTaskTime > 0) {
      output += `- 📊 Average Task Time: ${(summary.averageTaskTime / 1000).toFixed(1)}s\n`;
    }
    output += `\n`;

    if (params.aggregateResults !== false && results.length > 0) {
      output += `## Aggregated Results\n\n`;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const subtask = params.subtasks[i];
        
        output += `### Subtask ${i + 1}: ${subtask?.task || 'Unknown'}\n\n`;
        if (result.llmContent) {
          output += `${result.llmContent}\n\n`;
        } else if (result.returnDisplay) {
          output += `${result.returnDisplay}\n\n`;
        }
        output += `---\n\n`;
      }
    }

    const displayMessage = successful === total 
      ? `All ${total} subtasks completed successfully`
      : `${successful}/${total} subtasks completed, ${failed} failed`;

    return {
      llmContent: output,
      returnDisplay: displayMessage,
    };
  }
}