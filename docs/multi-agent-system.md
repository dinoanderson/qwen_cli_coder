# Multi-Agent System Documentation

## Overview

The Qwen CLI now includes a powerful multi-agent system that enables parallel task execution and intelligent workflow coordination. This system allows you to break down complex tasks into smaller, manageable subtasks that can be executed simultaneously by independent Qwen agents.

## Architecture

The multi-agent system consists of four main components:

### 1. SubAgentTool (`spawn_sub_agent`)
- **Purpose**: Spawn individual sub-agents to handle specific tasks
- **Capabilities**: 
  - Non-interactive Qwen CLI execution
  - Real-time output streaming
  - Timeout management
  - Error handling and recovery

### 2. ParallelExecutor
- **Purpose**: Manage multiple concurrent sub-agents
- **Capabilities**:
  - Task queuing and prioritization
  - Resource management and concurrency control
  - Progress monitoring across all agents
  - Result aggregation and coordination

### 3. DelegateTask Tool (`delegate_task`)
- **Purpose**: Intelligent task splitting and coordination
- **Capabilities**:
  - Automatic task breakdown
  - Parallel or sequential execution modes
  - Smart scheduling and resource allocation
  - Comprehensive result aggregation

### 4. AggregateResults Tool (`aggregate_results`)
- **Purpose**: Combine and analyze results from multiple sources
- **Capabilities**:
  - Multiple aggregation strategies (summary, merge, compare, analyze)
  - Various output formats (markdown, text, JSON, report)
  - Content analysis and pattern recognition
  - Custom processing instructions

## Core Tools

### SubAgentTool

**Tool Name**: `spawn_sub_agent`

**Parameters**:
```json
{
  "task": "string (required)",
  "context": "string (optional)",
  "timeout": "number (optional, 5-300 seconds)",
  "priority": "string (optional: low/medium/high)",
  "working_directory": "string (optional, relative path)"
}
```

**Example Usage**:
```
Use the spawn_sub_agent tool to create a simple Node.js web server:
- task: "Create a simple Express.js web server that serves a 'Hello World' page on port 3000"
- timeout: 120
- priority: "high"
```

### DelegateTask Tool

**Tool Name**: `delegate_task`

**Parameters**:
```json
{
  "mainTask": "string (required)",
  "subtasks": [
    {
      "task": "string (required)",
      "context": "string (optional)",
      "priority": "string (optional: low/medium/high)",
      "timeout": "number (optional, 5-300 seconds)",
      "working_directory": "string (optional)"
    }
  ],
  "executionMode": "string (optional: parallel/sequential)",
  "maxConcurrentAgents": "number (optional, 1-5)",
  "waitForCompletion": "boolean (optional, default: true)",
  "aggregateResults": "boolean (optional, default: true)"
}
```

**Example Usage**:
```
Use the delegate_task tool to build a full-stack web application:
- mainTask: "Create a complete to-do list web application"
- subtasks:
  - task: "Set up the frontend with React and TypeScript"
    priority: "high"
  - task: "Create a Node.js backend API with Express"
    priority: "high"
  - task: "Set up a SQLite database with user authentication"
    priority: "medium"
  - task: "Write comprehensive tests for both frontend and backend"
    priority: "medium"
- executionMode: "parallel"
- maxConcurrentAgents: 3
```

### AggregateResults Tool

**Tool Name**: `aggregate_results`

**Parameters**:
```json
{
  "results": [
    {
      "name": "string (required)",
      "content": "string (required)",
      "metadata": "object (optional)"
    }
  ],
  "aggregationType": "string (optional: summary/merge/compare/analyze/custom)",
  "title": "string (optional)",
  "format": "string (optional: markdown/text/json/report)",
  "includeMetadata": "boolean (optional)",
  "customInstructions": "string (optional, required for custom type)",
  "groupBy": "string (optional)",
  "sortBy": "string (optional: name/length/timestamp/custom)"
}
```

## Usage Patterns

### Pattern 1: Simple Task Delegation

For breaking down a single complex task into multiple independent subtasks:

```
Use delegate_task to analyze multiple log files:
- mainTask: "Analyze system logs for errors and performance issues"
- subtasks:
  - task: "Analyze error.log for critical errors and exceptions"
  - task: "Analyze access.log for traffic patterns and bottlenecks"  
  - task: "Analyze performance.log for slow queries and timeouts"
- executionMode: "parallel"
```

### Pattern 2: Sequential Workflow

For tasks that must be executed in a specific order:

```
Use delegate_task to deploy an application:
- mainTask: "Deploy web application to production"
- subtasks:
  - task: "Run test suite and verify all tests pass"
    priority: "high"
  - task: "Build production bundle and optimize assets"
    priority: "high"
  - task: "Deploy to staging environment and run smoke tests"
    priority: "high"
  - task: "Deploy to production environment"
    priority: "high"
- executionMode: "sequential"
```

