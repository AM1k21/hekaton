# Email Notification Implementation Summary

## ✅ What's Been Implemented

I've added a complete **automated email notification system** that sends emails to users who have opted in when new items matching their preferences are posted on the úřední deska.

## 📁 Files Created

### Backend API Endpoints

1. **`src/routes/api/v1/notifications/check-and-send/+server.ts`**
   - Processes all users with email notifications enabled
   - Filters items by user preferences (category, location, radius)
   - Sends personalized emails with matching items
   - Returns statistics about notifications sent

### Scripts

2. **`scripts/send-daily-notifications.ts`**
   - Main TypeScript script that orchestrates the daily check
   - Fetches all items from the API
   - Triggers the notification endpoint
   - Logs detailed results

3. **`scripts/run-daily-notifications.ps1`**
   - Windows PowerShell wrapper script
   - Handles dependencies and error checking
   - Makes scheduling easier on Windows

4. **`scripts/run-daily-notifications.sh`**
   - Linux/Mac bash wrapper script
   - Equivalent functionality to PowerShell script
   - Executable permissions need to be set

### Documentation

5. **`EMAIL_NOTIFICATIONS_QUICK_START.md`**
   - Quick setup guide (5 minutes)
   - Step-by-step user instructions
   - Testing procedures

6. **`AUTOMATED_EMAIL_NOTIFICATIONS.md`**
   - Comprehensive automation guide
   - Detailed scheduling instructions (Windows Task Scheduler & Cron)
   - Production considerations
   - Troubleshooting section

7. **`IMPLEMENTATION_SUMMARY.md`** (this file)
   - Overview of changes
   - File reference
   - Usage instructions

### Configuration

8. **`.env.example`** (updated)
   - Added `PUBLIC_BASE_URL` configuration
   - Required for scheduled scripts to work

9. **`README.md`** (updated)
   - Added email notifications section
   - Quick setup instructions
   - Project structure overview

## 🎯 How It Works

### User Flow

1. **User Opts In**:
   - User enables "Oznámení novinek na email" toggle in account settings
   - User configures notification preferences:
     - Categories of interest (e.g., "Ekonomika A Trh Práce")
     - Location (coordinates or place name)
     - Radius (in kilometers)

2. **Manual Testing** (Optional):
   - User clicks "Otestovat oznámení (dnes)" button
   - System immediately checks for items posted today
   - Sends test notification via email and/or browser

3. **Automated Daily Check**:
   - Scheduled script runs daily (typically 8:00 AM)
   - Fetches all items from the úřední deska
   - Filters items posted today
   - For each user with `emailNotifications: true`:
     - Matches items against user's preferences
     - Sends email if matches found
   - Logs results (users notified, emails sent)

### Technical Flow

```
Daily Script (scheduled via cron/Task Scheduler)
    ↓
GET /api/oznaceni (fetch all items)
    ↓
POST /api/v1/notifications/check-and-send (with items)
    ↓
For each user with emailNotifications=true:
    ↓
Filter items by user preferences (category + location + radius)
    ↓
If matches found → Send email via nodemailer
    ↓
Return statistics (users, emails sent, new items)
```

## 🚀 Getting Started

### Step 1: Configure Email

Your `.env` should have:

```env
APP_USER=your-email@gmail.com
APP_PASSWORD=your-app-specific-password
PUBLIC_BASE_URL=http://localhost:5173
```

See `EMAIL_SETUP.md` for Gmail configuration.

### Step 2: Test Manually

```powershell
# Windows
.\scripts\run-daily-notifications.ps1

# Linux/Mac
chmod +x scripts/run-daily-notifications.sh
./scripts/run-daily-notifications.sh
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

### Step 3: Schedule Daily Execution

#### **Windows (Task Scheduler)**

1. Open Task Scheduler: `Win + R` → `taskschd.msc`
2. Create Basic Task:
   - Name: "Úřední Deska Daily Notifications"
   - Trigger: Daily at 8:00 AM
   - Action: Start a program
     - Program: `powershell.exe`
     - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\project\scripts\run-daily-notifications.ps1"`
     - Start in: `C:\path\to\project`

#### **Linux/Mac (Cron)**

1. Edit crontab:
   ```bash
   crontab -e
   ```

2. Add this line (runs daily at 8 AM):
   ```
   0 8 * * * cd /path/to/project && tsx scripts/send-daily-notifications.ts >> /var/log/uredni-deska-notifications.log 2>&1
   ```

