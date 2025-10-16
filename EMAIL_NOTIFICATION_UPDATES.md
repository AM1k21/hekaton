# 📧 Email Notification Updates

## ✅ Changes Made

### 1. Links Now Point to Your Application

**Before**: Email links pointed to the original URL from úřední deska  
**After**: Email links point to your application's detail pages

- Format: `https://yourdomain.com/detail/{id}`
- Uses `PUBLIC_BASE_URL` from environment variables
- Works for both manual tests and automated notifications

### 2. Favicon Added to Email Header

**Before**: Plain text header  
**After**: Header includes your application's favicon (48x48px)

- Shows `favicon-144x144.png` from your static folder
- Positioned above "Nová oznámení" title
- Rounded corners for modern look

### 3. Improved Email Design

- Added border-radius to message cards
- Better padding on "Zobrazit detail" button
- Link to account settings in footer

## 📁 Files Modified

### 1. `src/lib/nodemailer.ts`
- Added `baseUrl` variable using `PUBLIC_BASE_URL`
- Added favicon image in email header
- Improved styling of message cards
- Added link to account page in footer

### 2. `src/routes/api/v1/notifications/check-and-send/+server.ts`
- Uses `PUBLIC_BASE_URL` for constructing URLs
- Generates detail page URLs: `${baseUrl}/detail/${msg.id}`

### 3. `src/routes/account/+page.svelte`
- Test button now uses `window.location.origin`
- Generates detail page URLs for test emails

## 🎨 Email Template Preview

```
┌─────────────────────────────────────┐
│  [🏛️ Favicon]                       │
│  Nová oznámení                      │
│  (KHK Blue Background)              │
├─────────────────────────────────────┤
│                                     │
│  Vážený uživateli,                  │
│                                     │
│  ┌────────────────────────────┐    │
│  │ Item Title                 │    │
│  │ Kategorie: Ekonomika       │    │
│  │ Vyvěšeno: 2025-01-16      │    │
│  │                            │    │
│  │ [Zobrazit detail] ←────────┼─── Links to your app!
│  └────────────────────────────┘    │
│                                     │
│  Děkujeme,                          │
│  Tým Úřední desky KHK               │
│                                     │
├─────────────────────────────────────┤
│  Automatická zpráva                 │
│  Nastavení v účtu ←───────────────── Links to /account
└─────────────────────────────────────┘
```

## 🔧 Configuration Required

Make sure your `.env` file has:

```env
PUBLIC_BASE_URL=http://localhost:5173  # Development
# or
PUBLIC_BASE_URL=https://yourdomain.com  # Production
```

## ✅ Testing

### Test the Changes

1. **Manual Test** (Test button):
   ```bash
   # Start your dev server
   pnpm run dev
   
   # Go to /account
   # Click "Otestovat oznámení (dnes)"
   # Check email inbox
   ```

2. **Automated Test**:
   ```bash
   # Run notification script
   pnpm run notify:test
   ```

### What to Check

- ✅ Email includes favicon in header
- ✅ "Zobrazit detail" button links to `/detail/{id}` on your domain
- ✅ Footer link points to `/account` on your domain
- ✅ All links work correctly

## 🎯 Benefits

1. **Better Branding**: Favicon makes emails recognizable
2. **Better UX**: Users stay within your application
3. **Better Tracking**: You can track which links are clicked
4. **Better Analytics**: Users land on your application pages

## 📝 Notes

- Favicon is served from `/favicon-144x144.png` (static folder)
- Links use absolute URLs (full domain)
- Works in both development and production
- Email clients will cache the favicon image

---

**Status**: ✅ Complete and ready to test!
