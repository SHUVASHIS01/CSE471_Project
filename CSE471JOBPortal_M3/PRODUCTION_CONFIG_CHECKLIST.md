# Production Configuration Checklist

## ✅ Your Current URLs

- **Backend**: `https://jobportal-backend-j2r8.onrender.com`
- **Frontend**: `https://jobportal-orpin-ten.vercel.app`

---

## 🔧 Backend Configuration (Render)

### Environment Variables to Set:

Go to: **Render Dashboard** → **Your Backend Service** → **Environment**

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://cse471_job1:CSE471project%40@cluster0.6qttunk.mongodb.net/cse471_job?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=https://jobportal-orpin-ten.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Important Notes:**
- ✅ `NODE_ENV=production` - **MUST be set** for cookie fix to work!
- ✅ `FRONTEND_URL` - **No trailing slash** (code will handle it)
- ✅ `MONGO_URI` - Not `MONGODB_URI`!

### Verify Backend is Running:
- Visit: https://jobportal-backend-j2r8.onrender.com
- Should see: "API is running"

---

## 🎨 Frontend Configuration (Vercel)

### Environment Variables to Set:

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

```
REACT_APP_API_URL=https://jobportal-backend-j2r8.onrender.com
```

**Important Notes:**
- ✅ **No trailing slash** in the URL
- ✅ **No `/api` suffix** (code adds it automatically)
- ✅ Must be set for **Production** environment (or All environments)

### Verify Frontend is Running:
- Visit: https://jobportal-orpin-ten.vercel.app
- Should load the application

---

## 🔍 Verification Steps

### Step 1: Check Backend Environment Variables
1. Go to Render dashboard
2. Open your backend service
3. Click "Environment" tab
4. Verify all variables are set correctly
5. **Especially check**: `NODE_ENV=production` ✅

### Step 2: Check Frontend Environment Variables
1. Go to Vercel dashboard
2. Open your project
3. Go to Settings → Environment Variables
4. Verify `REACT_APP_API_URL` is set
5. Make sure it's deployed to Production environment

### Step 3: Test Backend API
1. Open: https://jobportal-backend-j2r8.onrender.com
2. Should see: "API is running"
3. Test with curl (optional):
   ```bash
   curl https://jobportal-backend-j2r8.onrender.com/api/jobs/all
   ```
   Should return 401 (expected - needs auth), NOT CORS error

### Step 4: Clear Cookies and Test
1. Open your frontend: https://jobportal-orpin-ten.vercel.app
2. Open DevTools (F12) → Application → Cookies
3. **Delete all cookies** for the site
4. **Logout** (if logged in)
5. **Login again**
6. Check DevTools → Application → Cookies
   - Should see `token` cookie
   - Should have `SameSite=None` and `Secure` flags

### Step 5: Verify No 401 Errors
1. Open DevTools → Console tab
2. Should see **NO 401 errors**
3. Jobs should load successfully
4. Check Network tab:
   - Requests should include `Cookie: token=...` header
   - Responses should have `Set-Cookie` with `SameSite=None`

---

## 🐛 Troubleshooting

### Issue: Still Getting 401 Errors

**Check 1: NODE_ENV is production?**
- Go to Render → Environment variables
- Verify `NODE_ENV=production` (not `development` or missing)

**Check 2: Backend redeployed?**
- Go to Render → Your service → Logs
- Check latest deployment timestamp
- Should be after the cookie fix was pushed

**Check 3: Cookies cleared?**
- Must clear cookies after backend redeploys
- Use DevTools → Application → Cookies → Delete all

**Check 4: CORS working?**
- Check Network tab in DevTools
- Look for CORS errors (different from 401)
- Verify `FRONTEND_URL` in backend matches frontend URL exactly

**Check 5: Frontend environment variable?**
- Verify `REACT_APP_API_URL` is set in Vercel
- Must rebuild frontend after adding environment variable
- Go to Vercel → Deployments → Redeploy

### Issue: CORS Errors

**Symptoms:**
- Console shows "CORS policy" errors
- Network tab shows CORS preflight failures

**Fix:**
1. Verify `FRONTEND_URL` in backend is: `https://jobportal-orpin-ten.vercel.app`
2. No trailing slash (code handles it)
3. Redeploy backend after changing environment variable

### Issue: Backend Not Responding

**Symptoms:**
- "API is running" page doesn't load
- Timeout errors

**Fix:**
- Render free tier spins down after 15 min inactivity
- First request takes 30-60 seconds to wake up
- Wait for backend to wake up, then try again

---

## 📝 Quick Reference

### Backend URL:
```
https://jobportal-backend-j2r8.onrender.com
```

### Frontend URL:
```
https://jobportal-orpin-ten.vercel.app
```

### Backend API Endpoint:
```
https://jobportal-backend-j2r8.onrender.com/api
```

### Frontend Environment Variable:
```
REACT_APP_API_URL=https://jobportal-backend-j2r8.onrender.com
```

### Backend Environment Variable:
```
FRONTEND_URL=https://jobportal-orpin-ten.vercel.app
```

---

## ✅ Success Checklist

- [ ] Backend environment variables set correctly
- [ ] Frontend environment variables set correctly
- [ ] `NODE_ENV=production` in backend
- [ ] Backend deployed with latest code
- [ ] Frontend rebuilt with environment variables
- [ ] Cookies cleared in browser
- [ ] Logged out and logged in again
- [ ] No 401 errors in console
- [ ] Jobs load successfully
- [ ] `token` cookie exists with `SameSite=None`

---

**Last Updated**: After cookie fix deployment
**Status**: Ready for testing




