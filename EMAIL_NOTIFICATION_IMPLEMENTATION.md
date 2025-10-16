# Email Notification Feature Implementation

## Overview
Implemented email notification functionality using nodemailer to send notification emails to users when new messages matching their preferences are posted on the úřední deska.

## Files Created/Modified

### New Files Created:

1. **`/src/lib/nodemailer.ts`**
   - Nodemailer configuration and setup
   - Email sending utility functions
   - HTML email template generation
   - `sendEmail()` - Core email sending function
   - `createNotificationEmailHtml()` - Generates formatted HTML emails with message listings

2. **`/src/routes/api/v1/notifications/send-email/+server.ts`**
   - Server-side API endpoint for sending notification emails
   - Validates request data
   - Processes messages and sends formatted emails
   - Error handling and logging

3. **`/.env.example`**
   - Template for environment variables
   - Documentation for Gmail SMTP setup
   - Instructions for generating app passwords

4. **`/EMAIL_SETUP.md`**
   - Comprehensive setup guide
   - Step-by-step Gmail SMTP configuration
   - Troubleshooting section
   - Alternative SMTP provider configurations
   - Security best practices

### Modified Files:

1. **`/src/routes/account/+page.svelte`**
   - Updated `testNotifications()` function to support email notifications
   - Added logic to send emails when `emailNotifications` is enabled
   - Enhanced button to show disabled state when both notification types are off
   - Improved notification permission handling
   - Added success messages showing notification delivery method (browser/email)
   - Fixed vibrate API compatibility issue

## Features Implemented

### Email Notification System
- ✅ Send HTML-formatted emails with nodemailer
- ✅ Professional email templates matching KHK branding
- ✅ Multiple messages grouped in single email
- ✅ Direct links to message details
- ✅ Message information: title, category, date, location
- ✅ Gmail SMTP integration
- ✅ Environment variable configuration
- ✅ Error handling and logging

### User Interface Updates
- ✅ Test button respects both notification settings
- ✅ Disabled state when no notification methods are enabled
- ✅ Success messages indicate delivery method (browser/email/both)
- ✅ Proper permission handling for browser notifications
- ✅ Graceful fallback when email sending fails

### Backend Implementation
- ✅ Server-side email endpoint (`/api/v1/notifications/send-email`)
- ✅ Request validation
- ✅ Secure email sending (no credentials exposed to client)
- ✅ JSON response with success/error status

## How It Works

### User Flow:
1. User enables "Oznámení novinek na email" toggle in account settings
2. User configures notification parameters (categories, location, radius)
3. User clicks "Otestovat oznámení (dnes)" button
4. System filters messages based on:
   - Posted today
   - Matching category preferences
   - Within specified radius of location
5. If matches found:
   - Browser notifications shown (if enabled)
   - Email sent (if enabled)
   - Success message displays delivery methods

### Email Sending Process:
1. Client sends POST request to `/api/v1/notifications/send-email`
2. Server receives user email and matched messages
3. HTML email is generated using template
4. Nodemailer sends email via Gmail SMTP
5. Server returns success/error response
6. Client shows appropriate feedback

## Configuration Required

### Environment Variables (`.env`):
```env
APP_USER=your-email@gmail.com
APP_PASSWORD=your-app-specific-password
```

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Add credentials to `.env` file
4. Restart development server

## Dependencies Added
- `nodemailer@7.0.9` - Email sending library
- `@types/nodemailer@7.0.2` - TypeScript definitions

## Testing
To test the email notification feature:
1. Set up Gmail SMTP credentials in `.env`
2. Log in to the application
3. Enable email notifications toggle
4. Add notification parameters
5. Click "Otestovat oznámení (dnes)"
6. Check your email inbox for notification

## Security Considerations
- ✅ Environment variables for sensitive credentials
- ✅ Server-side email sending (credentials never exposed to client)
- ✅ `.env` excluded from version control
- ✅ App Passwords instead of main Gmail password
- ✅ Input validation on server endpoint
- ✅ Error handling without exposing sensitive information

## Future Enhancements (Optional)
- [ ] Schedule automatic daily notifications
- [ ] Email digest preferences (daily/weekly)
- [ ] Email template customization
- [ ] Multiple recipient support
- [ ] Unsubscribe functionality
- [ ] Email delivery status tracking
- [ ] Support for other email providers (Outlook, SendGrid, etc.)

## Notes
- Emails are sent only when user clicks test button (not automated yet)
- HTML emails are mobile-responsive
- Email template uses KHK brand colors (#0a2f83)
- Links in emails open message detail pages
- System gracefully handles email failures without affecting browser notifications
