import express from 'express';
import { body } from 'express-validator';
import {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  updateAdminProfile,
  changePassword,
  createInitialAdmin
} from '../controllers/adminController.js';
import { authenticateAdmin, authorize } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Validation middleware
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/login', loginValidation, loginAdmin);
router.post('/setup', createInitialAdmin); // Keep it but it will just return message

// Protected routes - require admin authentication
router.use(authenticateAdmin); // All routes below require admin authentication

router.get('/profile', getAdminProfile);
router.post('/logout', logoutAdmin);
router.put('/profile', updateAdminProfile);
router.put('/change-password', changePassword);

// Super admin only routes
router.use(authorize('super_admin'));
// Add super admin routes here

export default router;