import Notification from "../models/notificationModel.js";
import Account from "../models/accountModel.js";

/**
 * 🔔 Create notification for admin (used on new user registration)
 */
export const createNewUserNotification = async (user) => {
  try {
    if (!user?._id) return false;

    await Notification.create({
      type: "NEW_USER",
      title: "New User Registration",
      message: `${user.firstName || ""} ${user.lastName || ""} has registered`,
      userId: user._id,
      targetRole: "admin",
      isRead: false,
    });

    console.log(`🔔 Notification created for admin: ${user.email}`);
    return true;
  } catch (error) {
    console.error("❌ Notification creation failed:", error);
    return false;
  }
};

/**
 * ✅ Admin: Fetch notifications (all, with unread count)
 */
export const getAdminNotifications = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const notifications = await Notification.find({ targetRole: "admin" })
      .sort({ createdAt: -1 })
      .populate("userId", "email firstName lastName status");

    if (req.query.markRead === "true") {
      await Notification.updateMany({ targetRole: "admin", isRead: false }, { isRead: true });
    }

    res.status(200).json({
      success: true,
      data: notifications,
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error("❌ Failed to fetch notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

/**
 * ✅ Approve user from notification
 */
export const approveUserFromNotification = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    const user = await Account.findByIdAndUpdate(userId, { status: "approved" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User approved successfully", user });
  } catch (error) {
    console.error("❌ Approve user failed:", error);
    res.status(500).json({ success: false, message: "Failed to approve user" });
  }
};

/**
 * ✅ Student: Get their notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const unread = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({ success: true, notifications, total: notifications.length, unread });
  } catch (error) {
    console.error("❌ Failed to fetch user notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

/**
 * ✅ Mark a notification as read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user?.userId;

    if (!userId || !notificationId) return res.status(400).json({ success: false, message: "Invalid request" });

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("❌ Mark as read failed:", error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};
