# Development Tools

This directory contains utility scripts for development and testing.

## Scripts

- `debug-cli.sh` - Debug the CLI with detailed logging
- `debug-tools.js` - Debug tool execution and MCP server integration
- `interactive-test.sh` - Run interactive CLI tests
- `simple-test.sh` - Run simple CLI functionality tests
- `cli-test.sh` - Comprehensive CLI testing script

## Usage

All scripts can be run from the project root:

```bash
# Debug CLI with verbose output
./tools/debug-cli.sh

# Test tool integration
node tools/debug-tools.js

# Run interactive tests
./tools/interactive-test.sh

# Run simple functionality tests
./tools/simple-test.sh

# Run comprehensive CLI tests
./tools/cli-test.sh
```

## Environment Setup

Most scripts require a Qwen API key to be set:

```bash
export DASHSCOPE_API_KEY=your-api-key-here
```

Or use a `.env` file in the project root or `~/.qwen/` directory.