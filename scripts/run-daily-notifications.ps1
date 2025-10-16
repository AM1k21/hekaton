# Daily Email Notifications Script for Windows
# This script runs the notification check for users who opted in

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

# Change to project directory
Set-Location $ProjectDir

Write-Host "🔔 Starting daily notification check..." -ForegroundColor Cyan
Write-Host "📍 Project directory: $ProjectDir" -ForegroundColor Gray

# Check if tsx is installed
if (-not (Get-Command tsx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ tsx is not installed. Installing..." -ForegroundColor Red
    pnpm add -g tsx
}

# Run the notification script
Write-Host "🚀 Running notification script..." -ForegroundColor Cyan
tsx scripts/send-daily-notifications.ts

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Notification check completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Notification check failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
