const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Resume = require('../models/Resume');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getRecommendationPayload,
  trackSearchTerm
} = require('../services/recommendationService');

const router = express.Router();

const escapeRegex = (input = '') =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get recruiter's company jobs (all jobs from their company)
router.get('/recruiter/jobs', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const Company = require('../models/Company');
    
    // Build query: jobs from recruiter's company
    const query = {};
    
    if (recruiter.companyId) {
      // Recruiter belongs to a company: show all jobs from that company
      query.companyId = recruiter.companyId;
    } else {
      // Check if recruiter created any companies
      const createdCompanies = await Company.find({ recruiterId: req.user.id }).select('_id');
      const companyIds = createdCompanies.map(c => c._id);
      
      if (companyIds.length > 0) {
        // Recruiter created companies: show jobs from those companies
        query.companyId = { $in: companyIds };
      } else {
        // Independent recruiter with no companies: show their own jobs
        query.recruiterId = req.user.id;
      }
    }

    const jobs = await Job.find(query)
      .populate('applicants', 'name email')
      .populate('companyId', 'name logoUrl')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get only recruiter's own jobs (for "My Job Postings" tab)
router.get('/recruiter/my-jobs', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id })
      .populate('applicants', 'name email')
      .populate('companyId', 'name logoUrl')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get all active jobs (with enhanced search logging)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const searchTerm = (req.query.q || '').trim();
    const filterTitle = (req.query.title || '').trim();
    const filterLocation = (req.query.location || '').trim();
    const filterSkills = (req.query.skills || '').trim();
    
    const query = { isActive: true };

    // Build search query from all fields
    const orConditions = [];
    
    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), 'i');
      orConditions.push(
        { title: regex },
        { description: regex },
        { company: regex },
        { location: regex },
        { skills: { $elemMatch: { $regex: regex } } }
      );
    }
    
    if (filterTitle) {
      const regex = new RegExp(escapeRegex(filterTitle), 'i');
      orConditions.push({ title: regex });
    }
    
    if (filterLocation) {
      const regex = new RegExp(escapeRegex(filterLocation), 'i');
      orConditions.push({ location: regex });
    }
    
    if (filterSkills) {
      const regex = new RegExp(escapeRegex(filterSkills), 'i');
      orConditions.push({ skills: { $elemMatch: { $regex: regex } } });
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const jobs = await Job.find(query)
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    // Track all search fields separately for better matching
    if (req.user?.id) {
      const hasAnySearch = searchTerm || filterTitle || filterLocation || filterSkills;
      if (hasAnySearch) {
        await trackSearchTerm(req.user.id, {
          term: searchTerm,
          title: filterTitle,
          location: filterLocation,
          skills: filterSkills
        });
      }
    }

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get applicant's applications with full job details (MUST be before /:id route)
router.get('/applicant/applications', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user.id })
      .populate({
        path: 'jobId',
        populate: {
          path: 'recruiterId',
          select: 'name email company'
        }
      })
      .sort({ createdAt: -1 });
    
    // Hide status if locked (for Accepted/Rejected)
    const applicationsWithHiddenStatus = applications.map(app => {
      const appObj = app.toObject();
      // If status is locked and it's Accepted/Rejected, don't reveal the actual status
      if (app.isStatusLocked && ['Accepted', 'Rejected'].includes(app.status)) {
        appObj.status = 'Update Available'; // Generic status
        appObj.isStatusHidden = true;
        appObj.actualStatus = app.status; // Store actual status for backend use only
      }
      return appObj;
    });
    
    res.json({ applications: applicationsWithHiddenStatus });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// Withdraw application (MUST be before /:id route)
router.delete('/application/:id', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.applicantId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to withdraw this application' });
    }

    // Remove from job's applicants list
    const job = await Job.findById(application.jobId);
    if (job) {
      job.applicants = job.applicants.filter(id => id.toString() !== req.user.id);
      await job.save();
    }

    await Application.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Application withdrawn successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error withdrawing application', error: err.message });
  }
});

// NEW: Get personalized recommendations (applicant only) - MUST be before /:id route
router.get('/recommendations', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const searchTerm = (req.query.q || '').trim();
    
    console.log('[recommendations API] Request received:', {
      userId: req.user?.id,
      searchTerm: searchTerm || 'none'
    });
    
    // Track search term if provided (from filter boxes) - Enhanced to track all fields
    if (req.user?.id) {
      const filterTitle = (req.query.title || '').trim();
      const filterLocation = (req.query.location || '').trim();
      const filterSkills = (req.query.skills || '').trim();
      
      const hasAnySearch = searchTerm || filterTitle || filterLocation || filterSkills;
      if (hasAnySearch) {
        try {
          await trackSearchTerm(req.user.id, {
            term: searchTerm,
            title: filterTitle,
            location: filterLocation,
            skills: filterSkills
          });
          console.log('[recommendations API] Search fields tracked:', { searchTerm, filterTitle, filterLocation, filterSkills });
        } catch (trackErr) {
          console.error('[recommendations API] Error tracking search terms:', trackErr);
          // Don't fail the request if tracking fails
        }
      }
    }
    
    const payload = await getRecommendationPayload(req.user.id);
    console.log('[recommendations API] Payload prepared:', {
      keywords: payload.keywords?.length || 0,
      personalized: payload.personalized?.length || 0,
      collaborative: payload.collaborative?.length || 0,
      trends: payload.trends?.length || 0,
      trendJobs: payload.trendJobs?.length || 0
    });
    
    res.json(payload);
  } catch (err) {
    console.error('[recommendations API] Error:', err);
    console.error('[recommendations API] Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching recommendations', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get all saved jobs for applicant (MUST be before /:id route)
router.get('/applicant/saved', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedJobs',
      populate: {
        path: 'recruiterId',
        select: 'name email company'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ jobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved jobs', error: err.message });
  }
});

// Get single job by ID (MUST be after specific routes)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiterId', 'name email company');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching job', error: err.message });
  }
});

