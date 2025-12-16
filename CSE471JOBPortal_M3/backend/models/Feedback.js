const mongoose = require('mongoose');

/**
 * Feedback Model
 * Stores anonymous feedback from recruiters and applicants
 * Feedback is linked to applications but identities are kept anonymous
 */
const feedbackSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true
  },
  
  // Feedback type: 'recruiter' or 'applicant'
  feedbackType: {
    type: String,
    enum: ['recruiter', 'applicant'],
    required: true,
    index: true
  },
  
  // Structured ratings (1-5 scale)
  ratings: {
    // For recruiter feedback (about applicant)
    communicationSkills: { type: Number, min: 1, max: 5 },
    technicalCompetency: { type: Number, min: 1, max: 5 },
    interviewPreparedness: { type: Number, min: 1, max: 5 },
    professionalBehavior: { type: Number, min: 1, max: 5 },
    overallSuitability: { type: Number, min: 1, max: 5 },
    
    // For applicant feedback (about recruitment process)
    jobInfoClarity: { type: Number, min: 1, max: 5 },
    recruiterCommunication: { type: Number, min: 1, max: 5 },
    interviewOrganization: { type: Number, min: 1, max: 5 },
    processProfessionalism: { type: Number, min: 1, max: 5 },
    overallExperience: { type: Number, min: 1, max: 5 }
  },
  
  // Optional text feedback
  strengths: { type: String, trim: true, default: '' }, // Recruiter: applicant strengths
  improvements: { type: String, trim: true, default: '' }, // Recruiter: areas to improve
  whatWorkedWell: { type: String, trim: true, default: '' }, // Applicant: process strengths
  whatCouldImprove: { type: String, trim: true, default: '' }, // Applicant: process improvements
  
  // Always anonymous
  isAnonymous: {
    type: Boolean,
    default: true
  },
  
  // Timestamp when feedback was submitted
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one feedback per type per application
feedbackSchema.index({ applicationId: 1, feedbackType: 1 }, { unique: true });

// Index for querying feedback by application
feedbackSchema.index({ applicationId: 1, submittedAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);

