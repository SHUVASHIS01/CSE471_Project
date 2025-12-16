import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ page, limit: 20 });
      
      let filteredNotifications = response.data.notifications || [];
      
      // Apply filter
      if (filter === 'unread') {
        filteredNotifications = filteredNotifications.filter(n => !n.isRead);
      } else if (filter === 'read') {
        filteredNotifications = filteredNotifications.filter(n => n.isRead);
      }
      
      setNotifications(filteredNotifications);
      setTotalPages(response.data.pagination.pages);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await notificationAPI.markAsRead(notificationId);
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
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    <div className="notifications-page">
      <nav className="notifications-nav">
        <div className="nav-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="nav-actions">
          <span>Welcome, {user?.name}</span>
          <button onClick={() => navigate(user?.role === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard')} className="btn-secondary">
            Dashboard
          </button>
          <button onClick={() => navigate('/profile')} className="btn-secondary">
            Profile
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="notifications-container">
        <div className="notifications-header">
          <div className="header-left">
            <h2>All Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          <div className="header-actions">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              <button 
                className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="notifications-loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="empty-icon">📭</span>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <>
            <div className="notifications-list-full">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-large">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-header-row">
                      <h3 className="notification-title-large">
                        {notification.title}
                      </h3>
                      <div className="notification-actions-row">
                        {!notification.isRead && (
                          <button
                            className="action-btn mark-read"
                            onClick={(e) => handleMarkAsRead(notification._id, e)}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="action-btn delete"
                          onClick={(e) => handleDeleteNotification(notification._id, e)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <p className="notification-message-large">
                      {notification.message}
                    </p>
                    
                    {notification.type === 'application_update_locked' && (
                      <div className="notification-locked-hint">
                        💡 Submit feedback to view the decision and recruiter review
                      </div>
                    )}
                    
                    <div className="notification-footer-row">
                      <span className="notification-time-large">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                      {notification.priority && (
                        <span className={`priority-badge priority-${notification.priority}`}>
                          {notification.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