// Create a new job (recruiter only)
router.post('/create', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const { companyId: selectedCompanyId, ...restBody } = req.body;
    const Company = require('../models/Company');

    // Validate company selection
    let finalCompanyId = null;
    if (selectedCompanyId) {
      // Check if company exists and recruiter has access to it
      const company = await Company.findById(selectedCompanyId);
      if (!company) {
        return res.status(400).json({ message: 'Selected company not found' });
      }

      // Recruiter must either belong to this company OR be the creator
      if (company.recruiterId.toString() === req.user.id) {
        // Recruiter created this company
        finalCompanyId = selectedCompanyId;
      } else if (recruiter.companyId && recruiter.companyId.toString() === selectedCompanyId) {
        // Recruiter belongs to this company
        finalCompanyId = selectedCompanyId;
      } else {
        return res.status(403).json({ message: 'You can only post jobs for companies you belong to or created' });
      }
    } else if (recruiter.companyId) {
      // If no company selected but recruiter belongs to a company, use that
      finalCompanyId = recruiter.companyId;
    }

    const jobData = {
      ...restBody,
      recruiterId: req.user.id,
      companyId: finalCompanyId,
      positions: req.body.positions ? Number(req.body.positions) : 1
    };
    const job = new Job(jobData);
    await job.save();
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error creating job', error: err.message });
  }
});

// Configure multer for application resume uploads (temporary, not saved to Resume collection)
const applicationResumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.join(__dirname, '..', 'uploads', 'applications');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e6);
    cb(null, `application-resume-${timestamp}-${random}${ext}`);
  }
});

const applicationResumeUpload = multer({
  storage: applicationResumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.doc', '.docx'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Apply for a job (applicant only)
router.post('/:id/apply', verifyToken, authorizeRole('applicant'), applicationResumeUpload.single('resumeFile'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const { resumeId, coverLetter, skills, experience } = req.body;

    const job = await Job.findById(jobId);
    if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found or inactive' });

    const existingApp = await Application.findOne({ jobId, applicantId: req.user.id });
    if (existingApp) return res.status(400).json({ message: 'You have already applied for this job' });

    let resumeUrl = null;
    let finalResumeId = null;

    // Handle resume: either from uploaded resumes (resumeId) or new file upload
    if (resumeId) {
      // Using an uploaded resume
      const resume = await Resume.findOne({
        _id: resumeId,
        applicantId: req.user.id
      });
      
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      finalResumeId = resume._id;
      resumeUrl = resume.fileUrl;

      // Update resume usage stats
      resume.usageCount += 1;
      resume.lastUsedAt = new Date();
      await resume.save();
    } else if (req.file) {
      // New file upload (temporary, not saved to Resume collection)
      resumeUrl = `/uploads/applications/${req.file.filename}`;
    } else {
      return res.status(400).json({ message: 'Either resumeId or resume file is required' });
    }

    const application = new Application({
      jobId,
      applicantId: req.user.id,
      resume: resumeUrl, // For backward compatibility
      resumeId: finalResumeId, // Reference to uploaded resume if used
      coverLetter,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []),
      experience: experience || ''
    });

    await application.save();

    // Add applicant to job's applicants list
    if (!job.applicants.includes(req.user.id)) {
      job.applicants.push(req.user.id);
      await job.save();
    }

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    if (err.message && err.message.includes('Only PDF')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }
    res.status(500).json({ message: 'Error applying for job', error: err.message });
  }
});

// Update job (recruiter only)
router.put('/:id', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this job' });
    }

    // Preserve companyId - it should not be changed via update
    const companyIdToPreserve = job.companyId;
    
    Object.assign(job, req.body);
    
    // Restore companyId to prevent it from being changed
    job.companyId = companyIdToPreserve;
    
    if (typeof req.body.positions !== 'undefined') {
      job.positions = Number(req.body.positions) || 1;
    }
    await job.save();
    res.json({ message: 'Job updated successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error updating job', error: err.message });
  }
});

// Close job (recruiter only) - marks job as inactive but keeps it in database
router.put('/:id/close', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to close this job' });
    }

    job.isActive = false;
    await job.save();
    res.json({ message: 'Job closed successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error closing job', error: err.message });
  }
});

// Delete job (recruiter only) - permanently deletes the job and associated applications
router.delete('/:id', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this job' });
    }

    // Delete all applications associated with this job
    await Application.deleteMany({ jobId: req.params.id });

    // Delete the job itself
    await Job.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Job and associated applications deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting job', error: err.message });
  }
});

// Save job to wishlist (applicant only) - MUST be before generic /:id route
router.post('/:id/save', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.savedJobs.includes(jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }
    
    res.json({ message: 'Job saved successfully', isSaved: true });
  } catch (err) {
    res.status(500).json({ message: 'Error saving job', error: err.message });
  }
});

// Unsave job from wishlist (applicant only) - MUST be before generic /:id route
router.delete('/:id/unsave', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const user = await User.findById(req.user.id);
    
    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    await user.save();
    
    res.json({ message: 'Job removed from saved jobs', isSaved: false });
  } catch (err) {
    res.status(500).json({ message: 'Error removing saved job', error: err.message });
  }
});

// Check if job is saved by applicant - MUST be before generic /:id route
router.get('/:id/is-saved', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isSaved = user.savedJobs.includes(req.params.id);
    
    res.json({ isSaved });
  } catch (err) {
    res.status(500).json({ message: 'Error checking save status', error: err.message });
  }
});

// Get applications for a specific job (recruiter only) - MUST be before generic /:id route
router.get('/:id/applications', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view applications for this job' });
    }

    const applications = await Application.find({ jobId })
      .populate('applicantId', 'name email phone')
      .sort({ createdAt: -1 });
    
    // For applicants, hide status if locked
    const applicationsWithHiddenStatus = applications.map(app => {
      const appObj = app.toObject();
      // If status is locked and user is applicant, don't reveal the actual status
      if (app.isStatusLocked && ['Accepted', 'Rejected'].includes(app.status)) {
        appObj.status = 'Update Available'; // Generic status
        appObj.isStatusHidden = true;
      }
      return appObj;
    });
    
    res.json({ applications: applicationsWithHiddenStatus, job });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// Update application status (recruiter only)
