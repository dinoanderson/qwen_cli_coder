/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
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
import stripAnsi from 'strip-ansi';

export interface ShellToolParams {
  command: string;
  description?: string;
  directory?: string;
}
import { spawn } from 'child_process';

const OUTPUT_UPDATE_INTERVAL_MS = 1000;
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB max output size
const TRUNCATION_MESSAGE = '\n[Output truncated due to size limit]';
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds default timeout
const DEV_SERVER_TIMEOUT_MS = 10000; // 10 seconds for dev servers

export class ShellTool extends BaseTool<ShellToolParams, ToolResult> {
  static Name: string = 'run_shell_command';
  private whitelist: Set<string> = new Set();

  constructor(private readonly config: Config) {
    const toolDisplayName = 'Shell';

    let toolDescription: string;
    let toolParameterSchema: Record<string, unknown>;

    try {
      const descriptionUrl = new URL('shell.md', import.meta.url);
      toolDescription = fs.readFileSync(descriptionUrl, 'utf-8');
      const schemaUrl = new URL('shell.json', import.meta.url);
      toolParameterSchema = JSON.parse(fs.readFileSync(schemaUrl, 'utf-8'));
    } catch {
      // Fallback with minimal descriptions for tests when file reading fails
      toolDescription = 'Execute shell commands';
      toolParameterSchema = {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          description: { type: 'string', description: 'Command description' },
          directory: { type: 'string', description: 'Working directory' },
        },
        required: ['command'],
      };
    }

