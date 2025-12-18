const mongoose = require('mongoose');

const questionAnswerSchema = new mongoose.Schema({
  question: { type: String, trim: true, required: true },
  answer: { type: String, trim: true, default: '' }
}, { _id: false });

const interviewQuestionRepositorySchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  questions: [questionAnswerSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Ensure one repository per job
interviewQuestionRepositorySchema.index({ jobId: 1 }, { unique: true });

module.exports = mongoose.model('InterviewQuestionRepository', interviewQuestionRepositorySchema);

