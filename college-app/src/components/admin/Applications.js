// Applications.js – INTERNATIONAL APPLICATIONS (ADMIN)
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import "./Applications.css";

const Applications = () => {
  // ===============================
  // STATE
  // ===============================
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null); // 🔥 modal data

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
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  api.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    config.headers["Content-Type"] = "application/json";
    return config;
  });

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

  // Helper to format field names
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
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Helper to format field values
  const formatFieldValue = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    if (key.includes("Date") || key.includes("At")) {
      return formatDate(value);
    }

    if (key.includes("Agreement") || key === "thirdPartyPreparation" ||
      key === "highSchoolGraduated" || key === "currentlyInUS" ||
      key === "addAnotherSchool" || key === "attendedClassesSinceGraduation") {
      return value === "yes" || value === true || value === "agree" ? "Yes" :
        value === "no" || value === false ? "No" : String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "N/A";
    }

    if (typeof value === "object") {
      // Address object formatting
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
          value.zip
        ]
          .filter(Boolean)
          .join(", ") || "N/A";
      }

      return "N/A";
    }

    return String(value);

  };
 const groupByStudent = (records) => {
  const map = {};

  records.forEach((app) => {
    // ✅ Always derive key from studentId
    const studentKey =
      app.details?.studentId?._id ||
      app.studentId?._id ||
      app.student?._id;

    if (!studentKey) return; // safety

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

    // keep latest submission info
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
  // LOAD APPLICATIONS (INTERNATIONAL + ACADEMIC + GENERAL + FAMILY + CONTACTS)
  // ===============================
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all APIs in parallel, including Contacts
      const [
        internationalRes,
        academicRes,
        generalRes,
        familyRes,
        contactsRes,
        residencyRes // ✅ add this
      ] = await Promise.all([
        api.get("/international/admin/all"),
        api.get("/academics/admin/all"),
        api.get("/general/admin/all"),
        api.get("/family/admin/all"),
        api.get("/contacts/admin/all"),// ✅ Contacts API
        api.get("/residency/admin/all"), // 🔥 Residency API
      ]);

      const internationalRecords = internationalRes.data?.internationalRecords || [];
      const academicRecords = academicRes.data?.academicApplications || [];
      const generalRecords = generalRes.data?.generalApplications || [];
      const familyRecords = familyRes.data?.familyRecords || [];
      const contactsRecords = contactsRes.data?.contactsRecords || [];
      const residencyRecords = residencyRes.data?.residencyRecords || [];


      // -------------------------------
      // Map International records
      // -------------------------------
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

      // -------------------------------
      // Map Academic records
      // -------------------------------
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
        details: app.details || {}, // 🔥 THIS IS THE KEY FIX
        type: "general",
      }));


      // -------------------------------
      // Map Family records
      // -------------------------------
      const mappedFamily = familyRecords
        .filter(app => app.studentId && typeof app.studentId === "object")
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
  studentId: app.studentId, // 🔥 ADD THIS LINE
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

      // -------------------------------
      // Map Contacts records
      // -------------------------------
      const mappedContacts = contactsRecords
        .map((contact) => ({
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
        submittedAt: residency.submittedAt || residency.details?.updatedAt || residency.details?.createdAt,
        student: {
          name: residency.student?.name || "N/A",
          email: residency.student?.email || "N/A",
          phone: residency.student?.phone || "N/A",
        },
        details: residency.details,
        type: "residency",
      }));


      // -------------------------------
      // Combine all datasets
      // -------------------------------
      const combined = [
        ...mappedInternational,
        ...mappedAcademic,
        ...mappedGeneral,
        ...mappedFamily,
        ...mappedContacts, // ✅ added Contacts
        ...mappedResidency,
      ];

      // Sort by most recently submitted
      combined.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      // Update state
      const groupedApplications = groupByStudent(combined);
      setApplications(groupedApplications);


      // Update stats
      setStats({
        total: groupedApplications.length,
        pending: groupedApplications.filter(a => a.latestStatus === "pending").length,
        accepted: groupedApplications.filter(a => a.latestStatus === "accepted").length,
        rejected: groupedApplications.filter(a => a.latestStatus === "rejected").length,
        incomplete: groupedApplications.filter(
          a => a.latestStatus === "not-started" || a.latestStatus === "in-progress"
        ).length,
      });


    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications");
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
          <button onClick={loadApplications}>Retry</button>
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
      </div>

      {/* Overview Stats Cards */}
      <div className="applications-overview">
        <div className="stat-card total">
          <h3>Total Applications</h3>
          <span className="stat-number">{stats.total}</span>
        </div>
        
        <div className="stat-card incomplete">
          <h3>Incomplete</h3>
          <span className="stat-number">{stats.incomplete}</span>
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
            {applications.map((app) => (
              <tr key={app.studentId}>

                <td>{app.collegeId}</td>

                <td className="student-info">
                  <strong>{app.student.name}</strong>
                  <small>{app.student.email}</small>
                  {app.student.phone && app.student.phone !== "N/A" && (
                    <small>{app.student.phone}</small>
                  )}
                </td>

                <td>
                  <span className={`status-badge status-${app.latestStatus}`}>
                    {formatStatus(app.latestStatus)}
                  </span>

                </td>

                <td>{formatDate(app.submittedAt)}</td>

                <td>
                  <div className="progress-container">
                    <div
                      className={`progress-bar progress-${getProgressClass(app.latestProgress)}`}
                      style={{ width: `${app.latestProgress}%` }}
                    />

                  </div>
                  <small>{app.latestProgress}%</small>
                </td>

                <td>
                  <div className="action-buttons-simple">
                    <button
                      className="btn-single-view"
                      onClick={() => setSelectedApp(app)}

                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Application Details</h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedApp(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {/* Student Information Section */}
              <div className="info-section">
                <h3>Student Information</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Student Name:</span>
                    <span className="info-value">{selectedApp.student.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedApp.student.email}</span>
                  </div>
                  {selectedApp.student.phone && selectedApp.student.phone !== "N/A" && (
                    <div className="info-row">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{selectedApp.student.phone}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">College ID:</span>
                    <span className="info-value">{selectedApp.collegeId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Application ID:</span>
                    <span className="info-value">{selectedApp.applications[0]?._id}</span>

                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge status-${selectedApp.latestStatus}`}>
                      {formatStatus(selectedApp.latestStatus)}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Progress:</span>
                    <span className="info-value">{selectedApp.latestProgress}%</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Submitted:</span>
                    <span className="info-value">{formatDate(selectedApp.submittedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Application Details Section */}
              {selectedApp.applications.map((app, index) => (
                <div className="info-section" key={index}>
                  <h3>{app.type.toUpperCase()} DETAILS</h3>

                  <div className="info-grid">
                    {Object.entries(app.details || {})
                      .filter(([key]) =>
                        ![
                          '_id',
                          'collegeId',
                          'status',
                          'progress',
                          'createdAt',
                          'updatedAt',
                          '__v',
                          'studentId'
                        ].includes(key)
                      )
                      .map(([key, value]) => (
                        <div className="info-row" key={key}>
                          <span className="info-label">
                            {formatFieldName(key)}:
                          </span>
                          <span className="info-value">
                            {formatFieldValue(key, value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}


              {/* System Information Section */}
              <div className="info-section">
                <h3>System Information</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Created At:</span>
                    <span className="info-value">
                      {formatDate(selectedApp.details?.createdAt)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">
                      {formatDate(selectedApp.details?.updatedAt || selectedApp.details?.lastSaved)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Document Version:</span>
                    <span className="info-value">
                      {selectedApp.details?._v || "0"}
                    </span>
                  </div>
                </div>
              </div>


              {/* Action Buttons */}
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
                <button className="btn-primary" onClick={() => {
                  console.log("Process refund for:", selectedApp._id);
                }}>
                  Process Refund
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