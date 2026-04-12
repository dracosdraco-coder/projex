# 🚀 PROJEX - SETUP & DEBUG GUIDE

## 🎯 What Was Fixed

### 1. **Authentication System Conflict** ✅
- **Removed:** NextAuth + Prisma (incompatible with Supabase)
- **Kept:** Supabase Auth (simpler, modern, all-in-one)
- **Updated:** Middleware to use Supabase sessions instead of JWT tokens

### 2. **Environment Variables** ✅
- **Fixed:** Removed spaces after `=` signs in `.env.local`
- Environment variables now properly formatted

### 3. **Dependencies Cleaned** ✅
- Removed: `next-auth`, `@next-auth/prisma-adapter`, `prisma`, `@prisma/client`, `bcrypt`
- Added: `@supabase/auth-helpers-nextjs` for Next.js middleware support
- Kept: `@supabase/supabase-js` for client-side auth

---

## 📋 SETUP INSTRUCTIONS

### Step 1: Install Dependencies
```bash
cd /path/to/projex-fixed
npm install
```

### Step 2: Configure Supabase Dashboard

1. **Go to your Supabase Dashboard:** https://supabase.com/dashboard
2. **Navigate to Authentication → Providers → Email**
3. **IMPORTANT:** Disable "Confirm email" for testing
   - This prevents the email confirmation requirement during development
   - You can re-enable it later for production

### Step 3: Run Database Schema

1. **In Supabase Dashboard, go to SQL Editor**
2. **Copy the entire contents of `supabase-schema.sql`**
3. **Paste and run the SQL**
4. **Verify tables were created:** Go to Database → Tables

Expected tables:
- `projects`
- `project_phases`
- `tasks`
- `expenses`
- `meetings`
- `documents`
- `profiles`
- `branches`
- `templates`

### Step 4: Test Authentication

```bash
npm run dev
```

Visit: http://localhost:3000/login

**Test Flow:**
1. Create a new account (Sign Up)
2. Check browser console for logs (should show "✅ Sign up complete")
3. Try signing in with the same credentials
4. Should redirect to `/access` page

---

## 🐛 DEBUGGING CHECKLIST

If login still doesn't work, check these in order:

### 1. Check Environment Variables
```bash
# Make sure no spaces after = signs
cat .env.local

# Should look like:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

### 2. Check Browser Console
Open DevTools (F12) → Console tab

**Expected logs when clicking Login:**
```
🚀 Form submitted
🔑 Attempting sign in...
🔐 Attempting sign in...
Sign in result: { data: {...}, error: null }
✅ Sign in successful!
✅ Sign in complete, redirecting...
```

**If you see errors:**
- "Invalid login credentials" → User doesn't exist or wrong password
- "Email not confirmed" → Disable email confirmation in Supabase
- Network error → Check Supabase URL and API key

### 3. Check Supabase Dashboard

**Authentication → Users**
- Are there any users listed?
- Is the user email confirmed?

**Authentication → Providers → Email**
- Is email provider enabled?
- Is "Confirm email" DISABLED for testing?

### 4. Check Network Tab
Open DevTools → Network tab → Filter by "Fetch/XHR"

When clicking login, you should see:
- Request to `https://[your-project].supabase.co/auth/v1/token?grant_type=password`
- Status: 200 OK
- Response: Contains `access_token` and `user` data

### 5. Verify Middleware
```bash
# Check that middleware.ts exists and has no import errors
cat src/middleware.ts
```

Should import from `@supabase/auth-helpers-nextjs`, NOT `next-auth/jwt`

---

## 🔥 COMMON ERRORS & SOLUTIONS

### Error: "Email rate limit exceeded"
**Solution:** Wait 60 seconds between signup attempts on the same email

### Error: "Invalid login credentials"
**Solution:**
1. Make sure you're using the correct email/password
2. Check if user exists in Supabase Dashboard
3. Try creating a new account

### Error: "Email not confirmed"
**Solution:** Disable email confirmation in Supabase Dashboard:
- Authentication → Providers → Email → Turn OFF "Confirm email"

### Error: "Module not found: @supabase/auth-helpers-nextjs"
**Solution:**
```bash
npm install @supabase/auth-helpers-nextjs
```

### Error: Login button stuck on "Loading..."
**Solution:**
1. Check browser console for errors
2. Verify `.env.local` has correct values
3. Make sure Supabase project is active
4. Check Network tab for failed requests

### Error: "Cannot read properties of undefined (reading 'getSession')"
**Solution:** Middleware issue. Make sure:
- `@supabase/auth-helpers-nextjs` is installed
- No import errors in `middleware.ts`
- Run `npm install` again

---

## ✅ SUCCESS CHECKLIST

Before proceeding to mobile responsive work:

- [ ] `npm install` completes without errors
- [ ] `.env.local` has valid Supabase credentials (no spaces)
- [ ] Database schema is applied in Supabase
- [ ] Email confirmation is DISABLED in Supabase
- [ ] Can create a new account (sign up)
- [ ] Can sign in with credentials
- [ ] Login redirects to `/access` page
- [ ] Browser console shows success logs
- [ ] No errors in terminal or console
- [ ] Supabase Dashboard shows the new user

---

## 🎯 NEXT STEPS (After Login Works)

### Priority 2: Mobile Responsive (4 hours)
- Header - Hamburger menu
- FilterBar - Collapse on mobile
- Window system - Full screen on mobile
- Dock - Vertical orientation
- Task Board - Horizontal scroll
- Timeline - Touch gestures
- All modals - Full screen

### Priority 3: Error Handling (2 hours)
- Try/catch blocks everywhere
- Toast notifications
- Loading states
- Form validation
- Confirmation dialogs
- Error boundaries

### Priority 4: Performance (2 hours)
- Pagination for project lists
- Lazy load images
- Debounce search
- React.memo optimization
- Loading skeletons

---

## 📞 NEED HELP?

If you're still stuck after following this guide:

1. **Copy the exact error message** from browser console
2. **Check Network tab** for failed requests
3. **Screenshot the Supabase Auth settings** page
4. **Verify environment variables** are loaded (check process.env in console)

---

## 🎉 BETA LAUNCH READY CHECKLIST

- [ ] Login/Signup works
- [ ] Can create projects
- [ ] Can initialize PM (phases/tasks)
- [ ] Can add tasks and update status
- [ ] Can track expenses
- [ ] Data persists in Supabase
- [ ] Works on mobile
- [ ] No critical bugs
- [ ] Demo data created
- [ ] Known issues documented

**Target:** Monday Beta Launch 🚀
