# Smart Job Alert System - Complete Testing Guide

## 🧪 Testing Checklist

Follow these steps to verify the feature works 100% correctly.

---

## Step 1: Environment Setup

### 1.1 Verify Dependencies
```bash
cd backend
npm list sib-api-v3-sdk node-cron
```
Should show both packages installed.

### 1.2 Configure Environment Variables
Add to `backend/.env`:
```env
# Brevo Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=cse471project10@gmail.com
BREVO_SENDER_NAME=Job Portal

# Email Service
PREFERRED_EMAIL_SERVICE=brevo
ENABLE_EMAIL_FALLBACK=true

# For Testing - Enable Daily Alerts
ENABLE_DAILY_ALERTS=true

# Frontend URL (for unsubscribe links)
FRONTEND_URL=http://localhost:3000
```

### 1.3 Start the Server
```bash
npm start
# or
npm run dev
```

Check console for:
- ✅ MongoDB connected successfully
- ✅ Server listening on port 3000
- ✅ Smart Job Alert cron job scheduled: Daily (8 AM) (0 8 * * *)

---

## Step 2: Test API Endpoints

### 2.1 Create a Test User (if needed)
First, ensure you have an applicant user account.

### 2.2 Create a Job Alert

**Request:**
```bash
POST http://localhost:3000/api/job-alerts
Headers:
  Cookie: token=your_jwt_token
  Content-Type: application/json

Body:
{
  "name": "Software Engineer Jobs",
  "keywords": ["javascript", "react", "node.js", "developer"],
  "locations": ["Remote", "New York"],
  "jobTypes": ["Full-time", "Contract"],
  "frequency": "weekly"
}
```

**Expected Response:**
```json
{
  "message": "Job alert created successfully",
  "jobAlert": {
    "_id": "...",
    "userId": "...",
    "name": "Software Engineer Jobs",
    "keywords": ["javascript", "react", "node.js", "developer"],
    "locations": ["Remote", "New York"],
    "jobTypes": ["Full-time", "Contract"],
    "frequency": "weekly",
    "isActive": true,
    "matchesFound": 0,
    "notificationCount": 0
  }
}
```

### 2.3 Get All Job Alerts

**Request:**
```bash
GET http://localhost:3000/api/job-alerts
Headers:
  Cookie: token=your_jwt_token
```

**Expected Response:**
```json
{
  "jobAlerts": [
    {
      "_id": "...",
      "name": "Software Engineer Jobs",
      ...
    }
  ],
  "count": 1
}
```

### 2.4 Get Specific Job Alert

**Request:**
```bash
GET http://localhost:3000/api/job-alerts/:alertId
Headers:
  Cookie: token=your_jwt_token
```

### 2.5 Test Job Alert Matching (Most Important!)

**Request:**
```bash
POST http://localhost:3000/api/job-alerts/:alertId/test
Headers:
  Cookie: token=your_jwt_token
```

**Expected Response:**
```json
{
  "message": "Test completed successfully",
  "alertName": "Software Engineer Jobs",
  "matchCount": 5,
  "matches": [
    {
      "job": {
        "_id": "...",
        "title": "Senior JavaScript Developer",
        "company": "Tech Corp",
        "location": "Remote",
        "jobType": "Full-time",
        "salary": "$80,000 - $120,000",
        "description": "..."
      },
      "matchScore": 85,
      "reasons": [
        "Matches your keyword preferences",
        "Aligns with your skills",
        "Matches your location preference",
        "Matches your preferred job type"
      ]
    },
    ...
  ]
}
```

**✅ Verify:**
- Match scores are between 30-100%
- Reasons are provided for each match
- Jobs match the keywords/locations/jobTypes
- Top 10 matches returned (or fewer if less available)

### 2.6 Update Job Alert

**Request:**
```bash
PUT http://localhost:3000/api/job-alerts/:alertId
Headers:
  Cookie: token=your_jwt_token
  Content-Type: application/json

Body:
{
  "name": "Updated Alert Name",
  "keywords": ["python", "django"],
  "isActive": true
}
```

