#!/bin/bash

# Debug test for Qwen CLI
export DASHSCOPE_API_KEY="sk-9cfe4527afbf4279ab6dd388a6df4caa"
export DEBUG=1

echo "Starting Qwen CLI in debug mode..."
echo "test" | timeout 30s npm start -- --debug