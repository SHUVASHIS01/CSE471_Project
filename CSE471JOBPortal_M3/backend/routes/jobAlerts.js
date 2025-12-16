const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const JobAlert = require('../models/JobAlert');
const { processJobAlert, processAllActiveAlerts } = require('../services/smartJobAlertService');
const { sendJobAlertEmail } = require('../services/emailService');

const router = express.Router();

/**
 * POST /api/job-alerts
 * Create a new job alert
 */
router.post('/', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const { name, keywords, locations, jobTypes, frequency } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Alert name is required' });
    }

    // Validate jobTypes if provided
    if (jobTypes && Array.isArray(jobTypes)) {
      const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
      const invalidTypes = jobTypes.filter(type => !validJobTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({ 
          message: `Invalid job types: ${invalidTypes.join(', ')}. Valid types are: ${validJobTypes.join(', ')}` 
        });
      }
    }

    // Validate frequency
    if (frequency && !['daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({ message: 'Frequency must be "daily" or "weekly"' });
    }

    const jobAlert = new JobAlert({
      userId: req.user.id,
      name: name.trim(),
      keywords: keywords || [],
      locations: locations || [],
      jobTypes: jobTypes || [],
      frequency: frequency || 'weekly',
      isActive: true
    });

    await jobAlert.save();

    res.status(201).json({
      message: 'Job alert created successfully',
      jobAlert
    });
  } catch (error) {
    console.error('Error creating job alert:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/job-alerts
 * Get all job alerts for the authenticated user
 */
router.get('/', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobAlerts = await JobAlert.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      jobAlerts,
      count: jobAlerts.length
    });
  } catch (error) {
    console.error('Error fetching job alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/job-alerts/:id
 * Get a specific job alert by ID
 */
router.get('/:id', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).lean();

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    res.json({ jobAlert });
  } catch (error) {
    console.error('Error fetching job alert:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job alert ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/job-alerts/:id
 * Update a job alert
 */
router.put('/:id', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const { name, keywords, locations, jobTypes, frequency, isActive } = req.body;

    const jobAlert = await JobAlert.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Alert name cannot be empty' });
      }
      jobAlert.name = name.trim();
    }

    if (keywords !== undefined) {
      jobAlert.keywords = keywords;
    }

    if (locations !== undefined) {
      jobAlert.locations = locations;
    }

    if (jobTypes !== undefined) {
      if (Array.isArray(jobTypes)) {
        const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
        const invalidTypes = jobTypes.filter(type => !validJobTypes.includes(type));
        if (invalidTypes.length > 0) {
          return res.status(400).json({ 
            message: `Invalid job types: ${invalidTypes.join(', ')}. Valid types are: ${validJobTypes.join(', ')}` 
          });
        }
      }
      jobAlert.jobTypes = jobTypes;
    }

    if (frequency !== undefined) {
      if (!['daily', 'weekly'].includes(frequency)) {
        return res.status(400).json({ message: 'Frequency must be "daily" or "weekly"' });
      }
      jobAlert.frequency = frequency;
    }

    if (isActive !== undefined) {
      jobAlert.isActive = Boolean(isActive);
    }

    await jobAlert.save();

    res.json({
      message: 'Job alert updated successfully',
      jobAlert
    });
  } catch (error) {
    console.error('Error updating job alert:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job alert ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/job-alerts/:id
 * Delete a job alert
 */
router.delete('/:id', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    res.json({
      message: 'Job alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job alert:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job alert ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/job-alerts/:id/test
 * Test a job alert (find matches and return them without sending email)
 */
router.post('/:id/test', verifyToken, authorizeRole('applicant'), async (req, res) => {
  try {
    const jobAlert = await JobAlert.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('userId').lean();

    if (!jobAlert) {
      return res.status(404).json({ message: 'Job alert not found' });
    }

    // Process the alert (onlyNew = false to get all matches)
    const result = await processJobAlert(req.params.id, false);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Test completed successfully',
      alertName: result.alertName,
      matchCount: result.matches.length,
      matches: result.matches.map(match => ({
        job: {
          _id: match.job._id,
          title: match.job.title,
          company: match.job.company,
          location: match.job.location,
          jobType: match.job.jobType,
          salary: match.job.salary,
          description: match.job.description.substring(0, 200) + '...'
        },
        matchScore: match.score,
        reasons: match.reasons
      }))
    });
  } catch (error) {
    console.error('Error testing job alert:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job alert ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/job-alerts/test-all
 * Test all active job alerts (admin/testing endpoint)
 * Note: This endpoint is for testing purposes and should be protected in production
 */
router.post('/test-all', verifyToken, async (req, res) => {
  try {
    // Process all active alerts
    const results = await processAllActiveAlerts();

    const summary = {
      totalAlerts: results.length,
      alertsWithMatches: results.filter(r => r.matches && r.matches.length > 0).length,
      alertsWithErrors: results.filter(r => r.error).length,
      totalMatches: results.reduce((sum, r) => sum + (r.matches?.length || 0), 0),
      results: results.map(r => ({
        alertId: r.alertId,
        alertName: r.alertName,
        matchCount: r.matches?.length || 0,
        error: r.error || null
      }))
    };

    res.json({
      message: 'Test completed for all active alerts',
      summary
    });
  } catch (error) {
    console.error('Error testing all job alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

