// src/pages/University/University.js
import React, { useState, useEffect, useCallback } from "react";
import "./University.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const getAdminToken = () =>
  localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

/* ─── SVG Icon Components ─────────────────────── */
const IconBuilding = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/>
  </svg>
);
const IconBriefcase = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconFileText = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconUpload = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconRefresh = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/>
  </svg>
);
const IconGrid = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconList = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconPin = ({ size = 12, color = "#94a3b8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconGrad = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconBook = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconImport = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconArrow = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSearch = ({ size = 16, color = "#94a3b8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconFilter = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconStar = ({ size = 14, color = "#f59e0b" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconBackArrow = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconMail = ({ size = 14, color = "#94a3b8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

/* ─────────────────────────────────────────────
   UNIVERSITY REQUESTS SECTION
───────────────────────────────────────────── */
const UniversityRequests = () => {
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error,         setError]         = useState(null);
  const [filterStatus,  setFilterStatus]  = useState("pending");
  const [rejectModal,   setRejectModal]   = useState(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [approveModal,  setApproveModal]  = useState(null);
  const [programType,   setProgramType]   = useState("bachelors");
  const [successMsg,    setSuccessMsg]    = useState(null);

  const fetchRequests = useCallback(async () => {
    const adminToken = getAdminToken();
    if (!adminToken) { setError("Authentication required"); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const all = res.data?.data || [];
      const uniRequests = all
        .filter(n => n.type === "UNIVERSITY_REQUEST")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(uniRequests);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setApproveModal(null); setRejectModal(null); setRejectReason(''); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const parseRequest = (notification) => {
    const msg          = notification.message || "";
    const uniMatch     = msg.match(/"([^"]+)"/);
    const countryMatch = msg.match(/\(([^)]+)\)/);
    const courseMatch  = msg.match(/Interested courses?:\s*(.+)/i);
    return {
      universityName: uniMatch?.[1]    || "Unknown University",
      country:        countryMatch?.[1] || "N/A",
      courses:        courseMatch?.[1]?.split(",").map(c => c.trim()) || [],
    };
  };

  const openApproveModal = (notification) => {
    setApproveModal(notification);
    setProgramType("bachelors");
  };

  const confirmApprove = async () => {
    if (!approveModal) return;
    const { universityName, country, courses } = parseRequest(approveModal);
    const adminToken = getAdminToken();
    setActionLoading(approveModal._id);
    try {
      const endpoint = programType === "bachelors"
        ? `${API_URL}/api/bachelors/universities`
        : `${API_URL}/api/masters/universities`;

      const codePrefix = universityName.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').substring(0, 4).toUpperCase();
      const uniqueCode = `${codePrefix}-${Date.now().toString(36).toUpperCase()}`;
      const safeName   = universityName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

      const payload = {
        universityName, universityCode: uniqueCode, establishedYear: 2000,
        universityType: "Private University", website: `https://www.${safeName}.edu`,
        country: "United States", state: "California", city: "City",
        address: "Address to be updated", zipCode: "00000",
        adminEmail: `admin@${safeName}.edu`, adminPhone: "000-000-0000",
        admissionEmail: `admissions@${safeName}.edu`, admissionPhone: "",
        tuitionFees: { inState: "0", outOfState: "0", international: "0", roomAndBoard: "0" },
        programs: courses.map(c => ({
          name: c, title: c, program_name: c,
          level: programType === "bachelors" ? "Bachelor" : "Master",
          studyMode: "On Campus",
          duration: programType === "bachelors" ? "4 years" : "2 years",
          description: `${c} program at ${universityName}`,
        })),
        intakes: [], englishTests: ["TOEFL iBT", "IELTS Academic"],
        applicationRequirements: [],
        applicationDeadlines: { earlyDecision: "", earlyAction: "", regularDecision: "", rolling: "" },
        satRequirements: { math: "", reading: "", total: "" },
        actRequirements: { composite: "" },
        minimumGPA: "", ranking: "", accreditation: "",
        requestedCountry: country, isVisible: true, isActive: true,
        approvedFromRequest: true,
        requestedByUserId: approveModal.userId?._id || approveModal.userId,
      };

      await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${adminToken}` } });
      await axios.post(
        `${API_URL}/api/notifications/mark-read`,
        { notificationId: approveModal._id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      try {
        const studentId = approveModal.userId?._id || approveModal.userId;
        await axios.post(
          `${API_URL}/api/notifications/send-to-user`,
          {
            userId: studentId, recipientId: studentId, receiverId: studentId,
            type: "UNIVERSITY_APPROVED", title: "University Request Approved",
            message: `Your request for "${universityName}" has been approved!`,
          },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      } catch (notifyErr) {
        console.warn("Student notification failed:", notifyErr.response?.data || notifyErr.message);
      }

      setSuccessMsg(`"${universityName}" created as ${programType === "bachelors" ? "Bachelor's" : "Master's"} university!`);
      setApproveModal(null);
      fetchRequests();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    const adminToken   = getAdminToken();
    const notification = requests.find(r => r._id === rejectModal.id);
    setActionLoading(rejectModal.id);
    try {
      await axios.post(
        `${API_URL}/api/notifications/send-to-user`,
        {
          userId: notification?.userId?._id || notification?.userId,
          type: "UNIVERSITY_REJECTED", title: "University Request Rejected",
          message: `Your request for "${rejectModal.universityName}" was not approved.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      await axios.post(
        `${API_URL}/api/notifications/mark-read`,
        { notificationId: rejectModal.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setSuccessMsg(`"${rejectModal.universityName}" rejected — student notified.`);
      setRejectModal(null); setRejectReason("");
      fetchRequests();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  const displayed = requests.filter(r => {
    if (filterStatus === "pending")  return !r.isRead;
    if (filterStatus === "reviewed") return  r.isRead;
    return true;
  });

  const formatTime = (date) => {
    const diffMs   = Date.now() - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs  = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)  return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs  < 24) return `${diffHrs}h ago`;
    if (diffDays < 7)  return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="requests-section">
      <div className="requests-header">
        <div className="requests-header-left">
          <h2 className="requests-title">
            <IconBuilding size={18} color="#0891b2" />
            University Requests
            {requests.filter(r => !r.isRead).length > 0 && (
              <span className="requests-badge">{requests.filter(r => !r.isRead).length} pending</span>
            )}
          </h2>
          <p className="requests-subtitle">Review and approve student-requested universities</p>
        </div>
        <button className="btn-refresh-req" onClick={fetchRequests} disabled={loading}>
          <IconRefresh size={13} /> Refresh
        </button>
      </div>

      <div className="requests-filter-tabs">
        {["all", "pending", "reviewed"].map(f => (
          <button key={f} className={`req-filter-btn ${filterStatus === f ? "active" : ""}`} onClick={() => setFilterStatus(f)}>
            {f === "all" ? "All" : f === "pending" ? "Pending" : "Reviewed"}
            <span className="req-filter-count">
              {f === "all" ? requests.length : f === "pending" ? requests.filter(r => !r.isRead).length : requests.filter(r => r.isRead).length}
            </span>
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="req-alert success">
          <span style={{display:'flex',alignItems:'center',gap:6}}><IconCheck size={13} color="#166534"/> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}><IconX size={13}/></button>
        </div>
      )}
      {error && (
        <div className="req-alert error">
          <span>{error}</span>
          <button onClick={() => setError(null)}><IconX size={13}/></button>
        </div>
      )}
      {loading && <div className="req-loading"><div className="spinner"></div><p>Loading requests...</p></div>}

      {!loading && displayed.length === 0 && (
        <div className="req-empty">
          <div className="req-empty-icon"><IconBuilding size={44} color="#94a3b8"/></div>
          <h3>No {filterStatus !== "all" ? filterStatus : ""} requests</h3>
          <p>Student university requests will appear here.</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="requests-list">
          {displayed.map(notification => {
            const { universityName, country, courses } = parseRequest(notification);
            const isProcessing = actionLoading === notification._id;
            return (
              <div key={notification._id} className={`request-card ${notification.isRead ? "reviewed" : "pending"}`}>
                <div className={`request-status-strip ${notification.isRead ? "reviewed" : "pending"}`} />
                <div className="request-card-body">
                  <div className="request-student">
                    <div className="request-avatar">
                      {notification.userId?.firstName?.[0] || "S"}
                      {notification.userId?.lastName?.[0]  || "T"}
                    </div>
                    <div className="request-student-info">
                      <div className="request-student-name">
                        {notification.userId?.firstName
                          ? `${notification.userId.firstName} ${notification.userId.lastName || ""}`
                          : "Student"}
                      </div>
                      <div className="request-student-email">{notification.userId?.email || `User ID: ${notification.userId}`}</div>
                      <div className="request-time">{formatTime(notification.createdAt)}</div>
                    </div>
                  </div>
                  <div className="request-details">
                    <div className="request-uni-name">
                      <IconBuilding size={14} color="#0891b2"/> {universityName}
                    </div>
                    <div className="request-meta-row">
                      <span className="request-country"><IconPin size={11} color="#64748b"/> {country}</span>
                    </div>
                    <div className="request-courses">
                      {courses.map(c => <span key={c} className="request-course-tag">{c}</span>)}
                    </div>
                  </div>
                  <div className="request-actions">
                    {!notification.isRead ? (
                      <>
                        <button className="req-btn approve" onClick={() => openApproveModal(notification)} disabled={isProcessing}>
                          {isProcessing ? "..." : <><IconCheck size={12}/> Approve</>}
                        </button>
                        <button className="req-btn reject" onClick={() => setRejectModal({ id: notification._id, universityName })} disabled={isProcessing}>
                          <IconX size={12}/> Reject
                        </button>
                      </>
                    ) : (
                      <span className="req-reviewed-label"><IconCheck size={12} color="#10b981"/> Reviewed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveModal && (() => {
        const { universityName, country, courses } = parseRequest(approveModal);
        return (
          <div className="req-modal-overlay" onClick={() => setApproveModal(null)}>
            <div className="req-modal" onClick={e => e.stopPropagation()}>
              <div className="req-modal-header approve">
                <span><IconCheck size={15} color="#065f46"/> Approve University Request</span>
                <button className="req-modal-close" onClick={() => setApproveModal(null)}><IconX size={14}/></button>
              </div>
              <div className="req-modal-body">
                <div className="req-modal-uni-card">
                  <div className="req-modal-uni-name"><IconBuilding size={14} color="#0891b2"/> {universityName}</div>
                  <div className="req-modal-uni-meta"><span style={{display:'flex',alignItems:'center',gap:4}}><IconPin size={11} color="#64748b"/> {country}</span></div>
                  <div className="req-modal-courses">
                    {courses.map(c => <span key={c} className="request-course-tag">{c}</span>)}
                  </div>
                </div>
                <div className="req-modal-field">
                  <label className="req-modal-label">Select Program Type to Create:</label>
                  <div className="req-program-type-toggle">
                    <button className={`req-type-btn ${programType === "bachelors" ? "active bachelor" : ""}`} onClick={() => setProgramType("bachelors")}>
                      <IconGrad size={14} color={programType==="bachelors"?"#065f46":"#64748b"}/> Bachelor's
                    </button>
                    <button className={`req-type-btn ${programType === "masters" ? "active master" : ""}`} onClick={() => setProgramType("masters")}>
                      <IconBook size={14} color={programType==="masters"?"#0e7490":"#64748b"}/> Master's
                    </button>
                  </div>
                </div>
                <div className="req-modal-info-box approve">
                  <strong>What will happen:</strong>
                  <ul>
                    <li>"{universityName}" will be created as a <strong>{programType === "bachelors" ? "Bachelor's" : "Master's"}</strong> university</li>
                    <li>Courses ({courses.join(", ")}) will be added as programs</li>
                    <li>Student will be notified instantly</li>
                    <li>University will appear in student's profile dropdown</li>
                  </ul>
                </div>
              </div>
              <div className="req-modal-footer">
                <button className="req-modal-cancel" onClick={() => setApproveModal(null)}>Cancel</button>
                <button className="req-modal-confirm approve" onClick={confirmApprove} disabled={actionLoading === approveModal._id}>
                  {actionLoading === approveModal._id ? "Creating..." : <><IconCheck size={13}/> Confirm & Create</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="req-modal-overlay" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
          <div className="req-modal" onClick={e => e.stopPropagation()}>
            <div className="req-modal-header reject">
              <span><IconX size={15} color="#991b1b"/> Reject University Request</span>
              <button className="req-modal-close" onClick={() => { setRejectModal(null); setRejectReason(''); }}><IconX size={14}/></button>
            </div>
            <div className="req-modal-body">
              <div className="req-modal-uni-card">
                <div className="req-modal-uni-name"><IconBuilding size={14} color="#0891b2"/> {rejectModal.universityName}</div>
              </div>
              <div className="req-modal-field">
                <label className="req-modal-label">
                  Rejection Reason <span className="req-modal-label-hint">(optional — sent to student)</span>
                </label>
                <textarea
                  className="req-reject-textarea"
                  placeholder="e.g. University name not recognized, please provide full official name..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="req-modal-info-box reject">
                <strong>What will happen:</strong>
                <ul>
                  <li>Student will receive a rejection notification</li>
                  <li>They can re-submit with corrected details</li>
                  <li>No university will be created</li>
                </ul>
              </div>
            </div>
            <div className="req-modal-footer">
              <button className="req-modal-cancel" onClick={() => { setRejectModal(null); setRejectReason(""); }}>Cancel</button>
              <button className="req-modal-confirm reject" onClick={confirmReject} disabled={actionLoading === rejectModal.id}>
                {actionLoading === rejectModal.id ? "Rejecting..." : <><IconX size={13}/> Confirm Rejection</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN UNIVERSITY COMPONENT
═══════════════════════════════════════════════ */
const University = () => {
  const [universities,        setUniversities]        = useState([]);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState(null);
  const [importStats,         setImportStats]         = useState(null);
  const [importing,           setImporting]           = useState(false);
  const [importSuccess,       setImportSuccess]       = useState(null);
  const [activeTab,           setActiveTab]           = useState('universities');
  const [searchTerm,          setSearchTerm]          = useState('');
  const [searchResults,       setSearchResults]       = useState([]);
  const [searching,           setSearching]           = useState(false);
  const [selectedUniversity,  setSelectedUniversity]  = useState(null);
  const [showDetailsModal,    setShowDetailsModal]    = useState(false);
  const [sortBy,              setSortBy]              = useState('name');
  const [filterType,          setFilterType]          = useState('all');
  const [programLevel,        setProgramLevel]        = useState('all');
  const [viewMode,            setViewMode]            = useState('grid');
  const [selectedProgram,     setSelectedProgram]     = useState(null);
  const [showProgramDetails,  setShowProgramDetails]  = useState(false);
  const [loadingPrograms,     setLoadingPrograms]     = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [filtersOpen,         setFiltersOpen]         = useState(false);

  useEffect(() => {
    fetchAllUniversities();
    fetchImportStats();
    fetchPendingRequestCount();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') { setSearchResults([]); return; }
    const delayDebounce = setTimeout(() => { searchUniversities(); }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const fetchPendingRequestCount = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const all = res.data?.data || [];
      setPendingRequestCount(all.filter(n => n.type === "UNIVERSITY_REQUEST" && !n.isRead).length);
    } catch (_) {}
  };

  const fetchImportStats = async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/admin/import-stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setImportStats(response.data.data);
    } catch (err) { console.error("Failed to fetch import stats:", err); }
  };

  const importUniversities = async () => {
    const token = getAdminToken();
    if (!token) { setError("No authentication token found."); return; }
    setImporting(true); setError(null); setImportSuccess(null);
    try {
      const response = await axios.post(`${API_URL}/api/admin/import-universities`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        const { importedUniversities, updatedUniversities, importedColleges } = response.data.data;
        setImportSuccess(`Import completed: ${importedUniversities} new, ${updatedUniversities} updated, ${importedColleges} colleges`);
        setImportStats(response.data.data);
        fetchAllUniversities();
      } else { setError(response.data.message || "Import failed"); }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import universities.");
    } finally { setImporting(false); }
  };

  const mapUniFields = (uni, source) => ({
    ...uni,
    INSTNM: uni.universityName, UNITID: uni.universityCode,
    CITY: uni.city, STABBR: uni.state, ADDR: uni.address, ZIP: uni.zipCode, WEBADDR: uni.website,
    location: { city: uni.city, state: uni.state, country: uni.country },
    programs: uni.programs || [],
    programCount: uni.programs?.length || 0,
    importedByAdmin: false,
    lastUpdated: uni.updatedAt || uni.createdAt,
    logo: uni.universityLogo,
    contact: { website: uni.website, adminEmail: uni.adminEmail, adminPhone: uni.adminPhone, admissionEmail: uni.admissionEmail, admissionPhone: uni.admissionPhone },
    source,
  });

  const searchUniversities = async () => {
    if (!searchTerm.trim()) return;
    const token = getAdminToken();
    if (!token) { setError("No authentication token found."); return; }
    setSearching(true); setError(null);
    try {
      const [adminResponse, bachelorsResponse, mastersResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/universities/search`, { params: { q: searchTerm }, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get(`${API_URL}/api/bachelors/universities`, { params: { search: searchTerm, limit: 50 }, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get(`${API_URL}/api/masters/universities`, { params: { search: searchTerm, limit: 50 }, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
      ]);
      let combinedResults = [];
      if (adminResponse.data.success)     combinedResults = [...combinedResults, ...adminResponse.data.data.map(u => ({ ...u, source: 'admin', importedByAdmin: true }))];
      if (bachelorsResponse.data.success) combinedResults = [...combinedResults, ...bachelorsResponse.data.data.map(u => mapUniFields(u, 'bachelors'))];
      if (mastersResponse.data.success)   combinedResults = [...combinedResults, ...mastersResponse.data.data.map(u => mapUniFields(u, 'masters'))];
      setSearchResults(combinedResults);
    } catch (err) { setError("Search failed. Please try again."); }
    finally { setSearching(false); }
  };

  const fetchAllUniversities = async () => {
    const token = getAdminToken();
    if (!token) { setError("No authentication token found."); return; }
    setLoading(true); setError(null);
    try {
      const [adminResponse, bachelorsResponse, mastersResponse] = await Promise.all([
        axios.get(`${API_URL}/api/admin/universities`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get(`${API_URL}/api/bachelors/universities`, { params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get(`${API_URL}/api/masters/universities`, { params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }, headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
      ]);
      let combined = [];
      if (adminResponse.data.success)     combined = [...combined, ...adminResponse.data.data.map(u => ({ ...u, source: 'admin', importedByAdmin: true }))];
      if (bachelorsResponse.data.success) combined = [...combined, ...bachelorsResponse.data.data.map(u => mapUniFields(u, 'bachelors'))];
      if (mastersResponse.data.success)   combined = [...combined, ...mastersResponse.data.data.map(u => mapUniFields(u, 'masters'))];
      setUniversities(combined);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        setTimeout(() => { window.location.href = '/admin-login'; }, 2000);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch universities");
      }
    } finally { setLoading(false); }
  };

  const getProgramCount = (university) => {
    if (university.programs?.length)        return university.programs.length;
    if (university.GUS_DATA?.programs_data) return university.GUS_DATA.programs_data.length;
    if (university.GUS_DATA?.major_areas) {
      let count = 0;
      university.GUS_DATA.major_areas.forEach(area => { if (area.specific_programs) count += area.specific_programs.length; });
      if (count > 0) return count;
    }
    if (university.metadata?.programs) return university.metadata.programs.length;
    return university.programCount || 0;
  };

  const getPrograms = (university) => {
    if (university.programs?.length)                return university.programs;
    if (university.GUS_DATA?.programs_data?.length) return university.GUS_DATA.programs_data;
    if (university.GUS_DATA?.major_areas?.length) {
      const programs = [];
      university.GUS_DATA.major_areas.forEach(area => {
        area.specific_programs?.forEach(prog => {
          programs.push({ id: prog._id || `prog-${Math.random()}`, name: prog.program_name, title: prog.program_name, program_name: prog.program_name, level: university.GUS_DATA?.level || 'Undergraduate', studyMode: 'On Campus', duration: '3 years', majorArea: area.major_area });
        });
      });
      if (programs.length > 0) return programs;
    }
    if (university.metadata?.programs) return university.metadata.programs;
    return [];
  };

  const isBachelorLevel = (l) => { const s = (l||'').toLowerCase().trim(); return s === 'bachelor' || s === 'bachelors' || s === 'undergraduate' || s.startsWith('bachelor') || /\bb\.?a\.?\b/.test(s) || /\bb\.?s\.?(c\.?)?\b/.test(s); };
  const isMasterLevel   = (l) => { const s = (l||'').toLowerCase().trim(); return s === 'master' || s === 'masters' || s === 'graduate' || s === 'mba' || s.startsWith('master') || /\bm\.?s\.?(c\.?)?\b/.test(s) || /\bm\.?a\.?\b/.test(s); };

  const hasBachelorsPrograms = (u) => { if (u.source === 'bachelors') return true; if (u.source === 'masters') return false; return getPrograms(u).some(p => isBachelorLevel(typeof p === 'string' ? '' : (p.level || p.type || ''))); };
  const hasMastersPrograms   = (u) => { if (u.source === 'masters')   return true; if (u.source === 'bachelors') return false; return getPrograms(u).some(p => isMasterLevel(typeof p === 'string' ? '' : (p.level || p.type || ''))); };
  const getBachelorsCount    = (u) => { if (u.source === 'bachelors') return getProgramCount(u); if (u.source === 'masters') return 0; return getPrograms(u).filter(p => isBachelorLevel(typeof p === 'string' ? '' : (p.level || p.type || ''))).length; };
  const getMastersCount      = (u) => { if (u.source === 'masters')   return getProgramCount(u); if (u.source === 'bachelors') return 0; return getPrograms(u).filter(p => isMasterLevel(typeof p === 'string' ? '' : (p.level || p.type || ''))).length; };

  const getLocationString = (u) => {
    const parts   = [];
    const city    = u.city    || u.location?.city    || u.CITY;
    const state   = u.state   || u.location?.state   || u.STABBR;
    const country = u.country || u.location?.country || u.GUS_DATA?.country || 'USA';
    if (city)    parts.push(city);
    if (state)   parts.push(state);
    if (country) parts.push(country);
    return parts.join(', ') || 'Location not specified';
  };

  const getUniversityCode = (u) => {
    if (u.universityCode) return u.universityCode;
    const name  = u.INSTNM || u.universityName || '';
    const words = name.split(' ');
    if (words.length > 1) return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    return name.substring(0, 4).toUpperCase() || 'UNI';
  };

  const getSalary = (u) => {
    const c = getProgramCount(u);
    if (!c) return null;
    const mult = Math.min(c / 10, 1.5);
    return `${(7.5 * (1 + mult)).toFixed(1)} - ${(12.5 * (1 + mult)).toFixed(1)}k USD`;
  };

  const getLevelColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('bachelor') || l.includes('undergraduate')) return '#10b981';
    if (l.includes('master')   || l.includes('graduate') || l.includes('mba')) return '#6366f1';
    if (l.includes('phd')      || l.includes('doctorate')) return '#ef4444';
    if (l.includes('diploma'))     return '#8b5cf6';
    if (l.includes('certificate')) return '#0891b2';
    return '#64748b';
  };

  const handleViewDetails = async (university) => {
    const token = getAdminToken();
    if (!token) { setError("No authentication token found."); return; }
    setLoadingPrograms(true);
    try {
      let details = university;
      if (university.source === 'bachelors' && university._id) {
        try { const r = await axios.get(`${API_URL}/api/bachelors/universities/${university._id}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.data.success) details = r.data.data; } catch (_) {}
      } else if (university.source === 'masters' && university._id) {
        try { const r = await axios.get(`${API_URL}/api/masters/universities/${university._id}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.data.success) details = r.data.data; } catch (_) {}
      } else if (university.UNITID) {
        try { const r = await axios.get(`${API_URL}/api/admin/universities/${university.UNITID}`, { headers: { Authorization: `Bearer ${token}` } }); if (r.data.success) details = r.data.data; } catch (_) {}
      }
      setSelectedUniversity(details); setSelectedProgram(null); setShowDetailsModal(true); setShowProgramDetails(false);
    } catch (_) { setError("Failed to load university details."); }
    finally { setLoadingPrograms(false); }
  };

  const closeModal = () => { setShowDetailsModal(false); setSelectedUniversity(null); setSelectedProgram(null); setShowProgramDetails(false); };

  const sortUniversities = (data) => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      if (sortBy === 'name')      return (a.INSTNM || a.universityName || '').localeCompare(b.INSTNM || b.universityName || '');
      if (sortBy === 'location')  return getLocationString(a).localeCompare(getLocationString(b));
      if (sortBy === 'programs')  return getProgramCount(b)   - getProgramCount(a);
      if (sortBy === 'bachelors') return getBachelorsCount(b) - getBachelorsCount(a);
      if (sortBy === 'masters')   return getMastersCount(b)   - getMastersCount(a);
      return 0;
    });
  };

  const filterUniversities = (data) => {
    if (!data) return [];
    let filtered = data;
    if (filterType === 'hasPrograms') filtered = filtered.filter(u => getProgramCount(u) > 0);
    else if (filterType === 'imported') filtered = filtered.filter(u => u.source === 'admin');
    else if (filterType === 'custom')   filtered = filtered.filter(u => u.source === 'bachelors' || u.source === 'masters');
    if (programLevel === 'bachelors')   filtered = filtered.filter(u => u.source === 'bachelors' || (u.source !== 'masters' && hasBachelorsPrograms(u)));
    else if (programLevel === 'masters') filtered = filtered.filter(u => u.source === 'masters'  || (u.source !== 'bachelors' && hasMastersPrograms(u)));
    return filtered;
  };

  let displayData = searchTerm.trim() && searchResults.length > 0 ? searchResults : universities;
  displayData = filterUniversities(displayData);
  displayData = sortUniversities(displayData);

  const getCustomCount = () => universities.filter(u => u.source === 'bachelors' || u.source === 'masters').length;
  const hasActiveFilters = programLevel !== 'all' || filterType !== 'all' || sortBy !== 'name';

  return (
    <div className="university-container">
      {/* ── Header ── */}
      <div className="university-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="university-title">University Directory</h1>
            <p className="university-subtitle">Search by university name, location, or program keywords</p>
          </div>
          <div className="header-right">
            <div className="stat-badge">
              <span className="stat-number">{displayData.length}</span>
              <span className="stat-label">Universities</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="category-tags">
        <button className={`category-tag ${activeTab === 'universities' ? 'active' : ''}`} onClick={() => setActiveTab('universities')}>
          <IconBuilding size={14} color={activeTab==='universities'?'#fff':'#64748b'}/> Universities
        </button>
        <button className={`category-tag ${activeTab === 'colleges' ? 'active' : ''}`} onClick={() => setActiveTab('colleges')}>
          <IconBriefcase size={14} color={activeTab==='colleges'?'#fff':'#64748b'}/> Colleges
        </button>
        <button
          className={`category-tag requests-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => { setActiveTab('requests'); fetchPendingRequestCount(); }}
        >
          <IconFileText size={14} color={activeTab==='requests'?'#fff':'#64748b'}/> Requests
          {pendingRequestCount > 0 && <span className="requests-tab-badge">{pendingRequestCount}</span>}
        </button>
      </div>

      {activeTab === 'requests' && <UniversityRequests />}

      {activeTab === 'universities' && (
        <>
          {/* Stats */}
          {importStats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><IconBuilding size={24} color="#0891b2"/></div>
                <div className="stat-details">
                  <h3>Universities</h3>
                  <p className="stat-value">{universities.length}</p>
                  <p className="stat-sub">{universities.filter(u => u.source === 'admin').length} Imported · {getCustomCount()} Custom</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><IconGrad size={24} color="#10b981"/></div>
                <div className="stat-details">
                  <h3>Colleges</h3>
                  <p className="stat-value">{importStats.database?.colleges || 0}</p>
                  {importStats.files && <p className="stat-sub">File: {importStats.files.colleges?.count || 0}</p>}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><IconBook size={24} color="#6366f1"/></div>
                <div className="stat-details">
                  <h3>Total Programs</h3>
                  <p className="stat-value">{universities.reduce((s, u) => s + getProgramCount(u), 0) || 0}</p>
                  {importStats.files && <p className="stat-sub">File: {importStats.files.programs || 0}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Action bar ── */}
          <div className="action-bar">
            <div className="action-primary">
              <button className="btn-import" onClick={importUniversities} disabled={importing}>
                {importing
                  ? (<><span className="spinner-small"></span>Importing...</>)
                  : (<><span className="btn-icon"><IconUpload size={14}/></span>Import</>)}
              </button>
              <button className="btn-refresh" onClick={fetchAllUniversities}>
                <span className="btn-icon"><IconRefresh size={14}/></span>Refresh
              </button>
              <button
                className={`btn-filter-toggle ${filtersOpen ? 'active' : ''} ${hasActiveFilters ? 'has-active' : ''}`}
                onClick={() => setFiltersOpen(f => !f)}
              >
                <IconFilter size={13}/> Filters {hasActiveFilters && <span className="filter-active-dot" />}
              </button>
              <div className="view-toggle">
                <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
                  <IconGrid size={14} color={viewMode==='grid'?'#0891b2':'#64748b'}/>
                </button>
                <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view">
                  <IconList size={14} color={viewMode==='list'?'#0891b2':'#64748b'}/>
                </button>
              </div>
            </div>

            <div className={`action-filters ${filtersOpen ? 'filters-open' : ''}`}>
              <div className="program-level-filter">
                <button className={`level-btn ${programLevel === 'all' ? 'active' : ''}`} onClick={() => setProgramLevel('all')}>All</button>
                <button className={`level-btn bachelor ${programLevel === 'bachelors' ? 'active' : ''}`} onClick={() => setProgramLevel('bachelors')}>
                  <IconGrad size={12}/> Bachelors
                </button>
                <button className={`level-btn master ${programLevel === 'masters' ? 'active' : ''}`} onClick={() => setProgramLevel('masters')}>
                  <IconBook size={12}/> Masters
                </button>
              </div>
              <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name">Sort: Name</option>
                <option value="location">Sort: Location</option>
                <option value="programs">Sort: Programs</option>
                <option value="bachelors">Sort: Bachelor's</option>
                <option value="masters">Sort: Master's</option>
              </select>
              <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Universities</option>
                <option value="hasPrograms">Has Programs</option>
                <option value="imported">Imported Only</option>
                <option value="custom">Custom Created</option>
              </select>
            </div>
          </div>

          {programLevel !== 'all' && (
            <div className="active-filter-indicator">
              <span className="filter-label">Filter:</span>
              <span className="filter-value">{programLevel === 'bachelors' ? "Bachelor's" : "Master's"}</span>
              <button className="clear-filter" onClick={() => setProgramLevel('all')}><IconX size={13}/> Clear</button>
            </div>
          )}

          {importSuccess && (
            <div className="alert alert-success">
              <span style={{display:'flex',alignItems:'center',gap:6}}><IconCheck size={14} color="#0e7490"/> {importSuccess}</span>
              <button className="alert-close" onClick={() => setImportSuccess(null)}><IconX size={14}/></button>
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="alert-close" onClick={() => setError(null)}><IconX size={14}/></button>
            </div>
          )}

          {/* Search */}
          <div className="search-section">
            <div className="search-container">
              <span className="search-icon"><IconSearch size={16} color="#94a3b8"/></span>
              <input
                type="text"
                className="search-input"
                placeholder="Search universities..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searching && <div className="search-spinner"></div>}
              {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}><IconX size={14}/></button>}
            </div>
            {searchTerm && searchResults.length > 0 && (
              <div className="search-results-count">Found {searchResults.length} results</div>
            )}
          </div>

          {loading && <div className="loading-state"><div className="spinner"></div><p>Loading universities...</p></div>}

          {!loading && displayData.length === 0 && !error && (
            <div className="empty-state">
              <div className="empty-icon"><IconBuilding size={46} color="#94a3b8"/></div>
              <h3>No universities found</h3>
              <p>{programLevel !== 'all' ? `No ${programLevel === 'bachelors' ? "Bachelor's" : "Master's"} universities found.` : 'Click "Import" to load data.'}</p>
              <button className="btn-import" onClick={importUniversities} disabled={importing}>
                <IconUpload size={14}/> Import Now
              </button>
            </div>
          )}

          {!loading && displayData.length > 0 && (
            <div className={`university-items ${viewMode}`}>
              {displayData.map((uni, index) => {
                const programCount   = getProgramCount(uni);
                const bachelorsCount = getBachelorsCount(uni);
                const mastersCount   = getMastersCount(uni);
                const location = getLocationString(uni);
                const uniCode  = getUniversityCode(uni);
                const salary   = getSalary(uni);
                const programs = getPrograms(uni);

                return (
                  <div key={uni._id || uni.UNITID || index} className="university-item">
                    <div className="item-header">
                      <div className="item-logo">
                        {uni.logo || uni.universityLogo
                          ? <img src={uni.logo || uni.universityLogo} alt={uni.INSTNM || uni.universityName} onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML=`<span class="logo-fallback">${uniCode}</span>`; }} />
                          : <span className="logo-fallback">{uniCode}</span>}
                      </div>
                      <div className="item-info">
                        <h3 className="item-title">{uni.INSTNM || uni.universityName}</h3>
                        <p className="item-location">
                          <span className="location-icon"><IconPin size={12}/></span> {location}
                        </p>
                      </div>
                    </div>
                    <div className="item-body">
                      {salary && <div className="item-salary-badge">{salary}</div>}
                      {programCount > 0 && (
                        <div className="program-count-badges">
                          {bachelorsCount > 0 && (
                            <span className="program-count-badge bachelor">
                              <IconGrad size={11}/> {bachelorsCount} Bachelor's
                            </span>
                          )}
                          {mastersCount > 0 && (
                            <span className="program-count-badge master">
                              <IconBook size={11}/> {mastersCount} Master's
                            </span>
                          )}
                        </div>
                      )}
                      {uni.source === 'bachelors'
                        ? <span className="item-badge custom"><IconGrad size={11}/> Bachelor's</span>
                        : uni.source === 'masters'
                        ? <span className="item-badge masters"><IconBook size={11}/> Master's</span>
                        : <span className="item-badge imported"><IconImport size={11}/> Imported</span>}
                    </div>
                    <div className="item-footer">
                      <span className="item-date">
                        {uni.lastUpdated || uni.updatedAt || uni.createdAt
                          ? new Date(uni.lastUpdated || uni.updatedAt || uni.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recently updated'}
                      </span>
                      <button className="item-view-btn" onClick={() => handleViewDetails(uni)}>
                        View Details <IconArrow size={12}/>
                      </button>
                    </div>
                    {programs.length > 0 && (
                      <div className="program-preview">
                        <h4>Top Programs:</h4>
                        <div className="program-tags">
                          {programs.slice(0, 3).map((prog, idx) => {
                            const pName  = typeof prog === 'string' ? prog : (prog.name || prog.title || prog.program_name || `Program ${idx + 1}`);
                            const pLevel = typeof prog === 'string' ? '' : (prog.level || prog.type);
                            return <span key={idx} className="program-tag" style={{ background: getLevelColor(pLevel), color: 'white' }}>{pName}</span>;
                          })}
                          {programs.length > 3 && <span className="program-tag more">+{programs.length - 3} more</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Details Modal */}
          {showDetailsModal && selectedUniversity && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                {loadingPrograms ? (
                  <div className="modal-loading"><div className="spinner"></div><p>Loading details...</p></div>
                ) : (
                  <>
                    <div className="modal-header">
                      <div className="modal-header-left">
                        <div className="modal-logo">
                          {selectedUniversity.universityLogo || selectedUniversity.logo
                            ? <img src={selectedUniversity.universityLogo || selectedUniversity.logo} alt={selectedUniversity.universityName || selectedUniversity.INSTNM} onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML=`<span class="logo-fallback">${getUniversityCode(selectedUniversity)}</span>`; }} />
                            : <span className="logo-fallback">{getUniversityCode(selectedUniversity)}</span>}
                        </div>
                        <div>
                          <h2>{selectedUniversity.universityName || selectedUniversity.INSTNM}</h2>
                          <p className="modal-location" style={{display:'flex',alignItems:'center',gap:4}}>
                            <IconPin size={12}/> {getLocationString(selectedUniversity)}
                          </p>
                          {selectedUniversity.source && (
                            <span className={`source-badge ${selectedUniversity.source}`}>
                              {selectedUniversity.source === 'bachelors'
                                ? <><IconGrad size={11}/> Bachelor's</>
                                : selectedUniversity.source === 'masters'
                                ? <><IconBook size={11}/> Master's</>
                                : <><IconImport size={11}/> Imported</>}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="modal-close-btn" onClick={closeModal}><IconX size={16}/></button>
                    </div>

                    {!showProgramDetails ? (
                      <div className="modal-body">
                        <div className="modal-section">
                          <h4>University Information</h4>
                          <div className="info-grid">
                            <div className="info-item"><span className="info-label">Code</span><span className="info-value">{selectedUniversity.universityCode || selectedUniversity.UNITID || 'N/A'}</span></div>
                            {selectedUniversity.establishedYear && <div className="info-item"><span className="info-label">Established</span><span className="info-value">{selectedUniversity.establishedYear}</span></div>}
                            {selectedUniversity.universityType  && <div className="info-item"><span className="info-label">Type</span><span className="info-value">{selectedUniversity.universityType}</span></div>}
                            {selectedUniversity.ranking         && <div className="info-item"><span className="info-label">Ranking</span><span className="info-value">{selectedUniversity.ranking}</span></div>}
                            {selectedUniversity.website         && <div className="info-item full-width"><span className="info-label">Website</span><a href={selectedUniversity.website} target="_blank" rel="noopener noreferrer">{selectedUniversity.website}</a></div>}
                          </div>
                        </div>
                        {(selectedUniversity.adminEmail || selectedUniversity.admissionEmail || selectedUniversity.adminPhone) && (
                          <div className="modal-section">
                            <h4>Contact Information</h4>
                            <div className="info-grid">
                              {selectedUniversity.adminEmail     && <div className="info-item"><span className="info-label">Admin Email</span><span className="info-value">{selectedUniversity.adminEmail}</span></div>}
                              {selectedUniversity.adminPhone     && <div className="info-item"><span className="info-label">Admin Phone</span><span className="info-value">{selectedUniversity.adminPhone}</span></div>}
                              {selectedUniversity.admissionEmail && <div className="info-item"><span className="info-label">Admission Email</span><span className="info-value">{selectedUniversity.admissionEmail}</span></div>}
                              {selectedUniversity.admissionPhone && <div className="info-item"><span className="info-label">Admission Phone</span><span className="info-value">{selectedUniversity.admissionPhone}</span></div>}
                            </div>
                          </div>
                        )}
                        {selectedUniversity.tuitionFees && (
                          <div className="modal-section">
                            <h4>Tuition Fees (Annual)</h4>
                            <div className="info-grid">
                              {selectedUniversity.tuitionFees.inState       && <div className="info-item"><span className="info-label">In-State</span><span className="info-value">${selectedUniversity.tuitionFees.inState}</span></div>}
                              {selectedUniversity.tuitionFees.outOfState    && <div className="info-item"><span className="info-label">Out-of-State</span><span className="info-value">${selectedUniversity.tuitionFees.outOfState}</span></div>}
                              {selectedUniversity.tuitionFees.international && <div className="info-item"><span className="info-label">International</span><span className="info-value">${selectedUniversity.tuitionFees.international}</span></div>}
                            </div>
                          </div>
                        )}
                        {getPrograms(selectedUniversity).length > 0 && (
                          <div className="modal-section">
                            <h4>All Programs ({getProgramCount(selectedUniversity)})</h4>
                            <div className="programs-grid">
                              {getPrograms(selectedUniversity).map((program, idx) => {
                                const pName  = typeof program === 'string' ? program : (program.name || program.title || program.program_name || `Program ${idx+1}`);
                                const pLevel = typeof program === 'string' ? '' : (program.level || program.type);
                                return (
                                  <div key={idx} className="program-card" onClick={() => { setSelectedProgram(program); setShowProgramDetails(true); }} style={{ borderLeft: `4px solid ${getLevelColor(pLevel)}` }}>
                                    <h5 className="program-title">{pName}</h5>
                                    {pLevel && (
                                      <div className="program-badges">
                                        <span className="program-level" style={{ backgroundColor: getLevelColor(pLevel) }}>{pLevel}</span>
                                        {program.duration && <span className="program-duration">{program.duration}</span>}
                                      </div>
                                    )}
                                    <button className="view-program-btn">View Details <IconArrow size={11}/></button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {getPrograms(selectedUniversity).length === 0 && (
                          <div className="modal-section"><p className="no-programs-message">No programs available for this university.</p></div>
                        )}
                      </div>
                    ) : (
                      <div className="modal-body">
                        <button className="back-to-university" onClick={() => { setShowProgramDetails(false); setSelectedProgram(null); }}>
                          <IconBackArrow size={13}/> Back to University
                        </button>
                        <div className="program-details">
                          <h3 className="program-details-title">{selectedProgram.name || selectedProgram.title || selectedProgram.program_name || 'Program Details'}</h3>
                          <div className="program-details-grid">
                            {selectedProgram.level       && <div className="detail-item"><span className="detail-label">Level</span><span className="detail-value level-badge" style={{ backgroundColor: getLevelColor(selectedProgram.level) }}>{selectedProgram.level}</span></div>}
                            {selectedProgram.duration    && <div className="detail-item"><span className="detail-label">Duration</span><span className="detail-value">{selectedProgram.duration}</span></div>}
                            {selectedProgram.studyMode   && <div className="detail-item"><span className="detail-label">Study Mode</span><span className="detail-value">{selectedProgram.studyMode}</span></div>}
                            {selectedProgram.description && <div className="detail-item full-width"><span className="detail-label">Description</span><p className="detail-value description-text">{selectedProgram.description}</p></div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default University;