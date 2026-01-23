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
import transferActivitiesRoutes from "./routes/activitiestestRoutes.js"; // ✅ RENAMED for transfer
import firstYearActivitiesRoutes from "./routes/activitiesRoutes.js"; // ✅ RENAMED for first-year
import responsibilitiesRoutes from "./routes/responsibilitiesRoutes.js";
import writingRoutes from "./routes/writingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
// Import transfer and extended profile routes from previous code
import transferRoutes from "./routes/transferRoutes.js";
import extendedProfileRoutes from "./routes/extendedProfileRoutes.js";
import familyRoutes from "./routes/familytestRoutes.js";
import educationtestRoutes from "./routes/educationtestRoutes.js";
import testRoutes from "./routes/testRoutes.js"; // ✅ ADDED - Testing routes
import writingtestRoutes from "./routes/writingtestRoutes.js"; // ✅ ADDED - Writing test routes
import firstfamilydashbRoutes from "./routes/firstfamilydashbRoutes.js";
import adminUserRoutes from "./routes/adminuserroutes.js";
// import adminApplicationRoutes from "./routes/adminapplicationroutes.js";

// Load env
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

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });
}

/* ======================================================
   ✔ SERVE LOCAL LOGO FILES (IMPORTANT FOR COLLEGE SEARCH)
   ====================================================== */
const logosPath = path.join(process.cwd(), "public", "logos");
app.use("/logos", express.static(logosPath));

// Serve uploaded education files (local storage)
const uploadStaticPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadStaticPath));

/* ======================
   API ROUTES
   ====================== */
app.use("/api/students", accountRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/college-search", collegesearchRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/general", generalRoutes); 
app.use("/api/academics", firstAcademicRoutes);
app.use("/api/high-school-curriculum", highSchoolCurriculumRoutes);
app.use("/api/first-activities", firstactivitiesRoutes);
app.use("/api/contacts", firstContactsRoutes);
app.use("/api/family", firstFamilyRoutes);
app.use("/api/residency", firstResidencyRoutes);
app.use("/api/international", internationalStudentRoutes);
app.use("/api/review", firstReviewRoutes);
app.use("/api/students/testing", firstTestingRoutes);
app.use("/api/students", firstYearActivitiesRoutes); // ✅ First-year activities
app.use("/api/transfer", transferActivitiesRoutes); // ✅ Transfer activities
app.use("/api/students", responsibilitiesRoutes); 
app.use("/api/writing", writingRoutes);
app.use("/api/students/family-dashb", firstfamilydashbRoutes);

// ✅ ADDED: Transfer student and extended profile routes from previous code
app.use("/api/transfer", transferRoutes);
app.use("/api/profile", extendedProfileRoutes);
app.use("/api/family-background", familyRoutes);
app.use("/api/education-transfer", educationtestRoutes);
app.use("/api/testing", testRoutes); // ✅ ADDED - Testing routes
app.use("/api/writingtest", writingtestRoutes); // ✅ ADDED - Writing test routes
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUserRoutes);
// app.use("/api/admin", adminApplicationRoutes); // ← ADD THIS
// IMPORTANT: Since you have CommonJS files, we need to import them differently
// Remove the user routes import and route for now to test

// Root health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduTechEx API is running...",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    routes: {
      register: "POST /api/students/register",
      login: "POST /api/students/login",
      profile: "GET /api/students/profile (Protected)",
      adminProfile: "GET /api/admin/profile (Admin Protected)", // ✅ ADDED
      education: "GET /api/education (Protected)",
      collegeSearch: "GET /api/college-search",
      colleges: "GET /api/colleges (Protected)",
      general: "GET /api/general (Protected)",
      academics: "GET /api/academics (Protected)",
      highSchoolCurriculum: "GET /api/high-school-curriculum (Protected)",
      firstYearActivities: "GET /api/students/activities (Protected)", // ✅ UPDATED
      transferActivities: "GET /api/transfer/activities (Protected)", // ✅ ADDED
      writing: "GET /api/writing (Protected)", 
      writingPersonalEssay: "PUT /api/writing/personal-essay (Protected)",
      writingAdditionalInfo: "PUT /api/writing/additional-information (Protected)",
      // ✅ ADDED: Transfer and extended profile routes
      transfer: "POST /api/transfer/login",
      extendedProfile: "GET/POST /api/profile",
      familyBackground: "GET/POST /api/family-background",
      educationTransfer: "GET/POST /api/education-transfer",
      testing: "GET/POST /api/testing", // ✅ ADDED
      writingTest: "GET/POST /api/writingtest" // ✅ ADDED
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
    endpoints: {
      students: "/api/students",
      transfer: "/api/transfer",
      extendedProfile: "/api/profile",
      education: "/api/education",
      family: "/api/family-background",
      educationTransfer: "/api/education-transfer",
      writing: "/api/writing",
      firstYearActivities: "/api/students/activities", // ✅ UPDATED
      transferActivities: "/api/transfer/activities", // ✅ ADDED
      collegeSearch: "/api/college-search",
      testing: "/api/testing", // ✅ ADDED
      writingTest: "/api/writingtest", // ✅ ADDED
      admin: "/api/admin"
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: "Check available routes via '/' or '/api/status'",
  });
});

// Enhanced Error handler from previous code
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

📚 Available Routes:
   👨‍🎓 Students:        /api/students
   🔄 Transfer:         /api/transfer
   🧾 Extended Profile: /api/profile
   🎓 Education:        /api/education
   👨‍👩‍👧‍👦 Family:           /api/family-background
   🎓 Education Transfer: /api/education-transfer
   ✍️  Writing:          /api/writing
   🎯 First-Year Activities: /api/students/activities
   🎯 Transfer Activities: /api/transfer/activities
   🔍 College Search:   /api/college-search
   📝 Testing:          /api/testing
   ✍️  Writing Test:    /api/writingtest
   🏫 Colleges:         /api/colleges
   📋 General:          /api/general
   📚 Academics:        /api/academics
   🎒 High School:      /api/high-school-curriculum
   👥 Contacts:         /api/contacts
   🏠 Residency:        /api/residency
   🌍 International:    /api/international
   📊 Review:           /api/review

   🔐 Admin Endpoints:
   - POST   /api/admin/login
   - POST   /api/admin/logout
   - GET    /api/admin/profile
   - PUT    /api/admin/profile
   - PUT    /api/admin/change-password
   - POST   /api/admin/setup (first-time only)

🏥 Health:
   - GET /api/health
   - GET /api/status
   - GET /
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

export default app;