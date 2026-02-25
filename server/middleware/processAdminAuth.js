// backend/middleware/processAdminAuthMiddleware.js
import jwt from 'jsonwebtoken';
import ProcessAdmin from '../models/processAdminModel.js';

export const protectProcessAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token with the same secret used in login
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-2026');
      
      // For hardcoded process admin (no database)
      if (decoded.email === 'process-admin@edutechex.com' && decoded.role === 'process-admin') {
        req.processAdmin = {
          id: 'process-admin-001',
          email: decoded.email,
          role: decoded.role,
          firstName: 'Process',
          lastName: 'Admin'
        };
        return next();
      }
      
      // If you want to use database lookup instead (optional)
      // const processAdmin = await ProcessAdmin.findById(decoded.id).select('-password');
      
      // if (!processAdmin) {
      //   return res.status(401).json({ 
      //     success: false,
      //     message: 'Not authorized' 
      //   });
      // }
      
      // req.processAdmin = processAdmin;
      // next();
      
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized as process admin' 
      });
    } catch (error) {
      console.error('Process admin auth error:', error);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }
};

export const ensureSingleProcessAdmin = async (req, res, next) => {
  try {
    const count = await ProcessAdmin.countDocuments();
    if (count >= 1) {
      return res.status(403).json({ 
        success: false,
        message: 'A Process Admin account already exists. Only one admin is allowed.' 
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};