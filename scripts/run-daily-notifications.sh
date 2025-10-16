#!/bin/bash

# Daily Email Notifications Script for Linux/Mac
# This script runs the notification check for users who opted in

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

echo "🔔 Starting daily notification check..."
echo "📍 Project directory: $PROJECT_DIR"

# Check if tsx is installed
if ! command -v tsx &> /dev/null; then
    echo "❌ tsx is not installed. Installing..."
    npm install -g tsx
fi

# Run the notification script
echo "🚀 Running notification script..."
tsx scripts/send-daily-notifications.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ Notification check completed successfully!"
    exit 0
else
    echo "❌ Notification check failed with exit code $?"
    exit 1
fi
