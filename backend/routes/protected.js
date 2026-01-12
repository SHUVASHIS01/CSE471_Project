const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const User = require('../models/User');
const Draft = require('../models/Draft');

const router = express.Router();

// Get logged-in user profile
router.get('/profile', verifyToken, async (req, res,next) => {
    console.log('Profile route reached');
    try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('User found:', user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Update applicant profile keywords
router.put(
  '/profile/keywords',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const keywords = Array.isArray(req.body.keywords)
        ? req.body.keywords
        : [];
      const sanitized = [...new Set(
        keywords
          .map(keyword => keyword?.toString().trim().toLowerCase())
          .filter(Boolean)
      )];

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profileKeywords: sanitized },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user, profileKeywords: user.profileKeywords });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== DRAFT ROUTES ====================

// Save application draft
router.post(
  '/drafts',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const { jobId, formData } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: 'Job ID is required' });
      }

      // Validate formData structure
      const draftData = {
        applicantId: req.user.id,
        jobId,
        formData: {
          fullName: formData?.fullName || '',
          email: formData?.email || '',
          phoneNumber: formData?.phoneNumber || '',
          linkedIn: formData?.linkedIn || '',
          portfolio: formData?.portfolio || '',
          coverLetter: formData?.coverLetter || '',
          skills: formData?.skills || '',
          experience: formData?.experience || '',
          resumeFileName: formData?.resumeFileName || ''
        },
        lastSaved: new Date()
      };

      // Upsert draft (update if exists, create if not)
      const draft = await Draft.findOneAndUpdate(
        { applicantId: req.user.id, jobId },
        draftData,
        { new: true, upsert: true, runValidators: true }
      );

      res.json({ 
        message: 'Draft saved successfully',
        draft: {
          _id: draft._id,
          jobId: draft.jobId,
          formData: draft.formData,
          lastSaved: draft.lastSaved
        }
      });
    } catch (err) {
      console.error('Error saving draft:', err);
      next(err);
    }
  }
);

// Get draft for a specific job
router.get(
  '/drafts/:jobId',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;

      const draft = await Draft.findOne({
        applicantId: req.user.id,
        jobId
      });

      if (!draft) {
        return res.status(404).json({ message: 'No draft found' });
      }

      // Check if draft is older than 24 hours
      const draftAge = Date.now() - new Date(draft.lastSaved).getTime();
      const hoursOld = draftAge / (1000 * 60 * 60);
      const isOldDraft = hoursOld > 24;

      res.json({
        draft: {
          _id: draft._id,
          jobId: draft.jobId,
          formData: draft.formData,
          lastSaved: draft.lastSaved,
          isOldDraft,
          hoursOld: Math.round(hoursOld * 10) / 10
        }
      });
    } catch (err) {
      console.error('Error fetching draft:', err);
      next(err);
    }
  }
);

// Delete draft (after successful application submission)
router.delete(
  '/drafts/:jobId',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;

      const draft = await Draft.findOneAndDelete({
        applicantId: req.user.id,
        jobId
      });

      if (!draft) {
        return res.status(404).json({ message: 'Draft not found' });
      }

      res.json({ message: 'Draft deleted successfully' });
    } catch (err) {
      console.error('Error deleting draft:', err);
      next(err);
    }
  }
);

// Get all drafts for user
router.get(
  '/drafts',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const drafts = await Draft.find({
        applicantId: req.user.id
      })
        .select('jobId formData lastSaved')
        .populate('jobId', 'title company')
        .sort({ lastSaved: -1 })
        .lean();

      res.json({ drafts });
    } catch (err) {
      console.error('Error fetching drafts:', err);
      next(err);
    }
  }
);

// Applicant dashboard (only for applicants)
router.get(
  '/applicant/dashboard',
  verifyToken,
  authorizeRole('applicant'),
  (req, res, next) => {
    console.log('Applicant dashboard route reached for user:', req.user?.id);
    try {
      res.json({ message: 'Welcome to applicant dashboard' });
    } catch (err) {
      next(err);
    }
  }
);

// Recruiter dashboard (only for recruiters)
router.get(
  '/recruiter/dashboard',
  verifyToken,
  authorizeRole('recruiter'),
  (req, res, next) => {
    console.log('Recruiter dashboard route reached for user:', req.user?.id);
    try {
      res.json({ message: 'Welcome to recruiter dashboard' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
