# Multi-Agent System Examples

This document provides practical examples of using the Qwen CLI multi-agent system for complex tasks.

## Example 1: Full-Stack Web Application Development

This example demonstrates how to use the multi-agent system to build a complete web application with parallel development of frontend and backend components.

### Task: Create a Task Management Web Application

```bash
# Use the delegate_task tool with the following parameters:

Use delegate_task to create a full-stack task management application:
- mainTask: "Create a complete task management web application with React frontend and Node.js backend"
- subtasks:
  - task: "Set up React frontend with TypeScript, create components for task list, task form, and user authentication"
    priority: "high"
    timeout: 180
    working_directory: "frontend"
  - task: "Create Node.js backend with Express, implement REST API for tasks and user management with JWT authentication"
    priority: "high"
    timeout: 180
    working_directory: "backend"
  - task: "Set up SQLite database with migrations, create tables for users and tasks"
    priority: "medium"
    timeout: 120
    working_directory: "backend"
  - task: "Write comprehensive tests for both frontend components and backend API endpoints"
    priority: "medium"
    timeout: 150
    working_directory: "."
  - task: "Create Docker configuration and deployment scripts for production deployment"
    priority: "low"
    timeout: 120
    working_directory: "."
- executionMode: "parallel"
- maxConcurrentAgents: 3
- waitForCompletion: true
- aggregateResults: true
```

**Expected Outcome:**
- 4-5 sub-agents working in parallel
- Complete application with frontend, backend, database, tests, and deployment
- Aggregated report showing all components and their status

## Example 2: Code Analysis and Refactoring

This example shows how to analyze a large codebase across multiple files and languages.

### Task: Analyze and Improve Code Quality

```bash
# Step 1: Use delegate_task for parallel analysis

Use delegate_task to analyze codebase for quality issues:
- mainTask: "Comprehensive code quality analysis of the entire project"
- subtasks:
  - task: "Analyze all TypeScript files for code quality, find potential bugs, unused imports, and optimization opportunities"
    priority: "high"
    timeout: 120
  - task: "Analyze all Python files for PEP 8 compliance, potential security issues, and performance improvements"
    priority: "high"
    timeout: 120
  - task: "Review all configuration files (package.json, tsconfig.json, etc.) for best practices and security"
    priority: "medium"
    timeout: 90
  - task: "Analyze test coverage and identify areas needing additional tests"
    priority: "medium"
    timeout: 90
  - task: "Review documentation for completeness and accuracy"
    priority: "low"
    timeout: 60
- executionMode: "parallel"
- maxConcurrentAgents: 4

# Step 2: Aggregate and prioritize findings

Use aggregate_results to create action plan:
- aggregationType: "analyze"
- title: "Code Quality Analysis Report"
- format: "report"
- includeMetadata: true
- sortBy: "timestamp"
```

**Expected Outcome:**
- Detailed analysis of code quality across all languages
- Prioritized list of improvements
- Comprehensive report with actionable recommendations

## Example 3: Research and Documentation

This example demonstrates parallel research tasks and intelligent result aggregation.

### Task: Technology Stack Research

```bash
# Step 1: Parallel research on different technologies

Use delegate_task for technology research:
- mainTask: "Research modern web development technologies for choosing the best stack"
- subtasks:
  - task: "Research React ecosystem: latest features, performance characteristics, community support, and best practices"
    priority: "high"
    timeout: 150
  - task: "Research Vue.js ecosystem: latest features, performance characteristics, community support, and best practices"
    priority: "high"
    timeout: 150
  - task: "Research Svelte/SvelteKit: features, performance, ecosystem, and production readiness"
    priority: "high"
    timeout: 150
  - task: "Research backend technologies: Node.js vs Python vs Go for web APIs, performance and scalability comparison"
    priority: "medium"
    timeout: 120
  - task: "Research database options: PostgreSQL vs MongoDB vs SQLite for different use cases"
    priority: "medium"
    timeout: 120
- executionMode: "parallel"
- maxConcurrentAgents: 3

# Step 2: Compare and analyze research results

Use aggregate_results for comparison:
- aggregationType: "compare"
- title: "Technology Stack Comparison"
- format: "report"
- customInstructions: "Create a detailed comparison table with pros/cons for each technology, include performance metrics where available"
```

**Expected Outcome:**
- Comprehensive research on each technology
- Side-by-side comparison with pros and cons
- Data-driven recommendations for technology selection

## Example 4: Testing and Quality Assurance

This example shows how to run comprehensive testing across different categories in parallel.

### Task: Comprehensive Testing Suite

```bash
# Use delegate_task for parallel testing

Use delegate_task to run comprehensive test suite:
- mainTask: "Execute complete testing pipeline with different test types"
- subtasks:
  - task: "Run unit tests for all modules, generate coverage report, identify untested code"
    priority: "high"
    timeout: 180
  - task: "Run integration tests, test API endpoints and database interactions"
    priority: "high"
    timeout: 200
  - task: "Run end-to-end tests with Playwright, test complete user workflows"
    priority: "high"
    timeout: 300
  - task: "Run performance tests, benchmark API response times and identify bottlenecks"
    priority: "medium"
    timeout: 240
  - task: "Run security tests, check for vulnerabilities and security best practices"
    priority: "medium"
    timeout: 180
  - task: "Run accessibility tests, ensure WCAG compliance"
    priority: "low"
    timeout: 120
- executionMode: "parallel"
- maxConcurrentAgents: 4
- waitForCompletion: true
```

