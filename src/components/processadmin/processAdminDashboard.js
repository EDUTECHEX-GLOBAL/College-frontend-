// ProcessAdminDashboard.js — Teal Design System + Real EDUTECHEX SVG Logo
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./processAdminDashboard.css";
import Applications from "./Applications";
import Documents from "./documents";
import GusUniversity from "./gusuniversity";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ─── Helpers ─── */
const getProcessAdminToken = () => {
  const token = localStorage.getItem('processAdminToken');
  if (token) { console.log('✅ Using processAdminToken'); return token; }
  console.error('❌ No process-admin token found');
  return null;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s === 'validated')        return 'status-badge completed';
  if (s.includes('incomplete'))                            return 'status-badge incomplete';
  if (s.includes('in progress') || s.includes('pending')) return 'status-badge in-progress';
  if (s.includes('not started'))                           return 'status-badge not-started';
  return 'status-badge';
};

/* ─── SVG Icons ─── */
const IcoGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcoBuilding = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoFileText = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoFolder = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);
const IcoGradCap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IcoChevDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcoChevRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoChevLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoLines = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="15" y2="18"/>
  </svg>
);
const IcoHamburger = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6"  y1="6" x2="18" y2="18"/>
  </svg>
);

/* ─────────────────────────────────────────────────
   REAL EDUTECHEX SVG LOGO
   Embedded inline — no external file dependency.
   Unique gradient IDs prefixed with "pad-" to avoid
   conflicts with other SVGs on the same page.
───────────────────────────────────────────────── */
const EdutechExLogo = () => (
  <div className="pad-logo-wrap">
    <svg
      className="pad-logo-svg"
      viewBox="0 0 506 106"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        {/* Main text gradient — navy blue */}
        <linearGradient id="pad-lg1" gradientUnits="userSpaceOnUse"
          x1="516.3248" y1="53.11" x2="67.3956" y2="53.11"
          gradientTransform="matrix(1 0 0 -1 0 106.11)">
          <stop offset="0"    stopColor="#3C4C9B"/>
          <stop offset="0.08" stopColor="#3A4999"/>
          <stop offset="0.40" stopColor="#323E91"/>
          <stop offset="0.71" stopColor="#2A3887"/>
          <stop offset="1"    stopColor="#293682"/>
        </linearGradient>

        {/* EX arrow gradient — teal */}
        <linearGradient id="pad-lg2" gradientUnits="userSpaceOnUse"
          x1="398.72" y1="52.8" x2="485.17" y2="52.8">
          <stop offset="0"   stopColor="#14b8a6"/>
          <stop offset="0.5" stopColor="#0ea5e9"/>
          <stop offset="1"   stopColor="#6366f1"/>
        </linearGradient>

        {/* Clip paths for the EX chevron */}
        <clipPath id="pad-cp1">
          <polygon points="460.82,22.08 446.1,22.08 467.17,49.13 398.72,49.13 398.72,57.31 467.13,57.32 446.73,83.52 461.45,83.52 485.17,53.35"/>
        </clipPath>
      </defs>

      {/* EDUTEC letters */}
      <path fill="url(#pad-lg1)" d="
        M39.36,30.19c1.18,0,2.17-0.38,2.96-1.13c0.79-0.75,1.21-1.75,1.21-2.88
        c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.19-2.98-1.19H3.97c-1.13,0-2.11,0.39-2.92,1.17
        C0.23,24.04-0.2,25.08-0.2,26.26v53.05c0,1.14,0.41,2.13,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23h35.4
        c1.19,0,2.19-0.4,2.98-1.19c0.78-0.78,1.19-1.78,1.19-2.9c0-1.14-0.42-2.13-1.21-2.88
        c-0.79-0.75-1.78-1.13-2.96-1.13H8.15V56.76h22.4c1.09,0,2.05-0.37,2.84-1.09
        c0.83-0.77,1.33-1.87,1.33-3c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.18-2.98-1.18H8.13V30.19H39.36z
        M85.62,26.01c-4.64-2.61-9.98-3.93-15.84-3.93H56.19c-1.18,0-2.19,0.4-2.98,1.18
        c-0.79,0.79-1.19,1.79-1.19,2.98V79.3c0,1.19,0.4,2.19,1.19,2.98c0.79,0.79,1.79,1.19,2.98,1.19h13.59
        c5.87,0,11.2-1.33,15.84-3.93c4.66-2.61,8.33-6.31,10.92-10.96c2.58-4.64,3.89-9.97,3.89-15.84
        c0-5.87-1.31-11.19-3.89-15.81C93.95,32.3,90.28,28.63,85.62,26.01z
        M89.31,64.6c-0.8,1.45-1.74,2.78-2.81,3.98c-1.47,1.65-3.17,3.06-5.12,4.2
        c-3.37,1.97-7.27,2.96-11.61,2.96h-9.42V29.81h9.42c3.99,0,7.61,0.85,10.79,2.49
        c0.28,0.14,0.56,0.28,0.83,0.44c0.51,0.29,0.99,0.61,1.47,0.94c1.6,1.1,3.01,2.41,4.23,3.91
        c0.82,1.01,1.57,2.1,2.22,3.28c1.9,3.47,2.87,7.47,2.87,11.86C92.17,57.13,91.21,61.13,89.31,64.6z
        M155.13,22.08c-1.19,0-2.19,0.4-2.98,1.19c-0.79,0.79-1.19,1.79-1.19,2.98v36.53
        c0,2.66-0.68,5.07-2.03,7.14c-1.36,2.09-3.26,3.75-5.66,4.93c-2.44,1.2-5.28,1.8-8.44,1.8
        c-3.22,0-6.11-0.61-8.6-1.8c-2.45-1.18-4.37-2.83-5.73-4.92c-1.34-2.07-2.03-4.48-2.03-7.14V26.25
        c0-1.18-0.4-2.19-1.19-2.98c-0.79-0.79-1.79-1.19-2.98-1.19c-1.19,0-2.19,0.4-2.98,1.19
        s-1.19,1.79-1.19,2.98v36.53c0,4.2,1.07,8.01,3.17,11.33c2.1,3.33,5.07,5.95,8.84,7.8
        c3.72,1.83,7.99,2.77,12.69,2.77c4.65,0,8.87-0.93,12.55-2.77c3.71-1.85,6.65-4.48,8.75-7.8
        c2.1-3.33,3.17-7.14,3.17-11.33V26.25c0-1.18-0.4-2.19-1.19-2.98C157.33,22.48,156.32,22.08,155.13,22.08z
        M214.04,23.19c-0.73-0.72-1.71-1.11-2.83-1.11h-41.73c-1.12,0-2.1,0.39-2.83,1.11
        c-0.74,0.74-1.12,1.69-1.12,2.83c0,1.07,0.39,2.02,1.11,2.75c0.74,0.74,1.69,1.12,2.83,1.12h16.66v49.42
        c0,1.14,0.41,2.13,1.23,2.94c0.8,0.8,1.82,1.23,2.95,1.23c1.27,0,2.37-0.5,3.17-1.44
        c0.67-0.8,1-1.84,1-2.88V29.89h16.74c1.14,0,2.09-0.37,2.83-1.11c0.73-0.73,1.12-1.68,1.12-2.75
        C215.15,24.9,214.77,23.92,214.04,23.19z
        M260.94,30.19c1.18,0,2.17-0.38,2.96-1.13c0.79-0.75,1.21-1.75,1.21-2.88
        c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.19-2.98-1.19h-35.4c-1.13,0-2.11,0.39-2.92,1.17
        c-0.82,0.78-1.25,1.82-1.25,3v53.05c0,1.14,0.41,2.13,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23h35.4
        c1.19,0,2.19-0.4,2.98-1.19c0.78-0.78,1.19-1.78,1.19-2.9c0-1.14-0.42-2.13-1.21-2.88
        c-0.79-0.75-1.78-1.13-2.96-1.13h-31.23V56.76h22.4c1.09,0,2.05-0.37,2.84-1.09
        c0.83-0.77,1.33-1.87,1.33-3c0-1.12-0.41-2.12-1.19-2.9c-0.79-0.79-1.79-1.18-2.98-1.18h-22.4V30.19H260.94z
        M290.19,32.53c3.41-2.1,7.15-3.18,11.13-3.18c2.91,0,5.5,0.38,7.68,1.14
        c2.15,0.75,4.17,1.96,5.99,3.6c0.73,0.66,1.64,0.99,2.71,0.99c0.61,0,1.2-0.15,1.74-0.47
        c0.45-0.26,0.8-0.6,1.02-1.02c0.37-0.24,0.67-0.56,0.92-0.95c0.32-0.52,0.48-1.1,0.48-1.74
        c0-1.15-0.46-2.09-1.27-2.68c-2.87-2.4-5.88-4.17-8.98-5.27c-3.09-1.1-6.55-1.66-10.3-1.66
        c-5.58,0-10.77,1.43-15.42,4.25c-4.64,2.82-8.36,6.67-11.07,11.46c-2.71,4.79-4.08,10.07-4.08,15.69
        c0,5.68,1.39,10.98,4.12,15.77c2.73,4.79,6.47,8.65,11.11,11.46c4.65,2.82,9.82,4.25,15.35,4.25
        c7.88,0,14.38-2.29,19.31-6.81l0.07-0.07c0.77-0.83,1.15-1.82,1.15-2.94c0-1.18-0.42-2.2-1.21-2.96
        c-0.79-0.75-1.73-1.13-2.8-1.13c-0.82,0-1.61,0.28-2.42,0.87c-4.18,3.33-8.93,5.02-14.11,5.02
        c-4.03,0-7.8-1.06-11.21-3.14c-3.42-2.09-6.17-4.96-8.17-8.53c-2-3.57-3.01-7.53-3.01-11.78
        c0-4.14,1.02-8.06,3.05-11.62C283.99,37.54,286.76,34.65,290.19,32.53z
        M378.8,22.08c-0.86-0.02-1.73,0.21-2.44,0.69c-1.2,0.81-1.84,2.04-1.84,3.48v22.32h-34.38V26.25
        c0-1.18-0.4-2.19-1.19-2.98c-0.79-0.79-1.79-1.19-2.98-1.19c-1.13,0-2.11,0.39-2.92,1.17
        c-0.82,0.78-1.25,1.82-1.25,3V79.3c0,1.14,0.41,2.13,1.23,2.94c0.82,0.82,1.8,1.23,2.95,1.23
        c1.27,0,2.37-0.5,3.17-1.44c0.67-0.8,1-1.84,1-2.88V56.3h34.38v23c0,1.12,0.42,2.14,1.23,2.94
        c0.82,0.82,1.8,1.23,2.95,1.23c1.27,0,2.37-0.5,3.17-1.44c0.67-0.8,1-1.84,1-2.88v-52.9
        c0-1.18-0.4-2.19-1.19-2.98C380.89,22.5,379.94,22.1,378.8,22.08z
      "/>

      {/* EX bar top */}
      <path fill="url(#pad-lg1)" d="M446.1,30.26l-47.37,0.01v-8.18h18.89h22.54L446.1,30.26z"/>
      {/* EX bar bottom */}
      <path fill="url(#pad-lg1)" d="M446.1,75.34l-47.37-0.01v8.18h18.89h22.54L446.1,75.34z"/>
      {/* X right leg top */}
      <path fill="url(#pad-lg1)" d="M505.57,83.52h-10.57L481.9,66.68l5.28-6.78L505.57,83.52z"/>
      {/* X right leg bottom */}
      <path fill="url(#pad-lg1)" d="M495.63,22.08l-13.68,17.56l5.28,6.78l18.96-24.35L495.63,22.08z"/>

      {/* EX chevron body — teal gradient */}
      <polygon
        clipPath="url(#pad-cp1)"
        fill="url(#pad-lg2)"
        points="460.82,22.08 446.1,22.08 467.17,49.13 398.72,49.13 398.72,57.32 467.13,57.32 446.73,83.52 461.45,83.52 485.17,53.35"
      />
    </svg>
  </div>
);

