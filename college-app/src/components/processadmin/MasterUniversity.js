import React, { useState, useEffect, useCallback } from "react";
import "./MasterUniversity.css";

/* ─────────────────────────────────────────────────────────────────────────────
   API CONFIG
───────────────────────────────────────────────────────────────────────────── */
const API_BASE = "http://localhost:5000/api/master-university";

const getToken = () =>
  localStorage.getItem("processAdminToken") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("processAdminToken") ||
  "";

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/* ─────────────────────────────────────────────────────────────────────────────
   API FUNCTIONS
───────────────────────────────────────────────────────────────────────────── */
const fetchStats = async () => {
  const res = await fetch(`${API_BASE}/process-admin/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
};

const fetchApplications = async ({
  page = 1,
  limit = 50,
  status = "all",
  search = "",
} = {}) => {
  const params = new URLSearchParams({ page, limit, status, search });
  const res = await fetch(`${API_BASE}/process-admin/all?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Applications fetch failed: ${res.status}`);
  return res.json();
};

const fetchApplicationDetail = async (id) => {
  const res = await fetch(`${API_BASE}/process-admin/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Detail fetch failed: ${res.status}`);
  return res.json();
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const getStatusLabel = (applicationStatus) => {
  if (applicationStatus === "submitted")    return "COMPLETED";
  if (applicationStatus === "draft")        return "INCOMPLETE";
  if (applicationStatus === "under_review") return "IN PROGRESS";
  return applicationStatus?.toUpperCase() || "UNKNOWN";
};

const getStatusClass = (applicationStatus) => {
  if (applicationStatus === "submitted")    return "status-completed";
  if (applicationStatus === "draft")        return "status-incomplete";
  if (applicationStatus === "under_review") return "status-inprogress";
  return "status-incomplete";
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "—"; }
};

/* short date for mobile (e.g. "Apr 28") */
const formatDateShort = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    });
  } catch { return "—"; }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────────────────────────────────────── */
const DetailModal = ({ studentId, onClose }) => {
  const [detail,    setDetail]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchApplicationDetail(studentId)
      .then((res) => { if (!cancelled) setDetail(res.data); })
      .catch((e)  => { if (!cancelled) setError(e.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const TABS = ["personal", "contact", "course", "academics", "tests", "documents"];

  const Row = ({ label, value }) => (
    <div className="modal-field">
      <span className="modal-field-lbl">{label}</span>
      <span className="modal-field-val">{value || "—"}</span>
    </div>
  );

  const renderPersonal = (d) => (
    <>
      <Row label="Full Name"      value={d.fullName} />
      <Row label="Date of Birth"  value={formatDate(d.dateOfBirth)} />
      <Row label="Gender"         value={d.gender} />
      <Row label="Nationality"    value={d.nationality} />
      <Row label="Passport No."   value={d.passportNumber} />
      <Row label="Marital Status" value={d.maritalStatus} />
      <Row label="Application ID" value={d.applicationId} />
      <Row label="Status" value={
        <span className={`status-badge ${getStatusClass(d.applicationStatus)}`}>
          {getStatusLabel(d.applicationStatus)}
        </span>
      } />
      {d.submittedAt && <Row label="Submitted At" value={formatDate(d.submittedAt)} />}
    </>
  );

  const renderContact = (d) => {
    const c = d.contact || {};
    const addr = [c.addressLine1, c.addressLine2, c.city, c.state, c.postalCode, c.country]
      .filter(Boolean).join(", ");
    return (
      <>
        <Row label="Email"           value={c.emailAddress} />
        <Row label="Mobile"          value={c.mobileNumber} />
        <Row label="Alternate Phone" value={c.alternatePhone} />
        <Row label="Address"         value={addr || "—"} />
      </>
    );
  };

  const renderCourse = (d) => {
    const c = d.course || {};
    return (
      <>
        <Row label="Preferred Course" value={c.preferredCourse} />
        <Row label="Specialization"   value={c.specialization} />
        <Row label="Intake"           value={c.intake} />
        <Row label="Mode of Study"    value={c.modeOfStudy} />
        <Row label="University"       value={c.universityName} />
        <Row label="Duration"         value={c.duration} />
        <Row label="Level"            value={c.level} />
        <Row label="Major Area"       value={c.majorArea} />
      </>
    );
  };

  const renderAcademics = (d) => {
    const entries = d.academics?.entries || [];
    if (!entries.length)
      return <p className="modal-empty-msg">No academic records found.</p>;
    return entries.map((entry, i) => (
      <div key={i} className="modal-academic-entry">
        <div className="modal-entry-title">Academic Entry {i + 1}</div>
        <Row label="Degree"     value={entry.degree} />
        <Row label="Field"      value={entry.fieldOfStudy} />
        <Row label="University" value={entry.university} />
        <Row label="Country"    value={entry.country} />
        <Row label="Period"     value={`${entry.startDate || "?"} – ${entry.endDate || "?"}`} />
        <Row label="GPA/Grade"  value={entry.gpa} />
      </div>
    ));
  };

  const renderTests = (d) => {
    const { hasScores, summary } = d.tests || {};
    if (!hasScores)
      return <p className="modal-empty-msg">No test scores recorded.</p>;
    return summary.map((s, i) => (
      <Row
        key={i}
        label={
          s.attempt
            ? `${s.test} – Attempt ${s.attempt}${s.testDate ? ` (${s.testDate})` : ""}`
            : s.test
        }
        value={s.scores}
      />
    ));
  };

  const renderDocuments = (d) => {
    const fields = d.documents?.fields || {};
    const entries = Object.entries(fields);
    if (!entries.length)
      return <p className="modal-empty-msg">No document information available.</p>;

    return entries.map(([key, doc]) => (
      <div key={key} className="modal-doc-row">
        <div className="modal-doc-label">{doc.label}</div>
        <div className="modal-doc-status">
          {doc.uploaded ? (
            <>
              <span className="modal-doc-uploaded">Uploaded</span>
              {doc.fileUrl ? (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="modal-doc-link"
                >
                  View
                </a>
              ) : (
                doc.fileKey && (
                  <span style={{ fontSize: 11, color: "var(--text-lt)" }}>
                    (URL unavailable)
                  </span>
                )
              )}
            </>
          ) : (
            <span className="modal-doc-missing">Not uploaded</span>
          )}
        </div>
      </div>
    ));
  };

  const tabContent = (d) => ({
    personal:  renderPersonal(d),
    contact:   renderContact(d),
    course:    renderCourse(d),
    academics: renderAcademics(d),
    tests:     renderTests(d),
    documents: renderDocuments(d),
  });

  if (loading) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-loading">Loading application...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-error">
            <p>Error: {error}</p>
            <button className="btn-view" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {detail && (
          <>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-header-eyebrow">Master University Application</div>
                <div className="modal-header-name">{detail.fullName || detail.studentName}</div>
                <div className="modal-header-meta">
                  {detail.applicationId} · {detail.email}
                </div>
              </div>
              <div className="modal-header-right">
                <span className={`status-badge ${getStatusClass(detail.applicationStatus)}`}>
                  {getStatusLabel(detail.applicationStatus)}
                </span>
                <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
              </div>
            </div>

            {/* Progress strip */}
            <div className="modal-progress-strip">
              <div className="modal-progress-label">
                Progress · Docs: {detail.documents?.uploadedCount}/{detail.documents?.totalDocs}
              </div>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${detail.completionPercentage}%` }}
                />
              </div>
              <span className="progress-pct">{detail.completionPercentage}%</span>
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`modal-tab ${activeTab === tab ? "modal-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="modal-content">
              {tabContent(detail)[activeTab]}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="modal-close-footer-btn" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function MasterUniversity() {
  const [stats,              setStats]              = useState({ total: 0, submitted: 0, draft: 0, underReview: 0 });
  const [applications,       setApplications]       = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [statsLoading,       setStatsLoading]       = useState(true);
  const [error,              setError]              = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [activeFilter,       setActiveFilter]       = useState("All");
  const [searchQuery,        setSearchQuery]        = useState("");
  const [pagination,         setPagination]         = useState({ total: 0, pages: 1 });
  const [page,               setPage]               = useState(1);
  const [expandedSidebar,    setExpandedSidebar]    = useState({});
  const [selectedId,         setSelectedId]         = useState(null);
  const [universities,       setUniversities]       = useState([]);
  const [mobileMenuOpen,     setMobileMenuOpen]     = useState(false);

  const LIMIT = 50;

  const filterToStatus = {
    All:           "all",
    Completed:     "submitted",
    Incomplete:    "draft",
    "In Progress": "under_review",
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetchStats();
      if (res.success) setStats(res.stats);
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchApplications({
        page,
        limit: LIMIT,
        status: filterToStatus[activeFilter] || "all",
        search: searchQuery,
      });

      if (res.success) {
        const data = res.data || [];
        setApplications(data);
        setPagination(res.pagination || { total: 0, pages: 1 });

        const seen = new Set();
        const unis = [];
        data.forEach((app) => {
          const name = app.course?.universityName;
          if (name && !seen.has(name)) {
            seen.add(name);
            unis.push({ id: name, name });
          }
        });
        setUniversities(unis);
      } else {
        setError(res.message || "Failed to load applications.");
      }
    } catch (e) {
      setError(e.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, searchQuery]);

  useEffect(() => { loadStats(); },        [loadStats]);
  useEffect(() => { loadApplications(); }, [loadApplications]);

  /* close sidebar on resize back to desktop */
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const toggleSidebar = (id) =>
    setExpandedSidebar((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectUniversity = (uni) => {
    setSelectedUniversity(uni);
    setActiveFilter("All");
    setSearchQuery("");
    setPage(1);
    setMobileMenuOpen(false);
  };

  const handleRefresh = () => {
    loadStats();
    loadApplications();
  };

  const filteredApps = selectedUniversity
    ? applications.filter((app) => app.course?.universityName === selectedUniversity.id)
    : applications;

  const displayStats = selectedUniversity
    ? {
        total:      filteredApps.length,
        completed:  filteredApps.filter((a) => a.applicationStatus === "submitted").length,
        incomplete: filteredApps.filter((a) => a.applicationStatus === "draft").length,
        inProgress: filteredApps.filter((a) => a.applicationStatus === "under_review").length,
      }
    : {
        total:      statsLoading ? "..." : stats.total,
        completed:  statsLoading ? "..." : stats.submitted,
        incomplete: statsLoading ? "..." : stats.draft,
        inProgress: statsLoading ? "..." : stats.underReview,
      };

  return (
    <div className="mu-wrapper">
      {/* ── Mobile Menu Toggle ── */}
      

      {/* ── SIDEBAR ── */}
      <aside className={`mu-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Mobile header inside sidebar */}
        <div className="mu-sidebar-header">
          <span style={{ fontWeight: 800, fontSize: 14, color: "var(--primary)" }}>EDU TECH</span>
          <button
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Desktop logo */}
        <div className="mu-sidebar-logo">EDU TECH</div>

        <nav className="mu-nav">
          <div
            className="mu-nav-item mu-nav-item--dashboard"
            onClick={() => {
              setSelectedUniversity(null);
              setActiveFilter("All");
              setSearchQuery("");
              setPage(1);
              setMobileMenuOpen(false);
            }}
          >
            Dashboard
          </div>

          {universities.map((uni) => (
            <div key={uni.id} className="mu-nav-group">
              <div
                className={`mu-nav-item mu-nav-item--university ${
                  selectedUniversity?.id === uni.id ? "mu-nav-item--active" : ""
                }`}
                onClick={() => {
                  toggleSidebar(uni.id);
                  selectUniversity(uni);
                }}
              >
                <span className="mu-nav-uni-name">{uni.name}</span>
                <span className="mu-nav-chevron">
                  {expandedSidebar[uni.id] ? "−" : "+"}
                </span>
              </div>

              {expandedSidebar[uni.id] && (
                <div className="mu-nav-sub">
                  <div className="mu-nav-sub-item">Applications</div>
                  <div className="mu-nav-sub-item">Documents</div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mu-sidebar-logout">Logout</div>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MAIN ── */}
      <main className="mu-main">

        {/* Topbar */}
        <header className="mu-topbar">
          <div className="mu-topbar-title">
            <span className="mu-topbar-label">Process</span>
            <span className="mu-topbar-sub">Admin</span>
          </div>
          <div className="mu-topbar-search">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="mu-search-input"
            />
          </div>
          <button
            className="refresh-mobile"
            onClick={handleRefresh}
            aria-label="Refresh"
          >
            ↻
          </button>
        </header>

        {/* Banner */}
        <div className="mu-banner">
          <div className="mu-banner-left">
            <h2 className="mu-banner-title">Applications</h2>
            {selectedUniversity && (
              <span className="mu-banner-uni-badge" title={selectedUniversity.name}>
                {selectedUniversity.name}
              </span>
            )}
          </div>
          <div className="mu-banner-right">
            {/* Desktop */}
            <button
              className="btn-outline"
              onClick={() => {
                setSelectedUniversity(null);
                setActiveFilter("All");
                setSearchQuery("");
                setPage(1);
              }}
            >
              All Universities
            </button>
            <button className="btn-primary" onClick={handleRefresh}>↻ Refresh</button>

            {/* Mobile */}
            <button
              className="btn-outline-mobile"
              onClick={() => {
                setSelectedUniversity(null);
                setActiveFilter("All");
                setSearchQuery("");
                setPage(1);
              }}
            >
              All
            </button>
            <button className="btn-primary-mobile" onClick={handleRefresh}>↻</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-row">
          <div className="stat-card stat-card-total">
            <div className="stat-card-text">
              <div className="stat-label">Total</div>
              <div className="stat-value">{displayStats.total}</div>
            </div>
          </div>
          <div className="stat-card stat-card-incomplete">
            <div className="stat-card-text">
              <div className="stat-label">Draft</div>
              <div className="stat-value">{displayStats.incomplete}</div>
            </div>
          </div>
          <div className="stat-card stat-card-completed">
            <div className="stat-card-text">
              <div className="stat-label">Done</div>
              <div className="stat-value">{displayStats.completed}</div>
            </div>
          </div>
          <div className="stat-card stat-card-inprogress">
            <div className="stat-card-text">
              <div className="stat-label">Review</div>
              <div className="stat-value">{displayStats.inProgress}</div>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="filter-section">
          {/* Search bar replacing university tabs */}
          <div className="filter-search-bar">
            
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search by name, email or application ID…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
            {searchQuery && (
              <button
                className="filter-search-clear"
                onClick={() => { setSearchQuery(""); setPage(1); }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-btns-scroll">
            {["All", "Completed", "Incomplete", "In Progress"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? "filter-btn-active" : ""}`}
                onClick={() => { setActiveFilter(f); setPage(1); }}
              >
                {f === "In Progress" ? "Progress" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div className="error-box">⚠ {error}</div>}

        {/* ── Mobile Cards ── */}
        <div className="mobile-cards">
          {loading ? (
            <div className="loading-cards">Loading applications…</div>
          ) : filteredApps.length === 0 ? (
            <div className="empty-cards">No applications found.</div>
          ) : (
            <>
              {filteredApps.map((app) => (
                <div key={app._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-id">{app.applicationId}</div>
                    <span className={`status-badge ${getStatusClass(app.applicationStatus)}`}>
                      {getStatusLabel(app.applicationStatus)}
                    </span>
                  </div>

                  <div className="mobile-card-body">
                    {/* Student row */}
                    <div className="mobile-student-row">
                      <div className="avatar-small">
                        {getInitials(app.fullName || app.studentName)}
                      </div>
                      <div className="mobile-student-info">
                        <div className="mobile-student-name">
                          {app.fullName || app.studentName}
                        </div>
                        <div className="mobile-student-email">{app.email}</div>
                        {app.contact?.mobileNumber && (
                          <div className="mobile-student-phone">
                            {app.contact.mobileNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mobile-meta-grid">
                      {/* University + course */}
                      <div className="mobile-meta-item full-width">
                        <span className="mobile-meta-label">University</span>
                        <span className="mobile-meta-value">
                          {app.course?.universityName || "—"}
                        </span>
                        {app.course?.preferredCourse && (
                          <span className="mobile-meta-sub">
                            {app.course.preferredCourse}
                          </span>
                        )}
                      </div>

                      <div className="mobile-meta-item">
                        <span className="mobile-meta-label">Submitted</span>
                        <span className="mobile-meta-value">
                          {formatDateShort(app.submittedAt)}
                        </span>
                      </div>

                      <div className="mobile-meta-item">
                        <span className="mobile-meta-label">Progress</span>
                        <span className="mobile-meta-value">{app.completionPercentage}%</span>
                      </div>

                      <div className="mobile-meta-item full-width">
                        <div className="mobile-progress">
                          <div className="progress-bar-mobile">
                            <div
                              className="progress-fill-mobile"
                              style={{ width: `${app.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-card-footer">
                    <button
                      className="btn-view-mobile"
                      onClick={() => setSelectedId(app.studentId)}
                    >
                      View Details
                    </button>
                  
                  </div>
                </div>
              ))}

              {/* Showing X of X */}
              <div className="mobile-showing-label">
                Showing {filteredApps.length} of {pagination.total} applications
              </div>
            </>
          )}
        </div>

        {/* ── Desktop Table ── */}
        <div className="desktop-table-view">
          <div className="table-wrap">
            {loading ? (
              <div className="table-loading">Loading applications…</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>APPLICATION ID</th>
                    <th>UNIVERSITY</th>
                    <th>STUDENT</th>
                    <th>STATUS</th>
                    <th>SUBMITTED</th>
                    <th>PROGRESS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app._id} className="table-row">
                        {/* APP ID */}
                        <td>
                          <div className="app-id">{app.applicationId}</div>
                          <div className="app-subid">
                            {app.studentId ? app.studentId.slice(-8) : "—"}
                          </div>
                        </td>

                        {/* UNIVERSITY + course */}
                        <td>
                          <div className="uni-name-main">
                            {app.course?.universityName || "—"}
                          </div>
                          {app.course?.preferredCourse && (
                            <div className="uni-course-sub">
                              {app.course.preferredCourse}
                            </div>
                          )}
                        </td>

                        {/* STUDENT — avatar + name + email + phone */}
                        <td>
                          <div className="student-cell">
                            <div className="avatar">
                              {getInitials(app.fullName || app.studentName)}
                            </div>
                            <div className="student-info">
                              <div className="student-name" title={app.fullName || app.studentName}>
                                {app.fullName || app.studentName}
                              </div>
                              <div className="student-email" title={app.email}>
                                {app.email}
                              </div>
                              {app.contact?.mobileNumber && (
                                <div className="student-phone">
                                  {app.contact.mobileNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span className={`status-badge ${getStatusClass(app.applicationStatus)}`}>
                            {getStatusLabel(app.applicationStatus)}
                          </span>
                        </td>

                        {/* SUBMITTED DATE */}
                        <td className="submitted-date">
                          {formatDate(app.submittedAt)}
                        </td>

                        {/* PROGRESS */}
                        <td>
                          <div className="progress-wrap">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${app.completionPercentage}%` }}
                              />
                            </div>
                            <span className="progress-pct">
                              {app.completionPercentage}%
                            </span>
                          </div>
                        </td>

                        {/* ACTION — View + PDF */}
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn-view"
                              onClick={() => setSelectedId(app.studentId)}
                            >
                              View
                            </button>
                           
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer — "Showing X of X applications" + pagination */}
          <div className="table-footer">
            {pagination.pages > 1 ? (
              <div className="table-footer-inner">
                <span className="showing-label">
                  Showing {filteredApps.length} of {pagination.total} applications
                </span>
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="page-info">{page} / {pagination.pages}</span>
                  <button
                    className="page-btn"
                    disabled={page === pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-footer-inner">
                <span className="showing-label">
                  Showing {filteredApps.length} of {pagination.total} applications
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── DETAIL MODAL ── */}
      {selectedId && (
        <DetailModal
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}