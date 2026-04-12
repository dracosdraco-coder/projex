# ⚡ PROJEX - 5 Minute Setup

## ✅ Checklist

### 1. Install (2 min)
```bash
cd projex-clean
npm install
```

### 2. Database (2 min)
1. Open https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy/paste `supabase-schema.sql`
4. Click Run
5. Check Database → Tables (should see 9 tables)

### 3. Auth Settings (30 sec)
1. Authentication → Providers → Email
2. Turn OFF "Confirm email"
3. Save

### 4. Run (30 sec)
```bash
npm run dev
```

### 5. Test (1 min)
1. Go to http://localhost:3000/login
2. Click "Sign up"
3. Enter email: `test@test.com`
4. Enter password: `test123`
5. Click "Create Account"
6. Click "Sign in" tab
7. Enter same credentials
8. Click "Sign In"
9. **Should redirect to /access with your app!** ✅

---

## 🎉 Done!

If you see your window manager at `/access`, you're ready for mobile responsive work!

## 🐛 Problems?

**Doesn't redirect after "Sign in successful":**
1. Open Console (F12)
2. Type: `window.location.href = '/access'`
3. If that works → timing issue, let me know
4. If that doesn't work → send me console errors

**"Module not found":**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Tables not created:**
- Check for SQL errors in Supabase
- Copy error message and send to me

---

**Expected total time: 5-7 minutes** ⏱️
