// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { S3Client, HeadBucketCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import connectDB from "./config/db.js";
import accountRoutes from "./routes/accountRoutes.js";
import educationRoutes from "./routes/educationRoutes.js";
import collegesearchRoutes from "./routes/collegesearchRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import generalRoutes from "./routes/generalRoutes.js";
import firstAcademicRoutes from './routes/FirstAcademicRoutes.js';
import highSchoolCurriculumRoutes from "./routes/highSchoolCurriculumRoutes.js";
import firstactivitiesRoutes from "./routes/firstmycollegeactivitiesRoutes.js";
import firstContactsRoutes from "./routes/firstContactsRoutes.js";
import firstFamilyRoutes from "./routes/firstFamilyRoutes.js";
import firstResidencyRoutes from "./routes/FirstResidencyRoutes.js";
import internationalStudentRoutes from "./routes/InternationalStudentRoutes.js";
import firstReviewRoutes from "./routes/FirstReviewRoutes.js";
import firstTestingRoutes from "./routes/firstTestingRoutes.js";
import transferActivitiesRoutes from "./routes/activitiestestRoutes.js";
import firstYearActivitiesRoutes from "./routes/activitiesRoutes.js";
import responsibilitiesRoutes from "./routes/responsibilitiesRoutes.js";
import writingRoutes from "./routes/writingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";           // ✅ Handles ALL /api/admin/* routes
import transferRoutes from "./routes/transferRoutes.js";
import extendedProfileRoutes from "./routes/extendedProfileRoutes.js";
import familyRoutes from "./routes/familytestRoutes.js";
import educationtestRoutes from "./routes/educationtestRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import writingtestRoutes from "./routes/writingtestRoutes.js";
import firstfamilydashbRoutes from "./routes/firstfamilydashbRoutes.js";
import adminUserRoutes from "./routes/adminuserroutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import courseRoutes from "./routes/courseroutes.js";
import firstApplicationRoutes from "./routes/firstApplicationRoutes.js";
import overviewRoutes from "./routes/overviewRoutes.js";
import applicationPersonalRoutes from "./routes/applicationPersonalRoutes.js";
import applicationAddressRoutes from "./routes/applicationAddressRoutes.js";
import applicationEducationRoutes from "./routes/applicationEducationRoutes.js";
import applicationLanguageRoutes from "./routes/applicationLanguageRoutes.js";
import applicationDocumentRoutes from "./routes/applicationDocumentRoutes.js";
import adminUniversityRoutes from "./routes/adminUniversityRoutes.js";
import bachelorsRoutes from "./routes/bachelorsRoutes.js";
import mastersRoutes from './routes/mastersRoutes.js';
import userProfileRoutes from "./routes/userprofileroutes.js";
import applicationSpecialNeedRoutes from "./routes/applicationSpecialNeedRoutes.js";
import processAdminRoutes from "./routes/processAdminRoutes.js";
import processAdminDocumentRoutes from "./routes/processAdminDocumentRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import previewRoutes from './routes/applicationPreviewRoutes.js';
import applicationScoreRoutes from "./routes/applicationscoreroutes.js";
import gusUniversityRoutes from "./routes/gusuniversityroutes.js";
import analyticsRoutes from './routes/studentanalyticsroutes.js';

dotenv.config();

// =====================================================
// INITIALIZE
// =====================================================
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// S3 CLIENT SETUP
// =====================================================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const checkS3Connection = async () => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ S3 Bucket Connected: ${BUCKET_NAME}`);
    return true;
  } catch (err) {
    console.error(`❌ S3 Bucket Connection Failed!`);
    console.error(`   → Error   : ${err.message}`);
    console.error(`   → Code    : ${err.Code || err.code}`);
    console.error(`   → Bucket  : ${BUCKET_NAME}`);
    console.error(`   → Region  : ${process.env.AWS_REGION}`);
    console.error(`   → Key Set : ${!!process.env.AWS_ACCESS_KEY_ID}`);
    console.error(`   → Secret  : ${!!process.env.AWS_SECRET_ACCESS_KEY}`);
    return false;
  }
};

// =====================================================
// CONNECT TO DB
// =====================================================
connectDB();

