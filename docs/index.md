# Welcome to Qwen CLI (Community Fork) Documentation

This documentation provides a comprehensive guide to installing, using, and developing this community fork of Qwen CLI, modified to work with Qwen models. This tool lets you interact with Qwen AI models from Alibaba Cloud through a command-line interface.

> **Note**: This is a community fork of [Google's Qwen CLI](https://github.com/google-Qwen/Qwen-cli). For the original documentation, see the [original repository](https://github.com/google-Qwen/Qwen-cli).

## Overview

This Qwen CLI fork brings the capabilities of Qwen AI models to your terminal in an interactive Read-Eval-Print Loop (REPL) environment. This community fork focuses specifically on Alibaba's Qwen models, providing optimized integration for Qwen's capabilities. The CLI consists of a client-side application (`packages/cli`) that communicates with a local server (`packages/core`), which manages requests to Qwen APIs. The CLI includes a variety of tools for tasks such as performing file system operations, running shells, and web fetching, all managed by `packages/core`.

## Navigating the documentation

This documentation is organized into the following sections:

- **[Execution and Deployment](./deployment.md):** Information for running this Qwen CLI fork.
- **[Architecture Overview](./architecture.md):** Understand the high-level design of Qwen CLI, including its components and how they interact.
- **CLI Usage:** Documentation for `packages/cli`.
  - **[CLI Introduction](./cli/index.md):** Overview of the command-line interface.
  - **[Authentication](./cli/authentication.md):** How to authenticate with different AI providers.
  - **[Commands](./cli/commands.md):** Description of available CLI commands.
  - **[Configuration](./cli/configuration.md):** Information on configuring the CLI.
  - **[Checkpointing](./checkpointing.md):** Documentation for the checkpointing feature.
  - **[Extensions](./extension.md):** How to extend the CLI with new functionality.
  - **[Telemetry](./telemetry.md):** Overview of telemetry in the CLI.
- **Core Details:** Documentation for `packages/core`.
  - **[Core Introduction](./core/index.md):** Overview of the core component.
  - **[Tools API](./core/tools-api.md):** Information on how the core manages and exposes tools.
- **Tools:**
  - **[Tools Overview](./tools/index.md):** Overview of the available tools.
  - **[File System Tools](./tools/file-system.md):** Documentation for the `read_file` and `write_file` tools.
  - **[Multi-File Read Tool](./tools/multi-file.md):** Documentation for the `read_many_files` tool.
  - **[Shell Tool](./tools/shell.md):** Documentation for the `run_shell_command` tool.
  - **[Web Fetch Tool](./tools/web-fetch.md):** Documentation for the `web_fetch` tool.
  - **[Web Search Tool](./tools/web-search.md):** Documentation for the `web_search` tool.
  - **[Memory Tool](./tools/memory.md):** Documentation for the `save_memory` tool.
- **AI Providers:**
  - **[Qwen Provider](./providers/qwen.md):** Using Qwen/DashScope models as an alternative to Qwen.
- **[Contributing & Development Guide](../CONTRIBUTING.md):** Information for contributors and developers, including setup, building, testing, and coding conventions.
- **[Troubleshooting Guide](./troubleshooting.md):** Find solutions to common problems and FAQs.
- **[Terms of Service and Privacy Notice](./tos-privacy.md):** Information on the terms of service and privacy notices applicable to your use of Qwen CLI.

We hope this documentation helps you make the most of the Qwen CLI!
