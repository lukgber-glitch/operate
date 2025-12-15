# Checkpoint script that runs before context compaction
# This saves state automatically when context is running low

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$projectDir = $env:CLAUDE_PROJECT_DIR

# Find the current phase checkpoint file
$checkpointDir = Join-Path $projectDir ".planning\phases"
$masterCheckpoint = Join-Path $checkpointDir "CHECKPOINT.json"

if (Test-Path $masterCheckpoint) {
    # Read current checkpoint
    $checkpoint = Get-Content $masterCheckpoint -Raw | ConvertFrom-Json

    # Add compaction note
    $checkpoint.lastAutoCompact = $timestamp
    $checkpoint.note = "Auto-checkpoint before context compaction"

    # Save updated checkpoint
    $checkpoint | ConvertTo-Json -Depth 10 | Set-Content $masterCheckpoint

    Write-Host "AUTO-CHECKPOINT saved at $timestamp before compaction"
}

# Also create a backup with timestamp
$backupFile = Join-Path $checkpointDir "CHECKPOINT_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
if (Test-Path $masterCheckpoint) {
    Copy-Item $masterCheckpoint $backupFile
    Write-Host "Backup created: $backupFile"
}
