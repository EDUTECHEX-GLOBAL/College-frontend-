// Applications.js – INTERNATIONAL APPLICATIONS — Navy Blue Design System
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
  const [activeTab, setActiveTab]       = useState("applications");

  const [stats, setStats] = useState({
    total: 0, pending: 0, accepted: 0, rejected: 0,
    incomplete: 0, completed: 0, inProgress: 0,
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

  const getAuthToken = () =>
    localStorage.getItem("processAdminToken") ||
    localStorage.getItem("token");

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

  /* Progress bar color — navy blue palette */
  const getProgressColor = (progress) => {
    if (progress >= 90) return "pf-blue-nav";
    if (progress >= 70) return "pf-blue";
    if (progress >= 40) return "pf-amber";
    return "pf-red";
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

  /* Avatar color — blue palette */
  const getAvatarColor = (name = "") => {
    const colors = ["av-teal", "av-blue", "av-purple", "av-amber", "av-coral"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
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
        total:      grouped.length,
        pending:    grouped.filter((a) => a.latestStatus === "pending").length,
        accepted:   grouped.filter((a) => a.latestStatus === "accepted").length,
        rejected:   grouped.filter((a) => a.latestStatus === "rejected").length,
        incomplete: grouped.filter((a) => a.latestStatus === "not-started" || a.latestStatus === "in-progress").length,
        completed:  grouped.filter((a) => a.latestStatus === "completed").length,
        inProgress: grouped.filter((a) => a.latestStatus === "in-progress").length,
      });
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  useEffect(() => {
    if (selectedApp) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [selectedApp]);

  /* ── SVG Icons ── */
  const IcoRefresh = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
  const IcoSearch = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  const IcoEye = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const IcoDl = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
  const IcoDoc = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
  const IcoFolder = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  );
  const IcoRequests = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  const IcoCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  const IcoClock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  const IcoApps = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );

  if (loading) return (
    <div className="ap-container">
      <div className="ap-loading">
        <div className="ap-spinner"/>
        <p>Loading Applications…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="ap-container">
      <div className="ap-empty-state">
        <h3>Error</h3>
        <p>{error}</p>
        <div className="ap-error-actions">
          <button onClick={loadApplications} className="ap-retry-btn">Retry</button>
          <button onClick={() => (window.location.href = "/process-admin-login")} className="ap-login-btn">Go to Login</button>
        </div>
      </div>
    </div>
  );

  /* ── Mobile Card ── */
  const renderMobileCard = (app) => (
    <div className="ap-mob-card" key={app.studentId}>
      <div className="ap-mob-card-top">
        <span className="ap-cid-badge">{app.collegeId}</span>
        <span className={`ap-status-badge ap-s-${app.latestStatus}`}>{formatStatus(app.latestStatus)}</span>
      </div>
      <div className="ap-mob-card-body">
        <div className="ap-mob-student">
          <div className={`ap-avatar ${getAvatarColor(app.student.name)}`}>
            {app.student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="ap-mob-name">{app.student.name}</div>
            <div className="ap-mob-email">{app.student.email}</div>
          </div>
        </div>
        <div className="ap-mob-details">
          <div className="ap-mob-detail-item">
            <span className="ap-mob-detail-lbl">Submitted</span>
            <span className="ap-mob-detail-val">{formatDate(app.submittedAt)}</span>
          </div>
          <div className="ap-mob-detail-item">
            <span className="ap-mob-detail-lbl">Status</span>
            <span className="ap-mob-detail-val">{formatStatus(app.latestStatus)}</span>
          </div>
          <div className="ap-mob-detail-item ap-mob-full">
            <span className="ap-mob-detail-lbl">Progress</span>
            <div className="ap-prog-wrap">
              <div className="ap-prog-bar">
                <div className={`ap-prog-fill ${getProgressColor(app.latestProgress)}`} style={{ width: `${app.latestProgress}%` }}/>
              </div>
              <span className="ap-prog-pct">{app.latestProgress}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="ap-mob-card-footer">
        <button className="ap-view-btn" onClick={() => setSelectedApp(app)}>
          <IcoEye /> View Details
        </button>
        <button className="ap-dl-btn" onClick={() => downloadPDF(app)} title="Download PDF">
          <IcoDl />
        </button>
      </div>
    </div>
  );

  return (
    <div className="ap-container">

      {/* ── Hero header — University Directory style ── */}
      <div className="ap-hero">
        <div className="ap-hero-accent"/>
        <div className="ap-hero-left">
          <div className="ap-hero-title">International<br/>Applications</div>
          <div className="ap-hero-sub">Manage and review all student applications</div>
        </div>
        <div className="ap-hero-right">
          <div className="ap-hero-badge">
            <div className="ap-hero-badge-num">{stats.total}</div>
            <div className="ap-hero-badge-lbl">Applications</div>
          </div>
          <button className="ap-refresh-btn" onClick={loadApplications}>
            <IcoRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ap-tabs">
        {[
          { key: "applications", label: "Applications", Icon: IcoDoc },
          { key: "documents",    label: "Documents",    Icon: IcoFolder },
          { key: "requests",     label: "Requests",     Icon: IcoRequests },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`ap-tab ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="ap-stats-grid">
        <div className="ap-sc">
          <div className="ap-sc-icon ap-ic-teal"><IcoApps /></div>
          <div>
            <div className="ap-sc-lbl">Total Applications</div>
            <div className="ap-sc-val">{stats.total}</div>
            <div className="ap-sc-sub">{stats.completed} Completed · {stats.incomplete} Pending</div>
          </div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-icon ap-ic-coral"><IcoClock /></div>
          <div>
            <div className="ap-sc-lbl">In Progress</div>
            <div className="ap-sc-val">{stats.inProgress}</div>
            <div className="ap-sc-sub">Needs attention</div>
          </div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-icon ap-ic-blue"><IcoCheck /></div>
          <div>
            <div className="ap-sc-lbl">Completed</div>
            <div className="ap-sc-val">{stats.completed}</div>
            <div className="ap-sc-sub">100% profile done</div>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="ap-table-card">

        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <span className="ap-search-ico"><IcoSearch /></span>
            <input
              type="text"
              className="ap-search-input"
              placeholder="Search by name, email, college ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="ap-filter-sel"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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
          <button className="ap-refresh-btn" onClick={loadApplications}>
            <IcoRefresh /> Refresh
          </button>
        </div>

        {/* ── Desktop table ── */}
        <div className="ap-desktop-table">
          <div className="ap-table-wrap">
            <table className="ap-table">
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
                    <td colSpan="6" className="ap-no-results">
                      <div className="ap-empty-table"><p>No applications found</p></div>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.studentId}>
                      <td><span className="ap-cid-badge">{app.collegeId}</span></td>
                      <td>
                        <div className="ap-student-cell">
                          <div className={`ap-avatar ${getAvatarColor(app.student.name)}`}>
                            {app.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ap-student-info">
                            <strong>{app.student.name}</strong>
                            <small>{app.student.email}</small>
                            {app.student.phone && app.student.phone !== "N/A" && (
                              <small className="ap-phone">{app.student.phone}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ap-status-badge ap-s-${app.latestStatus}`}>
                          {formatStatus(app.latestStatus)}
                        </span>
                      </td>
                      <td className="ap-date">{formatDate(app.submittedAt)}</td>
                      <td>
                        <div className="ap-prog-wrap">
                          <div className="ap-prog-bar">
                            <div
                              className={`ap-prog-fill ${getProgressColor(app.latestProgress)}`}
                              style={{ width: `${app.latestProgress}%` }}
                            />
                          </div>
                          <span className="ap-prog-pct">{app.latestProgress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="ap-action-btns">
                          <button className="ap-view-btn" onClick={() => setSelectedApp(app)}>
                            <IcoEye /> View
                          </button>
                          <button className="ap-dl-btn" onClick={() => downloadPDF(app)} title="Download PDF">
                            <IcoDl />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredApplications.length > 0 && (
            <div className="ap-table-footer">
              <span className="ap-footer-count">
                Showing {filteredApplications.length} of {stats.total} applications
              </span>
              <button className="ap-refresh-btn" onClick={loadApplications}>
                <IcoRefresh /> Refresh
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile card list ── */}
        <div className="ap-mobile-list">
          {filteredApplications.length === 0 ? (
            <div className="ap-empty-table" style={{ padding: "2rem" }}>
              <p>No applications found</p>
            </div>
          ) : (
            <>
              {filteredApplications.map((app) => renderMobileCard(app))}
              <div className="ap-mob-list-footer">
                <span>Showing {filteredApplications.length} of {stats.total} applications</span>
                <button className="ap-refresh-btn" onClick={loadApplications}><IcoRefresh /> Refresh</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── View Details Modal ── */}
      {selectedApp && (
        <div className="ap-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedApp(null); }}>
          <div className="ap-modal-box">
            <div className="ap-modal-header">
              <div className="ap-modal-title-wrap">
                <h2>Application Details</h2>
                <div className="ap-modal-subtitle">
                  <span className="ap-modal-student-name">{selectedApp.student.name}</span>
                  <span className="ap-modal-cid">{selectedApp.collegeId}</span>
                </div>
              </div>
              <button className="ap-modal-close" onClick={() => setSelectedApp(null)}>×</button>
            </div>

            <div className="ap-modal-content">
              <div className="ap-info-section">
                <div className="ap-section-hdr">
                  <h3>Student Information</h3>
                  <div className="ap-status-display">
                    <span className={`ap-status-badge ap-s-${selectedApp.latestStatus}`}>
                      {formatStatus(selectedApp.latestStatus)}
                    </span>
                    <span className="ap-prog-display">{selectedApp.latestProgress}% Complete</span>
                  </div>
                </div>
                <div className="ap-info-grid">
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
                      <div className="ap-info-row" key={label}>
                        <span className="ap-info-label">{label}</span>
                        <span className={`ap-info-value ${label === "Email" ? "ap-email-val" : label === "Phone" ? "ap-phone-val" : ""}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {selectedApp.applications.map((app, index) => (
                <div className="ap-info-section" key={index}>
                  <h3 className="ap-section-title">{app.type.toUpperCase()} Details</h3>
                  <div className="ap-info-grid">
                    {Object.entries(app.details || {})
                      .filter(([key]) =>
                        !["_id","collegeId","status","progress","createdAt","updatedAt","__v","studentId"].includes(key)
                      )
                      .map(([key, value]) => (
                        <div className="ap-info-row" key={key}>
                          <span className="ap-info-label">{formatFieldName(key)}</span>
                          <span className="ap-info-value">{formatFieldValue(key, value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              <div className="ap-info-section ap-system-info">
                <h3>System Information</h3>
                <div className="ap-info-grid">
                  <div className="ap-info-row">
                    <span className="ap-info-label">Created At</span>
                    <span className="ap-info-value">{formatDate(selectedApp.applications[0]?.details?.createdAt)}</span>
                  </div>
                  <div className="ap-info-row">
                    <span className="ap-info-label">Last Updated</span>
                    <span className="ap-info-value">
                      {formatDate(selectedApp.applications[0]?.details?.updatedAt || selectedApp.applications[0]?.details?.lastSaved)}
                    </span>
                  </div>
                  <div className="ap-info-row">
                    <span className="ap-info-label">Document Version</span>
                    <span className="ap-info-value">{selectedApp.applications[0]?.details?._v || "0"}</span>
                  </div>
                </div>
              </div>

              <div className="ap-modal-actions">
                <button className="ap-btn-secondary" onClick={() => setSelectedApp(null)}>Close</button>
                <button className="ap-btn-primary" onClick={() => downloadPDF(selectedApp)}>
                  <IcoDl /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;