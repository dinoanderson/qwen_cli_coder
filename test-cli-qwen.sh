#!/bin/bash

# Test script for Qwen CLI integration
export DASHSCOPE_API_KEY="sk-9cfe4527afbf4279ab6dd388a6df4caa"

echo "Testing Qwen CLI integration..."
echo "hello qwen" | timeout 15s npm start

echo -e "\n\nTest completed!"