### 2.7 Delete Job Alert

**Request:**
```bash
DELETE http://localhost:3000/api/job-alerts/:alertId
Headers:
  Cookie: token=your_jwt_token
```

---

## Step 3: Test Email Sending

### 3.1 Test Single Alert Email (Manual Trigger)

Create a test script or use the cron job. First, let's test manually:

**Option A: Use the test endpoint to trigger email**
You can modify the test endpoint temporarily, or create a manual trigger.

**Option B: Test via Cron Job**
Wait for the scheduled time, or manually trigger by calling the cron function.

### 3.2 Verify Email Content

Check your email inbox for:
- ✅ Professional HTML email
- ✅ Job cards with match percentages
- ✅ Reasons for each match
- ✅ Unsubscribe link
- ✅ Correct sender (Brevo or Nodemailer)

### 3.3 Test Brevo Integration

**Check Console:**
- ✅ Brevo API initialized
- ✅ Email sent successfully via Brevo

**If Brevo fails:**
- ✅ Should fallback to Nodemailer
- ✅ Console shows fallback message

### 3.4 Test Nodemailer Fallback

Temporarily set invalid Brevo API key:
```env
BREVO_API_KEY=invalid_key
```

Verify:
- ✅ Falls back to Nodemailer
- ✅ Email still sent successfully

---

## Step 4: Test AI Matching Engine

### 4.1 Test Keyword Matching

Create alert with keywords: `["javascript", "react"]`

Verify:
- ✅ Jobs with "javascript" or "react" in title/description get high keyword scores
- ✅ Partial matches get partial scores

### 4.2 Test Skill Matching

Ensure user has skills in profile, then verify:
- ✅ Jobs requiring those skills get higher skill scores
- ✅ Skill overlap calculated correctly

### 4.3 Test Location Matching

Create alert with locations: `["Remote", "New York"]`

Verify:
- ✅ Remote jobs get location match
- ✅ New York jobs get location match
- ✅ Other locations get lower scores

### 4.4 Test Job Type Matching

Create alert with jobTypes: `["Full-time"]`

Verify:
- ✅ Full-time jobs get jobType score = 1.0
- ✅ Other types get score = 0

### 4.5 Test Recency Scoring

Verify:
- ✅ Jobs created in last 7 days get recency score = 1.0
- ✅ Older jobs get lower scores

### 4.6 Test Learning from Applications

1. Create an application with status "Accepted" or "Reviewed"
2. Create a job alert
3. Verify:
   - ✅ Enhanced keywords from successful job titles
   - ✅ Enhanced skills from successful jobs

---

## Step 5: Test Cron Job

### 5.1 Verify Cron Job Scheduled

Check server console on startup:
```
✅ Smart Job Alert cron job scheduled: Daily (8 AM) (0 8 * * *)
```

### 5.2 Test Cron Job Execution

**Option A: Wait for Scheduled Time**
- Set `ENABLE_DAILY_ALERTS=true` for daily (8 AM)
- Or wait for Monday 9 AM for weekly

**Option B: Manual Trigger (for testing)**

Create a test script (see below) to manually trigger the cron function.

### 5.3 Verify Cron Job Results

Check console for:
```
[Job Alerts] 🕐 Cron job triggered (Daily (8 AM))
[Job Alerts] Starting automated job alert processing...
[Job Alerts] ✅ Email sent for alert "..." to user@email.com (5 matches)
[Job Alerts] ✅ Processing complete. Sent: 2, Failed: 0, Total alerts: 2
```

### 5.4 Verify Database Updates

After cron runs, check JobAlert document:
- ✅ `lastSent` updated to current date
- ✅ `matchesFound` incremented
- ✅ `notificationCount` incremented

---

## Step 6: Test Edge Cases

### 6.1 No Matches Found

Create alert with very specific keywords that don't match any jobs.

Verify:
- ✅ Returns empty matches array
- ✅ No email sent (or email with "no matches" message)

