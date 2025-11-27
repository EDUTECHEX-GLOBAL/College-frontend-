// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Core pages
import Home from "./components/Home";
import CreateAccount from "./components/CreateAccount";
import FirstYearAccount from "./components/FirstYearAccount";
import TransferStudent from "./components/TransferStudent";
import SignIn from "./components/SignIn";
import ExtendedProfile from "./components/ExtendedProfile/ExtendedProfile";

// Dashboards
import Dashboard from "./components/Dashboard";          // First-year main dashboard
import DashboardTest from "./components/Dashboardtest";  // Transfer dashboard

function App() {
  return (
    <Router>
      <Routes>
        {/* 🏠 Homepage */}
        <Route path="/" element={<Home />} />

        {/* 🧾 Create Account (main) */}
        <Route path="/create-account" element={<CreateAccount />} />

        {/* 🎓 First-Year Student */}
        <Route path="/create-account/first-year" element={<FirstYearAccount />} />

        {/* 🔁 Transfer Student */}
        <Route path="/create-account/transfer" element={<TransferStudent />} />

        {/* 🔐 Sign In */}
        <Route path="/sign-in" element={<SignIn />} />

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

        {/* ⭐ Transfer Dashboard (FIXED to use DashboardTest) */}
        <Route
          path="/transfer/dashboard/*"
          element={<DashboardTest studentType="transfer" />}
        />

        {/* ⭐ Test Dashboard */}
        <Route
          path="/dashboard-test/*"
          element={<DashboardTest />}
        />

        {/* Redirect old profile route */}
        <Route
          path="/profile"
          element={<Navigate to="/firstyear/dashboard/profile/personal" replace />}
        />

        {/* 🚀 Catch All → Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
