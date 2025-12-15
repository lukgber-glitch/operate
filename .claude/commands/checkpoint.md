# Checkpoint Command

Save current progress to checkpoint file immediately.

## Instructions

1. **Read the current checkpoint file** to get the latest state:
   - `.planning/phases/13-multi-agent-fix-test/13-CHECKPOINT.json` (current phase)
   - Or the phase-specific checkpoint in `.planning/phases/*/`

2. **Update the checkpoint with current progress**:
   - Timestamp: current ISO time
   - Status: what stage we're at
   - Progress: X/Y completed
   - Results: what was tested/fixed
   - Next action: exactly what to do next

3. **Write the updated checkpoint file**

4. **Confirm to user**: "Checkpoint saved at [timestamp] - [brief status]"

## Checkpoint Template

```json
{
  "version": N,
  "timestamp": "ISO-8601",
  "phase": "phase-name",
  "status": "STATUS_CODE",
  "contextRemaining": "estimate%",

  "progress": {
    "completed": [],
    "inProgress": "",
    "remaining": []
  },

  "nextAction": {
    "command": "what to run next",
    "details": "specifics"
  }
}
```

## CRITICAL RULES

- **Save checkpoint every 5 pages tested** or after any fix
- **Save checkpoint before any risky operation**
- **Save checkpoint when context feels low** (don't wait until 2%!)
- **Always include nextAction** so resume is seamless
