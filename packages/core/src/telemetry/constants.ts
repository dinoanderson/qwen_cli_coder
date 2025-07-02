/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const SERVICE_NAME = 'qwen-cli';

export const EVENT_USER_PROMPT = 'qwen_cli.user_prompt';
export const EVENT_TOOL_CALL = 'qwen_cli.tool_call';
export const EVENT_API_REQUEST = 'qwen_cli.api_request';
export const EVENT_API_ERROR = 'qwen_cli.api_error';
export const EVENT_API_RESPONSE = 'qwen_cli.api_response';
export const EVENT_CLI_CONFIG = 'qwen_cli.config';

export const METRIC_TOOL_CALL_COUNT = 'qwen_cli.tool.call.count';
export const METRIC_TOOL_CALL_LATENCY = 'qwen_cli.tool.call.latency';
export const METRIC_API_REQUEST_COUNT = 'qwen_cli.api.request.count';
export const METRIC_API_REQUEST_LATENCY = 'qwen_cli.api.request.latency';
export const METRIC_TOKEN_USAGE = 'qwen_cli.token.usage';
export const METRIC_SESSION_COUNT = 'qwen_cli.session.count';
export const METRIC_FILE_OPERATION_COUNT = 'qwen_cli.file.operation.count';
