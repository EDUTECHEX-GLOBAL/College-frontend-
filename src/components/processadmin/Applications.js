// Applications.js – INTERNATIONAL APPLICATIONS (ADMIN) — Purple/Amber Theme
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Applications.css";

const Applications = () => {
  // ===============================
  // STATE
  // ===============================
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    incomplete: 0,
  });

  // ===============================
  // API SETUP
  // ===============================
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // ===============================
  // Auth Token Resolver (ONE place)
  // ===============================
  const getAuthToken = () => {
    // Priority order - processAdminToken first, then others
    return (
      localStorage.getItem("processAdminToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken")
    );
  };

  // ===============================
  // Axios Request Interceptor
  // ===============================
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔐 Auth token attached to request");
      } else {
        console.warn("⚠️ No admin/process-admin token found");
      }

      // Always set content type
      config.headers["Content-Type"] = "application/json";

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle auth errors gracefully
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log("🔴 Authentication failed - token may be invalid");
      } else if (error.response?.status === 403) {
        console.log("🔴 Authorization failed - insufficient permissions");
      }
      return Promise.reject(error);
    }
  );

  // ===============================
  // HELPERS
  // ===============================
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const formatStatus = (status) => {
    const map = {
      "not-started": "Not Started",
      "in-progress": "In Progress",
      completed: "Completed",
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      incomplete: "Incomplete",
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
      _id: "Application ID",
      collegeId: "College ID",
      highSchoolGraduated: "High School Graduated",
      attendedClassesSinceGraduation: "Attended Classes Since Graduation",
      addAnotherSchool: "Add Another School",
      schoolName: "School Name",
      schoolStartDate: "School Start Date",
      schoolEndDate: "School End Date",
      requestedImmigrationStatus: "Requested Visa Status",
      currentlyInUS: "Currently in US",
      currentImmigrationStatus: "Current Immigration Status",
      hearAboutKU: "How did you hear about KU?",
      applicationFeeAgreement: "Application Fee Agreement",
      certificationAgreement: "Certification Agreement",
      thirdPartyPreparation: "Third Party Preparation",
      progress: "Progress",
      status: "Status",
      createdAt: "Created At",
      updatedAt: "Updated At",
      _v: "Version",
      studentName: "Student Name",
      studentEmail: "Student Email",
      studentId: "Student Database ID",
    };

    if (nameMap[key]) return nameMap[key];

    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatFieldValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    if (key.includes("Date") || key.includes("At")) {
      return formatDate(value);
    }

    if (
      key.includes("Agreement") ||
      key === "thirdPartyPreparation" ||
      key === "highSchoolGraduated" ||
      key === "currentlyInUS" ||
      key === "addAnotherSchool" ||
      key === "attendedClassesSinceGraduation"
    ) {
      return value === "yes" || value === true || value === "agree"
        ? "Yes"
        : value === "no" || value === false
        ? "No"
        : String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "N/A";
    }

    if (typeof value === "object") {
      if (
        value.street1 !== undefined ||
        value.city !== undefined ||
        value.zip !== undefined
      ) {
        return [
          value.street1,
          value.street2,
          value.street3,
          value.city,
          value.state,
          value.country,
          value.zip,
        ]
          .filter(Boolean)
          .join(", ") || "N/A";
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
        ["Name", app.student.name],
        ["Email", app.student.email],
        ["Phone", app.student.phone || "N/A"],
        ["College ID", app.collegeId],
        ["Status", formatStatus(app.latestStatus)],
        ["Progress", `${app.latestProgress}%`],
        ["Submitted", formatDate(app.submittedAt)],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: 140 },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    app.applications.forEach((section) => {
      doc.setFontSize(12);
      doc.text(`${section.type.toUpperCase()} DETAILS`, 10, y);
      y += 5;

      const rows = Object.entries(section.details || {})
        .filter(
          ([key]) =>
            ![
              "_id",
              "collegeId",
              "status",
              "progress",
              "createdAt",
              "updatedAt",
              "__v",
              "studentId",
            ].includes(key)
        )
        .map(([key, value]) => [
          formatFieldName(key),
          formatFieldValue(key, value),
        ]);

      if (rows.length) {
        autoTable(doc, {
          startY: y,
          body: rows,
          theme: "grid",
          styles: { fontSize: 9 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 50 },
            1: { cellWidth: 130 },
          },
        });

        y = doc.lastAutoTable.finalY + 8;
      }
    });

    doc.save(`${app.student.name.replace(/\s+/g, "_")}_Application.pdf`);
  };

  const groupByStudent = (records) => {
    const map = {};

    records.forEach((app) => {
      const studentKey =
        app.details?.studentId?._id ||
        app.studentId?._id ||
        app.student?._id;

      if (!studentKey) return;

      if (!map[studentKey]) {
        map[studentKey] = {
          studentId: studentKey,
          collegeId: app.collegeId,
          student: app.student,
          submittedAt: app.submittedAt,
          latestStatus: app.status,
          latestProgress: app.progress,
          applications: [],
        };
      }

      map[studentKey].applications.push(app);

      if (
        app.submittedAt &&
        new Date(app.submittedAt) > new Date(map[studentKey].submittedAt)
      ) {
        map[studentKey].submittedAt = app.submittedAt;
        map[studentKey].latestStatus = app.status;
        map[studentKey].latestProgress = app.progress;
      }
    });

    return Object.values(map);
  };

  // ===============================
  // FILTER APPLICATIONS
  // ===============================
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
        (app.latestStatus === "not-started" ||
          app.latestStatus === "in-progress"));

    return matchesSearch && matchesStatus;
  });

  // ===============================
  // LOAD APPLICATIONS - USING PROCESS-ADMIN ENDPOINTS
  // ===============================
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if token exists first
      const token = getAuthToken();
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Loading applications using process-admin endpoints...");

      // Use Promise.allSettled to handle individual API failures
      const results = await Promise.allSettled([
        // ✅ Using process-admin endpoints
        api.get("/api/international/process-admin/all").catch(err => {
          console.log("International API unavailable:", err.message);
          return { data: { internationalRecords: [] } };
        }),
        api.get("/api/academics/process-admin/all").catch(err => {
          console.log("Academics API unavailable:", err.message);
          return { data: { academicApplications: [] } };
        }),
        api.get("/api/general/process-admin/all").catch(err => {
          console.log("General API unavailable:", err.message);
          return { data: { generalApplications: [] } };
        }),
        api.get("/api/family/process-admin/all").catch(err => {
          console.log("Family API unavailable:", err.message);
          return { data: { familyRecords: [] } };
        }),
        api.get("/api/contacts/process-admin/all").catch(err => {
          console.log("Contacts API unavailable:", err.message);
          return { data: { contactsRecords: [] } };
        }),
        api.get("/api/residency/process-admin/all").catch(err => {
          console.log("Residency API unavailable:", err.message);
          return { data: { residencyRecords: [] } };
        }),
        api.get("/api/high-school-curriculum/process-admin/all").catch(err => {
          console.log("High School API unavailable:", err.message);
          return { data: { highSchoolCurricula: [] } };
        })
      ]);

      // Extract data from successful responses, use empty arrays for failures
      const internationalRes = results[0].status === 'fulfilled' ? results[0].value : { data: { internationalRecords: [] } };
      const academicRes = results[1].status === 'fulfilled' ? results[1].value : { data: { academicApplications: [] } };
      const generalRes = results[2].status === 'fulfilled' ? results[2].value : { data: { generalApplications: [] } };
      const familyRes = results[3].status === 'fulfilled' ? results[3].value : { data: { familyRecords: [] } };
      const contactsRes = results[4].status === 'fulfilled' ? results[4].value : { data: { contactsRecords: [] } };
      const residencyRes = results[5].status === 'fulfilled' ? results[5].value : { data: { residencyRecords: [] } };
      const highSchoolRes = results[6].status === 'fulfilled' ? results[6].value : { data: { highSchoolCurricula: [] } };

      const internationalRecords = internationalRes.data?.internationalRecords || [];
      const academicRecords = academicRes.data?.academicApplications || [];
      const generalRecords = generalRes.data?.generalApplications || [];
      const familyRecords = familyRes.data?.familyRecords || [];
      const contactsRecords = contactsRes.data?.contactsRecords || [];
      const residencyRecords = residencyRes.data?.residencyRecords || [];
      const highSchoolRecords = highSchoolRes.data?.highSchoolCurricula || [];

      console.log(`📊 Records loaded:`, {
        international: internationalRecords.length,
        academic: academicRecords.length,
        general: generalRecords.length,
        family: familyRecords.length,
        contacts: contactsRecords.length,
        residency: residencyRecords.length,
        highSchool: highSchoolRecords.length
      });

      const mappedInternational = internationalRecords.map((app) => ({
        _id: app._id,
        collegeId: app.collegeId,
        status: app.progress === 100 ? "completed" : "incomplete",
        progress: app.progress || 0,
        submittedAt: app.createdAt,
        student: {
          name: app.studentId
            ? `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim()
            : "N/A",
          email: app.studentId?.email || "N/A",
          phone: app.studentId?.phone || "N/A",
        },
        details: app,
        type: "international",
      }));

      const mappedAcademic = academicRecords.map((app) => ({
        _id: app._id,
        collegeId: app.collegeId,
        status: app.progress === 100 ? "completed" : "incomplete",
        progress: app.progress || 0,
        submittedAt: app.lastSaved || app.createdAt,
        student: {
          name: app.studentId
            ? `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim()
            : "N/A",
          email: app.studentId?.email || "N/A",
          phone: app.studentId?.phone || "N/A",
        },
        details: app,
        type: "academic",
      }));

      const mappedGeneral = generalRecords.map((app) => ({
        _id: app._id,
        collegeId: app.collegeId,
        status: app.status || "not-started",
        progress: app.progress || 0,
        submittedAt: app.details?.lastSaved || app.details?.createdAt,
        student: {
          name: app.student?.name || "N/A",
          email: app.student?.email || "N/A",
          phone: app.student?.phone || "N/A",
        },
        details: app.details || {},
        type: "general",
      }));

      const mappedFamily = familyRecords
        .filter((app) => app.studentId && typeof app.studentId === "object")
        .map((app) => ({
          _id: app._id,
          collegeId: app.collegeId,
          status:
            app.progress === 100
              ? "completed"
              : app.progress > 0
              ? "in-progress"
              : "not-started",
          progress: app.progress || 0,
          submittedAt: app.lastUpdated || app.updatedAt || app.createdAt,
          student: {
            name: `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim(),
            email: app.studentId.email || "N/A",
            phone: app.studentId.phone || "N/A",
          },
          details: {
            studentId: app.studentId,
            parentGuardianAddress: app.parentGuardianAddress || "",
            parent1Address: app.parent1Address || {},
            parent2Address: app.parent2Address || {},
            showParent2Address: app.showParent2Address || false,
            kuGraduates: app.kuGraduates || [],
            kuEmployeeDependent: app.kuEmployeeDependent || "",
            kuEmployeeName: app.kuEmployeeName || "",
            kuEmployeeLocation: app.kuEmployeeLocation || "",
            militaryDependent: app.militaryDependent || "",
            militaryStatus: app.militaryStatus || "",
            vaBenefitsIntent: app.vaBenefitsIntent || "",
            lastUpdated: app.lastUpdated,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            progress: app.progress || 0,
          },
          type: "family",
        }));

      const mappedContacts = contactsRecords.map((contact) => ({
        _id: contact._id,
        collegeId: contact.collegeId || "N/A",
        status: contact.isComplete ? "completed" : "incomplete",
        progress: contact.progress || 0,
        submittedAt: contact.updatedAt || contact.createdAt,
        student: {
          name: contact.studentId
            ? `${contact.studentId.firstName || ""} ${contact.studentId.lastName || ""}`.trim()
            : "N/A",
          email: contact.studentId?.email || "N/A",
          phone: contact.studentId?.phone || "N/A",
        },
        details: contact,
        type: "contacts",
      }));

      const mappedResidency = residencyRecords.map((residency) => ({
        _id: residency._id,
        collegeId: residency.collegeId,
        status: residency.status || "not-started",
        progress: residency.progress || 0,
        submittedAt:
          residency.submittedAt ||
          residency.details?.updatedAt ||
          residency.details?.createdAt,
        student: {
          name: residency.student?.name || "N/A",
          email: residency.student?.email || "N/A",
          phone: residency.student?.phone || "N/A",
        },
        details: residency.details,
        type: "residency",
      }));

      const mappedHighSchool = highSchoolRecords.map((app) => ({
        _id: app._id,
        collegeId: app.collegeId,
        status: app.progress === 100 ? "completed" : "incomplete",
        progress: app.progress || 0,
        submittedAt: app.updatedAt || app.createdAt,
        student: {
          name: app.studentId
            ? `${app.studentId.firstName || ""} ${app.studentId.lastName || ""}`.trim()
            : "Unknown Student",
          email: app.studentId?.email || "N/A",
          phone: app.studentId?.phone || "N/A",
        },
        details: app,
        type: "highschool",
      }));

      const combined = [
        ...mappedInternational,
        ...mappedAcademic,
        ...mappedGeneral,
        ...mappedFamily,
        ...mappedContacts,
        ...mappedResidency,
        ...mappedHighSchool,
      ];

      console.log(`Loaded ${combined.length} total records`);

      combined.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      const groupedApplications = groupByStudent(combined);
      setApplications(groupedApplications);

      setStats({
        total: groupedApplications.length,
        pending: groupedApplications.filter((a) => a.latestStatus === "pending").length,
        accepted: groupedApplications.filter((a) => a.latestStatus === "accepted").length,
        rejected: groupedApplications.filter((a) => a.latestStatus === "rejected").length,
        incomplete: groupedApplications.filter(
          (a) => a.latestStatus === "not-started" || a.latestStatus === "in-progress"
        ).length,
      });

      // If we got zero records but no error, show a helpful message
      if (combined.length === 0) {
        console.log("No applications found. This could be because:");
        console.log("1. No applications exist in the database");
        console.log("2. The API endpoints are returning empty arrays");
        console.log("3. Authentication issues prevented data loading");
      }
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===============================
  // INITIAL LOAD
  // ===============================
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // ===============================
  // RENDER STATES
  // ===============================
  if (loading) {
    return (
      <div className="applications-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="applications-container">
        <div className="empty-state">
          <h3>Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={loadApplications} className="retry-btn">Retry</button>
            <button onClick={() => window.location.href = "/process-admin-login"} className="login-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <div className="applications-container">
      <div className="applications-header">
        <h1>International Applications</h1>
        <div className="header-subtitle">
          <p>Manage and review all student applications</p>
          <button onClick={loadApplications} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="applications-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, college ID, or status..."
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

      {/* Overview Stats Cards */}
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

      {/* Applications Table */}
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
                  <div className="empty-table-state">
                    <p>No applications found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.studentId}>
                  <td>
                    <span className="college-id-badge">{app.collegeId}</span>
                  </td>

                  <td className="student-info">
                    <div className="student-avatar">
                      {app.student.name.charAt(0).toUpperCase()}
                    </div>
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
                          className={`progress-fill progress-${getProgressClass(
                            app.latestProgress
                          )}`}
                          style={{ width: `${app.latestProgress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => setSelectedApp(app)}
                        title="View Details"
                      >
                        <span className="btn-icon">👁️</span>
                        View
                      </button>
                      <button
                        className="btn-download"
                        onClick={() => downloadPDF(app)}
                        title="Download PDF"
                      >
                        <span className="btn-icon">📥</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>Application Details</h2>
                <div className="modal-subtitle">
                  <span className="student-name">{selectedApp.student.name}</span>
                  <span className="college-id">{selectedApp.collegeId}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedApp(null)}>
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* Student Information Section */}
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
                  <div className="info-row">
                    <span className="info-label">Student Name:</span>
                    <span className="info-value">{selectedApp.student.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value email-value">{selectedApp.student.email}</span>
                  </div>
                  {selectedApp.student.phone && selectedApp.student.phone !== "N/A" && (
                    <div className="info-row">
                      <span className="info-label">Phone:</span>
                      <span className="info-value phone-value">{selectedApp.student.phone}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">College ID:</span>
                    <span className="info-value">{selectedApp.collegeId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Application ID:</span>
                    <span className="info-value app-id">{selectedApp.applications[0]?._id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Submitted:</span>
                    <span className="info-value">{formatDate(selectedApp.submittedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Application Sections */}
              {selectedApp.applications.map((app, index) => (
                <div className="info-section" key={index}>
                  <h3 className="section-title">{app.type.toUpperCase()} DETAILS</h3>
                  <div className="info-grid">
                    {Object.entries(app.details || {})
                      .filter(
                        ([key]) =>
                          ![
                            "_id",
                            "collegeId",
                            "status",
                            "progress",
                            "createdAt",
                            "updatedAt",
                            "__v",
                            "studentId",
                          ].includes(key)
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

              {/* System Information Section */}
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

              {/* Action Buttons */}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedApp(null)}>
                  Close
                </button>

                <button className="btn-primary" onClick={() => downloadPDF(selectedApp)}>
                  <span className="btn-icon">📥</span>
                  Download PDF
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