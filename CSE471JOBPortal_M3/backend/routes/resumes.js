const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure resume uploads storage - SEPARATE from existing uploads
const resumesDir = path.join(__dirname, '..', 'uploads', 'resumes');
fs.mkdirSync(resumesDir, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e6);
    // Format: resume-{timestamp}-{random}.pdf
    cb(null, `resume-${timestamp}-${random}${ext}`);
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
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

// Helper function to get file type from extension
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'PDF';
  if (ext === '.doc') return 'DOC';
  if (ext === '.docx') return 'DOCX';
  return 'PDF';
};

// Multer error handler middleware
const multerErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err.message && err.message.includes('Only PDF')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  next();
};

// Upload a new resume
router.post(
  '/upload',
  verifyToken,
  authorizeRole('applicant'),
  resumeUpload.single('resume'),
  multerErrorHandler,
  async (req, res, next) => {
    try {
      if (!req.file) {
        console.error('No file in request:', { body: req.body, files: req.files });
        return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
      }

      console.log('File received:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        savedAs: req.file.filename
      });

      const { title, description, tags, isDefault } = req.body;
      
      // If setting as default, unset other defaults
      if (isDefault === 'true' || isDefault === true) {
        await Resume.updateMany(
          { applicantId: req.user.id },
          { $set: { isDefault: false } }
        );
      }

      // Validate applicantId
      if (!req.user || !req.user.id) {
        console.error('Missing user ID in request');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Validate ObjectId format (mongoose will convert string to ObjectId automatically)
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        console.error('Invalid applicantId format:', req.user.id);
        return res.status(400).json({ message: 'Invalid user ID format' });
      }

      const applicantId = req.user.id;

      // Validate and prepare title
      const resumeTitle = (title && title.trim()) || `Resume ${new Date().toLocaleDateString()}`;
      if (!resumeTitle || resumeTitle.trim().length === 0) {
        return res.status(400).json({ message: 'Resume title is required' });
      }

      // Get file type
      const fileType = getFileType(req.file.filename);
      if (!['PDF', 'DOC', 'DOCX'].includes(fileType)) {
        return res.status(400).json({ message: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' });
      }

      console.log('Creating resume with data:', {
        applicantId,
        title: resumeTitle,
        fileUrl: `/uploads/resumes/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileType
      });

      const resume = new Resume({
        applicantId: applicantId,
        title: resumeTitle.trim(),
        description: (description && description.trim()) || '',
        fileUrl: `/uploads/resumes/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileType,
        isDefault: isDefault === 'true' || isDefault === true,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : []
      });

      await resume.save();
      console.log('Resume saved successfully:', resume._id);
      res.status(201).json({ message: 'Resume uploaded successfully', resume });
    } catch (err) {
      console.error('Resume upload error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        errors: err.errors
      });
      
      // If file was uploaded but database save failed, delete the file
      if (req.file) {
        const filePath = path.join(resumesDir, req.file.filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted uploaded file due to save error');
          }
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
      
      // Return more specific error message
      let errorMessage = 'Failed to save resume. Please try again.';
      if (err.name === 'ValidationError') {
        errorMessage = `Validation error: ${Object.values(err.errors).map(e => e.message).join(', ')}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      res.status(500).json({ message: errorMessage });
    }
  }
);

// Get all resumes for the logged-in applicant
router.get(
  '/',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const resumes = await Resume.find({ applicantId: req.user.id })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();

      // Get usage count for each resume
      const resumesWithUsage = await Promise.all(
        resumes.map(async (resume) => {
          const usageCount = await Application.countDocuments({
            applicantId: req.user.id,
            resumeId: resume._id
          });
          
          const lastUsedApp = await Application.findOne({
            applicantId: req.user.id,
            resumeId: resume._id
          }).sort({ createdAt: -1 });

          return {
            ...resume,
            usageCount,
            lastUsedAt: lastUsedApp?.createdAt || null
          };
        })
      );

      res.json({ resumes: resumesWithUsage });
    } catch (err) {
      next(err);
    }
  }
);

// Get a single resume by ID
router.get(
  '/:id',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const resume = await Resume.findOne({
        _id: req.params.id,
        applicantId: req.user.id
      });

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Get usage count
      const usageCount = await Application.countDocuments({
        applicantId: req.user.id,
        resumeId: resume._id
      });

      const lastUsedApp = await Application.findOne({
        applicantId: req.user.id,
        resumeId: resume._id
      }).sort({ createdAt: -1 });

      res.json({
        resume: {
          ...resume.toObject(),
          usageCount,
          lastUsedAt: lastUsedApp?.createdAt || null
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Update resume metadata (title, description, tags, default status)
router.put(
  '/:id',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const { title, description, tags, isDefault } = req.body;
      
      const resume = await Resume.findOne({
        _id: req.params.id,
        applicantId: req.user.id
      });

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      const update = {};
      if (title !== undefined) update.title = title.trim();
      if (description !== undefined) update.description = description.trim();
      if (tags !== undefined) {
        update.tags = Array.isArray(tags) 
          ? tags.map(t => t.trim()).filter(Boolean)
          : tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (isDefault !== undefined) {
        update.isDefault = isDefault === true || isDefault === 'true';
        // If setting as default, unset other defaults
        if (update.isDefault) {
          await Resume.updateMany(
            { applicantId: req.user.id, _id: { $ne: req.params.id } },
            { $set: { isDefault: false } }
          );
        }
      }

      const updatedResume = await Resume.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true }
      );

      res.json({ message: 'Resume updated successfully', resume: updatedResume });
    } catch (err) {
      next(err);
    }
  }
);

// Delete a resume
router.delete(
  '/:id',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const resume = await Resume.findOne({
        _id: req.params.id,
        applicantId: req.user.id
      });

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Delete the file from filesystem
      const filePath = path.join(__dirname, '..', resume.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete the resume record
      await Resume.findByIdAndDelete(req.params.id);

      res.json({ message: 'Resume deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// Set a resume as default
router.put(
  '/:id/set-default',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const resume = await Resume.findOne({
        _id: req.params.id,
        applicantId: req.user.id
      });

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Unset all other defaults
      await Resume.updateMany(
        { applicantId: req.user.id, _id: { $ne: req.params.id } },
        { $set: { isDefault: false } }
      );

      // Set this one as default
      resume.isDefault = true;
      await resume.save();

      res.json({ message: 'Default resume updated', resume });
    } catch (err) {
      next(err);
    }
  }
);

// Bulk delete resumes
router.post(
  '/bulk-delete',
  verifyToken,
  authorizeRole('applicant'),
  async (req, res, next) => {
    try {
      const { resumeIds } = req.body;
      
      if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
        return res.status(400).json({ message: 'Resume IDs array is required' });
      }

      const resumes = await Resume.find({
        _id: { $in: resumeIds },
        applicantId: req.user.id
      });

      // Delete files from filesystem
      resumes.forEach(resume => {
        const filePath = path.join(__dirname, '..', resume.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // Delete resume records
      await Resume.deleteMany({
        _id: { $in: resumeIds },
        applicantId: req.user.id
      });

      res.json({ message: `${resumes.length} resume(s) deleted successfully` });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

