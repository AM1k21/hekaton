# Automated Email Notifications Setup

This guide explains how to set up automated daily email notifications for users who have opted in to receive updates about new items on the úřední deska.

## Overview

The email notification system works as follows:

1. Users opt in by enabling "Oznámení novinek na email" in their account settings
2. Users configure their notification preferences (categories, location, radius)
3. A scheduled script runs daily (typically in the morning) to:
   - Fetch all items from the úřední deska
   - Filter items posted today
   - Match items against each user's preferences
   - Send email notifications to users with matching items

## Files Created

### Backend API Endpoints

- **`/src/routes/api/v1/notifications/check-and-send/+server.ts`**
  - Server endpoint that processes all users and sends notifications
  - Filters items by user preferences (category, location, radius)
  - Handles email sending via nodemailer
  - Returns statistics about notifications sent

### Scripts

- **`/scripts/send-daily-notifications.ts`**
  - Main script that fetches items and triggers notifications
  - Can be run manually or scheduled via cron/Task Scheduler
  - Logs detailed results

- **`/scripts/run-daily-notifications.ps1`**
  - Windows PowerShell wrapper script
  - Makes scheduling easier on Windows
  - Checks for dependencies and handles errors

## Setup Instructions

### 1. Install Dependencies

Ensure you have `tsx` installed for running TypeScript scripts:

```bash
pnpm add -g tsx
```

### 2. Configure Environment Variables

Make sure your `.env` file has the email configuration:

```env
APP_USER=your-email@gmail.com
APP_PASSWORD=your-app-specific-password
PUBLIC_BASE_URL=http://localhost:5173  # Change to production URL when deployed
```

### 3. Test Manually

Before scheduling, test the script manually:

```bash
# On Windows PowerShell:
.\scripts\run-daily-notifications.ps1

# Or directly with tsx:
tsx scripts/send-daily-notifications.ts
```

Expected output:
```
🔔 Starting daily notification check...
📅 Date: 2025-01-16T08:00:00.000Z
📥 Fetching items from /api/oznaceni...
✅ Fetched 150 total items
📧 Checking for users to notify...

📊 Results:
   • Users with notifications enabled: 5
   • New items today: 3
   • Emails sent: 2

📝 Detailed results:
   ✅ user1@example.com: 2 messages
   ✅ user2@example.com: 1 messages

✅ Daily notification check completed successfully!
```

## Scheduling Options

### Option 1: Windows Task Scheduler (Recommended for Windows)

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create a New Task**
   - Click "Create Basic Task..."
   - Name: "Úřední Deska Daily Notifications"
   - Description: "Send daily email notifications to opted-in users"

3. **Set Trigger**
   - Trigger: Daily
   - Start time: 8:00 AM (or your preferred time)
   - Recur every: 1 day

