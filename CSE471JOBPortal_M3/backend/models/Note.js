const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
noteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);

