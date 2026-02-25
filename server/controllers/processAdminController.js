import ProcessAdmin from '../models/processAdminModel.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login Process Admin
// @route   POST /api/process-admin/login
// @access  Public
export const loginProcessAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find admin by email
    const processAdmin = await ProcessAdmin.findOne({ email: email.toLowerCase() });

    if (!processAdmin) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await processAdmin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    processAdmin.lastLogin = Date.now();
    await processAdmin.save();

    // Generate token
    const token = generateToken(processAdmin._id);

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

// @desc    Get current process admin profile
// @route   GET /api/process-admin/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const processAdmin = await ProcessAdmin.findById(req.processAdmin._id).select('-password');
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

// @desc    Logout process admin
// @route   POST /api/process-admin/logout
// @access  Private
export const logoutProcessAdmin = (req, res) => {
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
};

// @desc    Change password
// @route   POST /api/process-admin/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const processAdmin = await ProcessAdmin.findById(req.processAdmin._id);
    
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

// @desc    Setup Process Admin (creates default admin if none exists)
// @route   POST /api/process-admin/setup
// @access  Public
export const setupProcessAdmin = async (req, res) => {
  try {
    // Check if any process admin exists
    const adminExists = await ProcessAdmin.findOne();
    
    if (adminExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Process Admin already exists' 
      });
    }

    // Create default process admin
    const processAdmin = new ProcessAdmin({
      email: 'process-admin@edutechex.com',
      password: 'process-admin@edutechex123',
      firstName: 'Process',
      lastName: 'Admin'
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