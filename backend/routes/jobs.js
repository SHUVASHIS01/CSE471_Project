const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const {
  getRecommendationPayload,
  trackSearchTerm
} = require('../services/recommendationService');

const router = express.Router();

const escapeRegex = (input = '') =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get recruiter's jobs (MUST be before /:id route)
router.get('/recruiter/jobs', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id })
      .populate('applicants', 'name email')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching jobs', error: err.message });
  }
});

// Get all active jobs (with optional search logging)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const searchTerm = (req.query.q || '').trim();
    const query = { isActive: true };

    if (searchTerm) {
      const regex = new RegExp(escapeRegex(searchTerm), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { company: regex },
        { location: regex },
        { skills: { $elemMatch: { $regex: regex } } }
      ];
    }

    const jobs = await Job.find(query)
      .populate('recruiterId', 'name email company')
      .sort({ createdAt: -1 });

    // Always record authenticated searches to build history for recommendations
    if (searchTerm && req.user?.id) {
      await trackSearchTerm(req.user.id, searchTerm);
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
    
    res.json({ applications });
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
    
    // Track search term if provided (from filter boxes)
    if (searchTerm && req.user?.id) {
      try {
        await trackSearchTerm(req.user.id, searchTerm);
        console.log('[recommendations API] Search term tracked:', searchTerm);
      } catch (trackErr) {
        console.error('[recommendations API] Error tracking search term:', trackErr);
        // Don't fail the request if tracking fails
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
    const jobData = {
      ...req.body,
      recruiterId: req.user.id
    };
    const job = new Job(jobData);
    await job.save();
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error creating job', error: err.message });
  }
});

// Apply for a job (applicant only)
router.post('/:id/apply', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const { resume, coverLetter, skills, experience } = req.body;

    const job = await Job.findById(jobId);
    if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found or inactive' });

    const existingApp = await Application.findOne({ jobId, applicantId: req.user.id });
    if (existingApp) return res.status(400).json({ message: 'You have already applied for this job' });

    const application = new Application({
      jobId,
      applicantId: req.user.id,
      resume,
      coverLetter,
      skills: skills || [],
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

    Object.assign(job, req.body);
    await job.save();
    res.json({ message: 'Job updated successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error updating job', error: err.message });
  }
});

// Close job (recruiter only)
router.delete('/:id', verifyToken, authorizeRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to close this job' });
    }

    job.isActive = false;
    await job.save();
    res.json({ message: 'Job closed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error closing job', error: err.message });
  }
});

module.exports = router;