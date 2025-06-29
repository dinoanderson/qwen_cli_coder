/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { SchemaValidator } from '../utils/schemaValidator.js';
import { makeRelative, shortenPath } from '../utils/paths.js';
import { BaseTool, ToolResult } from './tools.js';
import { isWithinRoot, detectFileType, getSpecificMimeType } from '../utils/fileUtils.js';
import { Config } from '../config/config.js';
import {
  recordFileOperationMetric,
  FileOperation,
} from '../telemetry/metrics.js';
import { promises as fs } from 'fs';

/**
 * Parameters for the ReadImage tool
 */
export interface ReadImageToolParams {
  /**
   * The absolute path to the image file to read
   */
  absolute_path: string;
}

/**
 * Implementation of the ReadImage tool logic
 */
export class ReadImageTool extends BaseTool<ReadImageToolParams, ToolResult> {
  static readonly Name: string = 'read_image';

  constructor(
    private rootDirectory: string,
    private config: Config,
  ) {
    super(
      ReadImageTool.Name,
      'ReadImage',
      'Reads an image file and returns it in a format suitable for vision models. Supports common image formats like PNG, JPG, GIF, WEBP, SVG, BMP. Only works with vision-capable models like qwen-vl-plus-latest.',
      {
        properties: {
          absolute_path: {
            description:
              "The absolute path to the image file to read (e.g., '/home/user/project/image.png'). Relative paths are not supported. You must provide an absolute path to an image file.",
            type: 'string',
            pattern: '^/',
          },
        },
        required: ['absolute_path'],
        type: 'object',
      },
    );
    this.rootDirectory = path.resolve(rootDirectory);
  }

  validateToolParams(params: ReadImageToolParams): string | null {
    if (
      this.schema.parameters &&
      !SchemaValidator.validate(
        this.schema.parameters as Record<string, unknown>,
        params,
      )
    ) {
      return 'Parameters failed schema validation.';
    }
    
    const filePath = params.absolute_path;
    if (!path.isAbsolute(filePath)) {
      return `File path must be absolute, but was relative: ${filePath}. You must provide an absolute path.`;
    }
    
    if (!isWithinRoot(filePath, this.rootDirectory)) {
      return `File path must be within the root directory (${this.rootDirectory}): ${filePath}`;
    }

    // Check if current model supports vision
    const currentModel = this.config.getModel();
    if (!currentModel.includes('vl')) {
      return `Current model '${currentModel}' does not support vision. Switch to a vision model like 'qwen-vl-plus-latest' first using /model command.`;
    }

    const fileService = this.config.getFileService();
    if (fileService.shouldQwenIgnoreFile(params.absolute_path)) {
      const relativePath = makeRelative(
        params.absolute_path,
        this.rootDirectory,
      );
      return `File path '${shortenPath(relativePath)}' is ignored by .qwenignore pattern(s).`;
    }

    // Check if the file exists and is an image
    try {
      const fileType = detectFileType(params.absolute_path);
      if (fileType !== 'image') {
        return `File is not an image: ${params.absolute_path}. Detected type: ${fileType}. Please provide a valid image file (PNG, JPG, GIF, WEBP, SVG, BMP).`;
      }
    } catch (error) {
      return `Error checking file type: ${error instanceof Error ? error.message : String(error)}`;
    }

    return null;
  }

  getDescription(params: ReadImageToolParams): string {
    if (
      !params ||
      typeof params.absolute_path !== 'string' ||
      params.absolute_path.trim() === ''
    ) {
      return `Image path unavailable`;
    }
    const relativePath = makeRelative(params.absolute_path, this.rootDirectory);
    return `📷 ${shortenPath(relativePath)}`;
  }

  async execute(
    params: ReadImageToolParams,
    _signal: AbortSignal,
  ): Promise<ToolResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      return {
        llmContent: `Error: Invalid parameters provided. Reason: ${validationError}`,
        returnDisplay: validationError,
      };
    }

    try {
      // Check if file exists
      const stats = await fs.stat(params.absolute_path);
      if (!stats.isFile()) {
        return {
          llmContent: `Error: Path is not a file: ${params.absolute_path}`,
          returnDisplay: 'Path is not a file.',
        };
      }

      // Read the image file as base64
      const imageBuffer = await fs.readFile(params.absolute_path);
      const base64Data = imageBuffer.toString('base64');
      const mimeType = getSpecificMimeType(params.absolute_path) || 'image/png';
      
      const relativePath = makeRelative(params.absolute_path, this.rootDirectory);

      // Record metrics
      recordFileOperationMetric(
        this.config,
        FileOperation.READ,
        undefined, // No line count for images
        mimeType,
        path.extname(params.absolute_path),
      );

      // Return the image in the format expected by vision models
      return {
        llmContent: {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        returnDisplay: `📷 Read image: ${relativePath} (${mimeType}, ${Math.round(imageBuffer.length / 1024)}KB)`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const relativePath = makeRelative(params.absolute_path, this.rootDirectory);
      return {
        llmContent: `Error reading image ${relativePath}: ${errorMessage}`,
        returnDisplay: `Error reading image ${relativePath}: ${errorMessage}`,
      };
    }
  }
}