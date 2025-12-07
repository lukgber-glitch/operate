# Get the page ID
$tabs = Invoke-RestMethod -Uri "http://localhost:9222/json"
$pageId = $tabs[0].id

# Navigate to operate.guru
$body = @{
    id = 1
    method = "Page.navigate"
    params = @{
        url = "https://operate.guru"
    }
} | ConvertTo-Json

$wsUrl = $tabs[0].webSocketDebuggerUrl
Write-Host "WebSocket URL: $wsUrl"
Write-Host "Page ID: $pageId"
Write-Host "Navigating to https://operate.guru..."

# Since we can't easily use WebSockets from PowerShell, let's use the HTTP API
try {
    # Create a new tab with the URL
    $result = Invoke-RestMethod -Uri "http://localhost:9222/json/new?https://operate.guru"
    Write-Host "New tab created:"
    Write-Host "Title: $($result.title)"
    Write-Host "URL: $($result.url)"
    Write-Host "ID: $($result.id)"

    Write-Host "`nWaiting for page to load..."
    Start-Sleep -Seconds 3

    # Get updated tab info
    $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json"
    $operateTab = $tabs | Where-Object { $_.url -like "*operate.guru*" }

    if ($operateTab) {
        Write-Host "`nOperate.guru tab found:"
        Write-Host "Title: $($operateTab.title)"
        Write-Host "URL: $($operateTab.url)"
    }
} catch {
    Write-Host "Error: $_"
}
