# 🚨 Authentication Bypass for Testing

## Quick Setup

The authentication bypass is **already enabled** and ready to use!

## ✅ What's Bypassed

When `BYPASS_AUTH = true` in development mode, the following are automatically bypassed:

- **All protected pages**: `/dashboard`, `/admin`, `/duplicates`, `/upload`
- **All API endpoints**: File upload, admin config, duplicate validation
- **Role-based restrictions**: You'll have ADMIN access to everything
- **Login redirects**: No more login prompts

## 🔧 Configuration

### Enable/Disable Bypass

Edit `/src/lib/test-auth.ts`:

```typescript
// Set to true to bypass authentication for testing
export const BYPASS_AUTH = true  // ✅ Currently enabled

// Set to false to use normal authentication
export const BYPASS_AUTH = false
```

### Change Test User Role

Edit `/src/lib/test-auth.ts`:

```typescript
export const mockTestUser = {
  id: "test-user-id",
  email: "test@example.com", 
  name: "Test User",
  role: UserRole.ADMIN,        // ✅ Current: Full admin access
  // role: UserRole.STANDARD_USER,  // Standard user access
  // role: UserRole.REVIEWER,       // Reviewer access
  image: null
}
```

## 🧪 Testing URLs

With bypass enabled, you can directly access:

- **Dashboard**: `http://localhost:3000/dashboard`
- **Upload Files**: `http://localhost:3000/upload` 
- **Admin Panel**: `http://localhost:3000/admin`
- **Duplicates**: `http://localhost:3000/duplicates`
- **Test Status**: `http://localhost:3000/test-auth` (shows bypass status)

## 🚨 Visual Indicators

When bypass is active, you'll see:

- **Navbar**: "🚨 TEST MODE" indicator in user dropdown
- **Console**: "🚨 AUTH BYPASS ENABLED" messages
- **Test Page**: Orange warning banner

## 🔄 Quick Toggle

### To Enable Bypass:
1. Set `BYPASS_AUTH = true` in `/src/lib/test-auth.ts`
2. Restart the dev server: `npm run dev`
3. Access any protected route directly

### To Disable Bypass:
1. Set `BYPASS_AUTH = false` in `/src/lib/test-auth.ts`  
2. Restart the dev server
3. Normal login will be required

## ⚠️ Important Notes

- **Development Only**: Bypass only works in development mode (`NODE_ENV=development`)
- **Security**: Never deploy with bypass enabled
- **Session**: Uses a mock session that never expires during development
- **APIs**: All API endpoints will authenticate as the test user

## 🎯 Current Status

✅ **Bypass is ACTIVE**
- Role: **ADMIN** (full access)
- User: test@example.com
- All features unlocked

**You can now test the entire application without any login requirements!** 🚀