4. **Set Action**
   - Action: Start a program
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "C:\path\to\project\scripts\run-daily-notifications.ps1"`
   - Start in: `C:\path\to\project`

5. **Configure Settings**
   - Run whether user is logged on or not (requires password)
   - Run with highest privileges
   - Configure for: Windows 10/11

6. **Test the Task**
   - Right-click the task → Run
   - Check the "Last Run Result" column

### Option 2: Cron (Linux/Mac)

1. **Open crontab**
   ```bash
   crontab -e
   ```

2. **Add the cron job**
   ```bash
   # Run daily at 8:00 AM
   0 8 * * * cd /path/to/project && tsx scripts/send-daily-notifications.ts >> /var/log/uredni-deska-notifications.log 2>&1
   ```

3. **Save and exit**

4. **Verify cron job**
   ```bash
   crontab -l
   ```

### Option 3: Node.js Scheduler (Alternative)

If you want to keep the scheduler within the application:

1. Install node-cron:
   ```bash
   pnpm add node-cron @types/node-cron
   ```

2. Create a scheduler service (example in `src/lib/scheduler.ts`):
   ```typescript
   import cron from 'node-cron';
   
   export function startNotificationScheduler() {
     // Run daily at 8:00 AM
     cron.schedule('0 8 * * *', async () => {
       console.log('Running scheduled notification check...');
       // Call the notification endpoint
     });
   }
   ```

3. Start the scheduler in your server setup

## API Endpoint Reference

### POST `/api/v1/notifications/check-and-send`

Checks for new items and sends notifications to opted-in users.

**Request Body:**
```json
{
  "items": [
    {
      "id": 1,
      "nazev": "Example Item",
      "category": "Ekonomika A Trh Práce",
      "vyveseni": "2025-01-16",
      "guessedLatitude": 50.21,
      "guessedLongitude": 15.83,
      "url": "https://example.com/item/1",
      "iri": "https://example.com/iri/1"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification check completed",
  "userCount": 5,
  "emailsSent": 2,
  "newItems": 3,
  "results": [
    {
      "email": "user@example.com",
      "messagesCount": 2,
      "success": true
    }
  ]
}
```

## Monitoring and Logs

### Check Script Logs

**Windows Task Scheduler:**
- Open Task Scheduler
- Select your task
- Check the "History" tab
- View "Last Run Result"

**Cron:**
```bash
# View logs
tail -f /var/log/uredni-deska-notifications.log

# View recent cron executions
grep CRON /var/log/syslog
```

### Email Delivery

- Check your Gmail "Sent" folder
- Monitor nodemailer logs in your application logs
- Consider setting up email delivery monitoring (e.g., SendGrid, Mailgun)

## Troubleshooting

### Script Doesn't Run

1. **Check script permissions** (Linux/Mac):
   ```bash
   chmod +x scripts/send-daily-notifications.ts
   ```

2. **Verify tsx installation**:
   ```bash
   tsx --version
   ```

3. **Check environment variables**:
   - Ensure `.env` file exists
   - Verify `APP_USER` and `APP_PASSWORD` are set
   - Check `PUBLIC_BASE_URL` is correct

### No Emails Sent

1. **Check user settings**:
   - Verify users have `emailNotifications: true`
   - Confirm notification preferences are configured

2. **Check Gmail SMTP**:
   - Verify App Password is correct
   - Check Gmail account isn't locked
   - Review Gmail security settings

3. **Check items**:
   - Confirm there are new items today
   - Verify items match user preferences
   - Check item coordinates are valid

### Emails Go to Spam

1. **Configure SPF/DKIM** for your domain
2. **Use a dedicated email service** (SendGrid, Mailgun, Amazon SES)
3. **Add a proper reply-to address**
4. **Include an unsubscribe link**

## Production Considerations

### 1. Rate Limiting

If you have many users, consider:
- Batch email sending (e.g., 10 emails per minute)
- Use a dedicated email service with better rate limits
- Implement retry logic for failed sends

### 2. Email Service

For production, consider using:
- **SendGrid**: 100 emails/day free tier
- **Mailgun**: 5,000 emails/month free tier
- **Amazon SES**: $0.10 per 1,000 emails
- **Postmark**: Reliable transactional email service

### 3. Monitoring

- Set up email delivery tracking
- Monitor script execution success/failure
- Alert on errors (e.g., via Sentry, Slack)
- Track open rates and engagement

### 4. Security

- Store credentials in environment variables (never commit)
- Use app-specific passwords (not main account password)
- Implement API authentication for the check-and-send endpoint
- Consider encrypting email addresses in database
- Add rate limiting to prevent abuse

### 5. Unsubscribe Feature

Consider adding:
- Unsubscribe link in emails
- Unsubscribe page/endpoint
- Honor unsubscribe requests immediately

## Example Unsubscribe Implementation

Add to `nodemailer.ts`:

```typescript
export const createNotificationEmailHtml = (messages: any[], unsubscribeUrl?: string) => {
  // ... existing code ...
  
  const footer = unsubscribeUrl 
    ? `<p style="margin: 5px 0 0 0;"><a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Odhlásit z odběru</a></p>`
    : '';
  
  return `
    <!-- ... existing HTML ... -->
    <tr>
      <td style="padding: 20px; background-color: #f0f7ff; text-align: center; font-size: 14px; color: #666;">
        <p style="margin: 0;">Toto je automatická zpráva z úřední desky Královéhradeckého kraje.</p>
        <p style="margin: 5px 0 0 0;">Nastavení oznámení můžete spravovat ve svém účtu.</p>
        ${footer}
      </td>
    </tr>
  `;
};
```

## Testing

### Test with Real Users

1. Create test accounts with different preferences
2. Add test items with various categories/locations
3. Run the script manually
4. Verify emails are received correctly

### Test Email Delivery

```bash
# Test with specific date
PUBLIC_BASE_URL=http://localhost:5173 tsx scripts/send-daily-notifications.ts
```

## Support

For issues or questions:
1. Check the logs first
2. Verify environment variables
3. Test email settings manually
4. Review Gmail App Password setup

## Next Steps

- [ ] Set up scheduled task (Windows Task Scheduler or Cron)
- [ ] Test with real users
- [ ] Monitor email delivery for first week
- [ ] Consider migration to dedicated email service for production
- [ ] Implement unsubscribe functionality
- [ ] Add email delivery tracking/analytics
- [ ] Set up alerting for failures
