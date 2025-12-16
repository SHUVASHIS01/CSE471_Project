const mongoose = require('mongoose');

const careerQuizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  answers: {
    type: Map,
    of: String,
    required: true
  },
  recommendations: [{
    careerTitle: { type: String, required: true },
    explanation: { type: String, required: true },
    jobListings: [{
      title: String,
      company: String,
      location: String,
      url: String
    }]
  }]
}, {
  timestamps: true
});

// Index for efficient queries
careerQuizSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CareerQuiz', careerQuizSchema);