/* ─── Stat icon wrapper ─── */
const StatIcon = ({ bg, stroke, children }) => (
  <div className="pad-stat-ico" style={{ background: bg }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </div>
);

/* ════════════════════════════════════════
   COMPONENT
════════════════════════════════════════ */
const ProcessAdminDashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen,         setSidebarOpen]         = useState(true);
  const [mobileSidebarOpen,   setMobileSidebarOpen]   = useState(false);
  const [activeTab,           setActiveTab]           = useState("dashboard");
  const [processAdminData,    setProcessAdminData]    = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [searchQuery,         setSearchQuery]         = useState("");
  const [kansasExpanded,      setKansasExpanded]      = useState(true);
  const [gusExpanded,         setGusExpanded]         = useState(false);
  const [applications,        setApplications]        = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isMobile,            setIsMobile]            = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const token     = getProcessAdminToken();
    const adminData = localStorage.getItem('processAdminData');
    if (!token) { navigate("/process-admin-login"); return; }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try { if (adminData) setProcessAdminData(JSON.parse(adminData)); }
    catch (e) { console.error("Error parsing admin data:", e); }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "applications") fetchApplications();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('processAdminToken');
    localStorage.removeItem('processAdminData');
    localStorage.removeItem('processAdminEmail');
    delete axios.defaults.headers.common['Authorization'];
    navigate("/process-admin-login");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    closeMobileSidebar();
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const token = getProcessAdminToken();
      if (!token) { navigate('/process-admin-login'); return; }
      const response = await axios.get(`${API_BASE_URL}/process-admin/documents/all`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data?.success && response.data?.data?.applications) {
        setApplications(response.data.data.applications);
      } else { setApplications([]); }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('processAdminToken');
        localStorage.removeItem('processAdminData');
        navigate('/process-admin-login');
      }
      setApplications([]);
    } finally { setApplicationsLoading(false); }
  };

  const viewApplicationDetails = async (applicationId) => {
    try {
      const token    = getProcessAdminToken();
      const response = await axios.get(
        `${API_BASE_URL}/process-admin/applications/${applicationId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedApplication(response.data.data || response.data);
    } catch (e) { alert('Failed to load application details'); }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const token = getProcessAdminToken();
      await axios.put(
        `${API_BASE_URL}/process-admin/applications/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchApplications();
      setSelectedApplication(null);
    } catch (e) { console.error("Error updating status:", e); }
  };

  /* ── Dashboard render ── */
  const renderDashboard = () => (
    <div className="pad-dash">
      <div className="pad-stats-row">
        <div className="pad-stat-card">
          <StatIcon bg="#e0f2fe" stroke="#0284c7">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </StatIcon>
          <div><div className="pad-sv">{applications.length || 120}</div><div className="pad-sl">Applications</div></div>
        </div>
        <div className="pad-stat-card">
          <StatIcon bg="#ccfbf1" stroke="#0d9488">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </StatIcon>
          <div><div className="pad-sv">55</div><div className="pad-sl">Documents</div></div>
        </div>
        <div className="pad-stat-card">
          <StatIcon bg="#ede9fe" stroke="#7c3aed">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </StatIcon>
          <div><div className="pad-sv">6</div><div className="pad-sl">Universities</div></div>
        </div>
        <div className="pad-stat-card">
          <StatIcon bg="#d1fae5" stroke="#059669">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </StatIcon>
          <div><div className="pad-sv">6</div><div className="pad-sl">Courses</div></div>
        </div>
        <div className="pad-stat-card">
          <StatIcon bg="#fef3c7" stroke="#d97706">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </StatIcon>
          <div><div className="pad-sv">12</div><div className="pad-sl">Pending Reviews</div></div>
        </div>
      </div>

      <div className="pad-charts-row">
        <div className="pad-chart-card">
          <div className="pad-chart-hdr">
            <span className="pad-chart-title"><strong>Applications</strong> Per Day</span>
            <div className="pad-pills">
              <span className="pad-pill pad-pill-teal">2.41</span>
              <span className="pad-pill">PITT</span>
              <span className="pad-pill">VIM</span>
              <span className="pad-pill pad-pill-amber">5%</span>
            </div>
          </div>
          <div className="pad-chart-body">
            <svg viewBox="0 0 500 120" preserveAspectRatio="none" width="100%" height="120">
              <defs>
                <linearGradient id="pad-lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.01"/>
                </linearGradient>
              </defs>
              {[10,35,60,85].map((y, i) => (
                <line key={i} x1="22" y1={y} x2="498" y2={y} stroke="#eef0f4" strokeWidth="1"/>
              ))}
              {['30','25','20','5'].map((t, i) => (
                <text key={i} x="2" y={[13,38,63,88][i]} fontSize="8" fill="#94a3b8">{t}</text>
              ))}
              <path d="M28,105 L98,80 L170,65 L244,63 L318,38 L393,50 L468,34 L468,112 L28,112Z" fill="url(#pad-lineGrad)"/>
              <path d="M28,105 L98,80 L170,65 L244,63 L318,38 L393,50 L468,34"
                stroke="#14b8a6" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              {[[28,105],[98,80],[170,65],[244,63],[318,38],[393,50],[468,34]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r={i === 4 ? 5 : 3.5}
                  fill={i === 4 ? "#14b8a6" : "white"} stroke="#14b8a6" strokeWidth="2"/>
              ))}
            </svg>
          </div>
          <div className="pad-chart-xlbls">
            {['Apr 9','Apr 10','Apr 11','Apr 12','Apr 13','Apr 14','Apr 15'].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="pad-chart-footer">
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#14b8a6'}}></span><strong>120</strong> Total</span>
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#0d9488'}}></span><strong>38</strong> this week</span>
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#f59e0b'}}></span><strong>12</strong> pending</span>
            <span className="pad-lines-ico"><IcoLines /></span>
          </div>
        </div>

        <div className="pad-chart-card">
          <div className="pad-chart-hdr">
            <span className="pad-chart-title"><strong>Documents</strong> Uploaded</span>
            <div className="pad-pills">
              <span className="pad-pill pad-pill-teal">5.35</span>
              <span className="pad-pill">TOTAL</span>
              <span className="pad-pill pad-pill-amber">5S</span>
            </div>
          </div>
          <div className="pad-chart-body">
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" width="100%" height="120">
              {[10,35,60,85].map((y, i) => (
                <line key={i} x1="22" y1={y} x2="398" y2={y} stroke="#eef0f4" strokeWidth="1"/>
              ))}
              {['50','40','30','20'].map((t, i) => (
                <text key={i} x="0" y={[13,38,63,88][i]} fontSize="8" fill="#94a3b8">{t}</text>
              ))}
              <rect x="32"  y="10" width="48" height="95" rx="5" fill="#14b8a6" opacity="0.82"/>
              <rect x="100" y="34" width="48" height="71" rx="5" fill="#5eead4" opacity="0.80"/>
              <rect x="168" y="50" width="48" height="55" rx="5" fill="#f59e0b" opacity="0.80"/>
              <rect x="236" y="60" width="48" height="45" rx="5" fill="#0d9488" opacity="0.80"/>
              <rect x="304" y="70" width="48" height="35" rx="5" fill="#fcd34d" opacity="0.88"/>
            </svg>
          </div>
          <div className="pad-bar-xlbls">
            {['Kansas','Stanford','MIT','GUS','GUS'].map((l, i) => (<span key={i}>{l}</span>))}
          </div>
          <div className="pad-chart-footer">
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#14b8a6'}}></span><strong>55</strong> Total</span>
            <span className="pad-cfi"><span className="pad-cfd" style={{background:'#f59e0b'}}></span><strong>12</strong> Pending</span>
            <span className="pad-view-all-link">View All</span>
          </div>
        </div>
      </div>

      <div className="pad-bottom-row">
        <div className="pad-table-card">
          <div className="pad-table-hdr">
            <span className="pad-section-title">Recent Applications</span>
            <span className="pad-view-all-link">View All &rsaquo;</span>
          </div>
          <table className="pad-table">
            <thead>
              <tr>
                <th>Student</th><th>University</th><th>Course</th>
                <th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aravind</td><td>Kansas University</td><td>BSc</td>
                <td><span className="pad-badge pad-pending">● Pending</span></td>
                <td>Apr 11</td><td className="pad-chev">∨</td>
              </tr>
              <tr>
                <td>Rahul</td><td>GUS University</td><td>MBA</td>
                <td><span className="pad-badge pad-approved">✓ Approved</span></td>
                <td>Apr 10</td><td className="pad-chev">∨</td>
              </tr>
              <tr>
                <td>Krishna</td><td>Stanford University</td><td>MSc</td>
                <td><span className="pad-badge pad-review">● Review</span></td>
                <td>Apr 9</td><td className="pad-chev">∨</td>
              </tr>
            </tbody>
          </table>
          <div className="pad-table-footer">
            <button className="pad-view-all-btn">View All &rsaquo;</button>
          </div>
        </div>

        <div className="pad-activity-card">
          <div className="pad-activity-hdr">
            <span className="pad-section-title">Recent Activity</span>
            <span className="pad-activity-arrow">‹</span>
          </div>
          <div className="pad-activity-list">
            <div className="pad-act-day">Today</div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-teal"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>Rahul:</strong> Document approved for GUS</span>
            </div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-teal"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>Aravind:</strong> Submitted to Kansas University</span>
            </div>
            <div className="pad-act-day" style={{ marginTop: 10 }}>Yesterday</div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-blue"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>Admin</strong> reviewed Krishna's application</span>
            </div>
            <div className="pad-act-item">
              <span className="pad-act-dot pad-dot-indigo"><IcoCheck /></span>
              <span className="pad-act-txt"><strong>New university</strong> MIT added to system</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return renderDashboard();
      case "applications": return (
        <Applications
          applications={applications}
          applicationsLoading={applicationsLoading}
          searchQuery={searchQuery}
          onViewDetails={viewApplicationDetails}
          onRefresh={fetchApplications}
          selectedApplication={selectedApplication}
          onCloseModal={() => setSelectedApplication(null)}
          onUpdateStatus={updateApplicationStatus}
          formatDate={formatDate}
        />
      );
      case "documents":        return <Documents />;
      case "gus-applications": return <GusUniversity />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="process-admin-dashboard">
      <div className="loading-container">
        <div className="loading-spinner"/>
        <p>Loading dashboard…</p>
      </div>
    </div>
  );

  const sidebarClass = [
    'sidebar',
    !isMobile && (sidebarOpen ? 'open' : 'closed'),
    isMobile  && mobileSidebarOpen && 'mobile-open',
  ].filter(Boolean).join(' ');

  return (
    <div className="process-admin-dashboard">

      {isMobile && (
        <div
          className={`pad-mob-overlay ${mobileSidebarOpen ? 'show' : ''}`}
          onClick={closeMobileSidebar}
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <div className={sidebarClass}>
        <div className="sidebar-header">
          {/* Real EDUTECHEX SVG logo */}
          <EdutechExLogo />

          {!isMobile && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)}>
              {sidebarOpen ? <IcoChevLeft /> : <IcoChevRight />}
            </button>
          )}
          {isMobile && (
            <button className="sidebar-toggle" onClick={closeMobileSidebar}>
              <IcoClose />
            </button>
          )}
        </div>

        <ul className="sidebar-menu">
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => handleTabChange("dashboard")}>
            <span className="sb-ico sb-teal"><IcoGrid /></span>
            {(sidebarOpen || isMobile) && <span>Dashboard</span>}
          </li>

          <li className={`kansas-parent ${kansasExpanded ? 'expanded' : ''}`} onClick={() => setKansasExpanded(p => !p)}>
            <span className="sb-ico sb-blue"><IcoBuilding /></span>
            {(sidebarOpen || isMobile) && (
              <>
                <span>Kansas University</span>
                <span className="dropdown-arrow">{kansasExpanded ? <IcoChevDown /> : <IcoChevRight />}</span>
              </>
            )}
          </li>

          {kansasExpanded && (sidebarOpen || isMobile) && (
            <ul className="sub-menu">
              <li className={activeTab === "applications" ? "active" : ""} onClick={() => handleTabChange("applications")}>
                <span className="sb-ico sb-ico-sm sb-teal"><IcoFileText /></span>
                <span>Applications</span>
              </li>
              <li className={activeTab === "documents" ? "active" : ""} onClick={() => handleTabChange("documents")}>
                <span className="sb-ico sb-ico-sm sb-amber"><IcoFolder /></span>
                <span>Documents</span>
              </li>
            </ul>
          )}

          <li className={`kansas-parent ${gusExpanded ? 'expanded' : ''}`} onClick={() => setGusExpanded(p => !p)}>
            <span className="sb-ico sb-teal"><IcoGradCap /></span>
            {(sidebarOpen || isMobile) && (
              <>
                <span>GUS University</span>
                <span className="dropdown-arrow">{gusExpanded ? <IcoChevDown /> : <IcoChevRight />}</span>
              </>
            )}
          </li>

          {gusExpanded && (sidebarOpen || isMobile) && (
            <ul className="sub-menu">
              <li className={activeTab === "gus-applications" ? "active" : ""} onClick={() => handleTabChange("gus-applications")}>
                <span className="sb-ico sb-ico-sm sb-teal"><IcoFileText /></span>
                <span>Applications</span>
              </li>
            </ul>
          )}
        </ul>

        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <span className="logout-circle"><IcoLogout /></span>
            {(sidebarOpen || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div className="main-content">
        <nav className="navbar">
          <div className="navbar-left">
            <button className="pad-hamburger" onClick={() => setMobileSidebarOpen(p => !p)} aria-label="Toggle menu">
              <IcoHamburger />
            </button>
            <h1>Process Admin <span>Dashboard</span></h1>
          </div>
          <div className="navbar-center">
            <div className="search-container">
              <span className="search-icon-left"><IcoSearch /></span>
              <input
                type="text"
                placeholder="Search applications, documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="navbar-right">
            <button className="notif-btn" title="Notifications">
              <IcoBell />
              <span className="notif-dot"/>
            </button>
            <div className="admin-profile">
              <div className="profile-icon"><IcoUser /></div>
              <span className="profile-name">{processAdminData?.email || "process-admin@..."}</span>
            </div>
            <button className="mail-btn" title="Mail"><IcoMail /></button>
          </div>
        </nav>

        <div className="content-area">{renderContent()}</div>

        <footer className="dashboard-footer">
          © 2026 Process Admin Dashboard — EduTechEx. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default ProcessAdminDashboard;