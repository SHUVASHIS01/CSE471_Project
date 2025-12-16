import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api';
import '../styles/NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load notifications and unread count
  useEffect(() => {
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 15 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id);
        setNotifications(notifications.map(notif => 
          notif._id === notification._id ? { ...notif, isRead: true } : notif
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to link if exists
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_accepted':
        return '🎉';
      case 'application_rejected':
        return '📋';
      case 'application_reviewed':
        return '👀';
      case 'application_update_locked':
        return '📬';
      case 'feedback_submitted':
        return '📝';
      case 'unusual_login':
        return '🔐';
      case 'password_changed':
        return '🔑';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationTime.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button" 
        onClick={handleBellClick}
        aria-label="Notifications"
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        <span className="bell-icon" style={{ fontSize: 'inherit' }}>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn" 
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </div>
                    {notification.type === 'application_update_locked' && (
                      <div className="notification-locked-hint">
                        💡 Submit feedback to view the decision and recruiter review
                      </div>
                    )}
                  </div>

                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="delete-notification-btn"
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-link" 
                onClick={() => window.location.href = '/notifications'}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

