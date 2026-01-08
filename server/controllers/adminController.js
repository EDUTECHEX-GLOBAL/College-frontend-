import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

// Hardcoded admin credentials
const HARDCODED_ADMIN = {
  email: 'admin@edutechex.com',
  password: 'admin@edutechex123',
  name: 'Super Admin',
  role: 'super_admin'
};

// Generate JWT Token
const generateToken = (adminData) => {
  return jwt.sign(
    {
      id: 'admin-001', // Static ID since no database
      email: adminData.email,
      name: adminData.name,
      role: adminData.role
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '24h' }
  );
};

// Admin Login - SIMPLIFIED (No Database)
export const loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check against hardcoded credentials
    if (email !== HARDCODED_ADMIN.email || password !== HARDCODED_ADMIN.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(HARDCODED_ADMIN);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: 'admin-001',
        email: HARDCODED_ADMIN.email,
        name: HARDCODED_ADMIN.name,
        role: HARDCODED_ADMIN.role,
        lastLogin: new Date()
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Admin Profile (No database lookup needed)
export const getAdminProfile = async (req, res) => {
  try {
    // req.admin is set by authenticateAdmin middleware
    const admin = req.admin;
    
    res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: new Date()
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Remove database-dependent functions or simplify them
export const logoutAdmin = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully'
  });
};

// Update Admin Profile (simplified - only name can be changed)
export const updateAdminProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Update hardcoded admin name
    HARDCODED_ADMIN.name = name;

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully',
      admin: {
        id: 'admin-001',
        email: HARDCODED_ADMIN.email,
        name: HARDCODED_ADMIN.name,
        role: HARDCODED_ADMIN.role
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Change Password (update hardcoded password)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check current password
    if (currentPassword !== HARDCODED_ADMIN.password) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    HARDCODED_ADMIN.password = newPassword;

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Remove the createInitialAdmin function since we don't need setup
export const createInitialAdmin = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Admin already exists. Use admin@edutechex.com / admin@edutechex123'
  });
};