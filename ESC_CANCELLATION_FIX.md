# ESC Cancellation Fix for Agent Shell Tool Calls

## Problem
When the AI agent executes a shell command through function calls and the user presses ESC to cancel, the conversation would get stuck and not resume properly.

## Root Cause
The ESC handler was prematurely marking tool calls as "submitted" before their cancellation responses were sent back to the AI. This created a race condition where:

1. User presses ESC
2. ESC handler cancels tools and marks them as submitted
3. The automatic response submission logic skips already-submitted tools
4. AI never receives the cancellation response
5. Conversation gets stuck waiting for tool responses

## The Fix
Removed the premature `markToolsAsSubmitted` call from the ESC handler. Now the flow works correctly:

1. User presses ESC
2. ESC handler cancels tools (but doesn't mark as submitted)
3. Tool scheduler creates cancellation responses
4. Automatic submission logic sends cancellation responses to AI
5. AI receives "[Operation Cancelled]" error and can continue conversation

## Code Changes
In `packages/cli/src/ui/hooks/useQwenStream.ts`:

```typescript
// Before (incorrect):
if (hasActiveTools) {
  cancelAllToolCalls();
  
  // This was the problem - marking as submitted too early
  const activeToolIds = toolCalls
    .filter(tc => ['executing', 'scheduled', 'validating', 'awaiting_approval'].includes(tc.status))
    .map(tc => tc.request.callId);
  
  if (activeToolIds.length > 0) {
    markToolsAsSubmitted(activeToolIds);
  }
}

// After (fixed):
if (hasActiveTools) {
  cancelAllToolCalls();
  
  // Don't mark tools as submitted here - let the normal flow handle it
  // This ensures cancelled tool responses are sent back to the AI
}
```

## Testing
To test the fix:

1. Run a command that triggers AI to use shell tool:
   ```bash
   node packages/cli/dist/index.js -p "Please run: sleep 30"
   ```

2. Press ESC while the command is executing

3. Verify:
   - Command is cancelled
   - AI receives cancellation response
   - You can continue the conversation (e.g., type "What happened?")

## Related Issues
- This fix only addresses agent-initiated shell commands (function calls)
- Shell mode (`!` commands) uses a different execution path
- The timeout race condition fix in shell.ts was a separate issue