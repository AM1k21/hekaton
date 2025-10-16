# 📧 Email Notifications - Complete Feature Guide

## 🎯 Overview

Users can now receive **automated daily email notifications** when new items matching their preferences are posted on the úřední deska.

---

## 👤 User Experience

### 1. Account Setup (User Side)

**Location**: Navigate to **Můj účet** (Account) page

#### Enable Email Notifications

1. **Toggle ON**: "Oznámení novinek na email"
   - Located in the Settings section
   - Enables email notifications for your account

#### Configure Preferences

2. **Click**: "Zobrazit parametry oznámení" button
   - Opens the preferences form

3. **Add Preferences**:
   - **Kategorie** (Categories): Select one or more categories you're interested in
   - **Lokace** (Location): Enter a place name or use the 📍 geolocation button
   - **Okruh** (Radius): Set the distance (1-100 km)
   - **Click**: "Přidat parametr" to save

4. **Multiple Preferences**: You can add multiple preference sets
   - Example: "Ekonomika" near "Hradec Králové" within 10 km
   - Example: "Školství" near "Náchod" within 20 km

#### Test Your Notifications

5. **Click**: "Otestovat oznámení (dnes)" button
   - Checks for items posted today
   - Sends test email immediately
   - Shows count of matching items

---

## 🔧 Administrator Setup

### Step 1: Email Configuration

**File**: `.env`

```env
APP_USER=your-email@gmail.com
APP_PASSWORD=your-app-specific-password
PUBLIC_BASE_URL=http://localhost:5173
```

**See**: `EMAIL_SETUP.md` for Gmail setup instructions

### Step 2: Test Script Manually

```bash
# Option A: Direct (cross-platform)
pnpm run notify:test

# Option B: Windows PowerShell
pnpm run notify:test:win

# Option C: Linux/Mac
chmod +x scripts/run-daily-notifications.sh
./scripts/run-daily-notifications.sh
```

### Step 3: Schedule Daily Execution

#### Windows Task Scheduler

1. Open: `Win + R` → type `taskschd.msc` → Enter
2. **Create Basic Task**:
   - Name: `Úřední Deska Daily Notifications`
   - Trigger: **Daily at 8:00 AM**
   - Action: **Start a program**
     - Program: `powershell.exe`
     - Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\project\scripts\run-daily-notifications.ps1"`
     - Start in: `C:\path\to\project`
3. **Test**: Right-click task → Run

#### Linux/Mac Cron

1. Edit crontab:
   ```bash
   crontab -e
   ```

2. Add line (runs daily at 8 AM):
   ```
   0 8 * * * cd /path/to/project && pnpm run notify:test >> /var/log/uredni-deska-notifications.log 2>&1
   ```

3. Save and exit

---

## 📁 File Structure

### User Interface
```
src/routes/account/+page.svelte
├── Email notifications toggle
├── Notification preferences form
│   ├── Category selector (multi-select)
│   ├── Location input with geolocation
│   └── Radius slider (1-100 km)
└── Test notification button
```

### Backend API
```
src/routes/api/v1/notifications/
├── send-email/+server.ts          # Manual email sending (test button)
└── check-and-send/+server.ts      # Automated daily check (scheduled)
```

### Scripts
```
scripts/
├── send-daily-notifications.ts     # Main script (cross-platform)
├── run-daily-notifications.ps1     # Windows wrapper
└── run-daily-notifications.sh      # Linux/Mac wrapper
```

### Core Logic
```
src/lib/
├── nodemailer.ts                   # Email sending & templates
└── db.ts                          # User preferences storage
```

---

## 🔄 How It Works

### Daily Automated Flow

```
08:00 AM (scheduled)
    ↓
Script Runs
    ↓
Fetch All Items from API
    ↓
Filter Items Posted Today
    ↓
For Each User with emailNotifications=true:
    ↓
    Match Items by:
    • Category (user's interests)
    • Location (within user's radius)
    ↓
    If Matches Found:
    • Send Email with Matching Items
    ↓
Log Results:
• Users checked: 10
• New items today: 5
• Emails sent: 3
```

### Test Button Flow

