// backend/middleware/processAdminAuthMiddleware.js

import jwt from "jsonwebtoken";

/**
 * Protect Process Admin Routes
 * Verifies JWT and ensures user has process-admin role
 */
export const protectProcessAdmin = (req, res, next) => {
  try {
    console.log("\n🔐 ===== PROCESS ADMIN AUTH CHECK =====");

    // 1️⃣ Check Authorization header
    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader ? "Bearer [PRESENT]" : "None");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing after Bearer.",
      });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-2026"
    );

    console.log("✅ Decoded Token:", decoded);

    // 4️⃣ Validate role strictly
    if (decoded.role !== "process-admin") {
      console.log("❌ Role mismatch:", decoded.role);

      return res.status(403).json({
        success: false,
        message: "Access denied. Not a process admin.",
      });
    }

    // 5️⃣ Attach admin data to request
    req.processAdmin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    console.log("🎉 Process admin authenticated successfully!");
    next();
  } catch (error) {
    console.error("❌ Process Admin Auth Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};