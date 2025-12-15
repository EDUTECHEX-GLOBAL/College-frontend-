import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getUniversityInfo, getChatResponse, testEndpoint } from './controllers/universityController.js';

// Load environment variables FIRST
dotenv.config();

console.log('\n🔍 ENVIRONMENT VARIABLES CHECK:');
console.log('================================');
console.log('AWS_REGION:', process.env.AWS_REGION || '❌ NOT SET');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ MISSING');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ MISSING');
console.log('PORT:', process.env.PORT || 5001);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('================================\n');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
// 🎓 Legacy university info endpoint (unchanged)
app.post('/api/university-info', getUniversityInfo);

// 💬 New universal chatbot endpoint
app.post('/api/chat-response', getChatResponse);

// 🔍 Optional test endpoint from your controller
app.get('/api/test', testEndpoint);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'University Info API'
  });
});

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    awsRegion: process.env.AWS_REGION || 'not-set',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'University Information API',
    endpoints: {
      getUniversityInfo: {
        method: 'POST',
        path: '/api/university-info',
        body: { universityName: 'University Name' }
      },
      chatResponse: {
        method: 'POST',
        path: '/api/chat-response',
        body: { message: 'Your question or university name', context: 'auto' }
      },
      health: {
        method: 'GET',
        path: '/api/health'
      },
      config: {
        method: 'GET',
        path: '/api/config'
      },
      test: {
        method: 'GET',
        path: '/api/test'
      }
    }
  });
});

// 404 handler - FIXED: Using app.all() instead of app.use()
app.all('*', (req, res) => {
  console.warn(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server started on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`\n📌 Available endpoints:`);
  console.log(`   POST /api/university-info - Get university information`);
  console.log(`   POST /api/chat-response   - Universal chatbot (general + university)`);
  console.log(`   GET  /api/test            - Chatbot capability test`);
  console.log(`   GET  /api/health          - Health check`);
  console.log(`   GET  /api/config          - Configuration`);
  console.log(`   GET  /                    - API documentation`);
});
