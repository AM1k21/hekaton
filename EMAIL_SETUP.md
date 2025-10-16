# Email Notification Setup

This guide explains how to configure email notifications for the Úřední deska application using Gmail SMTP.

## Prerequisites

- A Gmail account
- Two-factor authentication enabled on your Google account

## Setup Instructions

### 1. Enable Two-Factor Authentication

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled
3. Follow the prompts to set it up

### 2. Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select your device or choose "Other" and give it a name (e.g., "Úřední deska")
4. Click "Generate"
5. Copy the 16-character password that appears (you won't be able to see it again)

### 3. Configure Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist):
   ```bash
   touch .env
   ```

2. Add your Gmail credentials to the `.env` file:
   ```env
   APP_USER=your-email@gmail.com
   APP_PASSWORD=your-16-character-app-password
   ```

3. Replace `your-email@gmail.com` with your actual Gmail address
4. Replace `your-16-character-app-password` with the app password you generated

### 4. Verify Configuration

1. Make sure `.env` is in your `.gitignore` file (it should be by default)
2. Restart your development server:
   ```bash
   pnpm dev
   ```

## Testing Email Notifications

1. Log in to your account
2. Navigate to the Account Settings page
3. Enable "Oznámení novinek na email" toggle
4. Add notification parameters (categories, location, radius)
5. Click "Otestovat oznámení (dnes)" to send a test notification

The system will:
- Check for messages posted today
- Filter them based on your preferences (category, location, radius)
- Send an email if there are matching messages

## Troubleshooting

### Common Issues

**Error: "Invalid login credentials"**
- Make sure you're using an App Password, not your regular Gmail password
- Verify that 2-factor authentication is enabled
- Check that there are no extra spaces in your `.env` file

**Error: "Connection timeout"**
- Check your internet connection
- Verify that port 465 is not blocked by your firewall
- Try using port 587 with `secure: false` in `nodemailer.ts`

**Emails not being received**
- Check your spam/junk folder
- Verify the recipient email address is correct
- Check Gmail's "Sent" folder to confirm the email was sent

### Alternative SMTP Configuration

If Gmail doesn't work for you, you can use other SMTP providers:

#### Using Outlook/Office365
```env
# In nodemailer.ts, change:
host: "smtp.office365.com"
port: 587
secure: false  # Use STARTTLS
```

#### Using a custom SMTP server
```env
# In nodemailer.ts, update the configuration:
host: "your-smtp-server.com"
port: 587
secure: false
auth: {
  user: APP_USER,
  pass: APP_PASSWORD,
}
```

## Email Notification Features

- **HTML emails** with formatted content
- **Multiple messages** in a single email
- **Message details** including title, category, date, and link
- **Direct links** to view full message details
- **Professional branding** matching the Královéhradecký kraj design

## Security Notes

- Never commit your `.env` file to version control
- Use App Passwords instead of your main Gmail password
- Rotate your App Password periodically
- Only share environment variables through secure channels

## Additional Resources

- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Google Account Security](https://myaccount.google.com/security)
