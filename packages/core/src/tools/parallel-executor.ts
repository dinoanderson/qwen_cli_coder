/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'events';
import { Config } from '../config/config.js';
import { SubAgentTool, SubAgentToolParams } from './sub-agent.js';
import { ToolResult } from './tools.js';

export interface ParallelTask {
  id: string;
  params: SubAgentToolParams;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: ToolResult;
  error?: Error;
}

export interface ParallelExecutorOptions {
  maxConcurrentAgents?: number;
  defaultTimeout?: number;
  retryFailedTasks?: boolean;
  maxRetries?: number;
}

export interface ExecutionSummary {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  totalExecutionTime: number;
  averageTaskTime: number;
}

/**
 * ParallelExecutor manages multiple concurrent sub-agents for parallel task execution.
 * It provides task queuing, resource management, progress tracking, and result aggregation.
 */
export class ParallelExecutor extends EventEmitter {
  private tasks: Map<string, ParallelTask> = new Map();
  private runningTasks: Set<string> = new Set();
  private subAgentTool: SubAgentTool;
  private readonly maxConcurrentAgents: number;
  private readonly defaultTimeout: number;
  private readonly retryFailedTasks: boolean;
  private readonly maxRetries: number;
  private executionStartTime?: Date;
  private taskIdCounter = 0;

  constructor(
    private readonly config: Config,
    options: ParallelExecutorOptions = {}
  ) {
    super();
    
    this.maxConcurrentAgents = options.maxConcurrentAgents || 3;
    this.defaultTimeout = options.defaultTimeout || 60;
    this.retryFailedTasks = options.retryFailedTasks || false;
    this.maxRetries = options.maxRetries || 2;
    
    this.subAgentTool = new SubAgentTool(config);
  }

  /**
   * Add a task to the execution queue
   */
  addTask(params: SubAgentToolParams): string {
    const taskId = `task-${++this.taskIdCounter}-${Date.now()}`;
    const priority = params.priority || 'medium';
    
    const task: ParallelTask = {
      id: taskId,
      params: {
        ...params,
        timeout: params.timeout || this.defaultTimeout,
      },
      priority,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);
    this.emit('taskAdded', task);
    
    // Start execution if we have capacity
    this.processQueue();
    
    return taskId;
  }

  /**
   * Add multiple tasks at once
   */
  addTasks(paramsList: SubAgentToolParams[]): string[] {
    const taskIds: string[] = [];
    for (const params of paramsList) {
      taskIds.push(this.addTask(params));
    }
    return taskIds;
  }

