const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const InterviewQuestionRepository = require('../models/InterviewQuestionRepository');
const Job = require('../models/Job');
const User = require('../models/User');
const Company = require('../models/Company');

const router = express.Router();

// Middleware to check if recruiter has access to the job's question repository
// Only recruiters from the same company (or independent recruiters who own the job) can access
// Company owners can access all jobs from their companies
async function checkRepositoryAccess(req, res, next) {
  try {
    const jobId = req.params.jobId;
    console.log('checkRepositoryAccess - jobId:', jobId, 'userId:', req.user?.id);
    const job = await Job.findById(jobId);
    
    if (!job) {
      console.error('Job not found:', jobId);
      return res.status(404).json({ message: 'Job not found' });
    }

    const requestingRecruiter = await User.findById(req.user.id);
    if (!requestingRecruiter || requestingRecruiter.role !== 'recruiter') {
      console.error('User is not a recruiter:', req.user.id, requestingRecruiter?.role);
      return res.status(403).json({ message: 'Only recruiters can access interview questions' });
    }

    // If recruiter owns the job, allow access
    if (job.recruiterId.toString() === req.user.id) {
      console.log('Access granted: User is job owner');
      return next();
    }

    // If job has a company, check if recruiter is the company owner
    if (job.companyId) {
      const company = await Company.findById(job.companyId);
      if (company && company.recruiterId.toString() === req.user.id) {
        // Recruiter created this company, allow access
        console.log('Access granted: User is company owner');
        return next();
      }
    }

    // If both have companyId and they match, allow access
    if (requestingRecruiter.companyId && job.companyId) {
      if (requestingRecruiter.companyId.toString() === job.companyId.toString()) {
        console.log('Access granted: User is from same company');
        return next();
      }
    }

    // If both are independent (companyId is null), only owner can access
    if (!requestingRecruiter.companyId && !job.companyId) {
      console.log('Access denied: Independent recruiters can only access their own jobs');
      return res.status(403).json({ message: 'Access denied: You can only access your own job repositories' });
    }

    // Different companies or one is independent and other is not
    console.log('Access denied: Different companies');
    return res.status(403).json({ message: 'Access denied: You can only access repositories from your company' });
  } catch (err) {
    console.error('Error in checkRepositoryAccess:', err);
    return res.status(500).json({ message: 'Error checking access', error: err.message });
  }
}

// Middleware to check if user is the job poster (only job poster can edit)
async function checkEditPermission(req, res, next) {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    
    if (!job) {
      console.error('Job not found in checkEditPermission:', jobId);
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only the job poster (recruiterId) can edit
    if (job.recruiterId.toString() !== req.user.id) {
      console.log('Edit permission denied:', {
        jobRecruiterId: job.recruiterId.toString(),
        userId: req.user.id,
        match: job.recruiterId.toString() === req.user.id
      });
      return res.status(403).json({ message: 'Only the job poster can edit interview questions' });
    }

    next();
  } catch (err) {
    console.error('Error in checkEditPermission:', err);
    return res.status(500).json({ message: 'Error checking edit permission', error: err.message });
  }
}

// Get interview questions for a job
router.get(
  '/:jobId/questions',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await Job.findById(jobId);
      
      // Use lean() to avoid validation errors with old format data
      let repository = await InterviewQuestionRepository.findOne({ jobId }).lean();
      
      // If repository doesn't exist, create an empty one
      if (!repository) {
        const newRepo = new InterviewQuestionRepository({
          jobId,
          companyId: job.companyId || null,
          questions: [],
          createdBy: job.recruiterId
        });
        await newRepo.save();
        repository = newRepo.toObject();
      } else {
        // Migrate old format (strings) to new format (objects) if needed
        let needsMigration = false;
        const migratedQuestions = repository.questions.map(q => {
          if (typeof q === 'string') {
            needsMigration = true;
            return { question: q, answer: '' };
          }
          return q;
        });
        
        // Save migrated format if migration was needed
        if (needsMigration) {
          await InterviewQuestionRepository.findByIdAndUpdate(
            repository._id,
            { questions: migratedQuestions },
            { runValidators: true }
          );
          repository.questions = migratedQuestions;
        }
      }
      
      // Check if current user is the job poster
      const isJobPoster = job.recruiterId.toString() === req.user.id;
      
      res.json({ 
        repository,
        isJobPoster // Include permission info
      });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching interview questions', error: err.message });
    }
  }
);

