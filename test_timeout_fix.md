# Test Plan for ESC Cancellation Fix

## What We Fixed

The shell tool's timeout mechanism was interfering with ESC cancellation. The timeout handler and the ESC abort handler were both trying to kill the process, causing a race condition that prevented the system from properly returning to idle state.

### Changes Made

1. **Clear timeout on abort**: When the abort handler is triggered (by ESC), it now clears the timeout to prevent double-termination
2. **Proper timeout ID management**: Changed timeoutId to be properly scoped and nullable
3. **Safe cleanup**: Added null check before clearing timeout in the finally block

## Expected Behavior

1. When you press ESC during a shell command execution:
   - The command should be cancelled immediately
   - The system should return to idle state
   - You should be able to enter new commands right away
   - No double-termination or race conditions

2. When a command times out naturally:
   - It should show the timeout message
   - The system should return to idle state properly

## Test Commands

1. Test ESC cancellation:
   ```bash
   # Run a long command and press ESC quickly
   sleep 60
   ```

2. Test natural timeout:
   ```bash
   # Let this run for 30 seconds
   while true; do echo "Running..."; sleep 1; done
   ```

3. Test dev server timeout (10 seconds):
   ```bash
   # Should timeout after 10 seconds
   npm run dev
   ```

## Success Criteria

- ESC cancellation works immediately and cleanly
- System returns to idle state after cancellation
- No hanging or stuck states
- Timeout still works as expected when not cancelled