# Manual ESC Cancellation Test Guide

## Issue Description
When pressing ESC to cancel tool execution, the system gets stuck in a "responding" state and won't accept new inputs.

## Test Steps

### Test 1: Basic Tool Cancellation
1. Start the CLI: `npm start` or `node packages/cli/dist/index.js`
2. Enter a command that triggers tool execution: `"List all files in the current directory"`
3. While the tool is executing (you'll see "Executing" status), press ESC
4. **Expected**: You should see "Request cancelled" and be able to enter a new command
5. **Actual (before fix)**: System appears stuck, won't accept new input

### Test 2: Multiple Tool Cancellation
1. Start the CLI
2. Enter: `"Create a file test.txt with 'hello world' and then read it back"`
3. Press ESC while tools are executing
4. **Expected**: All tools should be cancelled, system returns to idle state
5. Try entering a new command like `"What is 2+2?"`

### Test 3: Cancellation During AI Response
1. Start the CLI
2. Enter: `"Explain quantum computing in detail"`
3. While the AI is streaming its response, press ESC
4. **Expected**: Response stops, "Request cancelled" message appears
5. Enter a new command to verify system is responsive

## What the Fix Does

The fix modifies the behavior when all tools are cancelled:
- **Before**: System tried to send cancelled tool responses back to the AI, causing a stuck state
- **After**: System marks tools as submitted but doesn't send their responses, allowing immediate return to idle state

## Code Changes

In `useQwenStream.ts`, the `useEffect` that handles tool completion was modified:
- When all tools are cancelled, we now just mark them as submitted
- We don't send the cancelled responses back to the AI
- This prevents the system from waiting for a response that will never come

## Verification

Run the automated test:
```bash
node test-esc-cancel-fix.js
```

Or test manually with the steps above.