// NOTE: For Accepted/Rejected status, feedback must be submitted via separate endpoint
router.put('/application/:id/status', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Applied', 'Reviewed', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.jobId;
    
    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to update this application' });
    }

    const previousStatus = application.status;
    application.status = status;
    
    // For Accepted/Rejected status, lock it until applicant submits feedback
    // Note: Recruiter feedback will be required and submitted separately
    if (['Accepted', 'Rejected'].includes(status) && !application.applicantFeedbackSubmitted) {
      application.isStatusLocked = true;
    }
    
    await application.save();
    
    // Create notification for applicant if status changed to Reviewed, Accepted, or Rejected
    if (previousStatus !== status && ['Reviewed', 'Accepted', 'Rejected'].includes(status)) {
      const { createApplicationStatusNotification } = require('../services/notificationService');
      try {
        // For Accepted/Rejected, check if recruiter feedback exists
        // If feedback exists, send notification. If not, notification will be sent when feedback is submitted
        if (['Accepted', 'Rejected'].includes(status)) {
          const Feedback = require('../models/Feedback');
          const { createLockedApplicationNotification } = require('../services/notificationService');
          const recruiterFeedback = await Feedback.findOne({
            applicationId: application._id,
            feedbackType: 'recruiter'
          });
          
          if (recruiterFeedback && !application.applicantFeedbackSubmitted) {
            // Recruiter feedback exists, send locked notification
            try {
              const lockedNotif = await createLockedApplicationNotification(
                application.applicantId.toString(),
                {
                  title: job.title,
                  company: job.company
                },
                application._id
              );
              console.log('✅ Locked application notification created for applicant (status change with existing feedback):', lockedNotif._id);
            } catch (notifError) {
              console.error('❌ Error creating locked notification:', notifError.message);
            }
          } else if (!recruiterFeedback) {
            // Feedback doesn't exist yet, notification will be sent when feedback is submitted
            console.log('📝 Status changed to', status, '- Notification will be sent when recruiter submits feedback');
          }
        } else {
          // For Reviewed or unlocked status, send normal notification
          await createApplicationStatusNotification(
            application.applicantId.toString(),
            status,
            {
              title: job.title,
              company: job.company
            },
            application._id
          );
          console.log('✅ Application status notification created for applicant');
        }
      } catch (notifError) {
        console.error('❌ Error creating application notification:', notifError.message);
        // Don't fail the request if notification fails
      }
    }
    
    res.json({ message: 'Application status updated successfully', application });
  } catch (err) {
    res.status(500).json({ message: 'Error updating application status', error: err.message });
  }
});

// Get company analytics (recruiter only)
router.get('/company/:companyId/analytics', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { companyId } = req.params;
    const Company = require('../models/Company');
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify recruiter has access to this company
    const recruiter = await User.findById(req.user.id);
    let hasAccess = false;
    
    if (company.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && recruiter.companyId.toString() === companyId) {
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view analytics for this company' });
    }

    // Get all jobs for this company (with recruiter info populated)
    const jobs = await Job.find({ companyId })
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });
    const jobIds = jobs.map(j => j._id);
    
    // Get all applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } });
    
    // Calculate statistics
    const totalApplications = applications.length;
    const acceptedCount = applications.filter(app => app.status === 'Accepted').length;
    const rejectedCount = applications.filter(app => app.status === 'Rejected').length;
    const reviewedCount = applications.filter(app => app.status === 'Reviewed').length;
    const appliedCount = applications.filter(app => app.status === 'Applied').length;
    const activeJobsCount = jobs.filter(job => job.isActive).length;
    const closedJobsCount = jobs.filter(job => !job.isActive).length;
    
    // Get applications per job (for the table)
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const jobApps = applications.filter(app => app.jobId.toString() === job._id.toString());
        return {
          jobTitle: job.title,
          totalApplicants: jobApps.length,
          accepted: jobApps.filter(app => app.status === 'Accepted').length,
          rejected: jobApps.filter(app => app.status === 'Rejected').length,
          reviewed: jobApps.filter(app => app.status === 'Reviewed').length,
          applied: jobApps.filter(app => app.status === 'Applied').length,
          isActive: job.isActive
        };
      })
    );
    
    res.json({
      company: {
        name: company.name,
        id: company._id
      },
      summary: {
        totalApplications,
        acceptedCount,
        rejectedCount,
        reviewedCount,
        appliedCount,
        activeJobsCount,
        closedJobsCount,
        totalJobsCount: jobs.length
      },
      jobsWithApplications,
      jobs: jobs // Include full job details for displaying job listings
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics', error: err.message });
  }
});

// Helper function to calculate skill match percentage
const calculateSkillMatch = (candidateSkills, requiredSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;
  
  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase().trim());
  const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase().trim());
  
  const matchedSkills = requiredSkillsLower.filter(reqSkill => 
    candidateSkillsLower.some(candSkill => 
      candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
    )
  );
  
  return Math.round((matchedSkills.length / requiredSkillsLower.length) * 100);
};

// Helper function to extract years from experience string
const extractYearsFromExperience = (experienceStr) => {
  if (!experienceStr) return 0;
  const match = experienceStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

// Helper function to parse job experience requirement
const parseJobExperience = (experienceStr) => {
  if (!experienceStr) return { min: 0, max: Infinity };
  const match = experienceStr.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  const singleMatch = experienceStr.match(/(\d+)\+/);
  if (singleMatch) {
    return { min: parseInt(singleMatch[1]), max: Infinity };
  }
  const numMatch = experienceStr.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    return { min: num, max: num };
  }
  return { min: 0, max: Infinity };
};

