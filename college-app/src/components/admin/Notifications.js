// src/components/admin/Notifications.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Notifications.css";

const Notifications = ({ fullView = false, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(fullView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const adminToken = localStorage.getItem("adminToken");

  const fetchNotifications = useCallback(async () => {
    if (!adminToken) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const list = res.data?.data || [];
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);

      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      onUnreadCountChange?.(unread);
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [adminToken, onUnreadCountChange, API_URL]); // Added API_URL to dependencies

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const originalNotifications = [...notifications];
    
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    onUnreadCountChange?.((prev) => Math.max(prev - 1, 0));

    try {
      await axios.post(
        `${API_URL}/api/notifications/mark-read`,
        { notificationId: id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch {
      // Revert on error
      setNotifications(originalNotifications);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    const originalNotifications = [...notifications];
    
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    const previousUnread = unreadCount;
    setUnreadCount(0);
    onUnreadCountChange?.(0);

    try {
      await axios.post(
        `${API_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch {
      // Revert on error
      setNotifications(originalNotifications);
      setUnreadCount(previousUnread);
      onUnreadCountChange?.(previousUnread);
    }
  };

  const deleteNotification = async (id) => {
    const originalNotifications = [...notifications];
    const notificationToDelete = notifications.find(n => n._id === id);
    
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (!notificationToDelete?.isRead) {
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      onUnreadCountChange?.((prev) => Math.max(prev - 1, 0));
    }

    try {
      await axios.delete(
        `${API_URL}/api/notifications/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch {
      // Revert on error
      setNotifications(originalNotifications);
      if (!notificationToDelete?.isRead) {
        setUnreadCount((prev) => prev + 1);
        onUnreadCountChange?.((prev) => prev + 1);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'warning':
      case 'alert':
        return <span className="notification-icon warning">⚠️</span>;
      case 'success':
        return <span className="notification-icon success">✅</span>;
      case 'info':
      default:
        return <span className="notification-icon info">ℹ️</span>;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  // Full panel view
  if (fullView) {
    return (
      <div className="notifications-full-view">
        <div className="notifications-header">
          <h2>
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="unread-counter">{unreadCount} unread</span>
            )}
          </h2>
          <div className="header-actions">
            <div className="filter-tabs">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === "unread" ? "active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                Unread
              </button>
              <button
                className={`filter-btn ${filter === "read" ? "active" : ""}`}
                onClick={() => setFilter("read")}
              >
                Read
              </button>
            </div>
            <button
              className="icon-btn"
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh"
            >
              {loading ? "🔄" : "↻"}
            </button>
            <button
              className="mark-all-read-btn"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              ✓ Mark all as read
            </button>
          </div>
        </div>

        <div className="notifications-list">
          {loading && (
            <div className="loading-state">
              <div className="spinner">🔄</div>
              <p>Loading notifications...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchNotifications} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <p>No notifications found</p>
              {filter !== "all" && (
                <button
                  className="clear-filter-btn"
                  onClick={() => setFilter("all")}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            filteredNotifications.map((n) => (
              <div
                key={n._id}
                className={`notification-card ${n.isRead ? "read" : "unread"}`}
              >
                <div className="notification-main">
                  {getNotificationIcon(n.type)}
                  <div className="notification-content">
                    <p className="notification-message">{n.message}</p>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(n.createdAt)}
                      </span>
                      {n.type && (
                        <span className={`notification-type ${n.type.toLowerCase()}`}>
                          {n.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="notification-actions">
                  {!n.isRead && (
                    <button
                      className="action-btn read-btn"
                      onClick={() => markAsRead(n._id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteNotification(n._id)}
                    title="Delete notification"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Navbar/dropdown view
  return (
    <div className="notifications-navbar">
      <div className="bell-container" onClick={() => setOpen(!open)}>
        <div className="bell-icon">
          🔔
          {unreadCount > 0 && (
            <span className="badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>

      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="notifications-dropdown">
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <div className="dropdown-actions">
                <button
                  className="icon-btn small"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  title="Mark all as read"
                >
                  ✓
                </button>
                <button
                  className="icon-btn small"
                  onClick={() => setOpen(false)}
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="dropdown-content">
              {loading && (
                <div className="dropdown-loading">
                  <span className="spinner-small">🔄</span>
                  <span>Loading...</span>
                </div>
              )}

              {error && (
                <div className="dropdown-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="dropdown-empty">
                  <div className="empty-icon-small">🔔</div>
                  <p>No notifications yet</p>
                </div>
              )}

              {!loading &&
                !error &&
                notifications.slice(0, 5).map((n) => (
                  <div
                    key={n._id}
                    className={`notification-item ${n.isRead ? "read" : "unread"}`}
                    onClick={() => !n.isRead && markAsRead(n._id)}
                  >
                    <div className="item-icon">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="item-content">
                      <p className="item-message">{n.message}</p>
                      <div className="item-meta">
                        <span className="item-time">
                          {formatTime(n.createdAt)}
                        </span>
                        {!n.isRead && <span className="unread-dot" />}
                      </div>
                    </div>
                    <button
                      className="item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>

            {notifications.length > 5 && (
              <div className="dropdown-footer">
                <a href="/admin/notifications" className="view-all-link">
                  View all notifications →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;