// Add a new question to the repository (only job poster can add)
router.post(
  '/:jobId/questions',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  checkEditPermission,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { question, answer } = req.body;
      
      console.log('✅ Route handler reached - Adding question:', { 
        jobId, 
        question, 
        answer, 
        body: req.body, 
        userId: req.user.id 
      });
      
      if (!question || !question.trim()) {
        console.log('❌ Validation failed: Question text is required');
        return res.status(400).json({ message: 'Question text is required' });
      }

      // Ensure answer is a string, default to empty string if not provided
      const answerText = (answer && typeof answer === 'string') ? answer.trim() : '';
      console.log('Answer text:', answerText);

      // Use lean() to get plain object and avoid validation issues with old format data
      let repository = await InterviewQuestionRepository.findOne({ jobId }).lean();
      console.log('Repository found:', !!repository);
      
      if (!repository) {
        const job = await Job.findById(jobId);
        if (!job) {
          console.log('❌ Job not found:', jobId);
          return res.status(404).json({ message: 'Job not found' });
        }
        console.log('Creating new repository for job:', jobId);
        repository = new InterviewQuestionRepository({
          jobId,
          companyId: job.companyId || null,
          questions: [{
            question: question.trim(),
            answer: answerText
          }],
          createdBy: job.recruiterId
        });
        await repository.save();
        console.log('✅ Question added successfully');
        return res.status(201).json({ message: 'Question added successfully', repository });
      }
      
      // Migrate old format (strings) to new format (objects) if needed
      let needsMigration = false;
      const migratedQuestions = repository.questions.map(q => {
        if (typeof q === 'string') {
          needsMigration = true;
          return { question: q, answer: '' };
        }
        return q;
      });
      
      // Add new question
      migratedQuestions.push({
        question: question.trim(),
        answer: answerText
      });
      
      // Update repository with migrated questions
      const updatedRepository = await InterviewQuestionRepository.findByIdAndUpdate(
        repository._id,
        { questions: migratedQuestions },
        { new: true, runValidators: true }
      );
      
      if (needsMigration) {
        console.log('✅ Migrated old format questions and added new question');
      } else {
        console.log('✅ Question added successfully');
      }
      
      res.status(201).json({ message: 'Question added successfully', repository: updatedRepository });
    } catch (err) {
      console.error('❌ Error in route handler:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
        message: 'Error adding question', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

// Update a specific question (only job poster can update)
router.put(
  '/:jobId/questions/:questionId',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  checkEditPermission,
  async (req, res) => {
    try {
      const { jobId, questionId } = req.params;
      const { question, answer } = req.body;
      
      if (!question || !question.trim()) {
        return res.status(400).json({ message: 'Question text is required' });
      }

      const repository = await InterviewQuestionRepository.findOne({ jobId });
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // questionId is the index in the questions array
      const index = parseInt(questionId, 10);
      if (isNaN(index) || index < 0 || index >= repository.questions.length) {
        return res.status(404).json({ message: 'Question not found' });
      }

      repository.questions[index].question = question.trim();
      if (answer !== undefined) {
        repository.questions[index].answer = answer ? answer.trim() : '';
      }
      await repository.save();
      
      res.json({ message: 'Question updated successfully', repository });
    } catch (err) {
      res.status(500).json({ message: 'Error updating question', error: err.message });
    }
  }
);

// Update answer for a specific question (only job poster can update)
router.put(
  '/:jobId/questions/:questionId/answer',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  checkEditPermission,
  async (req, res) => {
    try {
      const { jobId, questionId } = req.params;
      const { answer } = req.body;

      const repository = await InterviewQuestionRepository.findOne({ jobId });
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // questionId is the index in the questions array
      const index = parseInt(questionId, 10);
      if (isNaN(index) || index < 0 || index >= repository.questions.length) {
        return res.status(404).json({ message: 'Question not found' });
      }

      repository.questions[index].answer = answer ? answer.trim() : '';
      await repository.save();
      
      res.json({ message: 'Answer updated successfully', repository });
    } catch (err) {
      res.status(500).json({ message: 'Error updating answer', error: err.message });
    }
  }
);

// Delete a specific question (only job poster can delete)
router.delete(
  '/:jobId/questions/:questionId',
  verifyToken,
  authorizeRole('recruiter'),
  checkRepositoryAccess,
  checkEditPermission,
  async (req, res) => {
    try {
      const { jobId, questionId } = req.params;

      const repository = await InterviewQuestionRepository.findOne({ jobId });
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }

      // questionId is the index in the questions array
      const index = parseInt(questionId, 10);
      if (isNaN(index) || index < 0 || index >= repository.questions.length) {
        return res.status(404).json({ message: 'Question not found' });
      }

      repository.questions.splice(index, 1);
      await repository.save();
      
      res.json({ message: 'Question deleted successfully', repository });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting question', error: err.message });
    }
  }
);

module.exports = router;