// Helper function to calculate experience relevance score
const calculateExperienceRelevance = (candidateExp, jobExp) => {
  const candidateYears = extractYearsFromExperience(candidateExp);
  const jobReq = parseJobExperience(jobExp);
  
  if (candidateYears >= jobReq.min && candidateYears <= jobReq.max) {
    return 100;
  } else if (candidateYears < jobReq.min) {
    const deficit = jobReq.min - candidateYears;
    return Math.max(0, 100 - (deficit * 15)); // -15% per year deficit
  } else {
    // Overqualified - still good but slightly less
    return Math.max(80, 100 - ((candidateYears - jobReq.max) * 5)); // -5% per year over
  }
};

// Helper function to calculate past role similarity (based on skills overlap with job)
const calculatePastRoleSimilarity = (candidateSkills, jobSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 50; // Neutral if no job skills specified
  return calculateSkillMatch(candidateSkills, jobSkills);
};

// Calculate overall compatibility score
const calculateCompatibilityScore = (skillMatch, experienceRelevance, pastRoleSimilarity) => {
  // Weighted average: 50% skills, 30% experience, 20% past role similarity
  const weightedScore = (skillMatch * 0.5) + (experienceRelevance * 0.3) + (pastRoleSimilarity * 0.2);
  return Math.round(weightedScore);
};

// Get candidate comparison data (recruiter only)
router.post('/:id/compare-candidates', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const { candidateIds } = req.body; // Array of application IDs or applicant IDs
    
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: 'candidateIds must be a non-empty array' });
    }
    
    if (candidateIds.length > 4) {
      return res.status(400).json({ message: 'Maximum 4 candidates can be compared' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view applications for this job' });
    }

    // Fetch applications for the candidates
    const applications = await Application.find({ 
      jobId,
      $or: [
        { _id: { $in: candidateIds } },
        { applicantId: { $in: candidateIds } }
      ]
    })
      .populate('applicantId', 'name email phoneNumber skills bio avatarUrl')
      .populate('resumeId', 'fileUrl')
      .sort({ createdAt: -1 });

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for the provided candidate IDs' });
    }

    // Fetch achievements (certifications and education) for all applicants
    const Achievement = require('../models/Achievement');
    const applicantIds = applications.map(app => app.applicantId._id);
    const achievements = await Achievement.find({
      userId: { $in: applicantIds },
      category: { $in: ['certification', 'education'] },
      visibility: 'public'
    }).sort({ dateAchieved: -1 });

    // Group achievements by applicant
    const achievementsByApplicant = {};
    achievements.forEach(ach => {
      if (!achievementsByApplicant[ach.userId]) {
        achievementsByApplicant[ach.userId] = [];
      }
      achievementsByApplicant[ach.userId].push(ach);
    });

    // Build comparison data for each candidate
    const comparisonData = applications.map(application => {
      const applicant = application.applicantId;
      
      // Combine skills from user profile and application
      const allCandidateSkills = [
        ...(applicant.skills || []),
        ...(application.skills || [])
      ].filter((skill, index, self) => 
        self.findIndex(s => s.toLowerCase().trim() === skill.toLowerCase().trim()) === index
      );

      // Calculate metrics
      const skillMatch = calculateSkillMatch(allCandidateSkills, job.skills || []);
      const experienceRelevance = calculateExperienceRelevance(application.experience, job.experience);
      const pastRoleSimilarity = calculatePastRoleSimilarity(allCandidateSkills, job.skills || []);
      const compatibilityScore = calculateCompatibilityScore(skillMatch, experienceRelevance, pastRoleSimilarity);

      // Get certifications and education
      const applicantAchievements = achievementsByApplicant[applicant._id] || [];
      const certifications = applicantAchievements.filter(a => a.category === 'certification');
      const education = applicantAchievements.filter(a => a.category === 'education');

      // Determine education level (highest level found)
      let educationLevel = 'Not specified';
      if (education.length > 0) {
        const educationTitles = education.map(e => e.title.toLowerCase());
        if (educationTitles.some(t => t.includes('phd') || t.includes('doctorate'))) {
          educationLevel = 'PhD/Doctorate';
        } else if (educationTitles.some(t => t.includes('master') || t.includes('ms') || t.includes('mba'))) {
          educationLevel = 'Master\'s';
        } else if (educationTitles.some(t => t.includes('bachelor') || t.includes('bs') || t.includes('ba'))) {
          educationLevel = 'Bachelor\'s';
        } else if (educationTitles.some(t => t.includes('associate') || t.includes('diploma'))) {
          educationLevel = 'Associate/Diploma';
        } else {
          educationLevel = 'Other';
        }
      }

      return {
        applicationId: application._id,
        applicantId: applicant._id,
        name: applicant.name,
        email: applicant.email,
        phoneNumber: applicant.phoneNumber || 'Not provided',
        avatarUrl: applicant.avatarUrl,
        bio: applicant.bio || 'No bio available',
        skills: allCandidateSkills,
        matchedSkills: (job.skills || []).filter(reqSkill => 
          allCandidateSkills.some(candSkill => 
            candSkill.toLowerCase().trim().includes(reqSkill.toLowerCase().trim()) ||
            reqSkill.toLowerCase().trim().includes(candSkill.toLowerCase().trim())
          )
        ),
        unmatchedSkills: (job.skills || []).filter(reqSkill => 
          !allCandidateSkills.some(candSkill => 
            candSkill.toLowerCase().trim().includes(reqSkill.toLowerCase().trim()) ||
            reqSkill.toLowerCase().trim().includes(candSkill.toLowerCase().trim())
          )
        ),
        yearsOfExperience: extractYearsFromExperience(application.experience),
        experienceString: application.experience || 'Not specified',
        educationLevel: educationLevel,
        certifications: certifications.map(c => ({
          title: c.title,
          issuer: c.issuer,
          dateAchieved: c.dateAchieved,
          description: c.description
        })),
        education: education.map(e => ({
          title: e.title,
          issuer: e.issuer,
          dateAchieved: e.dateAchieved,
          description: e.description
        })),
        skillMatchPercentage: skillMatch,
        experienceRelevance: experienceRelevance,
        pastRoleSimilarity: pastRoleSimilarity,
        compatibilityScore: compatibilityScore,
        applicationStatus: application.status,
        appliedDate: application.createdAt,
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeId?.fileUrl || application.resume
      };
    });

    // Sort by compatibility score (highest first)
    comparisonData.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        requiredSkills: job.skills || [],
        experienceRequirement: job.experience || 'Not specified'
      },
      candidates: comparisonData
    });
  } catch (err) {
    console.error('Error comparing candidates:', err);
    res.status(500).json({ message: 'Error comparing candidates', error: err.message });
  }
});

