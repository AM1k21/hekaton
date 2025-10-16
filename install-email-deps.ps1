# Installation script for email notification dependencies
# Run this script from the project root directory

Write-Host "Installing nodemailer and TypeScript types..." -ForegroundColor Green
pnpm add nodemailer
pnpm add -D @types/nodemailer

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create a .env file in the project root"
Write-Host "2. Add your Gmail credentials:"
Write-Host "   APP_USER=your-email@gmail.com"
Write-Host "   APP_PASSWORD=your-app-password"
Write-Host "3. Restart your dev server: pnpm dev"