  /**
   * Cancel a specific task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === 'pending') {
      task.status = 'cancelled';
      task.completedAt = new Date();
      this.emit('taskCancelled', task);
      return true;
    }

    if (task.status === 'running') {
      // TODO: Implement actual process cancellation
      task.status = 'cancelled';
      task.completedAt = new Date();
      this.runningTasks.delete(taskId);
      this.emit('taskCancelled', task);
      this.processQueue(); // Start next task if available
      return true;
    }

    return false;
  }

  /**
   * Cancel all pending tasks
   */
  cancelAllTasks(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending') {
        this.cancelTask(taskId);
      }
    }
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): ParallelTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): ParallelTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: ParallelTask['status']): ParallelTask[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * Get current execution statistics
   */
  getExecutionSummary(): ExecutionSummary {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const failedTasks = allTasks.filter(t => t.status === 'failed');
    const cancelledTasks = allTasks.filter(t => t.status === 'cancelled');
    
    const totalExecutionTime = this.executionStartTime 
      ? Date.now() - this.executionStartTime.getTime()
      : 0;
    
    const taskTimes = completedTasks
      .filter(t => t.startedAt && t.completedAt)
      .map(t => t.completedAt!.getTime() - t.startedAt!.getTime());
    
    const averageTaskTime = taskTimes.length > 0 
      ? taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length
      : 0;

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      cancelledTasks: cancelledTasks.length,
      totalExecutionTime,
      averageTaskTime,
    };
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(): Promise<ExecutionSummary> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const pendingTasks = this.getTasksByStatus('pending');
        const runningTasks = this.getTasksByStatus('running');
        
        if (pendingTasks.length === 0 && runningTasks.length === 0) {
          resolve(this.getExecutionSummary());
        }
      };

      // Check immediately
      checkCompletion();

      // Listen for task completion events
      const onTaskCompleted = () => {
        checkCompletion();
      };

      this.on('taskCompleted', onTaskCompleted);
      this.on('taskFailed', onTaskCompleted);
      this.on('taskCancelled', onTaskCompleted);
    });
  }

  /**
   * Get aggregated results from all completed tasks
   */
  getAggregatedResults(): ToolResult[] {
    return this.getTasksByStatus('completed')
      .map(task => task.result)
      .filter((result): result is ToolResult => result !== undefined);
  }

  /**
   * Process the task queue - start tasks up to the concurrency limit
   */
  private processQueue(): void {
    if (!this.executionStartTime) {
      this.executionStartTime = new Date();
    }

    // Check if we can start more tasks
    const availableSlots = this.maxConcurrentAgents - this.runningTasks.size;
    if (availableSlots <= 0) {
      return;
    }

    // Get pending tasks sorted by priority and creation time
    const pendingTasks = this.getTasksByStatus('pending')
      .sort((a, b) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        // Then by creation time (earlier first)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    // Start tasks up to available slots
    const tasksToStart = pendingTasks.slice(0, availableSlots);
    for (const task of tasksToStart) {
      this.startTask(task);
    }
  }

  /**
   * Start execution of a specific task
   */
  private async startTask(task: ParallelTask): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    this.runningTasks.add(task.id);
    
    this.emit('taskStarted', task);

    try {
      // Create an abort signal for timeout handling
      const abortController = new AbortController();
      const timeoutHandle = setTimeout(() => {
        abortController.abort();
      }, (task.params.timeout || this.defaultTimeout) * 1000);

      // Execute the sub-agent task
      const result = await this.subAgentTool.execute(
        task.params,
        abortController.signal,
        (output: string) => {
          this.emit('taskProgress', task.id, output);
        }
      );

      clearTimeout(timeoutHandle);
      
      // Task completed successfully
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      this.runningTasks.delete(task.id);
      
      this.emit('taskCompleted', task);
      
    } catch (error) {
      // Task failed
      task.status = 'failed';
      task.error = error instanceof Error ? error : new Error(String(error));
      task.completedAt = new Date();
      this.runningTasks.delete(task.id);
      
      this.emit('taskFailed', task);
      
      // Retry if enabled and retries available
      if (this.retryFailedTasks && this.shouldRetryTask(task)) {
        this.retryTask(task);
      }
    }

    // Process queue to start next tasks
    this.processQueue();
  }

  /**
   * Check if a failed task should be retried
   */
  private shouldRetryTask(task: ParallelTask): boolean {
    // Simple retry logic - could be enhanced with more sophisticated rules
    const retryCount = this.getRetryCount(task.id);
    return retryCount < this.maxRetries;
  }

  /**
   * Get the retry count for a task (simplified - in real implementation you'd track this)
   */
  private getRetryCount(taskId: string): number {
    // For now, return 0. In a real implementation, you'd track retry counts
    return 0;
  }

  /**
   * Retry a failed task
   */
  private retryTask(task: ParallelTask): void {
    // Create a new task with the same parameters
    const retryTaskId = this.addTask({
      ...task.params,
      task: `${task.params.task} (retry)`,
    });
    
    this.emit('taskRetried', task, retryTaskId);
  }

  /**
   * Clear all completed, failed, and cancelled tasks from memory
   */
  clearCompletedTasks(): void {
    const toRemove: string[] = [];
    for (const [taskId, task] of this.tasks) {
      if (['completed', 'failed', 'cancelled'].includes(task.status)) {
        toRemove.push(taskId);
      }
    }
    
    for (const taskId of toRemove) {
      this.tasks.delete(taskId);
    }
    
    this.emit('tasksCleared', toRemove.length);
  }

  /**
   * Get current status including running task count and queue length
   */
  getStatus(): {
    running: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
    maxConcurrent: number;
  } {
    return {
      running: this.runningTasks.size,
      pending: this.getTasksByStatus('pending').length,
      completed: this.getTasksByStatus('completed').length,
      failed: this.getTasksByStatus('failed').length,
      cancelled: this.getTasksByStatus('cancelled').length,
      maxConcurrent: this.maxConcurrentAgents,
    };
  }
}