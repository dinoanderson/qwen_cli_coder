# Web Search Tool (`google_web_search`)

This document describes the `google_web_search` tool, which now uses MCP (Model Context Protocol) servers for web search functionality.

## Description

Use `google_web_search` to perform a web search using DuckDuckGo via an MCP server. The `google_web_search` tool returns a summary of web results with sources. This tool provides privacy-focused web search capabilities without tracking users.

### Arguments

`google_web_search` takes one argument:

- `query` (string, required): The search query.

## Setup Requirements

Before using the web search tool, you need to configure a DuckDuckGo MCP server:

### 1. Install DuckDuckGo MCP Server

Choose one of the available MCP servers:

```bash
# Option 1: Nick Clyde's comprehensive implementation (Recommended)
npm install -g @nickclyde/duckduckgo-mcp-server

# Option 2: Spences10's implementation with SerpAPI support
npm install -g @spences10/mcp-duckduckgo-search

# Option 3: Gianluca Mazza's Claude-optimized version
npm install -g @gianlucamazza/mcp-duckduckgo
```

### 2. Configure MCP Server

Add the MCP server to your `.gemini/settings.json` file:

```json
{
  "mcpServers": {
    "duckduckgo": {
      "command": "npx",
      "args": ["-y", "@nickclyde/duckduckgo-mcp-server"],
      "timeout": 30000
    }
  }
}
```

#### Alternative Configurations

**For SerpAPI-enhanced results:**
```json
{
  "mcpServers": {
    "duckduckgo": {
      "command": "npx", 
      "args": ["-y", "@spences10/mcp-duckduckgo-search"],
      "env": {
        "SERPAPI_KEY": "$SERPAPI_KEY"
      },
      "timeout": 30000
    }
  }
}
```

**For Claude Code optimized version:**
```json
{
  "mcpServers": {
    "duckduckgo": {
      "command": "npx",
      "args": ["-y", "@gianlucamazza/mcp-duckduckgo"],
      "timeout": 30000
    }
  }
}
```

### 3. Restart the CLI

After configuration, restart the CLI to load the MCP server.

## How to use `google_web_search` 

The `google_web_search` tool automatically detects and uses the configured DuckDuckGo MCP server. If no MCP server is configured, it will provide setup instructions.

Usage:

```
google_web_search(query="Your query goes here.")
```

## `google_web_search` examples

Get information on a topic:

```
google_web_search(query="latest advancements in AI-powered code generation")
```

Search for specific technologies:

```
google_web_search(query="Qwen AI model capabilities 2024")
```

## Features

- **Privacy-focused:** Uses DuckDuckGo which doesn't track users
- **Multiple sources:** Returns results with proper citations and source links
- **Structured results:** Provides both LLM-friendly content and formatted display
- **Regional filtering:** Supports safe search and regional preferences (depending on MCP server)
- **Rate limiting:** Built-in rate limiting to prevent API abuse

## Important notes

- **Setup required:** The tool requires a DuckDuckGo MCP server to be configured
- **No tracking:** Unlike Google Search, DuckDuckGo respects user privacy
- **Response format:** Returns processed results with citations and source links
- **Fallback:** If MCP server fails, the tool provides helpful error messages with setup instructions
- **Provider agnostic:** Works with any LLM provider (Qwen, Gemini, etc.)

## Troubleshooting

### "Web search not configured" error

This means no DuckDuckGo MCP server is detected. Follow the setup steps above.

### MCP server connection issues

1. Verify the MCP server is properly installed
2. Check your `.gemini/settings.json` configuration
3. Restart the CLI after making changes
4. Use `/mcp` command to check server status

### No search results

1. Try different search terms
2. Check your internet connection  
3. Verify the MCP server is responding with `/mcp` command

For more information about MCP servers, see the [MCP Server documentation](./mcp-server.md).
