# Email Notifications - Quick Start Guide

## Overview

The úřední deska application now supports **automated email notifications** for users who opt in. When new items matching their preferences are posted, users receive an email notification.

## Features

✅ **User Opt-in**: Users control their notification preferences  
✅ **Customizable Filters**: Filter by categories, location, and radius  
✅ **Smart Matching**: Only relevant items trigger notifications  
✅ **Beautiful Emails**: Branded HTML emails with KHK colors  
✅ **Daily Automated Checks**: Scheduled script checks for new items  
✅ **Test Function**: Users can test their notifications manually  

## Quick Setup (5 minutes)

### 1. Configure Email (Already Done)

Your email is already configured in `.env`:

```env
APP_USER=your-email@gmail.com
APP_PASSWORD=your-app-specific-password
```

See `EMAIL_SETUP.md` for detailed Gmail setup instructions.

### 2. User Setup

Users can enable notifications in their account page:

1. Log in to the application
2. Go to "Můj účet" (Account page)
3. Toggle "Oznámení novinek na email" ON
4. Click "Zobrazit parametry oznámení"
5. Add notification preferences:
   - Select categories of interest
   - Enter location (or use geolocation button)
   - Set radius (in kilometers)
6. Click "Přidat parametr"
7. Test with "Otestovat oznámení (dnes)" button

### 3. Schedule Daily Notifications

Choose your platform:

#### **Windows** (Recommended)

1. Open PowerShell as Administrator
2. Navigate to your project:
   ```powershell
   cd C:\path\to\your\project
   ```
3. Test the script:
   ```powershell
   .\scripts\run-daily-notifications.ps1
   ```
4. Schedule it:
   - Open Task Scheduler (`Win + R` → `taskschd.msc`)
   - Create Basic Task
   - Name: "Úřední Deska Notifications"
   - Trigger: Daily at 8:00 AM
   - Action: Start program
     - Program: `powershell.exe`
     - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\project\scripts\run-daily-notifications.ps1"`

#### **Linux/Mac**

1. Test the script:
   ```bash
   tsx scripts/send-daily-notifications.ts
   ```
2. Add to crontab:
   ```bash
   crontab -e
   ```
3. Add this line (runs daily at 8 AM):
   ```
   0 8 * * * cd /path/to/project && tsx scripts/send-daily-notifications.ts
   ```

## How It Works

### Manual Testing (Test Button)

When a user clicks "Otestovat oznámení (dnes)":

1. ✅ Fetches all items from the API
2. ✅ Filters items posted **today**
3. ✅ Matches items against user's preferences:
   - Categories must match user's interests
   - Location must be within user's radius
4. ✅ Sends browser notifications (if enabled)
5. ✅ Sends email notifications (if enabled)
6. ✅ Shows success message with count

### Automated Daily Check

When the scheduled script runs:

1. ✅ Fetches all items from `/api/oznaceni`
2. ✅ Filters items posted **today**
3. ✅ For each user with `emailNotifications: true`:
   - Matches items against their preferences
   - Sends email if there are matching items
4. ✅ Logs results (users notified, emails sent)

## API Endpoints

### 1. Send Email (Manual)

**Endpoint**: `POST /api/v1/notifications/send-email`

Used by the test button to send immediate notifications.

```typescript
// Request
{
  email: "user@example.com",
  messages: [
    {
      nazev: "Item Title",
      category: "Ekonomika A Trh Práce",
      vyveseni: "2025-01-16",
      url: "https://example.com/item/1",
      location: "Hradec Králové"
    }
  ]
}

// Response
{
  success: true,
  message: "Email sent successfully"
}
```

### 2. Check and Send (Automated)

**Endpoint**: `POST /api/v1/notifications/check-and-send`

Used by the daily script to process all users.

```typescript
// Request
{
  items: [...] // All items from /api/oznaceni
}

// Response
{
  success: true,
  message: "Notification check completed",
  userCount: 5,        // Users with notifications enabled
  emailsSent: 2,       // Emails actually sent
  newItems: 3,         // New items today
  results: [...]       // Detailed results per user
}
```

## Files Reference

### Core Implementation

- `src/lib/nodemailer.ts` - Email sending logic
- `src/lib/db.ts` - User database with notification preferences
- `src/routes/api/v1/notifications/send-email/+server.ts` - Manual email endpoint
- `src/routes/api/v1/notifications/check-and-send/+server.ts` - Automated check endpoint

