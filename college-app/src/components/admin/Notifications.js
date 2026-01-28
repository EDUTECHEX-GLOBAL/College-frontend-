import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Notifications.css";

const Notifications = ({ adminId, fullView = false, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(fullView ? true : false);

  const fetchNotifications = async () => {
    try {
      // Mock data for demonstration - replace with actual API call
      const mockNotifications = [
        {
          _id: "1",
          userId: "user001",
          userName: "Aravind Bonda",
          message: "New application submitted for review",
          read: false,
          timestamp: new Date(Date.now() - 10 * 60000).toISOString() // 10 minutes ago
        },
        {
          _id: "2",
          userId: "user002",
          userName: "John Doe",
          message: "Payment received for application",
          read: false,
          timestamp: new Date(Date.now() - 60 * 60000).toISOString() // 1 hour ago
        },
        {
          _id: "3",
          userId: "user003",
          userName: "Jane Smith",
          message: "Profile updated successfully",
          read: true,
          timestamp: new Date(Date.now() - 120 * 60000).toISOString() // 2 hours ago
        },
        {
          _id: "4",
          userId: "user004",
          userName: "Robert Johnson",
          message: "New user registration completed",
          read: false,
          timestamp: new Date(Date.now() - 180 * 60000).toISOString() // 3 hours ago
        },
      ];
      
      setNotifications(mockNotifications);
      const count = mockNotifications.filter(n => !n.read).length;
      setUnreadCount(count);
      
      // Notify parent component about unread count
      if (onUnreadCountChange) {
        onUnreadCountChange(count);
      }
      
      // For actual API call, uncomment this:
      // const { data } = await axios.get(`/api/admin/notifications/${adminId}`);
      // setNotifications(data.notifications || []);
      // const count = data.notifications.filter(n => !n.read).length;
      // setUnreadCount(count);
      // if (onUnreadCountChange) onUnreadCountChange(count);
      
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (notificationId, userId) => {
    try {
      // Mock API call
      console.log(`Approving user ${userId} for notification ${notificationId}`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      const newUnreadCount = unreadCount - 1;
      setUnreadCount(newUnreadCount);
      
      // Notify parent component
      if (onUnreadCountChange) {
        onUnreadCountChange(newUnreadCount);
      }
      
      // For actual API call, uncomment this:
      // await axios.post(`/api/admin/approve-user`, { userId });
      // setNotifications(prev =>
      //   prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      // );
      // const newUnreadCount = unreadCount - 1;
      // setUnreadCount(newUnreadCount);
      // if (onUnreadCountChange) onUnreadCountChange(newUnreadCount);
      
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    if (onUnreadCountChange) {
      onUnreadCountChange(0);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Full view mode (for notifications page)
  if (fullView) {
    return (
      <div className="notifications-full-view">
        <div className="notifications-header-full">
          <h3>All Notifications</h3>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="notifications-list-full">
          {notifications.length === 0 ? (
            <div className="notification-empty-full">
              <div className="empty-icon">📭</div>
              <h4>No notifications yet</h4>
              <p>When you receive notifications, they'll appear here</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                className={`notification-card ${n.read ? "read" : "unread"}`}
              >
                <div className="notification-icon">
                  {n.read ? "📩" : "📨"}
                </div>
                <div className="notification-content">
                  <div className="notification-title">
                    <strong>{n.userName}</strong> - {n.message}
                  </div>
                  <div className="notification-time">
                    {formatTime(n.timestamp)}
                  </div>
                </div>
                {!n.read && (
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(n._id, n.userId)}
                  >
                    Approve
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="notifications-footer">
          <span className="notification-count">
            {notifications.length} notifications total
          </span>
          <span className="unread-count">
            {unreadCount} unread
          </span>
        </div>
      </div>
    );
  }

  // Dropdown mode (for navbar)
  return (
    <div className="notifications-navbar">
      <div className="bell-icon" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </div>

      {open && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No new notifications</div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <div
                  key={n._id}
                  className={`notification-item ${n.read ? "read" : "unread"}`}
                >
                  <div className="notification-info">
                    <div className="notification-text">
                      <strong>{n.userName}</strong> - {n.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(n.timestamp)}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      className="approve-btn-small"
                      onClick={() => handleApprove(n._id, n.userId)}
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                // In a real app, this would navigate to notifications page
                window.location.hash = '#/admin/notifications';
              }}>
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;