// Serve resume file for recruiters (with authentication)
router.get('/application/:applicationId/resume', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId)
      .populate('jobId', 'recruiterId companyId')
      .populate('resumeId', 'fileUrl');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.jobId;
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId && job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view this resume' });
    }

    // Get resume file path
    let resumePath = null;
    if (application.resumeId && application.resumeId.fileUrl) {
      resumePath = application.resumeId.fileUrl;
    } else if (application.resume) {
      resumePath = application.resume;
    }

    if (!resumePath) {
      return res.status(404).json({ message: 'Resume not found for this application' });
    }

    // Construct full path - resumePath should be like /uploads/applications/... or /uploads/resumes/...
    let fullPath;
    if (resumePath.startsWith('/uploads/')) {
      // Path already includes /uploads/, so join with backend directory
      const cleanPath = resumePath.substring(1); // Remove leading slash
      fullPath = path.join(__dirname, '..', cleanPath);
    } else if (resumePath.startsWith('uploads/')) {
      // Path starts with uploads/ (no leading slash)
      fullPath = path.join(__dirname, '..', resumePath);
    } else {
      // Assume it's a relative path from uploads directory
      fullPath = path.join(__dirname, '..', 'uploads', resumePath);
    }

    // Normalize the path to handle any .. or . segments
    fullPath = path.normalize(fullPath);

    // Security check: ensure the path is within the uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.error(`Security check failed: ${resolvedPath} is outside ${resolvedUploadsDir}`);
      return res.status(403).json({ message: 'Invalid file path' });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Resume file not found at: ${resolvedPath}`);
      console.error(`Looking for resume path: ${resumePath}`);
      return res.status(404).json({ message: 'Resume file not found on server' });
    }

    // Send the file with appropriate headers
    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error serving file', error: err.message });
        }
      }
    });
  } catch (err) {
    console.error('Error serving resume file:', err);
    res.status(500).json({ message: 'Error serving resume file', error: err.message });
  }
});

// Submit recruiter feedback (required when changing status to Accepted/Rejected)
router.post('/application/:id/recruiter-feedback', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const {
      ratings,
      strengths,
      improvements
    } = req.body;

    const application = await Application.findById(applicationId).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.jobId;
    
    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to submit feedback for this application' });
    }

    // Validate required ratings for recruiter feedback
    if (!ratings || 
        typeof ratings.communicationSkills !== 'number' ||
        typeof ratings.technicalCompetency !== 'number' ||
        typeof ratings.interviewPreparedness !== 'number' ||
        typeof ratings.professionalBehavior !== 'number' ||
        typeof ratings.overallSuitability !== 'number') {
      return res.status(400).json({ 
        message: 'All rating fields are required (communicationSkills, technicalCompetency, interviewPreparedness, professionalBehavior, overallSuitability)' 
      });
    }

    // Validate rating range (1-5)
    const ratingFields = ['communicationSkills', 'technicalCompetency', 'interviewPreparedness', 'professionalBehavior', 'overallSuitability'];
    for (const field of ratingFields) {
      if (ratings[field] < 1 || ratings[field] > 5) {
        return res.status(400).json({ message: `Rating ${field} must be between 1 and 5` });
      }
    }

    const Feedback = require('../models/Feedback');
    
    // Check if feedback already exists
    let feedback = await Feedback.findOne({
      applicationId: application._id,
      feedbackType: 'recruiter'
    });

    if (feedback) {
      // Update existing feedback
      feedback.ratings = {
        communicationSkills: ratings.communicationSkills,
        technicalCompetency: ratings.technicalCompetency,
        interviewPreparedness: ratings.interviewPreparedness,
        professionalBehavior: ratings.professionalBehavior,
        overallSuitability: ratings.overallSuitability
      };
      feedback.strengths = strengths || '';
      feedback.improvements = improvements || '';
      feedback.submittedAt = new Date();
    } else {
      // Create new feedback
      feedback = new Feedback({
        applicationId: application._id,
        feedbackType: 'recruiter',
        ratings: {
          communicationSkills: ratings.communicationSkills,
          technicalCompetency: ratings.technicalCompetency,
          interviewPreparedness: ratings.interviewPreparedness,
          professionalBehavior: ratings.professionalBehavior,
          overallSuitability: ratings.overallSuitability
        },
        strengths: strengths || '',
        improvements: improvements || '',
        isAnonymous: true
      });
    }

    await feedback.save();

    // Mark recruiter feedback as submitted
    application.recruiterFeedbackSubmitted = true;
    
    // Reload application to get latest status
    await application.populate('jobId');
    const currentStatus = application.status;
    
    // Send notification to applicant when recruiter submits feedback
    // This happens when status is Accepted/Rejected OR will be changed to Accepted/Rejected
    // Since frontend submits feedback BEFORE updating status, we need to handle both cases
    if (!application.applicantFeedbackSubmitted) {
      // If status is already Accepted/Rejected, send notification now
      if (['Accepted', 'Rejected'].includes(currentStatus)) {
        application.isStatusLocked = true;
        
        // Send locked notification to applicant
        const { createLockedApplicationNotification } = require('../services/notificationService');
        try {
          const applicantId = application.applicantId.toString();
          const jobTitle = job.title || 'the position';
          const companyName = job.company || 'the company';
          
          console.log('📤 Sending locked notification to applicant (feedback submitted, status is Accepted/Rejected):', {
            applicantId,
            applicationId: application._id,
            status: currentStatus,
            jobTitle,
            companyName
          });
          
          const lockedNotif = await createLockedApplicationNotification(
            applicantId,
            {
              title: jobTitle,
              company: companyName
            },
            application._id
          );
          console.log('✅ Locked application notification created for applicant after recruiter feedback:', lockedNotif?._id || 'created');
          console.log('   Notification details:', {
            id: lockedNotif?._id,
            userId: lockedNotif?.userId,
            type: lockedNotif?.type,
            title: lockedNotif?.title
          });
        } catch (notifError) {
          console.error('❌ Error creating locked notification:', notifError.message);
          console.error('Full error:', notifError);
        }
      } else {
        // Status is not Accepted/Rejected yet, but feedback was submitted
        // Notification will be sent when status is changed to Accepted/Rejected (handled in status update endpoint)
        console.log('📝 Feedback submitted but status is not Accepted/Rejected yet:', currentStatus, '- Notification will be sent when status changes');
      }
    } else {
      console.log('⚠️  Applicant feedback already submitted - no notification needed');
    }
    
    // Unlock status if both feedbacks are submitted
    if (application.recruiterFeedbackSubmitted && application.applicantFeedbackSubmitted) {
      application.isStatusLocked = false;
    }
    
    await application.save();

    res.json({ 
      message: 'Recruiter feedback submitted successfully',
      feedback: {
        ratings: feedback.ratings,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        submittedAt: feedback.submittedAt
      }
    });
  } catch (err) {
    console.error('Error submitting recruiter feedback:', err);
    res.status(500).json({ message: 'Error submitting feedback', error: err.message });
  }
});

// Submit applicant feedback (required to unlock application status)
router.post('/application/:id/applicant-feedback', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const {
      ratings,
      whatWorkedWell,
      whatCouldImprove
    } = req.body;

    const application = await Application.findById(applicationId).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify applicant owns this application
    if (application.applicantId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to submit feedback for this application' });
    }

    // Check if status is locked (must be Accepted or Rejected)
    if (!['Accepted', 'Rejected'].includes(application.status)) {
      return res.status(400).json({ 
        message: 'Feedback can only be submitted for Accepted or Rejected applications' 
      });
    }

    // Validate required ratings for applicant feedback
    if (!ratings || 
        typeof ratings.jobInfoClarity !== 'number' ||
        typeof ratings.recruiterCommunication !== 'number' ||
        typeof ratings.interviewOrganization !== 'number' ||
        typeof ratings.processProfessionalism !== 'number' ||
        typeof ratings.overallExperience !== 'number') {
      return res.status(400).json({ 
        message: 'All rating fields are required (jobInfoClarity, recruiterCommunication, interviewOrganization, processProfessionalism, overallExperience)' 
      });
    }

    // Validate rating range (1-5)
    const ratingFields = ['jobInfoClarity', 'recruiterCommunication', 'interviewOrganization', 'processProfessionalism', 'overallExperience'];
    for (const field of ratingFields) {
      if (ratings[field] < 1 || ratings[field] > 5) {
        return res.status(400).json({ message: `Rating ${field} must be between 1 and 5` });
      }
    }

    const Feedback = require('../models/Feedback');
    
    // Check if feedback already exists
    let feedback = await Feedback.findOne({
      applicationId: application._id,
      feedbackType: 'applicant'
    });

    if (feedback) {
      // Update existing feedback
      feedback.ratings = {
        jobInfoClarity: ratings.jobInfoClarity,
        recruiterCommunication: ratings.recruiterCommunication,
        interviewOrganization: ratings.interviewOrganization,
        processProfessionalism: ratings.processProfessionalism,
        overallExperience: ratings.overallExperience
      };
      feedback.whatWorkedWell = whatWorkedWell || '';
      feedback.whatCouldImprove = whatCouldImprove || '';
      feedback.submittedAt = new Date();
    } else {
      // Create new feedback
      feedback = new Feedback({
        applicationId: application._id,
        feedbackType: 'applicant',
        ratings: {
          jobInfoClarity: ratings.jobInfoClarity,
          recruiterCommunication: ratings.recruiterCommunication,
          interviewOrganization: ratings.interviewOrganization,
          processProfessionalism: ratings.processProfessionalism,
          overallExperience: ratings.overallExperience
        },
        whatWorkedWell: whatWorkedWell || '',
        whatCouldImprove: whatCouldImprove || '',
        isAnonymous: true
      });
    }

    await feedback.save();

    // Mark applicant feedback as submitted
    application.applicantFeedbackSubmitted = true;
    
    // Unlock status if both feedbacks are submitted
    if (application.recruiterFeedbackSubmitted && application.applicantFeedbackSubmitted) {
      application.isStatusLocked = false;
      
      // Send notification to applicant that status is unlocked
      const { createApplicationStatusNotification } = require('../services/notificationService');
      try {
        const job = application.jobId;
        await createApplicationStatusNotification(
          application.applicantId.toString(),
          application.status, // Now reveal the actual status
          {
            title: job.title,
            company: job.company
          },
          application._id
        );
        console.log('✅ Status unlocked notification sent to applicant');
      } catch (notifError) {
        console.error('❌ Error creating unlock notification:', notifError.message);
      }
    }
    
    await application.save();

    res.json({ 
      message: 'Applicant feedback submitted successfully. Application status is now unlocked.',
      feedback: {
        ratings: feedback.ratings,
        whatWorkedWell: feedback.whatWorkedWell,
        whatCouldImprove: feedback.whatCouldImprove,
        submittedAt: feedback.submittedAt
      },
      applicationUnlocked: true
    });
  } catch (err) {
    console.error('Error submitting applicant feedback:', err);
    res.status(500).json({ message: 'Error submitting feedback', error: err.message });
  }
});

// Get feedback for an application (only when unlocked)
router.get('/application/:id/feedback', verifyToken, async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const application = await Application.findById(applicationId).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = application.jobId;
    const user = await User.findById(req.user.id);
    
    // Verify user has access (either recruiter or applicant)
    let hasAccess = false;
    let isRecruiter = false;
    
    if (user.role === 'applicant' && application.applicantId.toString() === req.user.id) {
      hasAccess = true;
    } else if (user.role === 'recruiter') {
      isRecruiter = true;
      const Company = require('../models/Company');
      if (job.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      } else if (user.companyId && job.companyId && user.companyId.toString() === job.companyId.toString()) {
        hasAccess = true;
      } else if (job.companyId) {
        const company = await Company.findById(job.companyId);
        if (company && company.recruiterId.toString() === req.user.id) {
          hasAccess = true;
        }
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view feedback for this application' });
    }

    // Check if status is unlocked (both feedbacks submitted)
    if (application.isStatusLocked) {
      return res.status(403).json({ 
        message: 'Feedback is locked. Both recruiter and applicant feedback must be submitted to view.',
        isLocked: true,
        recruiterFeedbackSubmitted: application.recruiterFeedbackSubmitted,
        applicantFeedbackSubmitted: application.applicantFeedbackSubmitted
      });
    }

    const Feedback = require('../models/Feedback');
    const feedbacks = await Feedback.find({
      applicationId: application._id
    }).sort({ submittedAt: 1 });

    // Return anonymous feedback (no personal identifiers)
    const response = {
      application: {
        id: application._id,
        status: application.status,
        jobTitle: job.title,
        company: job.company
      },
      recruiterFeedback: null,
      applicantFeedback: null,
      isLocked: false
    };

    feedbacks.forEach(feedback => {
      if (feedback.feedbackType === 'recruiter') {
        response.recruiterFeedback = {
          ratings: feedback.ratings,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          submittedAt: feedback.submittedAt
        };
      } else if (feedback.feedbackType === 'applicant') {
        response.applicantFeedback = {
          ratings: feedback.ratings,
          whatWorkedWell: feedback.whatWorkedWell,
          whatCouldImprove: feedback.whatCouldImprove,
          submittedAt: feedback.submittedAt
        };
      }
    });

    res.json(response);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
});

// Check feedback status for an application
router.get('/application/:id/feedback-status', verifyToken, async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const user = await User.findById(req.user.id);
    
    // Verify user has access
    let hasAccess = false;
    if (user.role === 'applicant' && application.applicantId.toString() === req.user.id) {
      hasAccess = true;
    } else if (user.role === 'recruiter') {
      const job = await Job.findById(application.jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      const Company = require('../models/Company');
      if (job.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      } else if (user.companyId && job.companyId && user.companyId.toString() === job.companyId.toString()) {
        hasAccess = true;
      } else if (job.companyId) {
        const company = await Company.findById(job.companyId);
        if (company && company.recruiterId.toString() === req.user.id) {
          hasAccess = true;
        }
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // For applicants, hide status if locked
    let statusToReturn = application.status;
    if (user.role === 'applicant' && application.isStatusLocked && ['Accepted', 'Rejected'].includes(application.status)) {
      statusToReturn = 'Update Available';
    }

    res.json({
      recruiterFeedbackSubmitted: application.recruiterFeedbackSubmitted || false,
      applicantFeedbackSubmitted: application.applicantFeedbackSubmitted || false,
      isStatusLocked: application.isStatusLocked || false,
      status: statusToReturn,
      actualStatus: user.role === 'recruiter' || !application.isStatusLocked ? application.status : undefined, // Only reveal to recruiters or when unlocked
      canViewFeedback: !application.isStatusLocked && ['Accepted', 'Rejected'].includes(application.status)
    });
  } catch (err) {
    console.error('Error checking feedback status:', err);
    res.status(500).json({ message: 'Error checking feedback status', error: err.message });
  }
});

// Get applicant feedback for a specific application (recruiter only, anonymous)
router.get('/job/:jobId/feedback/:applicationId', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view feedback for this job' });
    }
    
    const application = await Application.findById(applicationId).populate('jobId');
    if (!application || application.jobId._id.toString() !== jobId) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const Feedback = require('../models/Feedback');
    const applicantFeedback = await Feedback.findOne({
      applicationId: application._id,
      feedbackType: 'applicant'
    });
    
    if (!applicantFeedback) {
      return res.status(404).json({ message: 'Applicant feedback not found' });
    }
    
    // Return anonymous feedback (no applicant identity)
    res.json({
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      feedback: {
        ratings: applicantFeedback.ratings,
        whatWorkedWell: applicantFeedback.whatWorkedWell,
        whatCouldImprove: applicantFeedback.whatCouldImprove,
        submittedAt: applicantFeedback.submittedAt
      },
      // No applicant information is revealed
      isAnonymous: true
    });
  } catch (err) {
    console.error('Error fetching applicant feedback:', err);
    res.status(500).json({ message: 'Error fetching feedback', error: err.message });
  }
});

// Get all feedbacks for a job (recruiter only, all applicants anonymous)
router.get('/job/:jobId/feedbacks', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify recruiter has access to this job
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    let hasAccess = false;
    if (job.recruiterId.toString() === req.user.id) {
      hasAccess = true;
    } else if (recruiter.companyId && job.companyId && recruiter.companyId.toString() === job.companyId.toString()) {
      hasAccess = true;
    } else if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized to view feedbacks for this job' });
    }
    
    // Get all applications for this job
    const applications = await Application.find({ jobId: job._id });
    const applicationIds = applications.map(app => app._id);
    
    const Feedback = require('../models/Feedback');
    const applicantFeedbacks = await Feedback.find({
      applicationId: { $in: applicationIds },
      feedbackType: 'applicant'
    }).sort({ submittedAt: -1 });
    
    // Return anonymous feedbacks (no applicant identities)
    const feedbacks = applicantFeedbacks.map(feedback => ({
      feedback: {
        ratings: feedback.ratings,
        whatWorkedWell: feedback.whatWorkedWell,
        whatCouldImprove: feedback.whatCouldImprove,
        submittedAt: feedback.submittedAt
      },
      // No applicant information is revealed
      isAnonymous: true
    }));
    
    res.json({
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      feedbacks,
      totalCount: feedbacks.length
    });
  } catch (err) {
    console.error('Error fetching job feedbacks:', err);
    res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
  }
});

// Get all applicant feedbacks for recruiter (across all their jobs)
router.get('/recruiter/feedbacks', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    // Get all jobs the recruiter has access to
    let jobQuery = {};
    
    // If recruiter belongs to a company, get all jobs from that company
    if (recruiter.companyId) {
      jobQuery.companyId = recruiter.companyId;
    } else {
      // Get jobs where recruiter is the owner
      const createdCompanies = await Company.find({ recruiterId: req.user.id }).select('_id');
      const companyIds = createdCompanies.map(c => c._id);
      
      if (companyIds.length > 0) {
        jobQuery.$or = [
          { recruiterId: req.user.id },
          { companyId: { $in: companyIds } }
        ];
      } else {
        jobQuery.recruiterId = req.user.id;
      }
    }
    
    const jobs = await Job.find(jobQuery).select('_id title company');
    const jobIds = jobs.map(job => job._id);
    
    if (jobIds.length === 0) {
      return res.json({
        feedbacks: [],
        totalCount: 0,
        newCount: 0,
        jobs: []
      });
    }
    
    // Get all applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } });
    const applicationIds = applications.map(app => app._id);
    
    if (applicationIds.length === 0) {
      return res.json({
        feedbacks: [],
        totalCount: 0,
        newCount: 0,
        jobs: jobs.map(j => ({ id: j._id, title: j.title, company: j.company }))
      });
    }
    
    const Feedback = require('../models/Feedback');
    const Notification = require('../models/Notification');
    
    // Get all applicant feedbacks
    const applicantFeedbacks = await Feedback.find({
      applicationId: { $in: applicationIds },
      feedbackType: 'applicant'
    }).sort({ submittedAt: -1 });
    
    // Get notification IDs that the recruiter has read (to determine "new" feedbacks)
    const readNotificationIds = await Notification.find({
      userId: req.user.id,
      type: 'feedback_submitted',
      isRead: true
    }).select('metadata').lean();
    
    const readJobIds = new Set(
      readNotificationIds
        .map(n => n.metadata?.jobId)
        .filter(Boolean)
    );
    
    // Create a map of jobId to job details
    const jobMap = {};
    jobs.forEach(job => {
      jobMap[job._id.toString()] = {
        id: job._id,
        title: job.title,
        company: job.company
      };
    });
    
    // Create a map of applicationId to jobId
    const applicationToJobMap = {};
    applications.forEach(app => {
      applicationToJobMap[app._id.toString()] = app.jobId.toString();
    });
    
    // Process feedbacks with job information
    const feedbacks = applicantFeedbacks.map(feedback => {
      const jobId = applicationToJobMap[feedback.applicationId.toString()];
      const job = jobMap[jobId];
      
      return {
        feedback: {
          ratings: feedback.ratings,
          whatWorkedWell: feedback.whatWorkedWell,
          whatCouldImprove: feedback.whatCouldImprove,
          submittedAt: feedback.submittedAt
        },
        job: job || { id: jobId, title: 'Unknown Job', company: 'Unknown Company' },
        isAnonymous: true,
        isNew: !readJobIds.has(jobId) // New if recruiter hasn't read notification for this job
      };
    });
    
    // Count new feedbacks (feedbacks from jobs where recruiter hasn't read the notification)
    const newCount = feedbacks.filter(f => f.isNew).length;
    
    res.json({
      feedbacks,
      totalCount: feedbacks.length,
      newCount,
      jobs: Object.values(jobMap)
    });
  } catch (err) {
    console.error('Error fetching recruiter feedbacks:', err);
    res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
  }
});

// Get count of new applicant feedbacks for recruiter
router.get('/recruiter/feedbacks/count', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const recruiter = await User.findById(req.user.id);
    const Company = require('../models/Company');
    
    // Get all jobs the recruiter has access to
    let jobQuery = {};
    
    if (recruiter.companyId) {
      jobQuery.companyId = recruiter.companyId;
    } else {
      const createdCompanies = await Company.find({ recruiterId: req.user.id }).select('_id');
      const companyIds = createdCompanies.map(c => c._id);
      
      if (companyIds.length > 0) {
        jobQuery.$or = [
          { recruiterId: req.user.id },
          { companyId: { $in: companyIds } }
        ];
      } else {
        jobQuery.recruiterId = req.user.id;
      }
    }
    
    const jobs = await Job.find(jobQuery).select('_id');
    const jobIds = jobs.map(job => job._id);
    
    if (jobIds.length === 0) {
      return res.json({ newCount: 0, totalCount: 0 });
    }
    
    const applications = await Application.find({ jobId: { $in: jobIds } });
    const applicationIds = applications.map(app => app._id);
    
    if (applicationIds.length === 0) {
      return res.json({ newCount: 0, totalCount: 0 });
    }
    
    const Feedback = require('../models/Feedback');
    const Notification = require('../models/Notification');
    
    // Get all applicant feedbacks
    const applicantFeedbacks = await Feedback.find({
      applicationId: { $in: applicationIds },
      feedbackType: 'applicant'
    });
    
    // Get notification IDs that the recruiter has read
    const readNotificationIds = await Notification.find({
      userId: req.user.id,
      type: 'feedback_submitted',
      isRead: true
    }).select('metadata').lean();
    
    const readJobIds = new Set(
      readNotificationIds
        .map(n => n.metadata?.jobId)
        .filter(Boolean)
    );
    
    // Return total count (show total feedbacks, not just new ones)
    res.json({
      newCount: applicantFeedbacks.length, // Use total count for badge
      totalCount: applicantFeedbacks.length
    });
  } catch (err) {
    console.error('Error fetching feedback count:', err);
    res.status(500).json({ message: 'Error fetching feedback count', error: err.message });
  }
});

module.exports = router;