### Scripts

- `scripts/send-daily-notifications.ts` - Daily notification script
- `scripts/run-daily-notifications.ps1` - Windows wrapper

### Documentation

- `EMAIL_SETUP.md` - Gmail SMTP configuration
- `AUTOMATED_EMAIL_NOTIFICATIONS.md` - Complete automation guide
- `EMAIL_NOTIFICATION_IMPLEMENTATION.md` - Implementation details

### User Interface

- `src/routes/account/+page.svelte` - Account settings page with:
  - Email notifications toggle
  - Notification preferences form
  - Test notifications button

## Notification Preferences Structure

Each user can have multiple notification preferences:

```typescript
{
  zajmy: ["Ekonomika A Trh Práce", "Školství A Výzkum"],
  lokace: "50.209186, 15.832891",  // Coordinates
  radius: 10,                       // Kilometers
  displayName: "Hradec Králové"    // Human-readable name
}
```

## Email Template

Emails use the KHK brand colors and include:

- **Header**: "Nová oznámení" in brand blue (#0a2f83)
- **Message List**: Each item with:
  - Title (clickable link)
  - Category
  - Posted date
  - Location (if available)
  - "Zobrazit detail" button
- **Footer**: Automatic message disclaimer

## Testing

### Test Individual User

1. Create a test account
2. Enable email notifications
3. Add notification preferences
4. Click "Otestovat oznámení (dnes)"
5. Check your email inbox

### Test Daily Script

```bash
# Windows
.\scripts\run-daily-notifications.ps1

# Linux/Mac
tsx scripts/send-daily-notifications.ts
```

Expected output:
```
🔔 Starting daily notification check...
📥 Fetching items from /api/oznaceni...
✅ Fetched 150 total items
📧 Checking for users to notify...

📊 Results:
   • Users with notifications enabled: 5
   • New items today: 3
   • Emails sent: 2

✅ Daily notification check completed successfully!
```

## Troubleshooting

### No Emails Received

1. **Check user settings**:
   - Is "Oznámení novinek na email" enabled?
   - Are notification preferences configured?
   
2. **Check items**:
   - Are there new items today?
   - Do items match the user's preferences?
   
3. **Check email configuration**:
   - Is `.env` configured correctly?
   - Is Gmail App Password valid?
   - Check application logs for errors

### Emails in Spam

- Gmail may mark automated emails as spam initially
- Ask users to mark as "Not Spam" once
- For production, consider using SendGrid or similar service

### Script Not Running

1. **Check tsx installation**:
   ```bash
   tsx --version
   ```
2. **Install if needed**:
   ```bash
   pnpm add -g tsx
   ```
3. **Check permissions** (Linux/Mac):
   ```bash
   chmod +x scripts/send-daily-notifications.ts
   ```

## Production Considerations

### Email Service

For production with many users, consider:

- **SendGrid**: Free tier with 100 emails/day
- **Mailgun**: Free tier with 5,000 emails/month
- **Amazon SES**: $0.10 per 1,000 emails
- **Postmark**: Reliable transactional email

### Rate Limiting

- Gmail has sending limits (500/day)
- Implement batching for large user bases
- Add delays between emails if needed

### Monitoring

- Set up logging to file
- Monitor script execution success
- Track email delivery rates
- Alert on failures (Sentry, Slack, etc.)

### Security

- Rotate Gmail App Password regularly
- Use environment variables (never commit credentials)
- Consider encrypting email addresses in database
- Add authentication to notification endpoints

## Next Steps

1. ✅ Email configuration is done
2. ✅ User interface is ready
3. ✅ API endpoints are implemented
4. ✅ Scripts are created
5. ⏳ **Schedule the daily script** (see Setup above)
6. ⏳ Test with real users
7. ⏳ Monitor for first week
8. ⏳ Consider production email service

## Support

Need help? Check these resources:

- `EMAIL_SETUP.md` - Email configuration
- `AUTOMATED_EMAIL_NOTIFICATIONS.md` - Detailed automation guide
- `EMAIL_NOTIFICATION_IMPLEMENTATION.md` - Technical implementation

For issues:
1. Check logs first
2. Verify environment variables
3. Test email settings manually
4. Review Gmail setup in `EMAIL_SETUP.md`

---

**Ready to go!** 🎉 Just schedule the daily script and you're all set!
