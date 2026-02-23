// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
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
import adminRoutes from "./routes/adminRoutes.js";
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
import userProfileRoutes from "./routes/userprofileroutes.js";
import applicationSpecialNeedRoutes from "./routes/applicationspecialneedroutes.js";
dotenv.config();

// Initialize
const app = express();

// Connect to DB
connectDB();

// CORS Configuration
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:4200"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware - MOVED UP FOR DEBUGGING
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Bearer [PRESENT]' : 'None',
    'content-type': req.headers['content-type']
  });
  next();
});

/* ======================================================
   SERVE STATIC FILES
   ====================================================== */
const logosPath = path.join(process.cwd(), "public", "logos");
app.use("/logos", express.static(logosPath));

const uploadStaticPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadStaticPath));

/* ======================================================
   DEBUG ENDPOINTS (Place these BEFORE other routes)
   ====================================================== */
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ API is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/routes', (req, res) => {
  const routes = [];
  
  const extractRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({
          path: basePath + layer.route.path,
          methods: methods
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = basePath + (layer.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\?/g, '')
          .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param'));
        extractRoutes(layer.handle.stack, routerPath);
      }
    });
  };
  
  extractRoutes(app._router.stack);
  
  // Filter to show only relevant routes
  const filteredRoutes = routes.filter(r => 
    r.path.includes('/api/user') || 
    r.path === '/' || 
    r.path === '/api/test' ||
    r.path === '/api/routes'
  );
  
  res.json({
    success: true,
    message: 'Registered routes',
    routes: filteredRoutes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

/* ======================================================
   MOUNT USER ROUTES FIRST (Critical for /api/user/*)
   ====================================================== */
console.log('📌 Mounting user routes at /api/user...');
app.use("/api/user", userProfileRoutes);
console.log('✅ User routes mounted successfully');

/* ======================================================
   MOUNT ALL OTHER API ROUTES
   ====================================================== */
app.use("/api/students", accountRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/college-search", collegesearchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/application/education", applicationEducationRoutes);
app.use("/api/application/language", applicationLanguageRoutes);
app.use("/api/application/documents", applicationDocumentRoutes);
app.use("/api/admin", adminUniversityRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/general", generalRoutes);
app.use("/api/academics", firstAcademicRoutes);
app.use("/api/high-school-curriculum", highSchoolCurriculumRoutes);
app.use("/api/first-activities", firstactivitiesRoutes);
app.use("/api/application/special-needs", applicationSpecialNeedRoutes);
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
app.use("/api/application/personal", applicationPersonalRoutes);
app.use("/api/application/address", applicationAddressRoutes);
app.use("/api/writing", writingRoutes);
app.use("/api/students/family-dashb", firstfamilydashbRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/profile", extendedProfileRoutes);
app.use("/api/family-background", familyRoutes);
app.use("/api/education-transfer", educationtestRoutes);
app.use("/api/testing", testRoutes);
app.use("/api/writingtest", writingtestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUserRoutes);

/* ======================================================
   ROOT AND HEALTH ENDPOINTS
   ====================================================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduTechEx API is running...",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    userRoutes: {
      test: "/api/user/test",
      profile: "/api/user/profile",
      status: "/api/user/profile/status",
      image: "/api/user/profile/image"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "All systems operational",
    services: {
      database: "Connected",
      api: "Running",
      cors: "Enabled",
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: "Check available routes via '/api/routes' or '/'",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error("Stack:", err.stack);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired" });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║          🚀 EduTechEx API Server           ║
╚════════════════════════════════════════════╝

📡 Server Status:
   ✅ Port: ${PORT}
   ✅ Environment: ${process.env.NODE_ENV || "development"}
   ✅ URL: http://localhost:${PORT}

🔍 User Routes (Mounted at /api/user):
   ✅ GET  /api/user/test
   ✅ GET  /api/user/profile
   ✅ POST /api/user/profile
   ✅ GET  /api/user/profile/status
   ✅ PATCH /api/user/profile/image
   ✅ DELETE /api/user/profile
   ✅ GET  /api/user/profile/email/:email
   ✅ GET  /api/user/admin/profiles
   ✅ GET  /api/user/admin/profiles/program/:program
   ✅ GET  /api/user/admin/stats

🔧 Debug Endpoints:
   ✅ GET  /api/test
   ✅ GET  /api/routes

📚 Other Routes:
   👉 /api/students
   👉 /api/college-search
   👉 /api/admin
   👉 /api/courses
   👉 /api/colleges

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

export default app;