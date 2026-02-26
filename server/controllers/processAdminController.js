import ProcessAdmin from '../models/processAdminModel.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

/* ======================================================
   🔐 Generate JWT Token (FIXED VERSION)
   ====================================================== */
const generateToken = (processAdmin) => {
  return jwt.sign(
    {
      id: processAdmin._id,
      role: processAdmin.role,
      email: processAdmin.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/* ======================================================
   @desc    Login Process Admin
   @route   POST /api/process-admin/login
   @access  Public
   ====================================================== */
export const loginProcessAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const processAdmin = await ProcessAdmin.findOne({
      email: email.toLowerCase()
    });

    if (!processAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await processAdmin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    processAdmin.lastLogin = Date.now();
    await processAdmin.save();

    // ✅ FIXED: pass entire object
    const token = generateToken(processAdmin);

    res.json({
      success: true,
      token,
      processAdmin: {
        id: processAdmin._id,
        email: processAdmin.email,
        firstName: processAdmin.firstName,
        lastName: processAdmin.lastName,
        role: processAdmin.role,
        lastLogin: processAdmin.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/* ======================================================
   @desc    Get current process admin profile
   @route   GET /api/process-admin/me
   @access  Private
   ====================================================== */
export const getMe = async (req, res) => {
  try {
    const processAdmin = await ProcessAdmin
      .findById(req.processAdmin.id)
      .select('-password');

    res.json({
      success: true,
      processAdmin
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/* ======================================================
   @desc    Logout process admin
   @route   POST /api/process-admin/logout
   @access  Private
   ====================================================== */
export const logoutProcessAdmin = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

/* ======================================================
   @desc    Change password
   @route   POST /api/process-admin/change-password
   @access  Private
   ====================================================== */
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const processAdmin = await ProcessAdmin.findById(req.processAdmin.id);

    const isMatch = await processAdmin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    processAdmin.password = newPassword;
    await processAdmin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/* ======================================================
   @desc    Setup Process Admin (Only if none exists)
   @route   POST /api/process-admin/setup
   @access  Public
   ====================================================== */
export const setupProcessAdmin = async (req, res) => {
  try {
    const adminExists = await ProcessAdmin.findOne();

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Process Admin already exists'
      });
    }

    const processAdmin = new ProcessAdmin({
      email: 'process-admin@edutechex.com',
      password: 'process-admin@edutechex123',
      firstName: 'Process',
      lastName: 'Admin',
      role: 'process-admin' // ✅ Ensure role exists
    });

    await processAdmin.save();

    res.json({
      success: true,
      message: 'Process Admin created successfully',
      credentials: {
        email: processAdmin.email,
        password: 'process-admin@edutechex123'
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};