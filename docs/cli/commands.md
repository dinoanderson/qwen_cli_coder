# CLI Commands

Qwen CLI supports several built-in commands to help you manage your session, customize the interface, and control its behavior. These commands are prefixed with a forward slash (`/`), an at symbol (`@`), or an exclamation mark (`!`).

## Slash commands (`/`)

Slash commands provide meta-level control over the CLI itself.

- **`/bug`**

  - **Description:** File an issue about Qwen CLI. By default, the issue is filed within the GitHub repository for Qwen CLI. The string you enter after `/bug` will become the headline for the bug being filed. The default `/bug` behavior can be modified using the `bugCommand` setting in your `.Qwen/settings.json` files.

- **`/chat`**

  - **Description:** Save and resume conversation history for branching conversation state interactively, or resuming a previous state from a later session.
  - **Sub-commands:**
    - **`save`**
      - **Description:** Saves the current conversation history. You must add a `<tag>` for identifying the conversation state.
      - **Usage:** `/chat save <tag>`
    - **`resume`**
      - **Description:** Resumes a conversation from a previous save.
      - **Usage:** `/chat resume <tag>`
    - **`list`**
      - **Description:** Lists available tags for chat state resumption.

- **`/clear`**

  - **Description:** Clear the terminal screen, including the visible session history and scrollback within the CLI. The underlying session data (for history recall) might be preserved depending on the exact implementation, but the visual display is cleared.
  - **Keyboard shortcut:** Press **Ctrl+L** at any time to perform a clear action.

- **`/compress`**

  - **Description:** Replace the entire chat context with a summary. This saves on tokens used for future tasks while retaining a high level summary of what has happened.

- **`/editor`**

  - **Description:** Open a dialog for selecting supported editors.

- **`/help`** (or **`/?`**)

  - **Description:** Display help information about the Qwen CLI, including available commands and their usage.

- **`/lang`**

  - **Description:** Open a dialog to switch the interface language between English and Chinese. The selected language affects all UI text, command descriptions, help content, and system prompts.
  - **Features:**
    - Full UI translation (menus, help text, command descriptions)
    - System prompts automatically adapt to selected language
    - Settings are persisted across sessions
    - Real-time UI refresh after language change
  - **Supported Languages:**
    - **English** (`en`) - Default interface language
    - **中文简体** (`zh`) - Simplified Chinese interface

- **`/mcp`**

  - **Description:** List configured Model Context Protocol (MCP) servers, their connection status, server details, and available tools.
  - **Sub-commands:**
    - **`desc`** or **`descriptions`**:
      - **Description:** Show detailed descriptions for MCP servers and tools.
    - **`nodesc`** or **`nodescriptions`**:
      - **Description:** Hide tool descriptions, showing only the tool names.
    - **`schema`**:
      - **Description:** Show the full JSON schema for the tool's configured parameters.
  - **Keyboard Shortcut:** Press **Ctrl+T** at any time to toggle between showing and hiding tool descriptions.

