const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const jobRoutes = require('./routes/jobs');
const companyRoutes = require('./routes/companies');
const interviewQuestionRoutes = require('./routes/interviewQuestions');
const loginActivityRoutes = require('./routes/loginActivity');
const jobAlertRoutes = require('./routes/jobAlerts');
const resumeRoutes = require('./routes/resumes');
const achievementRoutes = require('./routes/achievements');
const notificationRoutes = require('./routes/notifications');
const notesRoutes = require('./routes/notes');
const careerQuizRoutes = require('./routes/careerQuiz');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// CORS configuration - supports both development and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5000"
];

// Add production frontend URL from environment variable if set
if (process.env.FRONTEND_URL) {
  // Remove trailing slash if present
  const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
  allowedOrigins.push(frontendUrl);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow any origin
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Ensure uploads directory exists and serve uploaded files statically
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/career-quiz', careerQuizRoutes);
app.use('/api', protectedRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', interviewQuestionRoutes);
app.use('/api/login-activity', loginActivityRoutes);
app.use('/api/job-alerts', jobAlertRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', notesRoutes);
console.log('✅ Career Quiz routes registered at /api/career-quiz');

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 3000;

console.log('Attempting to connect to MongoDB...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
      
      // Initialize Smart Job Alert cron jobs
      initializeJobAlertCronJobs();
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/**
 * ============================================
 * SMART JOB ALERT CRON JOBS - NEW FEATURE
 * ============================================
 * Automated email sending for job alerts
 * Does NOT affect existing functionality
 */
function initializeJobAlertCronJobs() {
  const cron = require('node-cron');
  const { processAllActiveAlerts } = require('./services/smartJobAlertService');
  const { sendJobAlertEmail } = require('./services/emailService');
  const JobAlert = require('./models/JobAlert');

  /**
   * Process and send job alert emails
   * @param {boolean} testMode - If true, always get fresh matches (for test cron)
   */
  async function processAndSendAlerts(testMode = false) {
    try {
      const modeText = testMode ? 'TEST MODE (all matches - fresh data)' : 'PRODUCTION MODE (all matches - fresh data)';
      console.log(`[Job Alerts] Starting automated job alert processing... (${modeText})`);
      console.log(`[Job Alerts] Note: All matches sent every time (no duplicate prevention)`);
      
      // Always get all matches (testMode just controls whether to ignore lastSent date)
      const results = await processAllActiveAlerts(testMode);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      let emailsSent = 0;
      let emailsFailed = 0;

      for (const result of results) {
        if (result.error) {
          console.log(`[Job Alerts] ⚠️  Error for alert "${result.alertName}": ${result.error}`);
          continue;
        }

        if (!result.matches || result.matches.length === 0) {
          console.log(`[Job Alerts] ⚠️  No matches found for alert "${result.alertName}" to ${result.userEmail}`);
          console.log(`[Job Alerts]    User data: Skills=${result.userSkills || 'N/A'}, Keywords=${result.userKeywords || 'N/A'}, Searches=${result.userSearches || 'N/A'}`);
          continue;
        }

        try {
          // Always send if there are matches (no duplicate prevention)
          console.log(`[Job Alerts] 📧 Preparing to send email for alert "${result.alertName}" to ${result.userEmail} (${result.matches.length} matches)`);
          
          const unsubscribeLink = `${frontendUrl}/job-alerts/${result.alertId}/unsubscribe`;
          
          const emailSent = await sendJobAlertEmail(
            result.userEmail,
            result.userName,
            result.alertName,
            result.matches,
            unsubscribeLink
          );

          if (emailSent) {
            // Update job alert: lastSent, matchesFound, notificationCount
            // NO duplicate prevention - send all matches every time
            await JobAlert.findByIdAndUpdate(result.alertId, {
              lastSent: new Date(),
              $inc: {
                matchesFound: result.matches.length,
                notificationCount: 1
              }
            });

            emailsSent++;
            console.log(`[Job Alerts] ✅ Email sent successfully for alert "${result.alertName}" to ${result.userEmail}`);
            console.log(`[Job Alerts]    Matches sent: ${result.matches.length}`);
            console.log(`[Job Alerts]    Top match: ${result.matches[0]?.job?.title || 'N/A'} (${result.matches[0]?.score || 'N/A'}% match)`);
          } else {
            emailsFailed++;
            console.error(`[Job Alerts] ❌ Failed to send email for alert "${result.alertName}" to ${result.userEmail}`);
            console.error(`[Job Alerts]    Check Brevo API key and email configuration`);
          }
        } catch (error) {
          emailsFailed++;
          console.error(`[Job Alerts] ❌ Error processing alert ${result.alertId}:`, error.message);
          console.error(error);
        }
      }

      console.log(`[Job Alerts] ✅ Processing complete. Sent: ${emailsSent}, Failed: ${emailsFailed}, Total alerts: ${results.length}`);
    } catch (error) {
      console.error('[Job Alerts] ❌ Error in automated job alert processing:', error);
    }
  }

  // Weekly cron: Monday 9 AM
  // Format: '0 9 * * 1' (minute hour day-of-month month day-of-week)
  // 0 = Sunday, 1 = Monday, etc.
  const weeklySchedule = '0 9 * * 1';
  
  // Daily cron for testing: Every day at 8 AM
  // Format: '0 8 * * *'
  const dailySchedule = '0 8 * * *';

  // Use daily schedule if ENABLE_DAILY_ALERTS is set, otherwise weekly
  const schedule = process.env.ENABLE_DAILY_ALERTS === 'true' ? dailySchedule : weeklySchedule;
  const scheduleName = process.env.ENABLE_DAILY_ALERTS === 'true' ? 'Daily (8 AM)' : 'Weekly (Monday 9 AM)';

  // Schedule the main cron job (weekly or daily)
  cron.schedule(schedule, async () => {
    console.log(`[Job Alerts] 🕐 Cron job triggered (${scheduleName})`);
    await processAndSendAlerts();
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC'
  });

  console.log(`✅ Smart Job Alert cron job scheduled: ${scheduleName} (${schedule})`);
  console.log('💡 Set ENABLE_DAILY_ALERTS=true in .env to switch to daily schedule');

  // Test cron: Every 10 minutes (for testing purposes)
  // Enable with ENABLE_TEST_CRON=true in .env
  // Test mode: Always gets fresh matches based on current profile (skills, searches, etc.)
  if (process.env.ENABLE_TEST_CRON === 'true') {
    const testSchedule = '*/10 * * * *'; // Every 10 minutes
    cron.schedule(testSchedule, async () => {
      console.log(`[Job Alerts] 🧪 Test cron job triggered (Every 10 minutes - TEST MODE)`);
      await processAndSendAlerts(true); // true = test mode (fresh matches)
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });
    console.log(`✅ Test cron job scheduled: Every 10 minutes (${testSchedule})`);
    console.log('💡 Test cron is ACTIVE - emails will be sent every 10 minutes');
    console.log('💡 Test mode: Always gets fresh matches (re-evaluates when profile changes)');
    console.log('💡 Set ENABLE_TEST_CRON=false in .env to disable test cron');
  } else {
    console.log('💡 Set ENABLE_TEST_CRON=true in .env to enable test cron (every 10 minutes)');
  }
}
