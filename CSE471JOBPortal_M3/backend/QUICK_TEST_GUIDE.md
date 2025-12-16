# Quick Testing Guide - Smart Job Alerts

## 🚀 Quick Start Testing

### 1. Setup (One-time)
```bash
# Ensure dependencies installed
cd backend
npm list sib-api-v3-sdk node-cron

# Add to .env
BREVO_API_KEY=your_key
BREVO_SENDER_EMAIL=cse471project10@gmail.com
BREVO_SENDER_NAME=Job Portal
PREFERRED_EMAIL_SERVICE=brevo
ENABLE_EMAIL_FALLBACK=true
ENABLE_DAILY_ALERTS=true
```

### 2. Start Server
```bash
npm start
```

Check console for:
- ✅ MongoDB connected
- ✅ Smart Job Alert cron job scheduled

### 3. Test via API (Using Postman/Thunder Client/curl)

#### A. Create Job Alert
```bash
POST http://localhost:3000/api/job-alerts
Cookie: token=your_jwt_token
Content-Type: application/json

{
  "name": "Test Alert",
  "keywords": ["javascript", "react"],
  "locations": ["Remote"],
  "jobTypes": ["Full-time"],
  "frequency": "weekly"
}
```

#### B. Test Matching (MOST IMPORTANT!)
```bash
POST http://localhost:3000/api/job-alerts/:alertId/test
Cookie: token=your_jwt_token
```

**Expected:** JSON with matches, scores, and reasons

#### C. Get All Alerts
```bash
GET http://localhost:3000/api/job-alerts
Cookie: token=your_jwt_token
```

### 4. Test via Script (Automated)

```bash
# Test everything
node scripts/testJobAlerts.js

# Test specific parts
node scripts/testJobAlerts.js match    # Test matching engine
node scripts/testJobAlerts.js email    # Test email sending
node scripts/testJobAlerts.js cron     # Test cron job function
node scripts/testJobAlerts.js stats    # Show statistics
```

### 5. Verify Email Sending

**Option A: Wait for Cron**
- Daily: 8 AM (if `ENABLE_DAILY_ALERTS=true`)
- Weekly: Monday 9 AM (default)

**Option B: Manual Trigger**
```bash
node scripts/testJobAlerts.js cron
```

Check:
- ✅ Console shows "Email sent successfully"
- ✅ Email received in inbox
- ✅ Email has job cards with match percentages

### 6. Verify Database Updates

After cron runs, check MongoDB:
```javascript
db.jobalerts.findOne({ name: "Test Alert" })
// Should show:
// - lastSent: updated
// - matchesFound: incremented
// - notificationCount: incremented
```

## ✅ Success Indicators

1. ✅ API endpoints return correct responses
2. ✅ Test endpoint shows matches with scores 30-100%
3. ✅ Emails sent successfully (check inbox)
4. ✅ Console shows "Brevo API initialized" or "Nodemailer fallback"
5. ✅ Database fields updated after email sent
6. ✅ No errors in console
7. ✅ Existing features still work (password reset, etc.)

## 🐛 Common Issues

**No matches found?**
- Check if jobs exist: `db.jobs.find({ isActive: true })`
- Verify keywords match job titles
- Check user has skills set

**Email not sending?**
- Check Brevo API key
- Check Nodemailer credentials (for fallback)
- Check console for errors

**Cron not running?**
- Server must be running
- Check timezone: `TZ=UTC` in .env
- For testing, use script: `node scripts/testJobAlerts.js cron`

## 📝 Quick Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Server starts without errors
- [ ] Can create job alert via API
- [ ] Test endpoint returns matches
- [ ] Email sent successfully
- [ ] Database updated
- [ ] Existing features still work

---

**For detailed testing, see:** `TESTING_JOB_ALERTS.md`

