import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// ---------------------------------------------------------------------------
// Hardcoded admin credentials (no database)
// ---------------------------------------------------------------------------
const HARDCODED_ADMIN = {
  email: "admin@edutechex.com",
  password: "admin@edutechex123",
  name: "Super Admin",
  role: "super_admin",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const generateToken = (adminData) =>
  jwt.sign(
    {
      id: "admin-001",
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
    },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    { expiresIn: "24h" }
  );

// ---------------------------------------------------------------------------
// POST /api/admin/login
// ---------------------------------------------------------------------------
export const loginAdmin = async (req, res) => {
  try {
    // 1️⃣  express-validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // 2️⃣  Normalize — trim whitespace & lowercase only (no normalizeEmail()
    //     called here because the route validator no longer calls it either)
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    // 3️⃣  Debug log (remove in production)
    console.log("🔑 Login attempt →", { email, passwordLength: password?.length });

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // 4️⃣  Credential check
    const expectedEmail = HARDCODED_ADMIN.email.toLowerCase();
    const expectedPassword = HARDCODED_ADMIN.password;

    if (email !== expectedEmail || password !== expectedPassword) {
      // Log the mismatch to help diagnose without exposing data
      console.warn(
        "❌ Credential mismatch →",
        "emailMatch:", email === expectedEmail,
        "passwordMatch:", password === expectedPassword
      );
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // 5️⃣  Issue token
    const token = generateToken(HARDCODED_ADMIN);

    console.log("✅ Admin login successful →", email);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: "admin-001",
        email: HARDCODED_ADMIN.email,
        name: HARDCODED_ADMIN.name,
        role: HARDCODED_ADMIN.role,
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/profile  (protected)
// ---------------------------------------------------------------------------
export const getAdminProfile = async (req, res) => {
  try {
    const admin = req.admin; // set by authenticateAdmin middleware
    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/admin/logout  (protected)
// ---------------------------------------------------------------------------
export const logoutAdmin = (_req, res) =>
  res.status(200).json({ success: true, message: "Admin logged out successfully" });

// ---------------------------------------------------------------------------
// PUT /api/admin/profile  (protected)
// ---------------------------------------------------------------------------
export const updateAdminProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    HARDCODED_ADMIN.name = name;

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin: {
        id: "admin-001",
        email: HARDCODED_ADMIN.email,
        name: HARDCODED_ADMIN.name,
        role: HARDCODED_ADMIN.role,
      },
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/change-password  (protected)
// ---------------------------------------------------------------------------
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (currentPassword !== HARDCODED_ADMIN.password) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    HARDCODED_ADMIN.password = newPassword;

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/admin/setup  (disabled — admin already exists)
// ---------------------------------------------------------------------------
export const createInitialAdmin = (_req, res) =>
  res.status(400).json({
    success: false,
    message: "Admin already exists. Use admin@edutechex.com / admin@edutechex123",
  });