const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteOldNotifications
} = require('../services/notificationService');

const router = express.Router();

/**
 * Get all notifications for the logged-in user
 * GET /api/notifications
 * Query params: page (default: 1), limit (default: 20)
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getUserNotifications(req.user.id, page, limit);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    const result = await markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await deleteNotification(req.params.id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

/**
 * Delete old read notifications
 * DELETE /api/notifications/old
 * Query params: daysOld (default: 30)
 */
router.delete('/old/cleanup', verifyToken, async (req, res) => {
  try {
    const daysOld = parseInt(req.query.daysOld) || 30;
    const result = await deleteOldNotifications(req.user.id, daysOld);
    
    res.json({
      success: true,
      message: `${result.deletedCount} old notifications deleted`
    });
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old notifications',
      error: error.message
    });
  }
});

module.exports = router;

