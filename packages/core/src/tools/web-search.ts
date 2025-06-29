/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GroundingMetadata } from '@google/genai';
import { BaseTool, ToolResult } from './tools.js';
import { SchemaValidator } from '../utils/schemaValidator.js';

import { getErrorMessage } from '../utils/errors.js';
import { Config } from '../config/config.js';
import { getResponseText } from '../utils/generateContentResponseUtilities.js';

interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

interface GroundingChunkItem {
  web?: GroundingChunkWeb;
  // Other properties might exist if needed in the future
}

interface GroundingSupportSegment {
  startIndex: number;
  endIndex: number;
  text?: string; // text is optional as per the example
}

interface GroundingSupportItem {
  segment?: GroundingSupportSegment;
  groundingChunkIndices?: number[];
  confidenceScores?: number[]; // Optional as per example
}

/**
 * Parameters for the WebSearchTool.
 */
export interface WebSearchToolParams {
  /**
   * The search query.
   */

  query: string;
}

/**
 * Extends ToolResult to include sources for web search.
 */
export interface WebSearchToolResult extends ToolResult {
  sources?: GroundingMetadata extends { groundingChunks: GroundingChunkItem[] }
    ? GroundingMetadata['groundingChunks']
    : GroundingChunkItem[];
}

/**
 * A tool to perform web searches using MCP servers (DuckDuckGo).
 * Replaces the previous Google Search implementation with MCP-based search.
 */
export class WebSearchTool extends BaseTool<
  WebSearchToolParams,
  WebSearchToolResult
