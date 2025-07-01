/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Config } from '@qwen/qwen-cli-core';
import { LoadedSettings } from '../config/settings.js';
import { WebApp } from './components/WebApp.js';

export interface WebRendererOptions {
  containerId?: string;
}

export class WebRenderer {
  private config: Config;
  private settings: LoadedSettings;
  private root: any = null;
  private containerId: string;

  constructor(
    config: Config,
    settings: LoadedSettings,
    options: WebRendererOptions = {}
  ) {
    this.config = config;
    this.settings = settings;
    this.containerId = options.containerId || 'qwen-assistant-root';
  }

  public render(): void {
    // Create root container if it doesn't exist
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }

    // Create React root and render the app
    this.root = createRoot(container);
    this.root.render(
      <React.StrictMode>
        <WebApp 
          config={this.config}
          settings={this.settings}
        />
      </React.StrictMode>
    );
  }

  public unmount(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

// Browser entry point
export function initializeWebRenderer(): void {
  // This will be called from the HTML page
  // Config and settings will be provided via API calls
  console.log('Qwen Assistant Web Interface initializing...');
  
  // For now, we'll render a placeholder that will connect to the WebSocket
  const container = document.createElement('div');
  container.id = 'qwen-assistant-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <WebApp />
    </React.StrictMode>
  );
}