import jwt from 'jsonwebtoken';

// Hardcoded admin info (for token verification)
const HARDCODED_ADMIN = {
  email: 'admin@edutechex.com',
  name: 'Super Admin',
  role: 'super_admin'
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, admin access denied',
      });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret);

    // Check if this is an admin token (has role property)
    if (!decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token',
      });
    }

    // Check if email matches hardcoded admin
    if (decoded.email !== HARDCODED_ADMIN.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin account',
      });
    }

    // Attach admin info to request
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token. Please login again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Admin authentication failed',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated as admin',
        });
      }

      if (!roles.includes(req.admin.role)) {
        return res.status(403).json({
          success: false,
          message: `Role ${req.admin.role} is not authorized`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

export default authenticateAdmin;