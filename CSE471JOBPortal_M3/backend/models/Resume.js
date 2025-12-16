const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  applicantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    default: function() {
      // Default title based on filename or timestamp
      return `Resume ${new Date().toLocaleDateString()}`;
    }
  },
  description: { 
    type: String, 
    trim: true,
    default: ''
  },
  fileUrl: { 
    type: String, 
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true // Size in bytes
  },
  fileType: {
    type: String,
    required: true,
    enum: ['PDF', 'DOC', 'DOCX']
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
resumeSchema.index({ applicantId: 1, isDefault: 1 });
resumeSchema.index({ applicantId: 1, createdAt: -1 });

// Ensure only one default resume per user
resumeSchema.pre('save', async function() {
  try {
    if (this.isDefault && this.isModified('isDefault')) {
      // Use the model constructor to avoid circular reference issues
      const ResumeModel = this.constructor;
      await ResumeModel.updateMany(
        { applicantId: this.applicantId, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    }
    // In Mongoose 9.x, async hooks don't need next() - just return
  } catch (err) {
    console.error('Error in resume pre-save hook:', err);
    // In Mongoose 9.x, throw errors instead of calling next(err)
    throw err;
  }
});

module.exports = mongoose.model('Resume', resumeSchema);

