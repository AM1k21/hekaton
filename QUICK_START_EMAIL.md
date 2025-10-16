# Quick Start: Email Notifications

## 1. Install Dependencies (Already Done)
```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

## 2. Setup Gmail SMTP

Create `.env` file in project root:
```env
APP_USER=your-gmail@gmail.com
APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

Get App Password:
1. Go to https://myaccount.google.com/apppasswords
2. Generate password for "Mail"
3. Copy 16-character password to `.env`

## 3. Test the Feature

1. Start dev server: `pnpm dev`
2. Log in to your account
3. Go to Account Settings
4. Enable "Oznámení novinek na email"
5. Add notification parameters
6. Click "Otestovat oznámení (dnes)"
7. Check your email inbox

## 4. Email Template Location

To customize email appearance, edit:
- `/src/lib/nodemailer.ts` - `createNotificationEmailHtml()` function

## 5. SMTP Configuration

To use different email provider, edit:
- `/src/lib/nodemailer.ts` - `transporter` configuration

### Example: Outlook/Office365
```typescript
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: APP_USER,
    pass: APP_PASSWORD,
  },
});
```

## Troubleshooting

**Problem**: Email not sending
- Check `.env` file exists and has correct credentials
- Verify 2FA is enabled on Gmail
- Check server console for error messages

**Problem**: Emails go to spam
- Add sender to contacts
- Check email template (no spam keywords)
- Verify SPF/DKIM records (for production)

For detailed setup, see `EMAIL_SETUP.md`