### Pattern 3: Research and Analysis

For gathering information from multiple sources:

```
First use delegate_task to gather research:
- mainTask: "Research modern web development frameworks"
- subtasks:
  - task: "Research React ecosystem and best practices"
  - task: "Research Vue.js ecosystem and best practices"
  - task: "Research Angular ecosystem and best practices"
  - task: "Research performance comparison between frameworks"

Then use aggregate_results to combine findings:
- aggregationType: "compare"
- format: "report"
- title: "Web Framework Comparison Report"
```

### Pattern 4: Code Generation

For creating multiple related components:

```
Use delegate_task to create a complete API:
- mainTask: "Create REST API for user management system"
- subtasks:
  - task: "Create user model and database schema"
  - task: "Create authentication middleware and JWT handling"
  - task: "Create user registration and login endpoints"
  - task: "Create user profile management endpoints"
  - task: "Create API documentation with OpenAPI/Swagger"
- executionMode: "parallel"
- maxConcurrentAgents: 3
```

## Best Practices

### Task Design

1. **Make subtasks independent**: For parallel execution, ensure subtasks don't depend on each other
2. **Be specific**: Provide clear, detailed task descriptions for better results
3. **Set appropriate timeouts**: Consider the complexity of each subtask
4. **Use priorities**: Mark critical tasks as high priority

### Resource Management

1. **Limit concurrent agents**: Start with 2-3 concurrent agents and adjust based on system performance
2. **Monitor execution**: Use real-time progress updates to track task completion
3. **Handle failures gracefully**: Include error handling and recovery strategies

### Result Processing

1. **Aggregate intelligently**: Choose the right aggregation type for your use case
2. **Include context**: Provide sufficient context for meaningful aggregation
3. **Format appropriately**: Select output format based on intended use

## Performance Considerations

### Concurrency Limits

- Default maximum: 3 concurrent agents
- Recommended range: 1-5 agents depending on system resources
- Consider CPU, memory, and I/O constraints

### Timeout Management

- Default timeout: 60 seconds per subtask
- Range: 5-300 seconds
- Set based on expected task complexity

### Resource Usage

- Each sub-agent runs in a separate Node.js process
- Memory usage scales with number of concurrent agents
- Monitor system resources during heavy multi-agent operations

## Error Handling

### Common Error Scenarios

1. **Subtask timeout**: Tasks that exceed their timeout limit
2. **Resource exhaustion**: Too many concurrent agents
3. **Dependency failures**: Sequential tasks that depend on previous results
4. **Invalid parameters**: Malformed task descriptions or parameters

### Recovery Strategies

1. **Automatic retry**: Failed tasks can be automatically retried (configurable)
2. **Graceful degradation**: Continue with successful results even if some tasks fail
3. **Error aggregation**: Collect and report all errors in the final summary

## Advanced Features

### Custom Aggregation

Use custom aggregation for specialized result processing:

```
Use aggregate_results with custom instructions:
- aggregationType: "custom"
- customInstructions: "Extract all function names and their descriptions from the code samples, create a reference guide"
```

### Metadata Tracking

Include metadata for enhanced result processing:

```json
{
  "name": "Frontend Analysis",
  "content": "React application analysis results...",
  "metadata": {
    "timestamp": "2025-01-01T12:00:00Z",
    "category": "frontend",
    "complexity": "high",
    "duration": 45.2
  }
}
```

### Dynamic Task Creation

Sub-agents can create additional subtasks by using the delegation tools themselves, enabling recursive task breakdown and truly dynamic workflows.

## Examples

See the `examples/` directory for complete examples demonstrating:

- Multi-agent code analysis
- Parallel testing workflows
- Documentation generation
- Research and comparison tasks
- Complex deployment pipelines

## Troubleshooting

### Common Issues

1. **Agents not starting**: Check that the Qwen CLI executable is available
2. **Tasks timing out**: Increase timeout values or break tasks into smaller pieces
3. **Resource constraints**: Reduce concurrent agent count
4. **Inconsistent results**: Ensure task descriptions are clear and specific

### Debug Mode

Enable debug mode for detailed execution logs:

```bash
DEBUG=1 qwen -p "your prompt here"
```

This will show detailed information about sub-agent spawning, execution, and coordination.

## Security Considerations

- Sub-agents inherit the same security context as the main agent
- Each sub-agent has access to the same tools and file system
- Consider the principle of least privilege when designing multi-agent workflows
- Monitor resource usage to prevent system overload

## Future Enhancements

The multi-agent system is designed for extensibility. Planned enhancements include:

- Advanced scheduling algorithms
- Cross-agent communication channels
- Persistent task queues
- Distributed execution across multiple machines
- Enhanced error recovery and retry mechanisms
- Performance analytics and optimization suggestions