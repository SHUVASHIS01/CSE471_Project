# Quick Fix for 401 Unauthorized Errors

## ✅ Step-by-Step Solution

### Step 1: Verify Backend Deployment
1. Go to your **Render dashboard**: https://dashboard.render.com
2. Find your backend service (`jobportal-backend`)
3. Check if there's a new deployment running or completed
4. **If no new deployment**: 
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete (2-5 minutes)

### Step 2: Verify Environment Variables
In Render dashboard, check your backend service → Environment:
- ✅ `NODE_ENV=production` (MUST be set to "production" for the cookie fix to work!)
- ✅ `MONGO_URI=your-connection-string` (not MONGODB_URI!)
- ✅ `JWT_SECRET=your-secret-key`
- ✅ `FRONTEND_URL=https://jobportal-orpin-ten.vercel.app` (your actual Vercel URL)

### Step 3: Clear Browser Data
**IMPORTANT**: You MUST clear cookies after backend redeploys!

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Cookies** in left sidebar
4. Select your Vercel domain (`jobportal-orpin-ten.vercel.app`)
5. Delete the `token` cookie (or delete all cookies)
6. Close DevTools

**Alternative - Clear All Site Data:**
1. Click the lock icon in address bar
2. Click "Cookies" → "Remove"
3. Or use: Settings → Privacy → Clear browsing data → Cookies

### Step 4: Logout and Login Again
1. **Logout** from the application
2. **Close the browser tab** (optional but recommended)
3. **Open a new tab** and go to your app
4. **Login again** with your credentials
5. Check DevTools → Application → Cookies
   - You should see a `token` cookie
   - It should have `SameSite=None` and `Secure` flags

### Step 5: Verify It's Working
1. Open DevTools → **Console** tab
2. Look for errors:
   - ✅ **No 401 errors** = Success!
   - ❌ **Still 401 errors** = Continue troubleshooting

3. Check **Network** tab:
   - Click on a failed request (red)
   - Check "Headers" → "Request Headers"
   - Look for `Cookie: token=...` (should be present)
   - Check "Response Headers" for `Set-Cookie` (should have `SameSite=None`)

## 🔍 If Still Getting 401 Errors

### Check 1: Backend Logs
1. Go to Render dashboard → Your backend service
2. Click "Logs" tab
3. Look for:
   - ✅ "MongoDB connected successfully"
   - ✅ "Server listening on port XXXX"
   - ❌ Any errors about cookies or authentication

### Check 2: Verify Cookie Settings in Backend
The backend should be setting cookies with:
- `sameSite: 'None'` (when NODE_ENV=production)
- `secure: true` (when NODE_ENV=production)

### Check 3: CORS Configuration
In `backend/index.js`, verify CORS includes your frontend URL:
```javascript
origin: [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL, // Should be your Vercel URL
  "https://jobportal-orpin-ten.vercel.app", // Your actual URL
],
credentials: true
```

### Check 4: Test Backend Directly
1. Open: `https://your-backend.onrender.com/`
2. Should see: "API is running"
3. Try: `https://your-backend.onrender.com/api/jobs/all`
   - Should return 401 (expected - needs auth)
   - But should NOT be a CORS error

## 🚨 Common Issues

### Issue: "NODE_ENV not set to production"
- **Symptom**: Cookies still use `sameSite: 'Strict'`
- **Fix**: Set `NODE_ENV=production` in Render environment variables

### Issue: "Frontend URL mismatch"
- **Symptom**: CORS errors in console
- **Fix**: Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly (including https://)

### Issue: "Cookies not being sent"
- **Symptom**: Network tab shows no `Cookie` header
- **Fix**: 
  - Clear cookies completely
  - Logout and login again
  - Verify `withCredentials: true` in frontend API calls (already set)

### Issue: "Backend not redeployed"
- **Symptom**: Old code still running
- **Fix**: 
  - Check Render dashboard for latest deployment
  - Manually trigger deploy if needed
  - Wait for deployment to complete

## ✅ Success Indicators

When everything is working:
- ✅ No 401 errors in console
- ✅ Jobs load successfully
- ✅ `token` cookie exists with `SameSite=None`
- ✅ Network requests include `Cookie: token=...` header
- ✅ Backend logs show successful authentication

---

**Still having issues?** Check the full troubleshooting section in `DEPLOYMENT_GUIDE.md`.




