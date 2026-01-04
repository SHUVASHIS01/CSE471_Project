# JobPortal - Modern Job Recruitment Platform

A comprehensive full-stack job portal application built with React and Node.js, designed to connect job seekers with recruiters through an intelligent matching system, candidate comparison tools, and mutual feedback mechanisms.

## 🚀 Features

### For Job Seekers (Applicants)

- **🔍 Job Search & Discovery**
  - Browse and search jobs with advanced filters
  - Personalized job recommendations based on skills and preferences
  - Save favorite jobs for later
  - Smart job alerts with AI-powered matching

- **📝 Application Management**
  - Apply to jobs with resume upload
  - Track application status (Pending, Reviewed, Accepted, Rejected)
  - View application history
  - Resume management system

- **📊 Profile & Achievements**
  - Comprehensive profile management
  - Achievement tracking and display
  - Career quiz for personalized guidance
  - Skills and experience tracking

- **💬 Feedback System**
  - Submit anonymous feedback about recruitment process
  - View recruiter feedback after mutual submission
  - Transparent application review process

- **🔔 Notifications**
  - Real-time application status updates
  - Job alert notifications
  - In-app notification system

- **📈 Analytics**
  - View company analytics
  - Track application statistics
  - Login history and activity tracking

### For Recruiters

- **📋 Job Posting**
  - Create and manage job postings
  - Set job requirements, skills, and qualifications
  - Job status management (Active, Closed, Draft)

- **👥 Candidate Management**
  - View all applications for posted jobs
  - **Candidate Comparison Tool**: Compare up to 4 candidates side-by-side
  - Compatibility scoring algorithm
  - Application status management (Pending, Reviewed, Accepted, Rejected)

- **💼 Company Management**
  - Create and manage company profiles
  - Company analytics and insights
  - Brand management

- **📝 Interview Question Bank**
  - Repository of interview questions
  - Categorize questions by job type and skill

- **💬 Mutual Feedback System**
  - Submit anonymous feedback for candidates
  - View applicant feedback about recruitment process
  - Locked status system ensuring both parties provide feedback

- **📊 Analytics Dashboard**
  - Application statistics
  - Company performance metrics
  - Candidate insights

- **🔔 Notifications**
  - Application updates
  - Feedback notifications
  - Real-time alerts

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - UI framework
- **React Router DOM 7.9.6** - Routing
- **Axios 1.13.2** - HTTP client
- **Chart.js 4.5.1** - Data visualization
- **React Chart.js 2** - Chart components

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **MongoDB** - Database
- **Mongoose 9.0.0** - ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service
- **Brevo API** - Email service (alternative)
- **Node-cron** - Scheduled tasks

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SHUVASHIS01/CSE471_Project.git
   cd CSE471_Project/CSE471JOBPortal_M3
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/jobportal
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobportal

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Email Configuration (Brevo - Optional)
BREVO_API_KEY=your-brevo-api-key
PREFERRED_EMAIL_SERVICE=brevo
ENABLE_EMAIL_FALLBACK=true

# IP Info API (for login tracking)
IPINFO_API_KEY=your-ipinfo-api-key
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory (optional):

```env
REACT_APP_API_URL=http://localhost:5000
```

## 🚀 Running the Application

### Development Mode

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   # Server will run on http://localhost:5000
   ```

3. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   # App will run on http://localhost:3000
   ```

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the backend in production mode**
   ```bash
   cd backend
   npm start
   ```

## 📁 Project Structure

```
CSE471JOBPortal_M3/
├── backend/
│   ├── index.js                 # Main server file
│   ├── models/                  # Mongoose models
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Application.js
│   │   ├── Company.js
│   │   ├── Feedback.js
│   │   ├── Notification.js
│   │   └── ...
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── companies.js
│   │   ├── jobAlerts.js
│   │   └── ...
│   ├── services/                # Business logic services
│   │   ├── emailService.js
│   │   ├── notificationService.js
│   │   ├── smartJobAlertService.js
│   │   └── ...
│   ├── middleware/              # Custom middleware
│   │   └── auth.js
│   ├── scripts/                 # Utility scripts
│   └── uploads/                 # Uploaded files
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ApplicantDashboard.js
│   │   │   ├── RecruiterDashboard.js
│   │   │   ├── CandidateComparison.js
│   │   │   ├── JobApplications.js
│   │   │   └── ...
│   │   ├── styles/              # CSS files
│   │   ├── api.js               # API client
│   │   ├── App.js               # Main app component
│   │   └── AuthContext.js       # Authentication context
│   └── public/
│
└── README.md
```

