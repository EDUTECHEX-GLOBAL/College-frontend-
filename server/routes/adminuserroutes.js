import express from "express";
import Account from "../models/accountModel.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// 🛡️ Protect all admin routes
router.use(authenticateAdmin);

// Validation middleware
const validateUser = (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (req.method === "POST" || req.method === "PUT") {
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: "First name, last name and email are required" });
    }

    if (req.method === "POST" && !password) {
      return res.status(400).json({ success: false, message: "Password is required for new users" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
  }

  next();
};

// Validation for status update
const validateStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['active', 'inactive', 'suspended'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "Valid status is required (active, inactive, or suspended)" 
    });
  }
  next();
};

// Validation for role update
const validateRole = (req, res, next) => {
  const { role } = req.body;
  const validRoles = ['user', 'admin', 'moderator'];
  
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: "Valid role is required (user, admin, or moderator)" 
    });
  }
  next();
};

// =======================================
// 👥 ADMIN USER ROUTES
// =======================================

// Get all users with filtering
router.get("/", async (req, res) => {
  try {
    const { search, role, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const users = await Account.find(filter).select("-password");
    
    // Calculate statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });
    
    res.status(200).json({ 
      success: true, 
      count: users.length, 
      users,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin get users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await Account.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("❌ Admin get user by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

// Create new user
router.post("/", validateUser, async (req, res) => {
  try {
    const { firstName, lastName, email, password, studentType, role = 'user', status = 'active' } = req.body;

    const existingUser = await Account.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ success: false, message: "Email already exists" });

    const newUser = await Account.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      studentType: studentType || "first-year",
      role,
      status,
      isVerified: true
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Calculate updated statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });

    res.status(201).json({ 
      success: true, 
      message: "User created successfully", 
      user: userResponse,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin create user error:", error);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
});

// Update user (general update)
router.put("/:id", validateUser, async (req, res) => {
  try {
    const { firstName, lastName, email, role, status } = req.body;

    const updateData = {
      firstName,
      lastName,
      email: email.toLowerCase()
    };

    // Add role and status if provided
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedUser = await Account.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    // Calculate updated statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });

    res.status(200).json({ 
      success: true, 
      message: "User updated successfully", 
      user: updatedUser,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin update user error:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

// Update user status - NEW ENDPOINT
router.patch("/:id/status", validateStatus, async (req, res) => {
  try {
    const { status } = req.body;

    const updatedUser = await Account.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    // Calculate updated statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });

    res.status(200).json({ 
      success: true, 
      message: `User status updated to ${status} successfully`, 
      user: updatedUser,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin update user status error:", error);
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
});

// Update user role - NEW ENDPOINT
router.patch("/:id/role", validateRole, async (req, res) => {
  try {
    const { role } = req.body;

    const updatedUser = await Account.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    // Calculate updated statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });

    res.status(200).json({ 
      success: true, 
      message: `User role updated to ${role} successfully`, 
      user: updatedUser,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin update user role error:", error);
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
});

// Approve user - NEW ENDPOINT
router.patch("/:id/approve", async (req, res) => {
  try {
    const updatedUser = await Account.findByIdAndUpdate(
      req.params.id,
      { status: 'active', isVerified: true },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    // Calculate updated statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });

    res.status(200).json({ 
      success: true, 
      message: "User approved successfully", 
      user: updatedUser,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin approve user error:", error);
    res.status(500).json({ success: false, message: "Failed to approve user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await Account.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });

    // Calculate updated statistics
    const totalUsers = await Account.countDocuments();
    const activeUsers = await Account.countDocuments({ status: 'active' });
    const adminUsers = await Account.countDocuments({ role: 'admin' });

    res.status(200).json({ 
      success: true, 
      message: "User deleted successfully",
      stats: {
        totalUsers,
        activeUsers,
        adminUsers
      }
    });
  } catch (error) {
    console.error("❌ Admin delete user error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

export default router;