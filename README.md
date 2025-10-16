# Úřední Deska KHK - PWA Application

Personalized bulletin board for Královéhradecký kraj with email notifications.

## Features

✅ **Personalized Feed**: Filter announcements by category and location  
✅ **Email Notifications**: Automated daily email notifications for new items  
✅ **Interactive Map**: View announcements on a map with clustering  
✅ **User Accounts**: Manage preferences and notification settings  
✅ **PWA Support**: Install as a mobile/desktop app  
✅ **Modern Design**: Clean interface with KHK brand colors

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Email Notifications Setup

The application supports automated daily email notifications. See these guides:

- **Quick Start**: `EMAIL_NOTIFICATIONS_QUICK_START.md` - Get started in 5 minutes
- **Email Setup**: `EMAIL_SETUP.md` - Configure Gmail SMTP
- **Automation**: `AUTOMATED_EMAIL_NOTIFICATIONS.md` - Schedule daily notifications

### Quick Setup

1. **Configure Email** (`.env`):
   ```env
   APP_USER=your-email@gmail.com
   APP_PASSWORD=your-app-specific-password
   PUBLIC_BASE_URL=http://localhost:5173
   ```

2. **Test Notifications**:
   ```powershell
   # Windows
   .\scripts\run-daily-notifications.ps1
   
   # Linux/Mac
   tsx scripts/send-daily-notifications.ts
   ```

3. **Schedule Daily** (Windows Task Scheduler or Cron):
   - See `AUTOMATED_EMAIL_NOTIFICATIONS.md` for detailed instructions

## Development

Install dependencies and start the development server:

```sh
pnpm install
pnpm run dev

# or start and open in browser
pnpm run dev -- --open
```

## Building

Create a production version:

```sh
pnpm run build
```

Preview the production build:

```sh
pnpm run preview
```

## Project Structure

```
src/
  lib/
    nodemailer.ts           # Email sending functionality
    db.ts                   # User database with preferences
    components/             # Reusable Svelte components
  routes/
    +page.svelte           # Main feed page
    account/+page.svelte   # User account & notification settings
    mapa/+page.svelte      # Interactive map view
    api/
      v1/notifications/    # Notification API endpoints
scripts/
  send-daily-notifications.ts  # Daily notification script
  run-daily-notifications.ps1  # Windows wrapper script
```

## Features Documentation

- **Email Notifications**: See `EMAIL_NOTIFICATIONS_QUICK_START.md`
- **Implementation Details**: See `EMAIL_NOTIFICATION_IMPLEMENTATION.md`
- **Email Setup**: See `EMAIL_SETUP.md`

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