## 📋 API Endpoints Reference

### 1. Manual Email Send
- **Endpoint**: `POST /api/v1/notifications/send-email`
- **Used by**: Test notification button in user account
- **Purpose**: Send immediate email to one user

### 2. Automated Check & Send
- **Endpoint**: `POST /api/v1/notifications/check-and-send`
- **Used by**: Daily scheduled script
- **Purpose**: Process all users and send notifications

## 🔧 Existing Features Utilized

The implementation leverages existing infrastructure:

- ✅ **`src/lib/nodemailer.ts`**: Email sending (already existed)
- ✅ **`src/lib/db.ts`**: User database with preferences (already existed)
- ✅ **User settings**: `emailNotifications`, `notificationPreferences` (already existed)
- ✅ **Test function**: Account page test button (already existed)

## 🆕 What's New

- ✅ **Automated check endpoint**: Processes all users automatically
- ✅ **Scheduled scripts**: Daily execution via cron/Task Scheduler
- ✅ **Comprehensive documentation**: Quick start and detailed guides
- ✅ **Production-ready**: Error handling, logging, statistics

## 📊 User Data Structure

Users in `db.json` have this structure:

```json
{
  "id": "abc123",
  "email": "user@example.com",
  "password": "hashed",
  "notifications": true,
  "emailNotifications": true,
  "notificationPreferences": [
    {
      "zajmy": ["Ekonomika A Trh Práce", "Školství A Výzkum"],
      "lokace": "50.209186, 15.832891",
      "radius": 10,
      "displayName": "Hradec Králové"
    }
  ]
}
```

## 🎨 Email Template

Emails use KHK brand colors (#0a2f83) and include:

- Header: "Nová oznámení"
- Message list with:
  - Title (clickable)
  - Category
  - Posted date
  - Location
  - "Zobrazit detail" button
- Footer: Disclaimer and account settings link

## 🧪 Testing

### Test with Real Users

1. Create test account
2. Enable email notifications
3. Add notification preferences (category, location, radius)
4. Click "Otestovat oznámení (dnes)" button
5. Check email inbox

### Test Automated Script

```bash
# Run manually
tsx scripts/send-daily-notifications.ts

# Check output for:
# - Items fetched
# - Users checked
# - Emails sent
```

## ⚠️ Important Notes

1. **Gmail Limits**: Gmail has a 500 emails/day limit
   - For production with many users, consider SendGrid, Mailgun, or AWS SES

2. **Coordinates Required**: Items must have `guessedLatitude` and `guessedLongitude`
   - Location matching won't work without coordinates

3. **Daily Check**: Script only sends notifications for items posted **today**
   - Prevents duplicate notifications for old items

4. **User Preferences**: Users must have valid coordinates in their `lokace`
   - Format: "50.209186, 15.832891"

5. **Environment Variable**: `PUBLIC_BASE_URL` must be set
   - Development: `http://localhost:5173`
   - Production: Your actual domain URL

## 🔮 Future Enhancements (Optional)

- [ ] Unsubscribe link in emails
- [ ] Email delivery tracking
- [ ] Weekly digest option
- [ ] Multiple notification times per day
- [ ] Email open rate analytics
- [ ] Support for other email providers

## 📚 Documentation Reference

- **`EMAIL_NOTIFICATIONS_QUICK_START.md`**: Start here! (5-minute setup)
- **`AUTOMATED_EMAIL_NOTIFICATIONS.md`**: Complete automation guide
- **`EMAIL_SETUP.md`**: Gmail SMTP configuration
- **`EMAIL_NOTIFICATION_IMPLEMENTATION.md`**: Technical implementation details

## ✅ Checklist

Before going live:

- [ ] Configure `.env` with Gmail credentials
- [ ] Test script manually
- [ ] Verify emails are received
- [ ] Schedule daily execution (Task Scheduler or Cron)
- [ ] Test with real users
- [ ] Monitor first week of automated runs
- [ ] Consider production email service if needed

## 🤝 Support

If you encounter issues:

1. Check the logs (script output)
2. Verify `.env` configuration
3. Test email setup manually
4. Review Gmail App Password setup
5. Check `AUTOMATED_EMAIL_NOTIFICATIONS.md` troubleshooting section

---

**Status**: ✅ Fully implemented and ready for scheduling!

Just schedule the daily script and you're all set! 🎉
