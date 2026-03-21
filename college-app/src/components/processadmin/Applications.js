// Applications.js – INTERNATIONAL APPLICATIONS (ADMIN) — Purple/Amber Theme + Mobile Cards
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Applications.css";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedApp, setSelectedApp]   = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [stats, setStats] = useState({
    total: 0, pending: 0, accepted: 0, rejected: 0, incomplete: 0,
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
  const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

  const getAuthToken = () =>
    localStorage.getItem("processAdminToken") ||
    localStorage.getItem("token") ;
    

  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      config.headers["Content-Type"] = "application/json";
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) console.log("🔴 Authentication failed");
      else if (error.response?.status === 403) console.log("🔴 Authorization failed");
      return Promise.reject(error);
    }
  );

  /* ── Helpers ── */
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric",
        })
      : "N/A";

  const formatStatus = (status) => {
    const map = {
      "not-started": "Not Started", "in-progress": "In Progress",
      completed: "Completed", pending: "Pending",
      accepted: "Accepted", rejected: "Rejected", incomplete: "Incomplete",
    };
    return map[status] || status;
  };

  const getProgressClass = (progress) => {
    if (progress >= 90) return "complete";
    if (progress >= 70) return "high";
    if (progress >= 40) return "medium";
    return "low";
  };

  const formatFieldName = (key) => {
    const nameMap = {
      _id: "Application ID", collegeId: "College ID",
      highSchoolGraduated: "High School Graduated",
      attendedClassesSinceGraduation: "Attended Classes Since Graduation",
      addAnotherSchool: "Add Another School", schoolName: "School Name",
      schoolStartDate: "School Start Date", schoolEndDate: "School End Date",
      requestedImmigrationStatus: "Requested Visa Status",
      currentlyInUS: "Currently in US",
      currentImmigrationStatus: "Current Immigration Status",
      hearAboutKU: "How did you hear about KU?",
      applicationFeeAgreement: "Application Fee Agreement",
      certificationAgreement: "Certification Agreement",
      thirdPartyPreparation: "Third Party Preparation",
      progress: "Progress", status: "Status",
      createdAt: "Created At", updatedAt: "Updated At",
      _v: "Version", studentName: "Student Name",
      studentEmail: "Student Email", studentId: "Student Database ID",
    };
    if (nameMap[key]) return nameMap[key];
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  };

  const formatFieldValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (key.includes("Date") || key.includes("At")) return formatDate(value);
    if (
      key.includes("Agreement") || key === "thirdPartyPreparation" ||
      key === "highSchoolGraduated" || key === "currentlyInUS" ||
      key === "addAnotherSchool" || key === "attendedClassesSinceGraduation"
    ) {
      return value === "yes" || value === true || value === "agree"
        ? "Yes"
        : value === "no" || value === false ? "No" : String(value);
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "N/A";
    if (typeof value === "object") {
      if (value.street1 !== undefined || value.city !== undefined || value.zip !== undefined) {
        return [value.street1, value.street2, value.street3, value.city, value.state, value.country, value.zip]
          .filter(Boolean).join(", ") || "N/A";
      }
      return "N/A";
    }
    return String(value);
  };

  const downloadPDF = (app) => {
    const doc = new jsPDF("p", "mm", "a4");
    let y = 10;
    doc.setFontSize(16);
    doc.text("Application Details", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(12);
    doc.text("Student Information", 10, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      body: [
        ["Name", app.student.name], ["Email", app.student.email],
        ["Phone", app.student.phone || "N/A"], ["College ID", app.collegeId],
        ["Status", formatStatus(app.latestStatus)],
        ["Progress", `${app.latestProgress}%`],
        ["Submitted", formatDate(app.submittedAt)],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 140 } },
    });
    y = doc.lastAutoTable.finalY + 8;
    app.applications.forEach((section) => {
      doc.setFontSize(12);
      doc.text(`${section.type.toUpperCase()} DETAILS`, 10, y);
      y += 5;
      const rows = Object.entries(section.details || {})
        .filter(([key]) => !["_id","collegeId","status","progress","createdAt","updatedAt","__v","studentId"].includes(key))
        .map(([key, value]) => [formatFieldName(key), formatFieldValue(key, value)]);
      if (rows.length) {
        autoTable(doc, {
          startY: y, body: rows, theme: "grid",
          styles: { fontSize: 9 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 130 } },
        });
        y = doc.lastAutoTable.finalY + 8;
      }
    });
    doc.save(`${app.student.name.replace(/\s+/g, "_")}_Application.pdf`);
  };

  const groupByStudent = (records) => {
    const map = {};
    records.forEach((app) => {
      const studentKey = app.details?.studentId?._id || app.studentId?._id || app.student?._id;
      if (!studentKey) return;
      if (!map[studentKey]) {
        map[studentKey] = {
          studentId: studentKey, collegeId: app.collegeId,
          student: app.student, submittedAt: app.submittedAt,
          latestStatus: app.status, latestProgress: app.progress, applications: [],
        };
      }
      map[studentKey].applications.push(app);
      if (app.submittedAt && new Date(app.submittedAt) > new Date(map[studentKey].submittedAt)) {
        map[studentKey].submittedAt = app.submittedAt;
        map[studentKey].latestStatus = app.status;
        map[studentKey].latestProgress = app.progress;
      }
    });
    return Object.values(map);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.collegeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.latestStatus.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      app.latestStatus === filterStatus ||
      (filterStatus === "incomplete" &&
        (app.latestStatus === "not-started" || app.latestStatus === "in-progress"));
    return matchesSearch && matchesStatus;
  });

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const token = getAuthToken();
      if (!token) { setError("No authentication token found. Please login again."); setLoading(false); return; }

      const results = await Promise.allSettled([
        api.get("/api/international/process-admin/all").catch(() => ({ data: { internationalRecords: [] } })),
        api.get("/api/academics/process-admin/all").catch(() => ({ data: { academicApplications: [] } })),
        api.get("/api/general/process-admin/all").catch(() => ({ data: { generalApplications: [] } })),
        api.get("/api/family/process-admin/all").catch(() => ({ data: { familyRecords: [] } })),
        api.get("/api/contacts/process-admin/all").catch(() => ({ data: { contactsRecords: [] } })),
        api.get("/api/residency/process-admin/all").catch(() => ({ data: { residencyRecords: [] } })),
        api.get("/api/high-school-curriculum/process-admin/all").catch(() => ({ data: { highSchoolCurricula: [] } })),
      ]);

      const get = (i, key) => (results[i].status === "fulfilled" ? results[i].value : { data: {} }).data?.[key] || [];

      const internationalRecords = get(0, "internationalRecords");
      const academicRecords      = get(1, "academicApplications");
      const generalRecords       = get(2, "generalApplications");
      const familyRecords        = get(3, "familyRecords");
      const contactsRecords      = get(4, "contactsRecords");
      const residencyRecords     = get(5, "residencyRecords");
      const highSchoolRecords    = get(6, "highSchoolCurricula");

      const mapped = (arr, fn) => arr.map(fn);

      const combined = [
        ...mapped(internationalRecords, (app) => ({
          _id: app._id, collegeId: app.collegeId,
          status: app.progress === 100 ? "completed" : "incomplete",
          progress: app.progress || 0, submittedAt: app.createdAt,
          student: { name: app.studentId ? `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim() : "N/A", email: app.studentId?.email || "N/A", phone: app.studentId?.phone || "N/A" },
          details: app, type: "international",
        })),
        ...mapped(academicRecords, (app) => ({
          _id: app._id, collegeId: app.collegeId,
          status: app.progress === 100 ? "completed" : "incomplete",
          progress: app.progress || 0, submittedAt: app.lastSaved || app.createdAt,
          student: { name: app.studentId ? `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim() : "N/A", email: app.studentId?.email || "N/A", phone: app.studentId?.phone || "N/A" },
          details: app, type: "academic",
        })),
        ...mapped(generalRecords, (app) => ({
          _id: app._id, collegeId: app.collegeId,
          status: app.status || "not-started", progress: app.progress || 0,
          submittedAt: app.details?.lastSaved || app.details?.createdAt,
          student: { name: app.student?.name || "N/A", email: app.student?.email || "N/A", phone: app.student?.phone || "N/A" },
          details: app.details || {}, type: "general",
        })),
        ...familyRecords
          .filter((app) => app.studentId && typeof app.studentId === "object")
          .map((app) => ({
            _id: app._id, collegeId: app.collegeId,
            status: app.progress === 100 ? "completed" : app.progress > 0 ? "in-progress" : "not-started",
            progress: app.progress || 0, submittedAt: app.lastUpdated || app.updatedAt || app.createdAt,
            student: { name: `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim(), email: app.studentId.email || "N/A", phone: app.studentId.phone || "N/A" },
            details: { studentId: app.studentId, ...app }, type: "family",
          })),
        ...mapped(contactsRecords, (c) => ({
          _id: c._id, collegeId: c.collegeId || "N/A",
          status: c.isComplete ? "completed" : "incomplete", progress: c.progress || 0,
          submittedAt: c.updatedAt || c.createdAt,
          student: { name: c.studentId ? `${c.studentId.firstName || ""} ${c.studentId.lastName || ""}`.trim() : "N/A", email: c.studentId?.email || "N/A", phone: c.studentId?.phone || "N/A" },
          details: c, type: "contacts",
        })),
        ...mapped(residencyRecords, (r) => ({
          _id: r._id, collegeId: r.collegeId, status: r.status || "not-started",
          progress: r.progress || 0, submittedAt: r.submittedAt || r.details?.updatedAt || r.details?.createdAt,
          student: { name: r.student?.name || "N/A", email: r.student?.email || "N/A", phone: r.student?.phone || "N/A" },
          details: r.details, type: "residency",
        })),
        ...mapped(highSchoolRecords, (app) => ({
          _id: app._id, collegeId: app.collegeId,
          status: app.progress === 100 ? "completed" : "incomplete",
          progress: app.progress || 0, submittedAt: app.updatedAt || app.createdAt,
          student: { name: app.studentId ? `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim() : "Unknown Student", email: app.studentId?.email || "N/A", phone: app.studentId?.phone || "N/A" },
          details: app, type: "highschool",
        })),
      ];

      combined.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      const grouped = groupByStudent(combined);
      setApplications(grouped);
      setStats({
        total: grouped.length,
        pending:    grouped.filter((a) => a.latestStatus === "pending").length,
        accepted:   grouped.filter((a) => a.latestStatus === "accepted").length,
        rejected:   grouped.filter((a) => a.latestStatus === "rejected").length,
        incomplete: grouped.filter((a) => a.latestStatus === "not-started" || a.latestStatus === "in-progress").length,
      });
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  /* ── Lock body scroll when modal is open ── */
  useEffect(() => {
    if (selectedApp) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [selectedApp]);

  if (loading) return (
    <div className="applications-container">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading Applications...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="applications-container">
      <div className="empty-state">
        <h3>Error</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={loadApplications} className="retry-btn">Retry</button>
          <button onClick={() => (window.location.href = "/process-admin-login")} className="login-btn">
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     MOBILE CARD — renders all fields
  ══════════════════════════════════════ */
  const renderMobileCard = (app) => (
    <div className="app-card" key={app.studentId}>

      {/* Top strip — college ID + status badge */}
      <div className="app-card-top">
        <span className="app-card-id">{app.collegeId}</span>
        <span className={`status-badge status-${app.latestStatus}`}>
          {formatStatus(app.latestStatus)}
        </span>
      </div>

      <div className="app-card-body">

        {/* Student info row */}
        <div className="app-card-student">
          <div className="app-card-avatar">
            {app.student.name.charAt(0).toUpperCase()}
          </div>
          <div className="app-card-name-block">
            <span className="app-card-name">{app.student.name}</span>
            <span className="app-card-email">{app.student.email}</span>
          </div>
        </div>

        {/* Detail fields — 2-col grid */}
        <div className="app-card-details">

          {/* Submitted */}
          <div className="app-card-detail-item">
            <span className="app-card-detail-label">Submitted</span>
            <span className="app-card-detail-value">{formatDate(app.submittedAt)}</span>
          </div>

          {/* Status text (for readability) */}
          <div className="app-card-detail-item">
            <span className="app-card-detail-label">Status</span>
            <span className="app-card-detail-value">{formatStatus(app.latestStatus)}</span>
          </div>

          {/* Progress — full width */}
          <div className="app-card-detail-item full-width">
            <span className="app-card-detail-label">Progress</span>
            <div className="app-card-progress-wrap">
              <div className="app-card-progress-track">
                <div
                  className={`app-card-progress-fill progress-${getProgressClass(app.latestProgress)}`}
                  style={{ width: `${app.latestProgress}%` }}
                />
              </div>
              <span className="app-card-pct">{app.latestProgress}%</span>
            </div>
          </div>

        </div>
      </div>

      {/* Action buttons */}
      <div className="app-card-actions">
        <button
          className="app-card-btn-view"
          onClick={() => setSelectedApp(app)}
        >
          <span>👁️</span> View Details
        </button>
        <button
          className="app-card-btn-download"
          onClick={() => downloadPDF(app)}
          title="Download PDF"
        >
          📥
        </button>
      </div>

    </div>
  );

  /* ══════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════ */
  return (
    <div className="applications-container">

      {/* Header */}
      <div className="applications-header">
        <div>
          <h1>International Applications</h1>
          <div className="header-subtitle">
            <p>Manage and review all student applications</p>
          </div>
        </div>
        <button onClick={loadApplications} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Search + Filter */}
      <div className="applications-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, college ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="not-started">Not Started</option>
            <option value="incomplete">Incomplete</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="applications-overview">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Applications</h3>
            <span className="stat-number">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card incomplete">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Incomplete</h3>
            <span className="stat-number">{stats.incomplete}</span>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: Table view ── */}
      <div className="applications-table-container">
        <table className="applications-table">
          <thead>
            <tr>
              <th>College ID</th>
              <th>Student</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Progress</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-results">
                  <div className="empty-table-state"><p>No applications found</p></div>
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.studentId}>
                  <td><span className="college-id-badge">{app.collegeId}</span></td>
                  <td className="student-info">
                    <div className="student-avatar">{app.student.name.charAt(0).toUpperCase()}</div>
                    <div className="student-details">
                      <strong>{app.student.name}</strong>
                      <small>{app.student.email}</small>
                      {app.student.phone && app.student.phone !== "N/A" && (
                        <small className="student-phone">{app.student.phone}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${app.latestStatus}`}>
                      {formatStatus(app.latestStatus)}
                    </span>
                  </td>
                  <td className="submission-date">{formatDate(app.submittedAt)}</td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-info">
                        <span className="progress-percentage">{app.latestProgress}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill progress-${getProgressClass(app.latestProgress)}`}
                          style={{ width: `${app.latestProgress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => setSelectedApp(app)}>
                        <span className="btn-icon">👁️</span> View
                      </button>
                      <button className="btn-download" onClick={() => downloadPDF(app)}>
                        <span className="btn-icon">📥</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Desktop footer */}
        {filteredApplications.length > 0 && (
          <div className="table-footer">
            <span className="table-footer-count">
              Showing {filteredApplications.length} of {stats.total} applications
            </span>
            <button onClick={loadApplications} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE: Card list view ── */}
      <div className="applications-card-list">
        {filteredApplications.length === 0 ? (
          <div className="empty-table-state" style={{ padding: "2rem", background: "#fff", borderRadius: 16 }}>
            <p>No applications found</p>
          </div>
        ) : (
          <>
            {filteredApplications.map((app) => renderMobileCard(app))}
            <div className="app-card-list-footer">
              <span>Showing {filteredApplications.length} of {stats.total} applications</span>
              <button onClick={loadApplications} className="refresh-btn">🔄 Refresh</button>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════
          VIEW DETAILS MODAL
          shared by desktop + mobile
          header = pinned, modal-content = scrolls
      ══════════════════════════════════════ */}
      {selectedApp && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedApp(null); }}
        >
          <div className="modal-box">

            {/* ── Pinned header ── */}
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>Application Details</h2>
                <div className="modal-subtitle">
                  <span className="student-name">{selectedApp.student.name}</span>
                  <span className="college-id">{selectedApp.collegeId}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedApp(null)}>×</button>
            </div>

            {/* ── Scrollable content area ── */}
            <div className="modal-content">

              {/* Student Info */}
              <div className="info-section">
                <div className="section-header">
                  <h3>Student Information</h3>
                  <div className="status-display">
                    <span className={`status-badge status-${selectedApp.latestStatus}`}>
                      {formatStatus(selectedApp.latestStatus)}
                    </span>
                    <span className="progress-display">{selectedApp.latestProgress}% Complete</span>
                  </div>
                </div>
                <div className="info-grid">
                  {[
                    ["Student Name",   selectedApp.student.name],
                    ["Email",          selectedApp.student.email],
                    ["Phone",          selectedApp.student.phone],
                    ["College ID",     selectedApp.collegeId],
                    ["Application ID", selectedApp.applications[0]?._id],
                    ["Submitted",      formatDate(selectedApp.submittedAt)],
                  ]
                    .filter(([, v]) => v && v !== "N/A")
                    .map(([label, value]) => (
                      <div className="info-row" key={label}>
                        <span className="info-label">{label}:</span>
                        <span className={`info-value${
                          label === "Email" ? " email-value" :
                          label === "Phone" ? " phone-value" : ""
                        }`}>
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Application detail sections */}
              {selectedApp.applications.map((app, index) => (
                <div className="info-section" key={index}>
                  <h3 className="section-title">{app.type.toUpperCase()} DETAILS</h3>
                  <div className="info-grid">
                    {Object.entries(app.details || {})
                      .filter(([key]) =>
                        !["_id","collegeId","status","progress","createdAt","updatedAt","__v","studentId"].includes(key)
                      )
                      .map(([key, value]) => (
                        <div className="info-row" key={key}>
                          <span className="info-label">{formatFieldName(key)}:</span>
                          <span className="info-value">{formatFieldValue(key, value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              {/* System info */}
              <div className="info-section system-info">
                <h3>System Information</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Created At:</span>
                    <span className="info-value">
                      {formatDate(selectedApp.applications[0]?.details?.createdAt)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">
                      {formatDate(
                        selectedApp.applications[0]?.details?.updatedAt ||
                        selectedApp.applications[0]?.details?.lastSaved
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Document Version:</span>
                    <span className="info-value">
                      {selectedApp.applications[0]?.details?._v || "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions — inside modal-content so they scroll with content */}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
                <button className="btn-primary" onClick={() => downloadPDF(selectedApp)}>
                  <span className="btn-icon">📥</span> Download PDF
                </button>
              </div>

            </div>{/* end modal-content */}
          </div>{/* end modal-box */}
        </div>/* end modal-overlay */
      )}
    </div>
  );
};

export default Applications;