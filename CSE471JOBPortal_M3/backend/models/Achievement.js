const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['certification', 'award', 'project', 'education', 'competition', 'publication', 'other'],
    index: true
  },
  dateAchieved: {
    type: Date,
    required: true,
    index: true
  },
  issuer: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  proofUrl: {
    type: String,
    trim: true,
    default: ''
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  impactLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  // Additional professional fields
  industry: {
    type: String,
    trim: true,
    default: '',
    index: true
  },
  duration: {
    type: Number, // Duration in months
    default: null
  },
  teamSize: {
    type: String,
    enum: ['individual', 'small', 'medium', 'large'],
    default: 'individual',
    index: true
  },
  recognitionLevel: {
    type: String,
    enum: ['local', 'regional', 'national', 'international'],
    default: 'local',
    index: true
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
achievementSchema.index({ userId: 1, createdAt: -1 });
achievementSchema.index({ userId: 1, category: 1 });
achievementSchema.index({ userId: 1, dateAchieved: -1 });
achievementSchema.index({ userId: 1, isFeatured: 1 });
achievementSchema.index({ userId: 1, industry: 1 });
achievementSchema.index({ userId: 1, teamSize: 1 });
achievementSchema.index({ userId: 1, recognitionLevel: 1 });
achievementSchema.index({ userId: 1, difficultyLevel: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);

