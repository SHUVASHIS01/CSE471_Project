const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: String }, // URL or file path to resume (for backward compatibility)
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null }, // Reference to uploaded resume
  coverLetter: { type: String },
  skills: [{ type: String }], // Array of skills
  experience: { type: String }, // Years of experience
  status: { type: String, enum: ['Applied', 'Reviewed', 'Accepted', 'Rejected'], default: 'Applied' },
  
  // Feedback tracking for mutual anonymous feedback feature
  recruiterFeedbackSubmitted: { type: Boolean, default: false },
  applicantFeedbackSubmitted: { type: Boolean, default: false },
  isStatusLocked: { type: Boolean, default: false } // Locked until both feedbacks submitted
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', applicationSchema);
