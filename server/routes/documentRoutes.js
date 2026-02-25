import express from 'express';
import { 
  uploadDocument, 
  validateDocument, 
  getUserDocuments, 
  getUserMarksheets,
  getDocument, 
  deleteDocument, 
  updateDocumentStatus,
  updateMarksheetDetails,
  getDocumentStats,
  getAllDocuments,
  updateDocumentReview,
  getAdminDocumentStats,
  getAdminDocument,
  testAdminEndpoint,
  // IMPORT NEW FUNCTIONS
  sendDocumentCorrectionRequest,
  getIncompleteApplications,
  sendDocumentEmail,
  sendAllDocumentsEmail
} from '../controllers/documentController.js';
import { generateStudentPDF } from '../controllers/pdfGeneratorController.js';
import { documentUpload } from '../middleware/documentUploadMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // ✅ Changed from protect
import { authenticateAdmin } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

console.log('📋 Document routes loading...');

// ============ PUBLIC TEST ROUTE ============
router.get('/test-public', (req, res) => {
  console.log('✅ Public test route called');
  res.json({
    success: true,
    message: 'Public test route works!',
    timestamp: new Date().toISOString()
  });
});

// ============ ADMIN ROUTES ============
// IMPORTANT: Admin routes come BEFORE router.use(authenticateToken)
router.get('/admin/test', authenticateAdmin, testAdminEndpoint);
console.log('✅ Registered: GET /admin/test');

router.get('/admin/all', authenticateAdmin, getAllDocuments);
console.log('✅ Registered: GET /admin/all');

router.get('/admin/:id', authenticateAdmin, getAdminDocument);
console.log('✅ Registered: GET /admin/:id');

// Document review with email notifications
router.put('/admin/:id/review', authenticateAdmin, updateDocumentReview);
console.log('✅ Registered: PUT /admin/:id/review');

// Send correction email manually
router.post('/admin/:id/send-correction', authenticateAdmin, sendDocumentCorrectionRequest);
console.log('✅ Registered: POST /admin/:id/send-correction');

// Send single document via email
router.post('/admin/send-email', authenticateAdmin, sendDocumentEmail);
console.log('✅ Registered: POST /admin/send-email');

// Send all documents via email
router.post('/admin/send-bulk-email', authenticateAdmin, sendAllDocumentsEmail);
console.log('✅ Registered: POST /admin/send-bulk-email');

// Get incomplete applications
router.get('/admin/applications/incomplete', authenticateAdmin, getIncompleteApplications);
console.log('✅ Registered: GET /admin/applications/incomplete');

router.get('/admin/stats', authenticateAdmin, getAdminDocumentStats);
console.log('✅ Registered: GET /admin/stats');

// PDF generation route
router.get('/admin/generate-pdf/:studentId', authenticateAdmin, generateStudentPDF);
console.log('✅ Registered: GET /admin/generate-pdf/:studentId');

// ============ REGULAR USER ROUTES ============
// Apply authenticateToken middleware to ALL user routes
router.use(authenticateToken); // ✅ Changed from protect

// Student routes
router.post('/upload', documentUpload.single('document'), uploadDocument);
console.log('✅ Registered: POST /upload');

router.post('/validate', documentUpload.single('document'), validateDocument);
console.log('✅ Registered: POST /validate');

router.get('/', getUserDocuments);
console.log('✅ Registered: GET /');

router.get('/marksheets', getUserMarksheets);
console.log('✅ Registered: GET /marksheets');

router.get('/stats', getDocumentStats);
console.log('✅ Registered: GET /stats');

router.get('/:id', getDocument);
console.log('✅ Registered: GET /:id');

router.delete('/:id', deleteDocument);
console.log('✅ Registered: DELETE /:id');

// Update routes
router.put('/:id/status', updateDocumentStatus);
console.log('✅ Registered: PUT /:id/status');

router.put('/:id/marksheet-details', updateMarksheetDetails);
console.log('✅ Registered: PUT /:id/marksheet-details');

// ============ DEBUG: Print all registered routes ============
console.log('\n📊 Document Routes Summary:');
const registeredRoutes = [];
router.stack.forEach((layer) => {
  if (layer.route) {
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    registeredRoutes.push({ methods, path });
  }
});

// Sort and display
registeredRoutes.sort((a, b) => a.path.localeCompare(b.path));
registeredRoutes.forEach(route => {
  console.log(`   ${route.methods.padEnd(6)} ${route.path}`);
});

console.log(`\n✅ Total document routes registered: ${registeredRoutes.length}`);
console.log('🎉 Document routes loaded successfully!\n');

export default router;