- **`/memory`**

  - **Description:** Manage the AI's instructional context (hierarchical memory loaded from `QWEN.md` files).
  - **Sub-commands:**
    - **`add`**:
      - **Description:** Adds the following text to the AI's memory. Usage: `/memory add <text to remember>`
    - **`show`**:
      - **Description:** Display the full, concatenated content of the current hierarchical memory that has been loaded from all `QWEN.md` files. This lets you inspect the instructional context being provided to the Qwen model.
    - **`refresh`**:
      - **Description:** Reload the hierarchical instructional memory from all `QWEN.md` files found in the configured locations (global, project/ancestors, and sub-directories). This command updates the model with the latest `QWEN.md` content.
    - **Note:** For more details on how `QWEN.md` files contribute to hierarchical memory, see the [CLI Configuration documentation](./configuration.md#4-qwenmd-files-hierarchical-instructional-context).

- **`/model`**

  - **Description:** Open a dialog to switch between different Qwen models. Shows detailed information about each model including context window, output tokens, and special capabilities.
  - **Features:**
    - Interactive dialog showing all available Qwen models
    - Model specifications displayed (context window, output tokens, vision support)
    - Current model highlighted for easy identification
    - Seamless switching without restarting the CLI
    - Model selection persisted across sessions
  - **Available Models:**
    - **qwen-turbo-latest** - Fast model with 1M context window and thinking capabilities
    - **qwen3-235b-a22b** - Most capable model with 131k context window
    - **qwen-vl-plus-latest** - Vision model for image analysis (32k context)
  - **Usage:** Simply type `/model` to open the selection dialog

- **`/restore`**

  - **Description:** Restores the project files to the state they were in just before a tool was executed. This is particularly useful for undoing file edits made by a tool. If run without a tool call ID, it will list available checkpoints to restore from.
  - **Usage:** `/restore [tool_call_id]`
  - **Note:** Only available if the CLI is invoked with the `--checkpointing` option or configured via [settings](./configuration.md). See [Checkpointing documentation](../checkpointing.md) for more details.

- **`/stats`**

  - **Description:** Display detailed statistics for the current Qwen CLI session, including token usage, cached token savings (when available), and session duration. Note: Cached token information is only displayed when cached tokens are being used, which occurs with API key authentication but not with OAuth authentication at this time.

- [**`/theme`**](./themes.md)

  - **Description:** Open a dialog that lets you change the visual theme of Qwen CLI.

- **`/auth`**

  - **Description:** Open a dialog that lets you change the authentication method.

- **`/about`**

  - **Description:** Show version info. Please share this information when filing issues.

- [**`/tools`**](../tools/index.md)

  - **Description:** Display a list of tools that are currently available within Qwen CLI.
  - **Sub-commands:**
    - **`desc`** or **`descriptions`**:
      - **Description:** Show detailed descriptions of each tool, including each tool's name with its full description as provided to the model.
    - **`nodesc`** or **`nodescriptions`**:
      - **Description:** Hide tool descriptions, showing only the tool names.

- **`/quit`** (or **`/exit`**)

  - **Description:** Exit Qwen CLI.

## At commands (`@`)

At commands are used to include the content of files or directories as part of your prompt to Qwen. These commands include git-aware filtering.

- **`@<path_to_file_or_directory>`**

  - **Description:** Inject the content of the specified file or files into your current prompt. This is useful for asking questions about specific code, text, or collections of files.
  - **Examples:**
    - `@path/to/your/file.txt Explain this text.`
    - `@src/my_project/ Summarize the code in this directory.`
    - `What is this file about? @README.md`
  - **Details:**
    - If a path to a single file is provided, the content of that file is read.
    - If a path to a directory is provided, the command attempts to read the content of files within that directory and any subdirectories.
    - Spaces in paths should be escaped with a backslash (e.g., `@My\ Documents/file.txt`).
    - The command uses the `read_many_files` tool internally. The content is fetched and then inserted into your query before being sent to the Qwen model.
    - **Git-aware filtering:** By default, git-ignored files (like `node_modules/`, `dist/`, `.env`, `.git/`) are excluded. This behavior can be changed via the `fileFiltering` settings.
    - **File types:** The command is intended for text-based files. While it might attempt to read any file, binary files or very large files might be skipped or truncated by the underlying `read_many_files` tool to ensure performance and relevance. The tool indicates if files were skipped.
  - **Output:** The CLI will show a tool call message indicating that `read_many_files` was used, along with a message detailing the status and the path(s) that were processed.

- **`@` (Lone at symbol)**
  - **Description:** If you type a lone `@` symbol without a path, the query is passed as-is to the Qwen model. This might be useful if you are specifically talking _about_ the `@` symbol in your prompt.

### Error handling for `@` commands

- If the path specified after `@` is not found or is invalid, an error message will be displayed, and the query might not be sent to the Qwen model, or it will be sent without the file content.
- If the `read_many_files` tool encounters an error (e.g., permission issues), this will also be reported.

## Shell mode & passthrough commands (`!`)

The `!` prefix lets you interact with your system's shell directly from within Qwen CLI.

- **`!<shell_command>`**

  - **Description:** Execute the given `<shell_command>` in your system's default shell. Any output or errors from the command are displayed in the terminal.
  - **Examples:**
    - `!ls -la` (executes `ls -la` and returns to Qwen CLI)
    - `!git status` (executes `git status` and returns to Qwen CLI)

- **`!` (Toggle shell mode)**

  - **Description:** Typing `!` on its own toggles shell mode.
    - **Entering shell mode:**
      - When active, shell mode uses a different coloring and a "Shell Mode Indicator".
      - While in shell mode, text you type is interpreted directly as a shell command.
    - **Exiting shell mode:**
      - When exited, the UI reverts to its standard appearance and normal Qwen CLI behavior resumes.

- **Caution for all `!` usage:** Commands you execute in shell mode have the same permissions and impact as if you ran them directly in your terminal.
