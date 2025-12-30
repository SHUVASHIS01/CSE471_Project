# Free Deployment Guide - JobPortal

This guide covers free deployment options for the JobPortal application. We'll deploy the frontend, backend, and database separately using free hosting services.

## 🎯 Deployment Architecture

```
Frontend (React) → Vercel/Netlify (Free)
Backend (Node.js) → Render/Railway (Free)
Database → MongoDB Atlas (Free)
File Storage → Cloudinary (Free) or Backend storage
```

## 📋 Prerequisites

1. GitHub account (for code hosting)
2. Accounts for:
   - [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (Frontend)
   - [Render](https://render.com) or [Railway](https://railway.app) (Backend)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Database)
   - [Cloudinary](https://cloudinary.com) (Optional - for file storage)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Free)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **FREE (M0) Shared** tier
   - Select a cloud provider and region (closest to your deployment)
   - Click "Create"

3. **Setup Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set user privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jobportal?retryWrites=true&w=majority`

6. **Database Creation**
   - ✅ **No manual database creation needed!**
   - MongoDB Atlas automatically creates the database when your application first writes data to it
   - The database name in your connection string (e.g., `cse471_job` or `jobportal`) will be created automatically
   - Example connection string: `mongodb+srv://cse471_job1:CSE471project%40@cluster0.6qttunk.mongodb.net/cse471_job?retryWrites=true&w=majority`
   - Just use your connection string as-is in the `MONGO_URI` environment variable

---

## 🖥️ Step 2: Deploy Backend (Render - Free)

### Option A: Render (Recommended - Free Tier Available)

1. **Create Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   ```
   Name: jobportal-backend
   Environment: Node
   Root Directory: CSE471JOBPortal_M3
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```
   
   **Important**: Since your repository has a nested structure (`CSE471_Project/CSE471JOBPortal_M3/backend`), you need to set the **Root Directory** to `CSE471JOBPortal_M3` in Render settings. This tells Render where your project root is.
   
   **Alternative** (if Root Directory option doesn't work):
   ```
   Build Command: cd CSE471JOBPortal_M3/backend && npm install
   Start Command: cd CSE471JOBPortal_M3/backend && npm start
   Root Directory: (leave empty)
   ```

4. **Environment Variables**
   Add these in Render dashboard:
   ```
   PORT=10000
   NODE_ENV=production
   MONGO_URI=mongodb+srv://cse471_job1:CSE471project%40@cluster0.6qttunk.mongodb.net/cse471_job?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   BREVO_API_KEY=your-brevo-api-key (optional)
   PREFERRED_EMAIL_SERVICE=brevo
   ENABLE_EMAIL_FALLBACK=true
   IPINFO_API_KEY=your-ipinfo-api-key (optional)
   ```
   
   **Note**: Use your actual MongoDB connection string. The database (`cse471_job`) will be automatically created when your app first connects and writes data.

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy the service URL (e.g., `https://jobportal-backend.onrender.com`)

**Note**: Render free tier spins down after 15 minutes of inactivity. First request may take 30-60 seconds.

### Option B: Railway (Alternative - Free Trial)

1. **Create Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure Service**
   - Railway auto-detects Node.js
   - Set Root Directory to `CSE471JOBPortal_M3/backend`
   - Set Start Command to `npm start`
   - Build Command: `npm install` (runs automatically in root directory)

4. **Environment Variables**
   - Add the same variables as Render
   - Railway provides `PORT` automatically

5. **Deploy**
   - Railway auto-deploys on push
   - Get your service URL

---

## 🎨 Step 3: Deploy Frontend (Vercel - Free)

### Option A: Vercel (Recommended)

1. **Create Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Project**
   ```
   Framework Preset: Create React App
   Root Directory: CSE471JOBPortal_M3/frontend
   Build Command: npm run build
   Output Directory: build
   ```
   
   **Important**: Since your repository has a nested structure, set the **Root Directory** to `CSE471JOBPortal_M3/frontend`.

4. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build (2-5 minutes)
   - Get your frontend URL (e.g., `https://jobportal.vercel.app`)

6. **Update Backend CORS**
   - Go back to Render/Railway
   - Update `FRONTEND_URL` environment variable with your Vercel URL
   - Redeploy backend

### Option B: Netlify (Alternative)

1. **Create Account**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **New Site from Git**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository

3. **Build Settings**
   ```
   Base directory: CSE471JOBPortal_M3/frontend
   Build command: npm run build
   Publish directory: CSE471JOBPortal_M3/frontend/build
   ```
   
   **Important**: Since your repository has a nested structure, use `CSE471JOBPortal_M3/frontend` as the base directory.

4. **Environment Variables**
   - Go to "Site settings" → "Environment variables"
   - Add `REACT_APP_API_URL`

5. **Deploy**
   - Click "Deploy site"
   - Get your Netlify URL

---

## 📁 Step 4: Handle File Uploads

The free hosting services have ephemeral file systems. You have two options:

### Option A: Use Backend Storage (Temporary - Files Lost on Restart)

**For Render/Railway:**
- Files are stored in `backend/uploads`
- Files persist until service restarts
- **Limitation**: Files are lost on service restart (Render free tier restarts daily)

### Option B: Use Cloudinary (Recommended - Free Tier)

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com
   - Sign up for free account
   - Get your credentials from dashboard

2. **Install Cloudinary**
   ```bash
   cd backend
   npm install cloudinary multer-storage-cloudinary
   ```

3. **Update Backend Code**
   Create `backend/config/cloudinary.js`:
   ```javascript
   const cloudinary = require('cloudinary').v2;
   const { CloudinaryStorage } = require('multer-storage-cloudinary');
   const multer = require('multer');

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   });

   const storage = new CloudinaryStorage({
     cloudinary: cloudinary,
     params: {
       folder: 'jobportal',
       allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
     }
   });

   module.exports = multer({ storage: storage });
   ```

4. **Update Routes**
   - Replace multer disk storage with Cloudinary storage in your routes
   - Update file URL generation to use Cloudinary URLs

5. **Environment Variables**
   Add to Render/Railway:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

---

## 🔧 Step 5: Update Code for Production

### 1. Update Backend CORS

In `backend/index.js`, update CORS to include production URLs:

```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL, // Add this
    "https://your-frontend.vercel.app", // Add your actual URL
  ],
  credentials: true
}));
```

### 2. Update Frontend API URL

In `frontend/src/api.js`, ensure it uses environment variable:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 3. Fix Cookie SameSite for Cross-Origin (CRITICAL for Production)

**This is required when frontend and backend are on different domains (Vercel + Render)!**

In `backend/routes/auth.js`, update the cookie settings for login and register:

**Find this code (around lines 54-59 and 138-143):**
```javascript
res.cookie(TOKEN_COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',  // ❌ This blocks cross-origin cookies!
  maxAge: TOKEN_EXPIRES_MS
});
```

**Replace with:**
```javascript
res.cookie(TOKEN_COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',  // ✅ Allows cross-origin in production
  maxAge: TOKEN_EXPIRES_MS
});
```

**Also update the logout route (around line 170):**
```javascript
res.clearCookie(TOKEN_COOKIE_NAME, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict'
});
```

**Why this is needed:**
- `sameSite: 'Strict'` blocks cookies when frontend (Vercel) and backend (Render) are on different domains
- `sameSite: 'None'` allows cross-origin cookies (required for production deployment)
- `secure: true` is required when using `sameSite: 'None'` (already set for production)

**After making this change:**
1. Commit and push to GitHub
2. Render will auto-deploy
3. Clear browser cookies
4. Logout and login again
5. Check browser DevTools → Application → Cookies to verify `token` cookie exists

### 4. Handle File Serving

If using backend storage, update file serving in `backend/index.js`:

```javascript
// For production, serve files from Cloudinary or update paths
app.use('/uploads', express.static(uploadsDir));
```

---

## 🚀 Step 6: Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Backend deployed on Render/Railway
- [ ] Frontend deployed on Vercel/Netlify
- [ ] Environment variables set in both frontend and backend
- [ ] CORS configured with production URLs
- [ ] File upload solution configured (Cloudinary or backend storage)
- [ ] Email service configured (Gmail or Brevo)
- [ ] Test login/registration
- [ ] Test file uploads
- [ ] Test email sending (password reset)

---

## 🔍 Step 7: Post-Deployment Testing

1. **Test Authentication**
   - Register new user
   - Login
   - Check JWT token in cookies

2. **Test File Uploads**
   - Upload resume
   - Upload profile picture
   - Verify files are accessible

3. **Test API Calls**
   - Create job (recruiter)
   - Apply to job (applicant)
   - Check notifications

4. **Test Email**
   - Request password reset
   - Check email delivery

---

## 🆓 Free Tier Limitations

### Render
- ✅ Free tier available
- ⚠️ Spins down after 15 min inactivity (cold start ~30-60s)
- ⚠️ 750 hours/month free
- ✅ Auto-deploy from GitHub

### Railway
- ✅ $5 free credit monthly
- ⚠️ Credit expires after 30 days
- ✅ Auto-deploy from GitHub
- ✅ No cold starts

### Vercel
- ✅ Unlimited free deployments
- ✅ Free SSL
- ✅ Global CDN
- ✅ 100GB bandwidth/month

### Netlify
- ✅ 100GB bandwidth/month
- ✅ Free SSL
- ✅ 300 build minutes/month

### MongoDB Atlas
- ✅ 512MB storage free
- ✅ Shared cluster
- ✅ Sufficient for development/small projects

### Cloudinary
- ✅ 25GB storage free
- ✅ 25GB bandwidth/month
- ✅ Perfect for file uploads

---

## 🐛 Troubleshooting

### Backend Not Starting
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check build logs in Render/Railway dashboard
- **"No such file or directory" error**: Your repository has nested structure (`CSE471_Project/CSE471JOBPortal_M3/backend`)
  - **Solution for Render**: Set **Root Directory** to `CSE471JOBPortal_M3` in service settings
  - **Alternative**: Use `cd CSE471JOBPortal_M3/backend && npm install` as build command
  - **Solution for Railway**: Set **Root Directory** to `CSE471JOBPortal_M3/backend`

### CORS Errors
- Verify `FRONTEND_URL` in backend matches actual frontend URL
- Check CORS configuration includes production URLs
- Ensure credentials: true is set

### File Upload Issues
- If using backend storage, files may be lost on restart
- Switch to Cloudinary for persistent storage
- Check file size limits

### Database Connection Issues
- Verify MongoDB Atlas network access allows all IPs (0.0.0.0/0)
- Check connection string has correct password (URL-encode special characters like `@` as `%40`)
- Verify database user has proper permissions
- **⚠️ IMPORTANT**: The backend uses `MONGO_URI` (not `MONGODB_URI`) - make sure your environment variable name matches!
- **Note**: The database will be automatically created on first use - you don't need to create it manually in Atlas
- If the database doesn't appear in Atlas, wait until your app writes data to it

### Email Not Sending
- For Gmail, use App Password (not regular password)
- Check email service environment variables
- Verify SMTP settings

### No Jobs Showing After Login

If you can login but don't see any jobs, check the following:

#### 1. **Database is Empty (Most Common)**
   - **Problem**: No jobs have been created in the database yet
   - **Solution**: 
     - Login as a **Recruiter** account
     - Create at least one job posting
     - Jobs must have `isActive: true` to be visible to applicants
   - **Quick Test**: Check if you can create a job as recruiter

#### 2. **Wrong Environment Variable Name**
   - **Problem**: Backend uses `MONGO_URI` but you set `MONGODB_URI`
   - **Solution**: 
     - Go to Render/Railway dashboard
     - Check environment variables
     - Make sure it's named `MONGO_URI` (not `MONGODB_URI`)
     - Update if needed and redeploy

#### 3. **Backend Not Connected to Database**
   - **Problem**: Backend can't connect to MongoDB
   - **Check**: 
     - View backend logs in Render/Railway dashboard
     - Look for "MongoDB connected successfully" message
     - If you see connection errors, verify:
       - `MONGO_URI` is set correctly
       - MongoDB Atlas network access allows all IPs (0.0.0.0/0)
       - Connection string password is URL-encoded (`@` → `%40`)

#### 4. **API Connection Issues**
   - **Problem**: Frontend can't reach backend API
   - **Check**:
     - Open browser Developer Tools (F12) → Network tab
     - Try to load jobs and check for failed requests
     - Look for CORS errors or 404/500 errors
   - **Solution**:
     - Verify `REACT_APP_API_URL` in Vercel/Netlify matches your backend URL
     - Check backend CORS includes your frontend URL
     - Ensure `FRONTEND_URL` in backend matches your Vercel/Netlify URL

#### 5. **Authentication Issues (401 Unauthorized Errors)**
   - **Problem**: JWT token not being sent or invalid - Most common in production!
   - **Root Cause**: Cookie `sameSite: 'Strict'` blocks cookies in cross-origin requests (Vercel ↔ Render)
   - **Check**:
     - Open browser Developer Tools → Application → Cookies
     - Verify `token` cookie exists after login
     - Check Network tab - requests show 401 status
   - **Solution** (CRITICAL FIX):
     - Update `backend/routes/auth.js` to use `sameSite: 'None'` for production
     - See "🔧 Step 5: Update Code for Production" section below for the exact code change
     - After fix: Clear cookies, logout, and login again
     - Verify `JWT_SECRET` is set in backend (at least 32 characters)

#### 6. **Backend Service Spun Down (Render Free Tier)**
   - **Problem**: Render free tier spins down after 15 min inactivity
   - **Check**: First request after inactivity takes 30-60 seconds
   - **Solution**: 
     - Wait for backend to wake up (first request is slow)
     - Consider using Railway or upgrading Render plan

#### 7. **Jobs Exist But Are Inactive**
   - **Problem**: Jobs exist but have `isActive: false`
   - **Solution**: 
     - Only jobs with `isActive: true` are shown to applicants
     - Check if jobs were closed or deactivated
     - Create new active jobs

#### 8. **User Role Issues**
   - **Problem**: Wrong dashboard for user role
   - **Check**:
     - Applicants see jobs via `/jobs/all` endpoint
     - Recruiters see jobs via `/jobs/recruiter/jobs` endpoint
   - **Solution**: Make sure you're logged in with the correct role

#### Quick Diagnostic Steps:
1. **Check Backend Logs** (Render/Railway dashboard):
   ```
   ✅ Look for: "MongoDB connected successfully"
   ✅ Look for: "Server listening on port XXXX"
   ❌ If you see errors, fix them first
   ```

2. **Test Backend Directly**:
   - Open: `https://your-backend.onrender.com/`
   - Should see: "API is running"
   - Test API: `https://your-backend.onrender.com/api/jobs/all` (requires auth)

3. **Check Frontend Console** (Browser F12):
   - Look for API errors
   - Check Network tab for failed requests
   - Verify API URL is correct

4. **Verify Environment Variables**:
   - **Backend**: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`
   - **Frontend**: `REACT_APP_API_URL`

5. **Create Test Data**:
   - Login as recruiter
   - Create a test job
   - Login as applicant
   - Jobs should now appear

---

## 📝 Quick Deploy Commands

### Render (Backend)
```bash
# Connect GitHub repo in Render dashboard
# Set Root Directory: CSE471JOBPortal_M3
# Set build: cd backend && npm install
# Set start: cd backend && npm start
# Add environment variables
```

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd CSE471JOBPortal_M3/frontend
vercel

# Follow prompts
# Or set Root Directory in Vercel dashboard: CSE471JOBPortal_M3/frontend
```

### Railway (Backend)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

---

## 🔐 Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT_SECRET** - At least 32 characters
3. **Use App Passwords for Gmail** - Not regular passwords
4. **Limit MongoDB Network Access** - Use specific IPs in production
5. **Enable HTTPS** - Vercel/Netlify provide free SSL

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## 🎉 Success!

Once deployed, your application will be accessible at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Database**: MongoDB Atlas (cloud-hosted)

All services are free and suitable for development, testing, and small-scale production use!


