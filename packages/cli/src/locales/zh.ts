/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Translations } from '../utils/i18n.js';

export const zhTranslations: Translations = {
  // General UI
  help: '帮助',
  theme: '主题',
  auth: '身份验证',
  settings: '设置',
  version: '版本',
  exit: '退出',
  quit: '退出',
  clear: '清除',
  
  // Commands
  commands: {
    help: {
      name: 'help',
      description: '显示通文千问CLI帮助信息',
    },
    clear: {
      name: 'clear',
      description: '清除屏幕和对话历史',
    },
    theme: {
      name: 'theme',
      description: '更改主题',
    },
    auth: {
      name: 'auth',
      description: '更改认证方式',
    },
    stats: {
      name: 'stats',
      description: '查看会话统计信息',
    },
    about: {
      name: 'about',
      description: '显示版本信息',
    },
    model: {
      name: 'model',
      description: '切换通文模型或列出可用模型',
    },
    memory: {
      name: 'memory',
      description: '管理记忆。用法：/memory <show|refresh|add> [要添加的文本]',
    },
    tools: {
      name: 'tools',
      description: '列出可用的通文CLI工具',
    },
    mcp: {
      name: 'mcp',
      description: '管理MCP服务器。子命令：browse、search、install 或列出当前服务器',
    },
    'setup-mcp': {
      name: 'setup-mcp',
      description: '设置MCP服务器（网络搜索等）',
    },
    chat: {
      name: 'chat',
      description: '管理对话历史。用法：/chat <list|save|resume> [标签]',
    },
    lang: {
      name: 'lang',
      description: '切换语言或显示当前语言',
    },
    compress: {
      name: 'compress',
      description: '通过摘要替换上下文来压缩对话',
    },
    quit: {
      name: 'quit',
      description: '退出CLI',
    },
    docs: {
      name: 'docs',
      description: '在浏览器中打开通文CLI完整文档',
    },
    editor: {
      name: 'editor',
      description: '设置外部编辑器偏好',
    },
    bug: {
      name: 'bug',
      description: '提交错误报告',
    },
  },
  
  // Messages
  messages: {
    currentLanguage: '当前语言：{language}',
    languageChanged: '语言已更改为：{language}',
    availableLanguages: '可用语言：{languages}',
    unknownLanguage: '未知语言：{language}。可用语言：{available}',
    currentModel: '当前模型：{model}',
    switchedModel: '已从 {previous} 切换到 {current}',
    unknownModel: '未知模型：{model}',
    availableModels: '可用模型：{models}',
    usage: '用法：{usage}',
    noInputProvided: '未通过标准输入提供输入。',
    openingDocs: '在浏览器中打开文档：{url}',
    clearingTerminal: '正在清除终端并重置聊天。',
    sessionStats: '会话统计',
    memoryUsage: '内存使用',
    addingToMemory: '正在尝试保存到内存："{text}"',
    unknownCommand: '未知命令：{command}',
    errorMessage: '错误：{error}',
    infoMessage: '信息：{info}',
    mcpSetupSuccess: 'MCP服务器配置成功！重启CLI即可使用。',
    mcpSetupExists: 'MCP服务器 {name} 已经配置。',
    mcpSetupFailed: '配置MCP服务器失败：{error}',
  },
  
  // Help content
  helpContent: {
    basics: '基础功能：',
    addContext: '添加上下文',
    addContextDesc: '使用 @ 指定文件作为上下文（例如：@src/myFile.ts）来定位特定文件或文件夹。',
    shellMode: '命令行模式',
    shellModeDesc: '通过 ! 执行shell命令（例如：!ls -la）',
    slashCommands: '斜杠命令：',
    slashCommandsDesc: '使用 / 命令来访问CLI功能',
    tips: '提示：',
    keyboardShortcuts: '键盘快捷键：',
  },
};