```
User Clicks "Otestovat oznámení"
    ↓
Frontend Calls API
    ↓
Filter Today's Items
    ↓
Match Against User's Preferences
    ↓
Send Email Immediately
    ↓
Show Success Message
```

---

## 📧 Email Template

Users receive emails with:

**Header** (KHK blue background):
- "Nová oznámení"

**Content**:
- Greeting
- List of matching items:
  - ✅ Title (clickable link)
  - ✅ Category
  - ✅ Posted date
  - ✅ Location
  - ✅ "Zobrazit detail" button

**Footer**:
- Disclaimer
- Link to manage settings

---

## 🎨 User Preferences Example

```json
{
  "zajmy": [
    "Ekonomika A Trh Práce",
    "Školství A Výzkum"
  ],
  "lokace": "50.209186, 15.832891",
  "radius": 10,
  "displayName": "Hradec Králové"
}
```

**Translation**:
- **zajmy**: Categories of interest
- **lokace**: GPS coordinates
- **radius**: Distance in kilometers
- **displayName**: Human-readable location name

---

## 🧪 Testing Checklist

### User Testing

- [ ] Create test account
- [ ] Toggle email notifications ON
- [ ] Add notification preferences
- [ ] Click test button
- [ ] Verify email received
- [ ] Check email formatting

### Admin Testing

- [ ] Configure `.env` properly
- [ ] Run script manually
- [ ] Check console output
- [ ] Verify emails sent
- [ ] Schedule with Task Scheduler/Cron
- [ ] Wait 24 hours and verify automated run

---

## 📊 Monitoring

### Check Script Logs

**Windows**:
- Task Scheduler → Your task → History tab
- View "Last Run Result"

**Linux/Mac**:
```bash
tail -f /var/log/uredni-deska-notifications.log
```

### Expected Output

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

---

## 🚨 Troubleshooting

### Problem: No emails received

**Check**:
1. User has `emailNotifications: true`
2. User has notification preferences configured
3. Items exist that match preferences
4. Gmail App Password is valid
5. Check spam folder

### Problem: Script fails to run

**Check**:
1. `tsx` is installed: `tsx --version`
2. `.env` file exists with correct values
3. `PUBLIC_BASE_URL` is set correctly
4. Path in Task Scheduler is correct

### Problem: Emails go to spam

**Solution**:
- Mark as "Not Spam" in Gmail
- For production, use SendGrid/Mailgun
- Add SPF/DKIM records

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `EMAIL_NOTIFICATIONS_QUICK_START.md` | ⚡ Quick setup (5 minutes) |
| `AUTOMATED_EMAIL_NOTIFICATIONS.md` | 📖 Complete guide with all details |
| `EMAIL_SETUP.md` | 📧 Gmail SMTP configuration |
| `IMPLEMENTATION_SUMMARY.md` | 📋 Technical overview |
| `FEATURE_GUIDE.md` | 🎯 This file - visual guide |

---

## ⚙️ NPM Scripts

| Command | Description |
|---------|-------------|
| `pnpm run notify:test` | Run notification check (cross-platform) |
| `pnpm run notify:test:win` | Run notification check (Windows) |

---

## 🎯 Quick Reference

### User Actions
- **Enable**: Account → Toggle "Oznámení novinek na email"
- **Configure**: Account → "Zobrazit parametry oznámení"
- **Test**: Account → "Otestovat oznámení (dnes)"

### Admin Actions
- **Setup**: Configure `.env` file
- **Test**: `pnpm run notify:test`
- **Schedule**: Task Scheduler or Cron

### API Endpoints
- **Manual**: `POST /api/v1/notifications/send-email`
- **Automated**: `POST /api/v1/notifications/check-and-send`

---

## ✅ Status

**Implementation**: ✅ Complete  
**Documentation**: ✅ Complete  
**Testing**: ✅ Ready  
**Production**: ⏳ Needs scheduling

---

## 🎉 Ready to Use!

1. ✅ Email configuration done
2. ✅ User interface ready
3. ✅ API endpoints working
4. ✅ Scripts created
5. ⏳ **Schedule the daily script** → See above
6. ⏳ Test with real users
7. ⏳ Monitor first week

**Next Step**: Schedule the daily script with Task Scheduler or Cron! 🚀
