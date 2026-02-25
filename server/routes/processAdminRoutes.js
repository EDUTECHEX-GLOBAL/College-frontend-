// backend/routes/processAdminRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Hardcoded credentials (as per manager's requirement)
const PROCESS_ADMIN_EMAIL = "process-admin@edutechex.com";
const PROCESS_ADMIN_PASSWORD = "process-admin@edutechex123";

// Generate JWT Token with id field (to match your middleware)
const generateToken = () => {
  return jwt.sign(
    { 
      id: 'process-admin-001',
      email: PROCESS_ADMIN_EMAIL,
      role: 'process-admin' 
    }, 
    process.env.JWT_SECRET || 'your-secret-key-2026', 
    {
      expiresIn: '7d'
    }
  );
};

// Middleware to verify process admin token
const verifyProcessAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-2026');
    
    if (decoded.email === PROCESS_ADMIN_EMAIL) {
      req.admin = {
        id: decoded.id || 'process-admin-001',
        email: PROCESS_ADMIN_EMAIL,
        role: 'process-admin'
      };
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

// ============= AUTH ROUTES =============

// @desc    Login Process Admin
// @route   POST /api/process-admin/login
// @access  Public
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email });

  if (email === PROCESS_ADMIN_EMAIL && password === PROCESS_ADMIN_PASSWORD) {
    const token = generateToken();
    
    console.log('Login successful, token generated');
    
    return res.json({
      success: true,
      token,
      processAdmin: {
        id: 'process-admin-001',
        email: PROCESS_ADMIN_EMAIL,
        firstName: 'Process',
        lastName: 'Admin',
        role: 'process-admin'
      }
    });
  }

  console.log('Login failed: invalid credentials');
  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. Please contact system administrator.'
  });
});

// @desc    Verify token
// @route   GET /api/process-admin/verify
// @access  Private
router.get('/verify', verifyProcessAdmin, (req, res) => {
  return res.json({
    success: true,
    processAdmin: {
      id: req.admin.id,
      email: req.admin.email,
      firstName: 'Process',
      lastName: 'Admin',
      role: 'process-admin'
    }
  });
});

// @desc    Get current admin profile
// @route   GET /api/process-admin/me
// @access  Private
router.get('/me', verifyProcessAdmin, (req, res) => {
  return res.json({
    success: true,
    processAdmin: {
      id: req.admin.id,
      email: req.admin.email,
      firstName: 'Process',
      lastName: 'Admin',
      role: 'process-admin'
    }
  });
});

// @desc    Logout
// @route   POST /api/process-admin/logout
// @access  Private
router.post('/logout', verifyProcessAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;