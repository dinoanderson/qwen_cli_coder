# Qwen CLI Configuration

This directory contains project-specific configuration for Qwen CLI.

## Files

- `settings.json` - Your project-specific Qwen CLI settings (create manually or via CLI commands)
- `settings.example.json` - Example configuration with DuckDuckGo MCP server setup

## Quick Setup for Web Search

To enable web search with DuckDuckGo:

1. **Install the MCP server:**
   ```bash
   npm install -g @nickclyde/duckduckgo-mcp-server
   ```

2. **Copy example settings:**
   ```bash
   cp .qwen/settings.example.json .qwen/settings.json
   ```

3. **Restart Qwen CLI**

## Configuration Hierarchy

Settings are loaded in this order (later overrides earlier):
1. Global settings: `~/.qwen/settings.json`
2. Project settings: `./.qwen/settings.json`

## Common Settings

- `theme` - Visual theme (e.g., "default-dark", "default-light")
- `language` - Interface language ("en" or "zh")
- `mcpServers` - MCP server configurations for additional tools
- `selectedAuthType` - Authentication method
- `fileFiltering` - File discovery and search settings

For more information, see the [documentation](../docs/cli/configuration.md).