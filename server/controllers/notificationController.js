import Notification from "../models/notificationModel.js";
import Account from "../models/accountModel.js";

// ─────────────────────────────────────────────
// 🔔 Helpers: Create Notifications (internal use)
// ─────────────────────────────────────────────

/**
 * Create notification for admin on new user registration
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
 * Create notification for admin on university request
 */
export const createUniversityRequestNotification = async ({
  userId,
  universityName,
  country,
  courses,
}) => {
  try {
    if (!userId) return false;
    await Notification.create({
      type: "UNIVERSITY_REQUEST",
      title: "New University Request",
      message: `A student has requested to add "${universityName}" (${country}). Interested courses: ${courses.join(", ")}`,
      userId,
      targetRole: "admin",
      isRead: false,
    });
    console.log(`🔔 University request notification created for admin: ${universityName}`);
    return true;
  } catch (error) {
    console.error("❌ University request notification failed:", error);
    return false;
  }
};

// ─────────────────────────────────────────────
// ✅ Admin: Notifications CRUD
// ─────────────────────────────────────────────

/**
 * GET /api/notifications
 * Fetch all admin notifications with unread count
 */
export const getAdminNotifications = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const notifications = await Notification.find({ targetRole: "admin" })
      .sort({ createdAt: -1 })
      .populate("userId", "email firstName lastName status");

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
 * POST /api/notifications/mark-read
 * Mark a single admin notification as read
 */
export const markNotificationRead = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ success: false, message: "notificationId is required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, targetRole: "admin" },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("❌ Mark as read failed:", error);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
};

/**
 * POST /api/notifications/mark-all-read
 * Mark all admin notifications as read
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const result = await Notification.updateMany(
      { targetRole: "admin", isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Mark all as read failed:", error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification (admin)
 */
export const deleteNotification = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Notification ID is required" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      targetRole: "admin",
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("❌ Delete notification failed:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

/**
 * POST /api/notifications/send-to-user
 * Admin sends a notification directly to a student (approve/reject university request etc.)
 *
 * Body: { userId, type, title, message }
 *
 * NOTE: `type` must be a valid enum from notificationModel.js
 * Currently supported: "UNIVERSITY_APPROVED" | "UNIVERSITY_REJECTED"
 * → Make sure these are added to the model enum (see notificationModel.js fix below)
 */
export const sendNotificationToUser = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const { userId, type, title, message } = req.body;

    if (!userId)   return res.status(400).json({ success: false, message: "userId is required" });
    if (!type)     return res.status(400).json({ success: false, message: "type is required" });
    if (!title)    return res.status(400).json({ success: false, message: "title is required" });
    if (!message)  return res.status(400).json({ success: false, message: "message is required" });

    // Verify target user exists
    const userExists = await Account.findById(userId).select("_id");
    if (!userExists) {
      return res.status(404).json({ success: false, message: "Target user not found" });
    }

    const notification = await Notification.create({
      type,
      title,
      message,
      userId,
      targetRole: "student",
      isRead: false,
    });

    console.log(`🔔 Notification sent to user ${userId}: [${type}] ${title}`);

    res.status(201).json({
      success: true,
      message: "Notification sent to user successfully",
      notification,
    });
  } catch (error) {
    // Return clear message if `type` fails enum validation
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: `Validation error: ${msg}` });
    }
    console.error("❌ Send notification to user failed:", error);
    res.status(500).json({ success: false, message: "Failed to send notification to user" });
  }
};

// ─────────────────────────────────────────────
// ✅ Admin: User Management from Notification
// ─────────────────────────────────────────────

/**
 * POST /api/notifications/approve-user
 */
export const approveUserFromNotification = async (req, res) => {
  try {
    if (!req.admin || !["admin", "super_admin"].includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const user = await Account.findByIdAndUpdate(
      userId,
      { status: "approved" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User approved successfully", user });
  } catch (error) {
    console.error("❌ Approve user failed:", error);
    res.status(500).json({ success: false, message: "Failed to approve user" });
  }
};

// ─────────────────────────────────────────────
// ✅ Student: Notifications
// ─────────────────────────────────────────────

/**
 * GET /api/user/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const unread = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      notifications,
      total: notifications.length,
      unread,
    });
  } catch (error) {
    console.error("❌ Failed to fetch user notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};