// =====================================================
// CORS
// =====================================================
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:4200"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// =====================================================
// BODY PARSER
// =====================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// =====================================================
// REQUEST LOGGING
// =====================================================
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Bearer [PRESENT]' : 'None',
    'content-type': req.headers['content-type']
  });
  next();
});

// =====================================================
// STATIC: /uploads — local first, S3 fallback
// =====================================================
const uploadsLocalPath = path.join(__dirname, 'uploads');
const uploadsAltPath   = path.join(process.cwd(), 'uploads');
const uploadsDir       = fs.existsSync(uploadsLocalPath)
  ? uploadsLocalPath
  : fs.existsSync(uploadsAltPath) ? uploadsAltPath : null;

if (uploadsDir) {
  console.log('📁 Local uploads folder found at:', uploadsDir);
  app.use('/uploads', express.static(uploadsDir));
  console.log('✅ Serving local uploads from disk');
} else {
  console.log('⚠️  No local uploads folder — /uploads requests will redirect to S3');
}

app.use('/uploads', (req, res) => {
  const s3Key = req.path.replace(/^\//, '');
  const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  console.log(`🔀 Redirecting to S3: /uploads${req.path} → ${s3Url}`);
  return res.redirect(302, s3Url);
});

// =====================================================
// S3 FILE PROXY
// =====================================================
app.use('/api/files', async (req, res) => {
  try {
    const s3Key = req.path.replace(/^\//, '');
    if (!s3Key) return res.status(400).json({ success: false, message: 'No file key provided' });

    console.log(`📥 Proxying S3 file: ${s3Key}`);
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const s3Response = await s3.send(command);

    const fileName = s3Key.split('/').pop();
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
      'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const contentType = s3Response.ContentType && s3Response.ContentType !== 'application/octet-stream'
      ? s3Response.ContentType : (mimeTypes[ext] || 'application/octet-stream');

    res.setHeader('Content-Type', contentType);
    const isPreviewable = ['pdf','jpg','jpeg','png','webp','gif'].includes(ext);
    res.setHeader('Content-Disposition', isPreviewable
      ? `inline; filename="${fileName}"` : `attachment; filename="${fileName}"`);
    if (s3Response.ContentLength) res.setHeader('Content-Length', s3Response.ContentLength);
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-cache');
    s3Response.Body.pipe(res);
  } catch (err) {
    console.error('❌ S3 file proxy error:', err.message);
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404)
      return res.status(404).json({ success: false, message: 'File not found' });
    return res.status(500).json({ success: false, message: 'Failed to load file' });
  }
});

// =====================================================
// STATIC: /logos
// =====================================================
const logosPath = path.join(__dirname, "public", "logos");
const altLogosPath = path.join(process.cwd(), "public", "logos");
if (fs.existsSync(logosPath)) {
  app.use("/logos", express.static(logosPath));
} else if (fs.existsSync(altLogosPath)) {
  app.use("/logos", express.static(altLogosPath));
}

// =====================================================
// DEBUG ENDPOINTS
// =====================================================
app.get('/api/test', (req, res) =>
  res.json({ success: true, message: '✅ API is working', timestamp: new Date().toISOString() })
);

app.get('/api/debug/s3', async (req, res) => {
  const connected = await checkS3Connection();
  res.json({
    connected, bucket: BUCKET_NAME, region: process.env.AWS_REGION,
    accessKeySet: !!process.env.AWS_ACCESS_KEY_ID,
    secretKeySet: !!process.env.AWS_SECRET_ACCESS_KEY,
    message: connected ? '✅ S3 is working correctly' : '❌ S3 connection failed',
  });
});

app.get('/api/debug/s3/:key', (req, res) => {
  const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.params.key}`;
  res.json({ key: req.params.key, bucket: BUCKET_NAME, region: process.env.AWS_REGION, s3Url });
});

app.get('/api/routes', (req, res) => {
  const routes = [];
  const extractRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        routes.push({ path: basePath + layer.route.path, methods: Object.keys(layer.route.methods).join(', ').toUpperCase() });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = basePath + (layer.regexp.source
          .replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/').replace(/\^/g, '').replace(/\?/g, '')
          .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param'));
        extractRoutes(layer.handle.stack, routerPath);
      }
    });
  };
  extractRoutes(app._router.stack);
  res.json({
    success: true,
    routes: routes.filter(r =>
      r.path.includes('/api/admin') || r.path.includes('/api/user') ||
      r.path.includes('/api/analytics') || r.path === '/api/test' || r.path === '/api/routes'
    ).sort((a, b) => a.path.localeCompare(b.path))
  });
});

// =====================================================
// ✅ ADMIN ROUTES — mounted FIRST, before everything else
//
// ❌ WHAT WAS BROKEN (old code had this):
//      app.post('/api/admin/login', adminLogin);
//    `adminLogin` was NEVER imported → calling undefined as
//    middleware crashed every login request with 401/500.
//
// ✅ THE FIX: Just mount adminRoutes here. The /login route
//    is already defined as PUBLIC inside adminRoutes.js
//    (it appears before authenticateAdmin middleware in that file).
// =====================================================
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin", adminUniversityRoutes);
console.log('✅ Admin routes mounted at /api/admin');

// =====================================================
// USER ROUTES
// =====================================================
console.log('📌 Mounting user routes at /api/user...');
app.use("/api/user", userProfileRoutes);
console.log('✅ User routes mounted');

// =====================================================
// PROCESS ADMIN ROUTES
// =====================================================
console.log('📌 Mounting process admin routes...');
app.use("/api/process-admin/documents", processAdminDocumentRoutes);
app.use("/api/process-admin", processAdminRoutes);
console.log('✅ Process admin routes mounted');

// =====================================================
// ANALYTICS
// =====================================================
app.use('/api/analytics', analyticsRoutes);
console.log('✅ Analytics routes mounted at /api/analytics');

// =====================================================
// ALL OTHER API ROUTES
// =====================================================
console.log('📌 Mounting remaining API routes...');

app.use("/api/students", accountRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/college-search", collegesearchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/application/education", applicationEducationRoutes);
app.use("/api/application/language", applicationLanguageRoutes);
app.use("/api/application/documents", applicationDocumentRoutes);
app.use("/api/application/special-needs", applicationSpecialNeedRoutes);
app.use("/api/application/resume", resumeRoutes);
app.use("/api/application/personal", applicationPersonalRoutes);
app.use("/api/application/address", applicationAddressRoutes);
app.use('/api/application/preview', previewRoutes);
app.use("/api/application/score", applicationScoreRoutes);
app.use("/api/application/process-admin/gus-university", gusUniversityRoutes);
app.use("/api/bachelors", bachelorsRoutes);
app.use('/api/masters/universities', mastersRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/general", generalRoutes);
app.use("/api/academics", firstAcademicRoutes);
app.use("/api/high-school-curriculum", highSchoolCurriculumRoutes);
app.use("/api/first-activities", firstactivitiesRoutes);
app.use("/api/contacts", firstContactsRoutes);
app.use("/api/family", firstFamilyRoutes);
app.use("/api/residency", firstResidencyRoutes);
app.use("/api/first-application", firstApplicationRoutes);
app.use("/api/international", internationalStudentRoutes);
app.use("/api/review", firstReviewRoutes);
app.use("/api/students/testing", firstTestingRoutes);
app.use("/api/students", firstYearActivitiesRoutes);
app.use("/api/transfer", transferActivitiesRoutes);
app.use("/api/students", responsibilitiesRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/writing", writingRoutes);
app.use("/api/students/family-dashb", firstfamilydashbRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/profile", extendedProfileRoutes);
app.use("/api/family-background", familyRoutes);
app.use("/api/education-transfer", educationtestRoutes);
app.use("/api/testing", testRoutes);
app.use("/api/writingtest", writingtestRoutes);

console.log('✅ All API routes mounted successfully');

// =====================================================
// ROOT & HEALTH ENDPOINTS
// =====================================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduTechEx API is running...",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    storage: { type: "AWS S3", bucket: BUCKET_NAME, region: process.env.AWS_REGION },
    adminRoutes: {
      login:          "POST /api/admin/login            (public)",
      profile:        "GET  /api/admin/profile          (protected)",
      logout:         "POST /api/admin/logout           (protected)",
      changePassword: "PUT  /api/admin/change-password  (protected)",
    },
    analyticsRoutes: {
      stats:    "GET /api/analytics/stats",
      profiles: "GET /api/analytics/profiles",
      detail:   "GET /api/analytics/profiles/:userId",
    },
    processAdminRoutes: {
      documents:   "/api/process-admin/documents/all",
      stats:       "/api/process-admin/stats",
      generatePDF: "/api/process-admin/generate-pdf/:studentId",
    },
    userRoutes: {
      test:    "/api/user/test",
      profile: "/api/user/profile",
      status:  "/api/user/profile/status",
      image:   "/api/user/profile/image",
    }
  });
});

app.get("/api/health", async (req, res) => {
  const s3Connected = await checkS3Connection();
  res.status(200).json({
    success: true, message: "Server is healthy",
    uptime: process.uptime(), timestamp: new Date().toISOString(),
    services: { api: "Running", s3: s3Connected ? `Connected (${BUCKET_NAME})` : "❌ Disconnected" }
  });
});

app.get("/api/status", (req, res) =>
  res.status(200).json({
    success: true, message: "All systems operational",
    services: { database: "Connected", api: "Running", cors: "Enabled", storage: `AWS S3 (${BUCKET_NAME})` },
    timestamp: new Date().toISOString(),
  })
);

// =====================================================
// 404 HANDLER
// =====================================================
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: "Check available routes via '/api/routes' or '/'",
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  console.error("\n🔴 GLOBAL ERROR CAUGHT:");
  console.error("   Message     :", err.message);
  console.error("   Name        :", err.name);
  console.error("   Code        :", err.code || err.Code);
  console.error("   HTTP Status :", err.$metadata?.httpStatusCode || err.status);
  if (err.storageErrors?.length)
    console.error("   StorageErrors:", JSON.stringify(err.storageErrors, null, 2));
  console.error("   Stack       :", err.stack);

  if (err.name === "JsonWebTokenError")
    return res.status(401).json({ success: false, message: "Invalid token" });
  if (err.name === "TokenExpiredError")
    return res.status(401).json({ success: false, message: "Token expired" });
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation Error", errors: messages });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ success: false, message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
  }
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ success: false, message: "File too large. Max size is 10MB." });
  if (err.name === "MulterError")
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  if (err.storageErrors || err.$metadata || err.Code)
    return res.status(500).json({
      success: false,
      message: "S3 upload failed. Please try again.",
      ...(process.env.NODE_ENV === "development" && { detail: err.message, code: err.Code || err.code }),
    });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { error: err.stack }),
  });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  const s3Connected = await checkS3Connection();
  console.log(`
╔════════════════════════════════════════════╗
║          🚀 EduTechEx API Server           ║
╚════════════════════════════════════════════╝

📡 Server Status:
   ✅ Port        : ${PORT}
   ✅ Environment : ${process.env.NODE_ENV || "development"}
   ✅ URL         : http://localhost:${PORT}

☁️  Storage (AWS S3):
   ${s3Connected ? '✅' : '❌'} Bucket : ${BUCKET_NAME}
   ${s3Connected ? '✅' : '❌'} Region : ${process.env.AWS_REGION}
   ${s3Connected ? '✅' : '❌'} Status : ${s3Connected ? 'Connected ✅' : 'FAILED ❌ — Check .env!'}

🔐 Admin:
   ✅ POST /api/admin/login           (public)
   ✅ GET  /api/admin/profile         (protected)
   ✅ POST /api/admin/logout          (protected)
   ✅ PUT  /api/admin/change-password (protected)

📊 Analytics:
   ✅ GET /api/analytics/stats
   ✅ GET /api/analytics/profiles
   ✅ GET /api/analytics/profiles/:userId

🔧 Debug:
   ✅ GET /api/test
   ✅ GET /api/routes
   ✅ GET /api/debug/s3
   ✅ GET /api/health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  if (!s3Connected) {
    console.error(`⚠️  WARNING: S3 NOT connected! File uploads will FAIL. Check your .env.`);
  }
});

export default app;