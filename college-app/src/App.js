// src/App.js - FULL UPDATED CODE
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ✅ NEW: Role Selection Page
import RoleSelection from "./components/RoleSelection";

// ✅ NEW: Admin Login Page
import AdminLogin from "./components/AdminLogin";

// ✅ NEW: User Profile Page
import UserProfile from "./components/UserProfile";

// ✅ NEW: Admin Dashboard Page
import AdminDashboard from "./components/admin/admindashboard";

// Core pages
import Home from "./components/Home";
import CreateAccount from "./components/CreateAccount";
import FirstYearAccount from "./components/FirstYearAccount";
import TransferStudent from "./components/TransferStudent";
import SignIn from "./components/SignIn";
import ExtendedProfile from "./components/ExtendedProfile/ExtendedProfile";
import ForgotPassword from "./components/ForgotPassword";

// Dashboards
import Dashboard from "./components/Dashboard";           // First-year main dashboard
import DashboardTest from "./components/Dashboardtest";   // Transfer dashboard

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ NEW: Role Selection - FIRST PAGE */}
        <Route path="/" element={<RoleSelection />} />

        {/* 🏠 Old Homepage (for "Continue as Student") */}
        <Route path="/home" element={<Home />} />

        {/* 🧾 Create Account (main) */}
        <Route path="/create-account" element={<CreateAccount />} />

        {/* 🎓 First-Year Student */}
        <Route path="/create-account/first-year" element={<FirstYearAccount />} />

        {/* 🔁 Transfer Student */}
        <Route path="/create-account/transfer" element={<TransferStudent />} />

        {/* 🔐 Sign In */}
        <Route path="/sign-in" element={<SignIn />} />

        {/* ✅ NEW: User Profile Route */}
        <Route path="/profile" element={<UserProfile />} />

        {/* ✅ NEW: Admin Login Page */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ✅ NEW: Admin Dashboard Page */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* ✅ FORGOT PASSWORD ROUTES */}
        <Route path="/firstyear/forgot-password" element={<ForgotPassword />} />
        <Route path="/transfer/forgot-password" element={<ForgotPassword />} />

        {/* 📋 Transfer Extended Profile */}
        <Route path="/extended-profile" element={<ExtendedProfile />} />

        {/* ================================
           DASHBOARD ROUTING SECTION
        ================================= */}

        {/* ⭐ First-Year Dashboard */}
        <Route
          path="/firstyear/dashboard/*"
          element={<Dashboard studentType="firstyear" />}
        />

        {/* ⭐ Transfer Dashboard */}
        <Route
          path="/transfer/dashboard/*"
          element={<DashboardTest studentType="transfer" />}
        />

        {/* ⭐ Test Dashboard */}
        <Route
          path="/dashboard-test/*"
          element={<DashboardTest />}
        />

        {/* ✅ Temporary routes for RoleSelection */}
        <Route path="/admin-dashboard-old" element={<Navigate to="/sign-in" replace />} />
        <Route path="/student-dashboard" element={<Navigate to="/home" replace />} />

        {/* 🚀 Catch All → Role Selection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;