### 6.2 Inactive Alert

Set `isActive: false` on an alert.

Verify:
- ✅ Cron job skips inactive alerts
- ✅ Test endpoint returns error

### 6.3 Invalid Data

Test with:
- Empty name
- Invalid job types
- Invalid frequency

Verify:
- ✅ Proper validation errors
- ✅ 400 status codes

### 6.4 User Not Found

Test with invalid userId (shouldn't happen in production, but test anyway).

Verify:
- ✅ Graceful error handling
- ✅ No crashes

---

## Step 7: Integration Testing

### 7.1 Full Workflow Test

1. **Create User** (applicant)
2. **Create Job Alert**
3. **Create Some Jobs** (matching the alert criteria)
4. **Wait for Cron** or trigger manually
5. **Check Email** received
6. **Verify Database** updated

### 7.2 Multiple Alerts Test

1. Create 2-3 different job alerts for same user
2. Verify each processes independently
3. Verify each sends separate email

### 7.3 Multiple Users Test

1. Create alerts for different users
2. Verify each user gets their own matches
3. Verify emails sent to correct addresses

---

## Step 8: Performance Testing

### 8.1 Large Dataset

Test with:
- 100+ active job alerts
- 1000+ jobs in database

Verify:
- ✅ Processing completes in reasonable time
- ✅ No memory leaks
- ✅ Database queries optimized

### 8.2 Concurrent Requests

Test multiple API calls simultaneously:
- Create multiple alerts
- Test multiple alerts
- Update multiple alerts

Verify:
- ✅ No race conditions
- ✅ All requests handled correctly

---

## Step 9: Security Testing

### 9.1 Authorization

Test accessing other user's alerts:
```bash
GET /api/job-alerts/:otherUserAlertId
```

Verify:
- ✅ 404 or 403 error
- ✅ Cannot access other user's data

### 9.2 Input Validation

Test with:
- SQL injection attempts
- XSS attempts
- Very long strings

Verify:
- ✅ Proper sanitization
- ✅ No security vulnerabilities

---

## Step 10: Manual Testing Script

Create a test script to automate some tests (see `testJobAlerts.js` below).

---

## ✅ Success Criteria

The feature is working 100% correctly if:

1. ✅ All API endpoints work correctly
2. ✅ Job matching returns accurate results with scores
3. ✅ Emails are sent successfully (Brevo or Nodemailer)
4. ✅ Cron job runs and processes alerts
5. ✅ Database updates correctly
6. ✅ No existing functionality broken
7. ✅ Error handling works properly
8. ✅ Authorization works correctly
9. ✅ Edge cases handled gracefully

---

## 🐛 Troubleshooting

### Issue: No matches found
- Check if jobs exist in database
- Verify keywords match job titles/descriptions
- Check if jobs are active (`isActive: true`)

### Issue: Emails not sending
- Verify Brevo API key is correct
- Check Nodemailer credentials (for fallback)
- Check console for error messages

### Issue: Cron job not running
- Verify server is running
- Check timezone settings
- Verify cron schedule syntax

### Issue: Matches seem incorrect
- Check scoring weights in `smartJobAlertService.js`
- Verify user has skills/profileKeywords set
- Check job data quality

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

API Endpoints:
[ ] Create alert
[ ] Get all alerts
[ ] Get specific alert
[ ] Update alert
[ ] Delete alert
[ ] Test matching

Email System:
[ ] Brevo integration
[ ] Nodemailer fallback
[ ] Email content correct

Matching Engine:
[ ] Keyword matching
[ ] Skill matching
[ ] Location matching
[ ] Job type matching
[ ] Recency scoring
[ ] Learning from applications

Cron Job:
[ ] Scheduled correctly
[ ] Executes on time
[ ] Processes all alerts
[ ] Updates database

Edge Cases:
[ ] No matches
[ ] Inactive alerts
[ ] Invalid data
[ ] Error handling

Overall Status: [ ] PASS [ ] FAIL

Notes:
_______________________________________
```

