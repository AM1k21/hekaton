#!/bin/bash

# Installation script for email notification dependencies
# Run this script from the project root directory

echo "Installing nodemailer and TypeScript types..."
pnpm add nodemailer
pnpm add -D @types/nodemailer

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Create a .env file in the project root"
echo "2. Add your Gmail credentials:"
echo "   APP_USER=your-email@gmail.com"
echo "   APP_PASSWORD=your-app-password"
echo "3. Restart your dev server: pnpm dev"