    super(
      ShellTool.Name,
      toolDisplayName,
      toolDescription,
      toolParameterSchema,
      false, // output is not markdown
      true, // output can be updated
    );
  }

  getDescription(params: ShellToolParams): string {
    let description = `${params.command}`;
    // append optional [in directory]
    // note description is needed even if validation fails due to absolute path
    if (params.directory) {
      description += ` [in ${params.directory}]`;
    }
    // append optional (description), replacing any line breaks with spaces
    if (params.description) {
      description += ` (${params.description.replace(/\n/g, ' ')})`;
    }
    return description;
  }

  getCommandRoot(command: string): string | undefined {
    return command
      .trim() // remove leading and trailing whitespace
      .replace(/[{}()]/g, '') // remove all grouping operators
      .split(/[\s;&|]+/)[0] // split on any whitespace or separator or chaining operators and take first part
      ?.split(/[/\\]/) // split on any path separators (or return undefined if previous line was undefined)
      .pop(); // take last part and return command root (or undefined if previous line was empty)
  }

  validateToolParams(params: ShellToolParams): string | null {
    if (
      !SchemaValidator.validate(
        this.parameterSchema as Record<string, unknown>,
        params,
      )
    ) {
      return `Parameters failed schema validation.`;
    }
    if (!params.command.trim()) {
      return 'Command cannot be empty.';
    }
    if (!this.getCommandRoot(params.command)) {
      return 'Could not identify command root to obtain permission from user.';
    }
    if (params.directory) {
      if (path.isAbsolute(params.directory)) {
        return 'Directory cannot be absolute. Must be relative to the project root directory.';
      }
      const directory = path.resolve(
        this.config.getTargetDir(),
        params.directory,
      );
      if (!fs.existsSync(directory)) {
        return 'Directory must exist.';
      }
    }
    return null;
  }

  async shouldConfirmExecute(
    params: ShellToolParams,
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false> {
    if (this.validateToolParams(params)) {
      return false; // skip confirmation, execute call will fail immediately
    }
    const rootCommand = this.getCommandRoot(params.command)!; // must be non-empty string post-validation
    if (this.whitelist.has(rootCommand)) {
      return false; // already approved and whitelisted
    }
    const confirmationDetails: ToolExecuteConfirmationDetails = {
      type: 'exec',
      title: 'Confirm Shell Command',
      command: params.command,
      rootCommand,
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          this.whitelist.add(rootCommand);
        }
      },
    };
    return confirmationDetails;
  }

  async execute(
    params: ShellToolParams,
    abortSignal: AbortSignal,
    updateOutput?: (chunk: string) => void,
  ): Promise<ToolResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      return {
        llmContent: [
          `Command rejected: ${params.command}`,
          `Reason: ${validationError}`,
        ].join('\n'),
        returnDisplay: `Error: ${validationError}`,
      };
    }

    if (abortSignal.aborted) {
      return {
        llmContent: 'Command was cancelled by user before it could start.',
        returnDisplay: 'Command cancelled by user.',
      };
    }

    const isWindows = os.platform() === 'win32';
    const tempFileName = `shell_pgrep_${crypto
      .randomBytes(6)
      .toString('hex')}.tmp`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    // pgrep is not available on Windows, so we can't get background PIDs
    const command = isWindows
      ? params.command
      : (() => {
          // wrap command to append subprocess pids (via pgrep) to temporary file
          let command = params.command.trim();
          if (!command.endsWith('&')) command += ';';
          // Use || true to ensure the wrapped command doesn't fail if pgrep is not available
          return `{ ${command} }; __code=$?; pgrep -g 0 >${tempFilePath} 2>&1 || true; exit $__code;`;
        })();

    // spawn command in specified directory (or project root if not specified)
    const shell = isWindows
      ? spawn('cmd.exe', ['/c', command], {
          stdio: ['ignore', 'pipe', 'pipe'],
          // detached: true, // ensure subprocess starts its own process group (esp. in Linux)
          cwd: path.resolve(this.config.getTargetDir(), params.directory || ''),
        })
      : spawn('bash', ['-c', command], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: true, // ensure subprocess starts its own process group (esp. in Linux)
          cwd: path.resolve(this.config.getTargetDir(), params.directory || ''),
        });

    let exited = false;
    let stdout = '';
    let output = '';
    let lastUpdateTime = Date.now();
    let outputTruncated = false;
    let stdoutTruncated = false;
    let stderrTruncated = false;

    const appendOutput = (str: string) => {
      if (output.length + str.length > MAX_OUTPUT_SIZE) {
        // Truncate to fit within the limit
        const remainingSpace = MAX_OUTPUT_SIZE - output.length;
        if (remainingSpace > 0) {
          output += str.substring(0, remainingSpace);
        }
        if (!outputTruncated) {
          output += TRUNCATION_MESSAGE;
          outputTruncated = true;
        }
      } else {
        output += str;
      }
      
      if (
        updateOutput &&
        Date.now() - lastUpdateTime > OUTPUT_UPDATE_INTERVAL_MS
      ) {
        updateOutput(output);
        lastUpdateTime = Date.now();
      }
    };

    shell.stdout.on('data', (data: Buffer) => {
      // continue to consume post-exit for background processes
      // removing listeners can overflow OS buffer and block subprocesses
      // destroying (e.g. shell.stdout.destroy()) can terminate subprocesses via SIGPIPE
      if (!exited) {
        const str = stripAnsi(data.toString());
        
        // Limit stdout buffer
        if (stdout.length + str.length > MAX_OUTPUT_SIZE) {
          const remainingSpace = MAX_OUTPUT_SIZE - stdout.length;
          if (remainingSpace > 0) {
            stdout += str.substring(0, remainingSpace);
          }
          if (!stdoutTruncated) {
            stdout += TRUNCATION_MESSAGE;
            stdoutTruncated = true;
          }
        } else {
          stdout += str;
        }
        
        appendOutput(str);
      }
    });

    let stderr = '';
    shell.stderr.on('data', (data: Buffer) => {
      if (!exited) {
        const str = stripAnsi(data.toString());
        
        // Limit stderr buffer
        if (stderr.length + str.length > MAX_OUTPUT_SIZE) {
          const remainingSpace = MAX_OUTPUT_SIZE - stderr.length;
          if (remainingSpace > 0) {
            stderr += str.substring(0, remainingSpace);
          }
          if (!stderrTruncated) {
            stderr += TRUNCATION_MESSAGE;
            stderrTruncated = true;
          }
        } else {
          stderr += str;
        }
        
        appendOutput(str);
      }
    });

    let error: Error | null = null;
    shell.on('error', (err: Error) => {
      error = err;
      // remove wrapper from user's command in error message
      error.message = error.message.replace(command, params.command);
    });

    let code: number | null = null;
    let processSignal: NodeJS.Signals | null = null;
    const exitHandler = (
      _code: number | null,
      _signal: NodeJS.Signals | null,
    ) => {
      exited = true;
      code = _code;
      processSignal = _signal;
    };
    shell.on('exit', exitHandler);

    let isAborting = false;
    const abortHandler = async () => {
      // Prevent multiple abort handler executions
      if (isAborting || exited) {
        return;
      }
      isAborting = true;
      
      if (shell.pid && !exited) {
        // Clear timeout when abort is triggered to prevent double-termination
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (os.platform() === 'win32') {
          // For Windows, use taskkill to kill the process tree
          spawn('taskkill', ['/pid', shell.pid.toString(), '/f', '/t']);
        } else {
          try {
            // attempt to SIGTERM process group (negative PID)
            // fall back to SIGKILL (to group) after 200ms
            process.kill(-shell.pid, 'SIGTERM');
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (shell.pid && !exited) {
              process.kill(-shell.pid, 'SIGKILL');
            }
          } catch (_e) {
            // if group kill fails, fall back to killing just the main process
            try {
              if (shell.pid) {
                shell.kill('SIGKILL');
              }
            } catch (_e) {
              console.error(`failed to kill shell process ${shell.pid}: ${_e}`);
            }
          }
        }
      }
    };
    
    // Set up timeout - use shorter timeout for dev server commands
    let timedOut = false;
    let timeoutId: NodeJS.Timeout | null = null;
    const isDevServerCommand = /\b(dev|serve|watch|start|run dev|run serve)\b/i.test(params.command);
    const timeoutMs = isDevServerCommand ? DEV_SERVER_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
    
    // Set up abort handler before timeout to ensure proper cleanup
    abortSignal.addEventListener('abort', abortHandler);
    
    // Only set timeout if not already aborted
    if (!abortSignal.aborted) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        abortHandler();
      }, timeoutMs);
    }

    // wait for the shell to exit
    try {
      await new Promise((resolve) => shell.on('exit', resolve));
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      abortSignal.removeEventListener('abort', abortHandler);
    }

    // parse pids (pgrep output) from temporary file and remove it
    const backgroundPIDs: number[] = [];
    if (os.platform() !== 'win32') {
      if (fs.existsSync(tempFilePath)) {
        const pgrepLines = fs
          .readFileSync(tempFilePath, 'utf8')
          .split('\n')
          .filter(Boolean);
        for (const line of pgrepLines) {
          if (!/^\d+$/.test(line)) {
            console.error(`pgrep: ${line}`);
          }
          const pid = Number(line);
          // exclude the shell subprocess pid
          if (pid !== shell.pid) {
            backgroundPIDs.push(pid);
          }
        }
        fs.unlinkSync(tempFilePath);
      } else {
        // Only log as error if the command completed normally but pgrep failed
        // It's normal for the file to not exist when the command was aborted quickly
        if (!abortSignal.aborted && !timedOut && code === 0) {
          console.error('missing pgrep output');
        }
      }
    }

    let llmContent = '';
    if (abortSignal.aborted || timedOut) {
      if (timedOut) {
        llmContent = `Command exceeded timeout of ${timeoutMs / 1000} seconds and was terminated.`;
        if (isDevServerCommand) {
          llmContent += '\nNote: Dev server commands typically run indefinitely. Consider running them in the background with "&" or in a separate terminal.';
        }
      } else {
        llmContent = 'Command was cancelled by user before it could complete.';
      }
      if (output.trim()) {
        llmContent += ` Below is the output (on stdout and stderr) before it was terminated:\n${output}`;
      } else {
        llmContent += ' There was no output before it was terminated.';
      }
    } else {
      llmContent = [
        `Command: ${params.command}`,
        `Directory: ${params.directory || '(root)'}`,
        `Stdout: ${stdout || '(empty)'}`,
        `Stderr: ${stderr || '(empty)'}`,
        `Error: ${error ?? '(none)'}`,
        `Exit Code: ${code ?? '(none)'}`,
        `Signal: ${processSignal ?? '(none)'}`,
        `Background PIDs: ${backgroundPIDs.length ? backgroundPIDs.join(', ') : '(none)'}`,
        `Process Group PGID: ${shell.pid ?? '(none)'}`,
      ].join('\n');
    }

    let returnDisplayMessage = '';
    if (this.config.getDebugMode()) {
      returnDisplayMessage = llmContent;
    } else {
      if (output.trim()) {
        returnDisplayMessage = output;
      } else {
        // Output is empty, let's provide a reason if the command failed or was cancelled
        if (timedOut) {
          returnDisplayMessage = `Command terminated after ${timeoutMs / 1000} seconds timeout.`;
          if (isDevServerCommand) {
            returnDisplayMessage += '\nDev servers run indefinitely - try running in background with "&"';
          }
        } else if (abortSignal.aborted) {
          returnDisplayMessage = 'Command cancelled by user.';
        } else if (processSignal) {
          returnDisplayMessage = `Command terminated by signal: ${processSignal}`;
        } else if (error) {
          // If error is not null, it's an Error object (or other truthy value)
          returnDisplayMessage = `Command failed: ${getErrorMessage(error)}`;
        } else if (code !== null && code !== 0) {
          returnDisplayMessage = `Command exited with code: ${code}`;
        }
        // If output is empty and command succeeded (code 0, no error/signal/abort),
        // returnDisplayMessage will remain empty, which is fine.
      }
    }

    return { llmContent, returnDisplay: returnDisplayMessage };
  }
}