> {
  static readonly Name: string = 'web_search';

  constructor(private readonly config: Config) {
    super(
      WebSearchTool.Name,
      'DuckDuckGoSearch',
      'Performs a web search using DuckDuckGo search engine (via MCP server) and returns the results. This tool provides privacy-focused web search capabilities. Requires DuckDuckGo MCP server to be configured in settings.',
      {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find information on the web.',
          },
        },
        required: ['query'],
      },
    );
  }

  validateParams(params: WebSearchToolParams): string | null {
    if (
      this.schema.parameters &&
      !SchemaValidator.validate(
        this.schema.parameters as Record<string, unknown>,
        params,
      )
    ) {
      return "Parameters failed schema validation. Ensure 'query' is a string.";
    }
    if (!params.query || params.query.trim() === '') {
      return "The 'query' parameter cannot be empty.";
    }
    return null;
  }

  getDescription(params: WebSearchToolParams): string {
    return `Searching the web for: "${params.query}"`;
  }

  async execute(
    params: WebSearchToolParams,
    signal: AbortSignal,
  ): Promise<WebSearchToolResult> {
    const validationError = this.validateParams(params);
    if (validationError) {
      return {
        llmContent: `Error: Invalid parameters provided. Reason: ${validationError}`,
        returnDisplay: validationError,
      };
    }

    try {
      // Try to use DuckDuckGo MCP tool if available
      const toolRegistry = await this.config.getToolRegistry();
      const mcpSearchResult = await this.tryMcpSearch(toolRegistry, params, signal);
      if (mcpSearchResult) {
        return mcpSearchResult;
      }

      // If no MCP tool available, return error with setup instructions
      const setupMessage = `Web search requires a DuckDuckGo MCP server to be configured.\n\n**Quick setup:**\nUse \`/setup-mcp websearch\` to configure automatically, or:\n\n**Manual setup:**\n1. Install: \`npm install -g @oevortex/ddg_search\`\n2. Add to your .qwen/settings.json:\n\`\`\`json\n{\n  "mcpServers": {\n    "duckduckgo": {\n      "command": "npx",\n      "args": ["-y", "@oevortex/ddg_search"]\n    }\n  }\n}\n\`\`\`\n3. Restart the CLI\n\nFor more help: \`/mcp\` shows server status, \`/setup-mcp\` shows setup options.`;
      
      return {
        llmContent: `Error: ${setupMessage}`,
        returnDisplay: 'Web search not configured. Use `/setup-mcp websearch` to configure DuckDuckGo search.',
      };
    } catch (error: unknown) {
      const errorMessage = `Error during web search for query "${params.query}": ${getErrorMessage(error)}`;
      console.error(errorMessage, error);
      return {
        llmContent: `Error: ${errorMessage}`,
        returnDisplay: `Error performing web search. Check if DuckDuckGo MCP server is configured and running.`,
      };
    }
  }

  /**
   * Attempts to use an MCP-based search tool (DuckDuckGo)
   */
  private async tryMcpSearch(
    toolRegistry: any,
    params: WebSearchToolParams,
    signal: AbortSignal,
  ): Promise<WebSearchToolResult | null> {
    // Look for DuckDuckGo search tools
    const possibleToolNames = [
      'web_search', // Primary tool name from @oevortex/ddg_search
      'ddg_search', // Alternative name from @oevortex/ddg_search
      'duckduckgo_web_search', 
      'search',
      'duckduckgo_search', 
      'search_web'
    ];

    for (const toolName of possibleToolNames) {
      const tool = toolRegistry.getTool(toolName);
      if (tool && this.isDuckDuckGoTool(tool)) {
        try {
          // Use the correct parameters for the MCP tool
          const mcpParams = { 
            query: params.query,
            count: 10,
            safeSearch: 'moderate'
          };
          const result = await tool.execute(mcpParams, signal);
          return this.transformMcpResult(result, params.query);
        } catch (error) {
          console.warn(`Failed to use MCP tool ${toolName}:`, error);
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Checks if a tool is likely a DuckDuckGo search tool
   */
  private isDuckDuckGoTool(tool: any): boolean {
    const description = tool.description?.toLowerCase() || '';
    const name = tool.name?.toLowerCase() || '';
    
    return (
      description.includes('duckduckgo') ||
      description.includes('search') ||
      name.includes('search') ||
      name.includes('ddg')
    );
  }

  /**
   * Transforms MCP search result to WebSearchToolResult format
   */
  private transformMcpResult(
    mcpResult: any,
    query: string,
  ): WebSearchToolResult {
    let resultText = '';
    let sources: GroundingChunkItem[] = [];

    // Extract content from MCP result
    if (mcpResult.llmContent) {
      if (typeof mcpResult.llmContent === 'string') {
        resultText = mcpResult.llmContent;
      } else if (Array.isArray(mcpResult.llmContent)) {
        // Handle Part[] format
        resultText = mcpResult.llmContent
          .map((part: any) => {
            if (part.text) return part.text;
            if (part.functionResponse?.response) {
              return JSON.stringify(part.functionResponse.response, null, 2);
            }
            return JSON.stringify(part, null, 2);
          })
          .join('\n');
      }
    }

    // Try to extract structured search results
    try {
      const parsed = this.parseSearchResults(resultText);
      if (parsed.results.length > 0) {
        sources = parsed.results.map((result, index) => ({
          web: {
            title: result.title,
            uri: result.url,
          },
        }));
        
        // Format with citations
        const formattedResults = parsed.results
          .map((result, index) => `${result.snippet} [${index + 1}]`)
          .join('\n\n');
        
        const sourcesList = parsed.results
          .map((result, index) => `[${index + 1}] ${result.title} (${result.url})`)
          .join('\n');
        
        resultText = `${formattedResults}\n\nSources:\n${sourcesList}`;
      }
    } catch (error) {
      // If parsing fails, use the raw result
      console.warn('Failed to parse search results, using raw format:', error);
    }

    return {
      llmContent: `Web search results for "${query}":\n\n${resultText}`,
      returnDisplay: `Search results for "${query}" returned.`,
      sources,
    };
  }

  /**
   * Attempts to parse search results from various formats
   */
  private parseSearchResults(text: string): {
    results: Array<{ title: string; url: string; snippet: string }>;
  } {
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.title && item.url) {
            results.push({
              title: item.title,
              url: item.url,
              snippet: item.snippet || item.description || '',
            });
          }
        }
      } else if (parsed.results && Array.isArray(parsed.results)) {
        for (const item of parsed.results) {
          if (item.title && item.url) {
            results.push({
              title: item.title,
              url: item.url,
              snippet: item.snippet || item.description || '',
            });
          }
        }
      }
    } catch {
      // If not JSON, try to extract from markdown/text format
      const lines = text.split('\n');
      let currentResult: Partial<{ title: string; url: string; snippet: string }> = {};
      
      for (const line of lines) {
        // Look for URLs
        const urlMatch = line.match(/https?:\/\/[^\s)]+/g);
        if (urlMatch) {
          currentResult.url = urlMatch[0];
        }
        
        // Look for titles (often in **bold** or ## headers)
        const titleMatch = line.match(/(?:\*\*|##)\s*(.+?)(?:\*\*|$)/);
        if (titleMatch) {
          currentResult.title = titleMatch[1].trim();
        }
        
        // Collect content as snippet
        if (line.trim() && !line.match(/^(\*\*|##|https?:)/) && currentResult.title) {
          currentResult.snippet = (currentResult.snippet || '') + ' ' + line.trim();
        }
        
        // If we have title and URL, save the result
        if (currentResult.title && currentResult.url) {
          results.push({
            title: currentResult.title,
            url: currentResult.url,
            snippet: currentResult.snippet?.trim() || '',
          });
          currentResult = {};
        }
      }
    }

    return { results };
  }
}
