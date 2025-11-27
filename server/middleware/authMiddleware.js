import jwt from 'jsonwebtoken';

/**
 * 🔐 Authentication Middleware
 * Verifies JWT token and attaches user info to req.user
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer TOKEN format)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔐 Auth Middleware - Checking token...');
    console.log('📦 Endpoint:', `${req.method} ${req.originalUrl}`);
    console.log('📦 Auth Header present:', !!authHeader);
    console.log('📦 Token present:', !!token);

    if (!token) {
      console.log(`⚠️  No token for: ${req.method} ${req.originalUrl}`);

      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied',
      });
    }

    console.log('🔑 Token found, verifying...');
    console.log('📝 Token (first 30 chars):', token.substring(0, 30) + '...');

    // Use same secret as generateToken function
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  WARNING: JWT_SECRET not found in .env file!');
      console.warn('   Using fallback secret: "your-secret-key-change-in-production"');
      console.warn('   Make sure this matches the secret used in generateToken()');
    } else {
      console.log('🔑 JWT_SECRET loaded from .env: Yes ✅');
    }

    // Verify token with secret
    const decoded = jwt.verify(token, jwtSecret);

    console.log('✅ Token verified successfully!');
    console.log('👤 Decoded user ID:', decoded.id);
    console.log('📧 Decoded email:', decoded.email);
    console.log('📝 Decoded username:', decoded.username);

    // Attach user info to request object
    req.user = decoded;
    req.userId = decoded.id; // Easier access in controllers

    console.log('✅ User authenticated and attached to request - ID:', req.userId);

    next();
  } catch (error) {
    console.log(`⚠️  Auth error on: ${req.method} ${req.originalUrl}`);
    console.error('❌ Auth middleware error:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);

    if (process.env.NODE_ENV === 'development') {
      console.error('   Stack:', error.stack);
    }

    if (error.name === 'TokenExpiredError') {
      console.error('⏰ Token expired at:', error.expiredAt);
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please sign in again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      console.error('🔑 JWT Error - Token signature is invalid');
      console.error('   💡 This usually means:');
      console.error('      1. JWT_SECRET mismatch between token creation and verification');
      console.error('      2. Token was tampered with');
      console.error('      3. Token format is incorrect');
      console.error('   🔧 Solution: Clear localStorage and sign in again');

      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please sign in again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    console.error('⚠️  Unknown auth error:', error.name);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please sign in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * 🔐 Default export for backward compatibility
 */
const authMiddleware = authenticateToken;
export default authMiddleware;