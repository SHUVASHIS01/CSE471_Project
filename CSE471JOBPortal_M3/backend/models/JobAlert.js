const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'My Job Alert'
  },
  keywords: {
    type: [String],
    default: [],
    set: (keywords = []) =>
      keywords
        .map(keyword => keyword?.toString().trim())
        .filter(Boolean)
  },
  locations: {
    type: [String],
    default: [],
    set: (locations = []) =>
      locations
        .map(location => location?.toString().trim())
        .filter(Boolean)
  },
  jobTypes: {
    type: [String],
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: []
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'weekly'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastSent: {
    type: Date,
    default: null
  },
  matchesFound: {
    type: Number,
    default: 0
  },
  notificationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
jobAlertSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('JobAlert', jobAlertSchema);