**Expected Outcome:**
- Complete test suite execution in parallel
- Comprehensive testing report with all results
- Performance, security, and accessibility analysis

## Example 5: Content Generation

This example demonstrates parallel content creation for documentation and marketing.

### Task: Create Complete Project Documentation

```bash
# Step 1: Generate different types of documentation in parallel

Use delegate_task for documentation creation:
- mainTask: "Create comprehensive documentation suite for the project"
- subtasks:
  - task: "Create detailed API documentation with examples for all endpoints"
    priority: "high"
    timeout: 120
  - task: "Write user guide with step-by-step tutorials and common use cases"
    priority: "high"
    timeout: 150
  - task: "Create developer setup guide with installation and configuration instructions"
    priority: "high"
    timeout: 90
  - task: "Write troubleshooting guide with common issues and solutions"
    priority: "medium"
    timeout: 90
  - task: "Create changelog and migration guide for version updates"
    priority: "medium"
    timeout: 60
  - task: "Generate README with project overview, features, and quick start"
    priority: "low"
    timeout: 60
- executionMode: "parallel"
- maxConcurrentAgents: 3

# Step 2: Merge all documentation into cohesive structure

Use aggregate_results to organize documentation:
- aggregationType: "merge"
- title: "Complete Project Documentation"
- format: "markdown"
- sortBy: "custom"
```

**Expected Outcome:**
- Complete documentation suite created in parallel
- Well-organized, cohesive documentation structure
- Professional documentation ready for users and developers

## Example 6: Data Processing Pipeline

This example shows how to process large datasets with parallel agents.

### Task: Process and Analyze Large Dataset

```bash
# Use delegate_task for parallel data processing

Use delegate_task to process customer data:
- mainTask: "Process and analyze customer database for insights and reporting"
- subtasks:
  - task: "Clean and validate customer data, remove duplicates and fix formatting issues"
    priority: "high"
    timeout: 180
    working_directory: "data"
  - task: "Analyze customer demographics and create demographic reports with visualizations"
    priority: "high"
    timeout: 150
    working_directory: "data"
  - task: "Analyze purchase patterns and identify trends and seasonal variations"
    priority: "high"
    timeout: 150
    working_directory: "data"
  - task: "Generate customer segmentation analysis and create customer personas"
    priority: "medium"
    timeout: 120
    working_directory: "data"
  - task: "Create predictive models for customer churn and lifetime value"
    priority: "medium"
    timeout: 200
    working_directory: "data"
  - task: "Generate executive summary dashboard with key metrics and insights"
    priority: "low"
    timeout: 90
    working_directory: "data"
- executionMode: "parallel"
- maxConcurrentAgents: 4
```

**Expected Outcome:**
- Parallel processing of different data analysis tasks
- Complete customer insights and analytics
- Executive dashboard with key findings

## Advanced Usage Patterns

### Pattern 1: Nested Delegation

Sub-agents can themselves use delegation for complex hierarchical tasks:

```bash
# Parent task
Use delegate_task for microservices architecture:
- mainTask: "Create complete microservices system"
- subtasks:
  - task: "Use delegate_task to create user service with authentication, profile management, and user preferences"
  - task: "Use delegate_task to create product service with catalog, search, and inventory management"
  - task: "Use delegate_task to create order service with cart, checkout, and payment processing"
```

### Pattern 2: Conditional Execution

Use results from one delegation to inform the next:

```bash
# Step 1: Analysis phase
Use delegate_task to analyze system requirements

# Step 2: Based on analysis results, create implementation plan
Use spawn_sub_agent with context from analysis to create detailed implementation plan

# Step 3: Execute implementation with parallel agents
Use delegate_task with subtasks based on the implementation plan
```

### Pattern 3: Iterative Refinement

Use multiple rounds of delegation for iterative improvement:

```bash
# Round 1: Initial implementation
Use delegate_task to create initial version

# Round 2: Review and improve
Use delegate_task to review each component and suggest improvements

# Round 3: Apply improvements
Use delegate_task to implement suggested improvements in parallel
```

## Performance Tips

1. **Optimize task size**: Balance between too many small tasks (overhead) and too few large tasks (poor parallelization)

2. **Use appropriate timeouts**: Set timeouts based on task complexity, not too short (premature termination) or too long (resource waste)

3. **Monitor resource usage**: Watch CPU and memory usage, adjust concurrent agent count accordingly

4. **Batch similar operations**: Group similar tasks together for better resource utilization

5. **Cache results**: For repeated operations, consider implementing result caching

## Debugging Multi-Agent Workflows

### Enable Debug Mode

```bash
DEBUG=1 qwen -p "your multi-agent task"
```

### Common Issues and Solutions

1. **Tasks hanging**: Check for infinite loops or blocking operations
2. **Resource exhaustion**: Reduce concurrent agents or increase timeouts
3. **Inconsistent results**: Ensure task descriptions are specific and deterministic
4. **Partial failures**: Implement proper error handling and recovery strategies

### Monitoring Execution

Use the progress monitoring features to track:
- Task start and completion times
- Resource usage patterns
- Error rates and types
- Performance bottlenecks

These examples demonstrate the power and flexibility of the Qwen CLI multi-agent system. Start with simpler examples and gradually work up to more complex workflows as you become comfortable with the tools and patterns.