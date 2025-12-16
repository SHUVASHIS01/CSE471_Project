const mongoose = require('mongoose');

/**
 * Notification Model
 * Stores all notifications for users (applicants and recruiters)
 */
const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  
  // Notification type - determines icon and color
  type: { 
    type: String, 
    enum: [
      'application_accepted',
      'application_rejected', 
      'application_reviewed',
      'application_update_locked',
      'feedback_required',
      'feedback_submitted',
      'unusual_login',
      'password_changed',
      'info',
      'warning',
      'success'
    ], 
    required: true,
    index: true
  },
  
  // Notification title (short)
  title: { 
    type: String, 
    required: true 
  },
  
  // Notification message (detailed)
  message: { 
    type: String, 
    required: true 
  },
  
  // Optional: Link to related entity
  link: { 
    type: String 
  },
  
  // Optional: Related entity details
  relatedEntity: {
    entityType: { 
      type: String, 
      enum: ['job', 'application', 'login', 'user', 'company', null] 
    },
    entityId: { 
      type: mongoose.Schema.Types.ObjectId 
    }
  },
  
  // Read status
  isRead: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  readAt: { 
    type: Date 
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to get recent notifications for a user
notificationSchema.statics.getRecentNotifications = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadNotifications = function(userId) {
  return this.find({ userId, isRead: false })
    .sort({ createdAt: -1 });
};

// Static method to mark notification as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete old read notifications (older than 30 days)
notificationSchema.statics.deleteOldNotifications = function(userId, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    userId,
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);

