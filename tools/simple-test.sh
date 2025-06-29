#!/bin/bash

# Simple test for Qwen CLI with debug logs
export DASHSCOPE_API_KEY="sk-9cfe4527afbf4279ab6dd388a6df4caa"

echo "Testing Qwen CLI..."
echo "hello world" | timeout 15s npm start 2>&1