## 🔑 Key Features Documentation

### 1. Candidate Comparison Feature
Recruiters can compare up to 4 candidates simultaneously with compatibility scoring based on:
- Skill match (50%)
- Experience relevance (30%)
- Past role similarity (20%)

See [CANDIDATE_COMPARISON_FEATURE.md](./CANDIDATE_COMPARISON_FEATURE.md) for detailed documentation.

### 2. Mutual Anonymous Feedback System
A two-way feedback system where both recruiters and applicants must provide feedback before application decisions are revealed.

See [MUTUAL_FEEDBACK_FEATURE.md](./MUTUAL_FEEDBACK_FEATURE.md) for detailed documentation.

### 3. Smart Job Alerts
AI-powered job matching system that:
- Learns from user preferences and successful applications
- Sends personalized job recommendations via email
- Uses weighted scoring algorithm (keywords, skills, location, job type, recency)

See [backend/SMART_JOB_ALERT_IMPLEMENTATION.md](./backend/SMART_JOB_ALERT_IMPLEMENTATION.md) for detailed documentation.

## 📡 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (recruiter only)
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)
- `GET /api/jobs/personalized` - Get personalized job recommendations
- `POST /api/jobs/:id/apply` - Apply to job
- `GET /api/jobs/:id/applications` - Get applications for job (recruiter only)
- `PUT /api/jobs/application/:id/status` - Update application status

### Applications
- `GET /api/jobs/applications` - Get user's applications
- `GET /api/jobs/application/:id` - Get application details
- `POST /api/jobs/application/:id/recruiter-feedback` - Submit recruiter feedback
- `POST /api/jobs/application/:id/applicant-feedback` - Submit applicant feedback

### Candidate Comparison
- `POST /api/jobs/compare-candidates` - Compare multiple candidates

### Job Alerts
- `POST /api/job-alerts` - Create job alert
- `GET /api/job-alerts` - Get user's job alerts
- `PUT /api/job-alerts/:id` - Update job alert
- `DELETE /api/job-alerts/:id` - Delete job alert
- `POST /api/job-alerts/:id/test` - Test job alert matching

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create company (recruiter only)
- `GET /api/companies/:id` - Get company details
- `GET /api/companies/:id/analytics` - Get company analytics

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read

## 🔐 Authentication & Authorization

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in HTTP-only cookies for security.

- **Protected Routes**: Most API endpoints require authentication
- **Role-Based Access**: Different endpoints for applicants and recruiters
- **Session Management**: Automatic session timeout with warnings

## 📧 Email Configuration

The application supports two email services:

1. **Gmail (via Nodemailer)** - Recommended for development
2. **Brevo API** - Recommended for production

See [backend/EMAIL_SETUP.md](./backend/EMAIL_SETUP.md) for detailed email setup instructions.

## 🧪 Testing

### Backend Scripts
```bash
# Seed test jobs
npm run seed:jobs

# Seed user keywords
npm run seed:userKeywords

# Test job alerts
node scripts/testJobAlerts.js
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env`

2. **CORS Errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check CORS configuration in `backend/index.js`

3. **File Upload Issues**
   - Ensure `uploads` directory exists
   - Check file size limits in Multer configuration

4. **Email Not Sending**
   - Verify email credentials in `.env`
   - For Gmail, use App Password (not regular password)
   - Check email service configuration

## 📝 License

This project is licensed under the ISC License.

## 👥 Contributors

- Project developed for CSE471 Course

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

---

**Note**: Remember to never commit `.env` files or sensitive information to version control. The `.gitignore` file is configured to exclude these files.


