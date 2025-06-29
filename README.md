# Qwen CLI - Community Fork

> **A community fork of Google's Gemini CLI, modified to work with Qwen models from Alibaba Cloud**

![Qwen CLI Screenshot](./docs/assets/qwen-screenshot.png)

This repository contains a community-maintained fork of Google's Gemini CLI, modified to work with Qwen models. It's a command-line AI workflow tool that connects to your tools, understands your code and accelerates your workflows using Qwen's powerful language models.

## Attribution

This project is a community fork of [Google's Gemini CLI](https://github.com/google-gemini/gemini-cli), originally developed by Google. We've modified it to work with Qwen models from Alibaba Cloud while maintaining the excellent architecture and functionality of the original project.

**Original Project**: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)  
**Original License**: Apache License 2.0  
**This Fork**: Community-maintained, independent project

## What You Can Do

With the Qwen CLI you can:

- Query and edit large codebases using Qwen's 131k+ token context window
- Generate new apps from PDFs or sketches, using Qwen's multimodal capabilities
- Automate operational tasks, like querying pull requests or handling complex rebases
- Use tools and MCP servers to connect new capabilities
- Advanced vision capabilities with Qwen VL models for image analysis and processing

## Quickstart

> **Note**: This is a community fork. Installation requires building from source as it's not published to npm registries.

1. **Prerequisites:** Ensure you have [Node.js version 18](https://nodejs.org/en/download) or higher installed.

2. **Clone and Build:**
   ```bash
   git clone https://github.com/[your-username]/qwen-cli-fork
   cd qwen-cli-fork
   npm install
   npm run build
   npm run bundle
   ```

3. **Run the CLI:**
   ```bash
   node bundle/qwen.js
   ```

4. **Set up Authentication:** Configure your Qwen API key from Alibaba Cloud DashScope:
   ```bash
   export DASHSCOPE_API_KEY="your-api-key-here"
   # or
   export QWEN_API_KEY="your-api-key-here"
   ```

5. **Pick a color theme** and start using the CLI!

You are now ready to use the Qwen CLI fork!

### Getting Your Qwen API Key

1. Create an account at [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/)
2. Navigate to the API Keys section in your dashboard
3. Create a new API key for DashScope services
4. Set it as an environment variable as shown above

### Supported Models

This fork supports the following Qwen models:
- **qwen-turbo-latest** - Fast model with 1M context window
- **qwen3-235b-a22b** - Most capable model with 131k context window  
- **qwen-vl-plus-latest** - Vision model for image analysis (32k context)

For detailed model specifications, see our [model documentation](./docs/providers/qwen.md).

## Examples

Once the CLI is running, you can start interacting with Qwen from your shell.

You can start a project from a new directory:

```sh
cd new-project/
node /path/to/bundle/qwen.js
> Write me a Discord bot that answers questions using a FAQ.md file I will provide
```

Or work with an existing project:

```sh
git clone https://github.com/[your-username]/qwen-cli-fork
cd qwen-cli-fork
node bundle/qwen.js
> Give me a summary of all of the changes that went in yesterday
```

### Next steps

- Learn how to [contribute to this community fork](./CONTRIBUTING.md)
- Explore the available **[CLI Commands](./docs/cli/commands.md)**
- If you encounter any issues, review the **[Troubleshooting guide](./docs/troubleshooting.md)**
- For more comprehensive documentation, see the [full documentation](./docs/index.md)
- Take a look at some [popular tasks](#popular-tasks) for more inspiration
- Check out the [original Gemini CLI](https://github.com/google-gemini/gemini-cli) for updates and comparisons

### Troubleshooting

Head over to the [troubleshooting](docs/troubleshooting.md) guide if you're
having issues.

## Popular tasks

### Explore a new codebase

Start by `cd`ing into an existing or newly-cloned repository and running the Qwen CLI.

```text
> Describe the main pieces of this system's architecture.
```

```text
> What security mechanisms are in place?
```

### Work with your existing code

```text
> Implement a first draft for GitHub issue #123.
```

```text
> Help me migrate this codebase to the latest version of Java. Start with a plan.
```

### Automate your workflows

Use MCP servers to integrate your local system tools with your enterprise collaboration suite.

```text
> Make me a slide deck showing the git history from the last 7 days, grouped by feature and team member.
```

```text
> Make a full-screen web app for a wall display to show our most interacted-with GitHub issues.
```

### Interact with your system

```text
> Convert all the images in this directory to png, and rename them to use dates from the exif data.
```

```text
> Organise my PDF invoices by month of expenditure.
```

## Community Fork Notice

This is a community-maintained fork of Google's Gemini CLI. It is not affiliated with, endorsed by, or supported by Google or Alibaba Cloud. 

- **Original Project**: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) by Google
- **This Fork**: Community project for Qwen model integration
- **Support**: Community-based support through GitHub issues
- **License**: Apache License 2.0 (same as original)

For the original project's terms of service and privacy notice, see the [original repository](https://github.com/google-gemini/gemini-cli).

### Contributing to This Fork

We welcome contributions to improve Qwen model integration and CLI functionality. Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines specific to this community fork.
