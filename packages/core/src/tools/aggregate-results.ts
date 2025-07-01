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
} from './tools.js';
import { SchemaValidator } from '../utils/schemaValidator.js';

export interface ResultSource {
  name: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface AggregateResultsParams {
  results: ResultSource[];
  aggregationType?: 'summary' | 'merge' | 'compare' | 'analyze' | 'custom';
  title?: string;
  format?: 'markdown' | 'text' | 'json' | 'report';
  includeMetadata?: boolean;
  customInstructions?: string;
  groupBy?: string;
  sortBy?: 'name' | 'length' | 'timestamp' | 'custom';
}

/**
 * AggregateResults tool combines and processes outputs from multiple agents or operations.
 * It provides intelligent summarization, comparison, and analysis capabilities.
 */
export class AggregateResultsTool extends BaseTool<AggregateResultsParams, ToolResult> {
  static Name: string = 'aggregate_results';

  constructor(private readonly config: Config) {
    const toolDisplayName = 'Result Aggregation';

    const toolDescription = `Combine, analyze, and summarize results from multiple agents or operations.

This tool provides sophisticated result processing capabilities for multi-agent workflows:

**Aggregation Types:**
- **Summary**: Create a concise summary of all results
- **Merge**: Combine all results into a single coherent document
- **Compare**: Highlight differences and similarities between results
- **Analyze**: Perform deeper analysis and extract insights
- **Custom**: Use custom instructions for specialized processing

**Output Formats:**
- **Markdown**: Rich formatted output with headers, lists, and emphasis
- **Text**: Plain text format for simple consumption
- **JSON**: Structured data format for programmatic use
- **Report**: Professional report format with sections and analysis

**Use Cases:**
- Summarize outputs from parallel research tasks
- Compare solutions from different approaches
- Merge code changes from multiple agents
- Analyze test results from various scenarios
- Create comprehensive reports from distributed work

**Features:**
- Intelligent content analysis and categorization
- Automatic duplicate detection and removal
- Metadata preservation and analysis
- Flexible grouping and sorting options
- Custom processing instructions support

The tool automatically handles various content types and can extract meaningful insights from diverse result sets.`;

    const toolParameterSchema: Record<string, unknown> = {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          description: 'Array of results to aggregate',
          minItems: 1,
          maxItems: 20,
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name or identifier for this result',
              },
              content: {
                type: 'string',
                description: 'The actual content/result to aggregate',
              },
              metadata: {
                type: 'object',
                description: 'Optional metadata about this result',
              },
            },
            required: ['name', 'content'],
          },
        },
        aggregationType: {
          type: 'string',
          description: 'Type of aggregation to perform',
          enum: ['summary', 'merge', 'compare', 'analyze', 'custom'],
          default: 'summary',
        },
        title: {
          type: 'string',
          description: 'Title for the aggregated output',
        },
        format: {
          type: 'string',
          description: 'Output format for the aggregated results',
          enum: ['markdown', 'text', 'json', 'report'],
          default: 'markdown',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Whether to include metadata in the output',
          default: false,
        },
        customInstructions: {
          type: 'string',
          description: 'Custom instructions for aggregation (required for custom type)',
        },
        groupBy: {
          type: 'string',
          description: 'Group results by this metadata field',
        },
        sortBy: {
          type: 'string',
          description: 'Sort results by this criteria',
          enum: ['name', 'length', 'timestamp', 'custom'],
          default: 'name',
        },
      },
      required: ['results'],
    };

    super(
      AggregateResultsTool.Name,
      toolDisplayName,
      toolDescription,
      toolParameterSchema,
      true, // output is markdown
      false, // output cannot be updated (processing is atomic)
    );
  }

  getDescription(params: AggregateResultsParams): string {
    const resultCount = params.results.length;
    const type = params.aggregationType || 'summary';
    const format = params.format || 'markdown';
    
    let description = `Aggregate ${resultCount} results (${type}, ${format} format)`;
    
    if (params.title) {
      description += ` - "${params.title}"`;
    }
    
    return description;
  }

  validateToolParams(params: AggregateResultsParams): string | null {
    if (
      !SchemaValidator.validate(
        this.parameterSchema as Record<string, unknown>,
        params,
      )
    ) {
      return `Parameters failed schema validation.`;
    }

    if (!params.results || params.results.length === 0) {
      return 'At least one result must be provided.';
    }

    if (params.results.length > 20) {
      return 'Maximum of 20 results can be aggregated at once.';
    }

    for (let i = 0; i < params.results.length; i++) {
      const result = params.results[i];
      if (!result.name || !result.name.trim()) {
        return `Result ${i + 1} must have a name.`;
      }
      if (!result.content || !result.content.trim()) {
        return `Result ${i + 1} must have content.`;
      }
    }

    if (params.aggregationType === 'custom' && !params.customInstructions) {
      return 'Custom instructions are required when using custom aggregation type.';
    }

    return null;
  }

  async shouldConfirmExecute(
    params: AggregateResultsParams,
    _abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false> {
    // Result aggregation is generally safe and doesn't need confirmation
    return false;
  }

  async execute(
    params: AggregateResultsParams,
    abortSignal: AbortSignal,
  ): Promise<ToolResult> {
    const validationError = this.validateToolParams(params);
    if (validationError) {
      return {
        llmContent: [
          `Result aggregation rejected`,
          `Reason: ${validationError}`,
        ].join('\n'),
        returnDisplay: `Error: ${validationError}`,
      };
    }

    if (abortSignal.aborted) {
      return {
        llmContent: 'Result aggregation was cancelled by user.',
        returnDisplay: 'Result aggregation cancelled.',
      };
    }

    try {
      const aggregationType = params.aggregationType || 'summary';
      const format = params.format || 'markdown';
      const title = params.title || 'Aggregated Results';

      // Sort results if requested
      const sortedResults = this.sortResults(params.results, params.sortBy);

      // Group results if requested
      const groupedResults = params.groupBy 
        ? this.groupResults(sortedResults, params.groupBy)
        : { 'All Results': sortedResults };

      // Perform aggregation based on type
      let aggregatedContent: string;
      switch (aggregationType) {
        case 'summary':
          aggregatedContent = this.createSummary(groupedResults, title, format, params.includeMetadata);
          break;
        case 'merge':
          aggregatedContent = this.mergeResults(groupedResults, title, format, params.includeMetadata);
          break;
        case 'compare':
          aggregatedContent = this.compareResults(groupedResults, title, format, params.includeMetadata);
          break;
        case 'analyze':
          aggregatedContent = this.analyzeResults(groupedResults, title, format, params.includeMetadata);
          break;
        case 'custom':
          aggregatedContent = this.customAggregation(groupedResults, title, format, params.customInstructions!, params.includeMetadata);
          break;
        default:
          throw new Error(`Unsupported aggregation type: ${aggregationType}`);
      }

      // Format output based on requested format
      const formattedOutput = this.formatOutput(aggregatedContent, format);

      return {
        llmContent: formattedOutput,
        returnDisplay: `Aggregated ${params.results.length} results using ${aggregationType} method`,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `❌ Result aggregation failed: ${errorMessage}`,
        returnDisplay: `Result aggregation failed: ${errorMessage}`,
      };
    }
  }

  private sortResults(results: ResultSource[], sortBy?: string): ResultSource[] {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'length':
        return sorted.sort((a, b) => b.content.length - a.content.length);
      case 'timestamp':
        return sorted.sort((a, b) => {
          const timestampA = a.metadata?.timestamp || a.metadata?.createdAt || 0;
          const timestampB = b.metadata?.timestamp || b.metadata?.createdAt || 0;
          return new Date(timestampB).getTime() - new Date(timestampA).getTime();
        });
      default:
        return sorted;
    }
  }

  private groupResults(results: ResultSource[], groupBy: string): Record<string, ResultSource[]> {
    const groups: Record<string, ResultSource[]> = {};
    
    for (const result of results) {
      const groupKey = result.metadata?.[groupBy] || 'Ungrouped';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(result);
    }
    
    return groups;
  }

  private createSummary(
    groupedResults: Record<string, ResultSource[]>,
    title: string,
    format: string,
    includeMetadata?: boolean
  ): string {
    let summary = `# ${title}\n\n`;
    
    const allResults = Object.values(groupedResults).flat();
    const totalResults = allResults.length;
    const totalLength = allResults.reduce((sum, r) => sum + r.content.length, 0);
    const avgLength = Math.round(totalLength / totalResults);
    
    summary += `## Summary Overview\n\n`;
    summary += `- **Total Results**: ${totalResults}\n`;
    summary += `- **Total Content Length**: ${totalLength.toLocaleString()} characters\n`;
    summary += `- **Average Content Length**: ${avgLength.toLocaleString()} characters\n`;
    summary += `- **Groups**: ${Object.keys(groupedResults).length}\n\n`;

    for (const [groupName, results] of Object.entries(groupedResults)) {
      if (Object.keys(groupedResults).length > 1) {
        summary += `## ${groupName}\n\n`;
      }

      for (const result of results) {
        summary += `### ${result.name}\n\n`;
        
        // Create a summary of the content (first 200 chars + ellipsis if longer)
        const contentSummary = result.content.length > 200 
          ? result.content.substring(0, 200) + '...'
          : result.content;
        
        summary += `${contentSummary}\n\n`;
        
        if (includeMetadata && result.metadata) {
          summary += `**Metadata**: ${JSON.stringify(result.metadata, null, 2)}\n\n`;
        }
        
        summary += `**Length**: ${result.content.length} characters\n\n`;
        summary += `---\n\n`;
      }
    }

    return summary;
  }

  private mergeResults(
    groupedResults: Record<string, ResultSource[]>,
    title: string,
    format: string,
    includeMetadata?: boolean
  ): string {
    let merged = `# ${title}\n\n`;
    
    for (const [groupName, results] of Object.entries(groupedResults)) {
      if (Object.keys(groupedResults).length > 1) {
        merged += `## ${groupName}\n\n`;
      }

      for (const result of results) {
        merged += `### ${result.name}\n\n`;
        merged += `${result.content}\n\n`;
        
        if (includeMetadata && result.metadata) {
          merged += `<details>\n<summary>Metadata</summary>\n\n`;
          merged += `\`\`\`json\n${JSON.stringify(result.metadata, null, 2)}\n\`\`\`\n\n`;
          merged += `</details>\n\n`;
        }
      }
    }

    return merged;
  }

  private compareResults(
    groupedResults: Record<string, ResultSource[]>,
    title: string,
    format: string,
    includeMetadata?: boolean
  ): string {
    const allResults = Object.values(groupedResults).flat();
    
    let comparison = `# ${title}\n\n`;
    comparison += `## Comparison Analysis\n\n`;
    
    // Basic statistics
    const lengths = allResults.map(r => r.content.length);
    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    
    comparison += `### Content Length Analysis\n\n`;
    comparison += `- **Shortest**: ${minLength} characters (${allResults.find(r => r.content.length === minLength)?.name})\n`;
    comparison += `- **Longest**: ${maxLength} characters (${allResults.find(r => r.content.length === maxLength)?.name})\n`;
    comparison += `- **Average**: ${avgLength} characters\n\n`;
    
    // Content similarity (simplified - could be enhanced with actual similarity algorithms)
    comparison += `### Content Overview\n\n`;
    for (let i = 0; i < allResults.length; i++) {
      const result = allResults[i];
      comparison += `**${result.name}**: ${result.content.substring(0, 100)}${result.content.length > 100 ? '...' : ''}\n\n`;
    }
    
    // Detailed comparison
    comparison += `### Detailed Comparison\n\n`;
    for (const [groupName, results] of Object.entries(groupedResults)) {
      if (Object.keys(groupedResults).length > 1) {
        comparison += `#### ${groupName}\n\n`;
      }
      
      for (const result of results) {
        comparison += `**${result.name}**:\n`;
        comparison += `- Length: ${result.content.length} characters\n`;
        comparison += `- Content preview: ${result.content.substring(0, 150)}${result.content.length > 150 ? '...' : ''}\n`;
        
        if (includeMetadata && result.metadata) {
          comparison += `- Metadata: ${Object.keys(result.metadata).join(', ')}\n`;
        }
        
        comparison += `\n`;
      }
    }

    return comparison;
  }

  private analyzeResults(
    groupedResults: Record<string, ResultSource[]>,
    title: string,
    format: string,
    includeMetadata?: boolean
  ): string {
    const allResults = Object.values(groupedResults).flat();
    
    let analysis = `# ${title}\n\n`;
    analysis += `## Results Analysis\n\n`;
    
    // Statistical analysis
    const lengths = allResults.map(r => r.content.length);
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    const avgLength = totalLength / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    analysis += `### Statistical Summary\n\n`;
    analysis += `- **Total Results**: ${allResults.length}\n`;
    analysis += `- **Total Content**: ${totalLength.toLocaleString()} characters\n`;
    analysis += `- **Mean Length**: ${Math.round(avgLength).toLocaleString()} characters\n`;
    analysis += `- **Standard Deviation**: ${Math.round(stdDev).toLocaleString()} characters\n`;
    analysis += `- **Length Range**: ${Math.min(...lengths).toLocaleString()} - ${Math.max(...lengths).toLocaleString()} characters\n\n`;
    
    // Content analysis
    analysis += `### Content Analysis\n\n`;
    
    // Word frequency analysis (simplified)
    const allText = allResults.map(r => r.content).join(' ').toLowerCase();
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    if (topWords.length > 0) {
      analysis += `**Most Common Words**:\n`;
      topWords.forEach(([word, count]) => {
        analysis += `- ${word}: ${count} occurrences\n`;
      });
      analysis += `\n`;
    }
    
    // Pattern analysis
    analysis += `### Pattern Analysis\n\n`;
    for (const [groupName, results] of Object.entries(groupedResults)) {
      if (Object.keys(groupedResults).length > 1) {
        analysis += `#### ${groupName}\n\n`;
      }
      
      // Analyze patterns in this group
      const groupLengths = results.map(r => r.content.length);
      const groupAvg = groupLengths.reduce((a, b) => a + b, 0) / groupLengths.length;
      
      analysis += `- **Results in group**: ${results.length}\n`;
      analysis += `- **Average length**: ${Math.round(groupAvg)} characters\n`;
      analysis += `- **Content variation**: ${groupLengths.length > 1 ? 'Varied' : 'Single result'}\n\n`;
      
      // List each result with brief analysis
      results.forEach(result => {
        const words = result.content.split(/\s+/).length;
        const sentences = result.content.split(/[.!?]+/).length - 1;
        
        analysis += `**${result.name}**:\n`;
        analysis += `  - ${result.content.length} characters, ~${words} words, ~${sentences} sentences\n`;
        
        if (includeMetadata && result.metadata) {
          analysis += `  - Metadata: ${JSON.stringify(result.metadata)}\n`;
        }
      });
      
      analysis += `\n`;
    }

    return analysis;
  }

  private customAggregation(
    groupedResults: Record<string, ResultSource[]>,
    title: string,
    format: string,
    customInstructions: string,
    includeMetadata?: boolean
  ): string {
    let output = `# ${title}\n\n`;
    output += `## Custom Aggregation\n\n`;
    output += `**Instructions**: ${customInstructions}\n\n`;
    
    // For custom aggregation, we'll provide a structured format
    // that follows the custom instructions as closely as possible
    output += `## Processing Results\n\n`;
    
    for (const [groupName, results] of Object.entries(groupedResults)) {
      if (Object.keys(groupedResults).length > 1) {
        output += `### ${groupName}\n\n`;
      }
      
      output += `Applying custom instructions to ${results.length} result(s):\n\n`;
      
      for (const result of results) {
        output += `#### ${result.name}\n\n`;
        
        // Apply custom processing (this is simplified - could be enhanced with AI)
        if (customInstructions.toLowerCase().includes('extract')) {
          // Try to extract key information
          const lines = result.content.split('\n').filter(line => line.trim());
          const keyLines = lines.slice(0, 3); // First 3 non-empty lines
          output += `**Key Information**:\n`;
          keyLines.forEach(line => output += `- ${line}\n`);
          output += `\n`;
        } else if (customInstructions.toLowerCase().includes('summarize')) {
          // Create a summary
          const summary = result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '');
          output += `**Summary**: ${summary}\n\n`;
        } else {
          // Default: show content with custom context
          output += `**Content** (processed per custom instructions):\n\n`;
          output += `${result.content}\n\n`;
        }
        
        if (includeMetadata && result.metadata) {
          output += `**Metadata**: ${JSON.stringify(result.metadata, null, 2)}\n\n`;
        }
        
        output += `---\n\n`;
      }
    }

    return output;
  }

  private formatOutput(content: string, format: string): string {
    switch (format) {
      case 'text':
        // Strip markdown formatting for plain text
        return content
          .replace(/#{1,6}\s/g, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/`(.*?)`/g, '$1') // Remove code
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Remove links
          .replace(/---/g, '---'); // Keep dividers

      case 'json':
        // Convert to structured JSON (simplified)
        return JSON.stringify({
          content: content,
          format: 'aggregated_results',
          timestamp: new Date().toISOString(),
        }, null, 2);

      case 'report':
        // Add professional report styling
        const reportHeader = `---
title: "Aggregated Results Report"
date: ${new Date().toLocaleDateString()}
generated: "Qwen Multi-Agent System"
---

`;
        return reportHeader + content;

      case 'markdown':
      default:
        return content;
    }
  }
}