// src/App.js - Updated for admin folder
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ✅ Role Selection Page
import RoleSelection from "./components/RoleSelection";

// ✅ Admin Login Page
import AdminLogin from "./components/AdminLogin";

// ✅ Process Admin Login Page
import ProcessAdminLogin from "./components/processadmin/ProcessAdminLogin";

// ✅ User Profile Page
import UserProfile from "./components/UserProfile";

// ✅ Admin Dashboard Page
import AdminDashboard from "./components/admin/admindashboard";

// ✅ Process Admin Dashboard Page
import ProcessAdminDashboard from "./components/processadmin/processAdminDashboard";

// ✅ NEW EDUCATION PAGES - ADMIN FOLDER
import BachelorsTemplate from "./components/admin/Bachelors";


// Core pages
import Home from "./components/Home";
import CreateAccount from "./components/CreateAccount";
import FirstYearAccount from "./components/FirstYearAccount";
import TransferStudent from "./components/TransferStudent";
import SignIn from "./components/SignIn";
import ExtendedProfile from "./components/ExtendedProfile/ExtendedProfile";
import ForgotPassword from "./components/ForgotPassword";

// Dashboards
import Dashboard from "./components/Dashboard";
import DashboardTest from "./components/Dashboardtest";

function App() {
  return (
    <Router>
      <Routes>
        {/* Role Selection - FIRST PAGE */}
        <Route path="/" element={<RoleSelection />} />

        {/* ✅ BACHELORS APPLICATION ROUTES - ADMIN FOLDER */}
        <Route path="/bachelors" element={<BachelorsTemplate />} />
        
        {/* Old Homepage */}
        <Route path="/home" element={<Home />} />

        {/* Create Account pages */}
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/create-account/first-year" element={<FirstYearAccount />} />
        <Route path="/create-account/transfer" element={<TransferStudent />} />

        {/* Sign In */}
        <Route path="/sign-in" element={<SignIn />} />

        {/* User Profile Route */}
        <Route path="/profile" element={<UserProfile />} />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Process Admin Routes */}
        <Route path="/process-admin-login" element={<ProcessAdminLogin />} />
        <Route path="/process-admin-dashboard" element={<ProcessAdminDashboard />} />

       

        {/* Forgot Password Routes */}
        <Route path="/firstyear/forgot-password" element={<ForgotPassword />} />
        <Route path="/transfer/forgot-password" element={<ForgotPassword />} />

        {/* Transfer Extended Profile */}
        <Route path="/extended-profile" element={<ExtendedProfile />} />

        {/* Dashboard Routes */}
        <Route path="/firstyear/dashboard/*" element={<Dashboard studentType="firstyear" />} />
        <Route path="/transfer/dashboard/*" element={<DashboardTest studentType="transfer" />} />
        <Route path="/dashboard-test/*" element={<DashboardTest />} />

        {/* Redirects */}
        <Route path="/admin-dashboard-old" element={<Navigate to="/sign-in" replace />} />
        <Route path="/student-dashboard" element={<Navigate to="/home" replace />} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
