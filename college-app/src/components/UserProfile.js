// src/components/UserProfile.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

if (typeof document !== 'undefined' && !document.getElementById('urp-styles')) {
  const s = document.createElement('style');
  s.id = 'urp-styles';
  s.textContent = `
.urp-overlay{position:fixed;inset:0;z-index:99999;background:rgba(8,12,36,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:urp-fade-in .2s ease-out}
@keyframes urp-fade-in{from{opacity:0}to{opacity:1}}
.urp-card{background:#fff;border-radius:24px;width:100%;max-width:440px;position:relative;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.28),0 8px 30px rgba(0,0,0,.12);animation:urp-slide-up .38s cubic-bezier(.34,1.56,.64,1)}
@keyframes urp-slide-up{from{opacity:0;transform:translateY(32px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
.urp-phase-waiting{border-top:5px solid #6366f1}
.urp-phase-approved{border-top:5px solid #10b981}
.urp-phase-rejected{border-top:5px solid #ef4444}
.urp-phase-timeout{border-top:5px solid #f59e0b}
.urp-body{padding:32px 28px 28px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;position:relative}
.urp-close{position:absolute;top:12px;right:14px;width:30px;height:30px;border-radius:50%;border:none;background:#f1f5f9;color:#64748b;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;line-height:1}
.urp-close:hover{background:#e2e8f0;color:#1e293b}
.urp-title{font-size:21px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-.3px;line-height:1.25}
.urp-title-green{color:#065f46}.urp-title-red{color:#7f1d1d}
.urp-desc{font-size:14px;color:#475569;margin:0;line-height:1.65;max-width:370px}
.urp-highlight{color:#1e293b}
.urp-rings{position:relative;width:88px;height:88px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.urp-ring{position:absolute;border-radius:50%;border:2.5px solid transparent}
.urp-ring-1{inset:0;border-top-color:#6366f1;border-right-color:#6366f1;animation:urp-spin 1.4s linear infinite}
.urp-ring-2{inset:8px;border-bottom-color:#8b5cf6;border-left-color:#8b5cf6;animation:urp-spin 2s linear infinite reverse}
.urp-ring-3{inset:16px;border-top-color:#a78bfa;animation:urp-spin 2.8s linear infinite}
@keyframes urp-spin{to{transform:rotate(360deg)}}
.urp-center-emoji{font-size:30px;line-height:1;animation:urp-float 3s ease-in-out infinite;position:relative;z-index:2}
@keyframes urp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.urp-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.urp-chip{background:#ede9fe;color:#5b21b6;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600}
.urp-status-badge{display:inline-flex;align-items:center;gap:8px;background:#f0f0ff;border:1px solid #c7d2fe;border-radius:999px;padding:8px 18px;font-size:13px;color:#4338ca;font-weight:600}
.urp-pulse{width:8px;height:8px;border-radius:50%;background:#6366f1;flex-shrink:0;animation:urp-pulse-anim 1.3s ease-in-out infinite}
@keyframes urp-pulse-anim{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.45}}
.urp-progress-track{width:100%;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden}
.urp-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:999px;transition:width 1s linear}
.urp-timer{width:100%;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8}
.urp-timer-value{font-weight:700;font-variant-numeric:tabular-nums;color:#6366f1;font-size:13px}
.urp-note{font-size:12px;color:#94a3b8;margin:0;line-height:1.55;max-width:340px}
.urp-burst{position:relative;width:88px;height:88px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.urp-burst-dot{position:absolute;width:8px;height:8px;border-radius:2px;animation:urp-burst-fly .7s ease-out forwards}
.urp-bd-0{background:#10b981;top:2px;left:36px;animation-delay:.30s}
.urp-bd-1{background:#f59e0b;top:8px;right:4px;animation-delay:.35s}
.urp-bd-2{background:#6366f1;top:36px;right:2px;animation-delay:.40s}
.urp-bd-3{background:#ef4444;bottom:8px;right:8px;animation-delay:.45s}
.urp-bd-4{background:#3b82f6;bottom:2px;left:36px;animation-delay:.30s}
.urp-bd-5{background:#ec4899;bottom:8px;left:4px;animation-delay:.35s}
.urp-bd-6{background:#10b981;top:36px;left:2px;animation-delay:.40s}
.urp-bd-7{background:#a78bfa;top:2px;left:10px;animation-delay:.45s}
.urp-bd-8{background:#fbbf24;top:2px;right:14px;animation-delay:.50s}
.urp-bd-9{background:#34d399;bottom:6px;right:20px;animation-delay:.55s}
@keyframes urp-burst-fly{0%{opacity:0;transform:scale(0) rotate(0deg)}60%{opacity:1;transform:scale(1.3) rotate(200deg) translate(10px,-14px)}100%{opacity:0;transform:scale(.8) rotate(360deg) translate(18px,-26px)}}
.urp-check-wrap{position:relative;z-index:2}
.urp-check-svg{width:72px;height:72px}
.urp-circle{fill:none;stroke:#10b981;stroke-width:2;stroke-dasharray:160;stroke-dashoffset:160;animation:urp-draw .55s cubic-bezier(.65,0,.45,1) .1s forwards}
.urp-tick{fill:none;stroke:#10b981;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:50;stroke-dashoffset:50;animation:urp-draw .35s ease-out .6s forwards}
@keyframes urp-draw{to{stroke-dashoffset:0}}
.urp-reject-wrap{display:flex;align-items:center;justify-content:center}
.urp-reject-circle{width:72px;height:72px;border-radius:50%;background:#fee2e2;border:2px solid #fca5a5;display:flex;align-items:center;justify-content:center;animation:urp-slide-up .45s cubic-bezier(.34,1.56,.64,1)}
.urp-reject-x{font-size:26px;color:#ef4444;font-weight:800;line-height:1}
.urp-timeout-emoji{font-size:54px;line-height:1;animation:urp-float 3s ease-in-out infinite}
.urp-reason{width:100%;background:#fff1f2;border:1px dashed #fca5a5;border-radius:12px;padding:14px 16px;text-align:left}
.urp-reason-label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#ef4444;margin-bottom:6px}
.urp-reason-text{font-size:13px;color:#7f1d1d;margin:0;line-height:1.55;font-style:italic}
.urp-infobox{width:100%;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;text-align:left}
.urp-infobox-green{background:#f0fdf4;border:1px solid #bbf7d0}
.urp-infobox-red{background:#fff7f7;border:1px solid #fecaca}
.urp-infobox-amber{background:#fffbeb;border:1px solid #fde68a}
.urp-inforow{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#334155;line-height:1.5}
.urp-infoicon{font-size:15px;flex-shrink:0;line-height:1.4}
.urp-btn-primary{width:100%;padding:14px 20px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .18s,box-shadow .18s;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;letter-spacing:-.2px}
.urp-btn-green{background:linear-gradient(135deg,#10b981,#059669)}
.urp-btn-blue{background:linear-gradient(135deg,#3b82f6,#2563eb)}
.urp-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,.18)}
.urp-btn-primary:active{transform:translateY(0);box-shadow:none}
.urp-btn-ghost{width:100%;padding:12px 20px;border:2px solid #e2e8f0;border-radius:14px;background:transparent;font-size:14px;font-weight:600;color:#475569;cursor:pointer;transition:border-color .15s,color .15s,background .15s}
.urp-btn-ghost:hover{border-color:#6366f1;color:#6366f1;background:#f0f0ff}
.urp-btn-link{background:none;border:none;font-size:13px;color:#94a3b8;cursor:pointer;padding:4px;text-decoration:underline;transition:color .15s}
.urp-btn-link:hover{color:#475569}
.urp-highlight-card{border:2px solid #10b981 !important;box-shadow:0 0 0 4px rgba(16,185,129,.15) !important;animation:urp-highlight-pulse 2s ease-in-out 3}
@keyframes urp-highlight-pulse{0%,100%{box-shadow:0 0 0 4px rgba(16,185,129,.15)}50%{box-shadow:0 0 0 8px rgba(16,185,129,.30)}}
.urp-new-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 8px rgba(16,185,129,.4);z-index:10}
.urp-result-banner{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-radius:14px;margin-bottom:16px;font-size:14px;line-height:1.55;position:relative}
.urp-banner-approved{background:#f0fdf4;border:1px solid #86efac;color:#065f46}
.urp-banner-rejected{background:#fff7f7;border:1px solid #fca5a5;color:#7f1d1d}
.urp-banner-icon{font-size:20px;flex-shrink:0;line-height:1.3}
.urp-banner-text{flex:1}
.urp-banner-text strong{font-weight:700}
.urp-banner-close{background:none;border:none;font-size:18px;cursor:pointer;color:inherit;opacity:.5;line-height:1;padding:0 2px;flex-shrink:0}
.urp-banner-close:hover{opacity:1}
@media(max-width:480px){.urp-card{border-radius:20px}.urp-body{padding:26px 20px 22px;gap:13px}.urp-title{font-size:18px}}
`;
  document.head.appendChild(s);
}

const URP_POLL_MS = 12000;
const URP_WAIT_MS = 10 * 60 * 1000;

const UniversityRequestPopup = ({ token, pendingRequest, onApproved, onRejected, onDismiss }) => {
  const [phase,      setPhase]      = React.useState("waiting");
  const [timeLeft,   setTimeLeft]   = React.useState(URP_WAIT_MS);
  const [dotCount,   setDotCount]   = React.useState(1);
  const [resultData, setResultData] = React.useState(null);

  const startRef    = React.useRef(Date.now());
  const pollRef     = React.useRef(null);
  const timerRef    = React.useRef(null);
  const dotsRef     = React.useRef(null);
  const resolvedRef = React.useRef(false);
  const seenIds     = React.useRef(new Set());

  React.useEffect(() => {
    dotsRef.current = setInterval(() => setDotCount(d => d >= 3 ? 1 : d + 1), 550);
    return () => clearInterval(dotsRef.current);
  }, []);

  React.useEffect(() => {
    if (phase !== "waiting") return;
    timerRef.current = setInterval(() => {
      const remaining = URP_WAIT_MS - (Date.now() - startRef.current);
      if (remaining <= 0) {
        setTimeLeft(0);
        if (!resolvedRef.current) setPhase("timeout");
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const urpPoll = React.useCallback(async () => {
    if (resolvedRef.current || !token) return;
    try {
      const res = await axios.get(`${API_URL}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = res.data?.notifications || res.data?.data || [];
      const uniLower = (pendingRequest?.universityName || "").toLowerCase();
      const matches = (n) =>
        !seenIds.current.has(n._id) &&
        (!uniLower || n.message?.toLowerCase().includes(uniLower));
      const approved = all.find(n => n.type === "UNIVERSITY_APPROVED" && matches(n));
      const rejected = all.find(n => n.type === "UNIVERSITY_REJECTED" && matches(n));
      if (approved) {
        resolvedRef.current = true;
        seenIds.current.add(approved._id);
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        setResultData({ universityName: pendingRequest?.universityName || urpExtractName(approved.message) });
        setPhase("approved");
        urpMarkRead(approved._id);
      } else if (rejected) {
        resolvedRef.current = true;
        seenIds.current.add(rejected._id);
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        setResultData({
          universityName: pendingRequest?.universityName || urpExtractName(rejected.message),
          reason: urpExtractReason(rejected.message),
        });
        setPhase("rejected");
        urpMarkRead(rejected._id);
      }
    } catch (_) {}
  }, [token, pendingRequest]);

  React.useEffect(() => {
    urpPoll();
    pollRef.current = setInterval(urpPoll, URP_POLL_MS);
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
      clearInterval(dotsRef.current);
    };
  }, [urpPoll]);

  const urpMarkRead = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/user/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
  };

  const urpExtractName   = (msg = "") => msg.match(/"([^"]+)"/)?.[1] || "your university";
  const urpExtractReason = (msg = "") => msg.match(/[Rr]eason[:\s]+(.+)/)?.[1]?.trim() || null;
  const fmtTime = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const progressPct = Math.min(100, ((URP_WAIT_MS - timeLeft) / URP_WAIT_MS) * 100);
  const dots = ".".repeat(dotCount);
  const stopAll = () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  const handleDismiss        = () => { stopAll(); onDismiss?.(); };
  const handleApprovedAction = () => { stopAll(); onApproved?.(resultData); };
  const handleRejectedAction = () => { stopAll(); onRejected?.(resultData); };

  return (
    <div className="urp-overlay">
      <div className={`urp-card urp-phase-${phase}`}>
        {phase === "waiting" && (
          <div className="urp-body">
            <button className="urp-close" onClick={handleDismiss} aria-label="Close">✕</button>
            <div className="urp-rings">
              <div className="urp-ring urp-ring-1" /><div className="urp-ring urp-ring-2" /><div className="urp-ring urp-ring-3" />
              <span className="urp-center-emoji">🏛️</span>
            </div>
            <h2 className="urp-title">Request Sent!</h2>
            <p className="urp-desc">Your request for <strong className="urp-highlight">"{pendingRequest?.universityName}"</strong> has been sent to the admin team.</p>
            {pendingRequest?.courses?.length > 0 && (
              <div className="urp-chips">{pendingRequest.courses.map((c, i) => <span key={i} className="urp-chip">{c}</span>)}</div>
            )}
            <div className="urp-status-badge"><span className="urp-pulse" />Waiting for admin review{dots}</div>
            <div className="urp-progress-track"><div className="urp-progress-fill" style={{ width: `${progressPct}%` }} /></div>
            <div className="urp-timer"><span>Time remaining</span><span className="urp-timer-value">{fmtTime(timeLeft)}</span></div>
            <p className="urp-note">Stay here and you'll be notified instantly when admin responds. Or close and continue selecting other universities.</p>
            <button className="urp-btn-ghost" onClick={handleDismiss}>Continue Without Waiting</button>
          </div>
        )}
        {phase === "approved" && (
          <div className="urp-body">
            <div className="urp-burst">
              {[...Array(10)].map((_, i) => <div key={i} className={`urp-burst-dot urp-bd-${i}`} />)}
              <div className="urp-check-wrap"><svg className="urp-check-svg" viewBox="0 0 52 52"><circle className="urp-circle" cx="26" cy="26" r="24" /><path className="urp-tick" d="M14 27l8 8 16-16" /></svg></div>
            </div>
            <h2 className="urp-title urp-title-green">🎉 University Approved!</h2>
            <p className="urp-desc"><strong>"{resultData?.universityName}"</strong> has been added to the directory and is now visible in your list below.</p>
            <div className="urp-infobox urp-infobox-green">
              <div className="urp-inforow"><span className="urp-infoicon">✅</span><span>University is now in your search list</span></div>
              <div className="urp-inforow"><span className="urp-infoicon">🔍</span><span>Search for it by name and click to select</span></div>
              <div className="urp-inforow"><span className="urp-infoicon">🎓</span><span>Then pick up to 2 courses from it</span></div>
            </div>
            <button className="urp-btn-primary urp-btn-green" onClick={handleApprovedAction}>Find &amp; Select University →</button>
            <button className="urp-btn-link" onClick={handleDismiss}>I'll do it later</button>
          </div>
        )}
        {phase === "rejected" && (
          <div className="urp-body">
            <div className="urp-reject-wrap"><div className="urp-reject-circle"><span className="urp-reject-x">✕</span></div></div>
            <h2 className="urp-title urp-title-red">Request Not Approved</h2>
            <p className="urp-desc">Sorry, <strong>"{resultData?.universityName}"</strong> could not be added at this time.</p>
            {resultData?.reason && (<div className="urp-reason"><span className="urp-reason-label">Admin's note</span><p className="urp-reason-text">"{resultData.reason}"</p></div>)}
            <div className="urp-infobox urp-infobox-red">
              <div className="urp-inforow"><span className="urp-infoicon">🏛️</span><span>Please select from available universities below</span></div>
              <div className="urp-inforow"><span className="urp-infoicon">📋</span><span>You can re-submit with the official name</span></div>
            </div>
            <button className="urp-btn-primary urp-btn-blue" onClick={handleRejectedAction}>Select from Available Universities</button>
            <button className="urp-btn-link" onClick={handleDismiss}>Dismiss</button>
          </div>
        )}
        {phase === "timeout" && (
          <div className="urp-body">
            <div className="urp-timeout-emoji">⏰</div>
            <h2 className="urp-title">Still Processing…</h2>
            <p className="urp-desc">Your request is still being reviewed. Admins usually respond within a few hours.</p>
            <div className="urp-infobox urp-infobox-amber">
              <div className="urp-inforow"><span className="urp-infoicon">📬</span><span>You'll be notified once admin responds</span></div>
              <div className="urp-inforow"><span className="urp-infoicon">🏛️</span><span>For now, select from existing universities</span></div>
            </div>
            <button className="urp-btn-primary" onClick={handleDismiss}>Continue Selecting Universities</button>
          </div>
        )}
      </div>
    </div>
  );
};

const COURSE_SUGGESTIONS_LIST = [
  "Computer Science","Business Administration","Data Science","Mechanical Engineering",
  "Electrical Engineering","Civil Engineering","Psychology","Economics","Finance",
  "Marketing","Nursing","Medicine","Law","Architecture","Information Technology",
  "Artificial Intelligence","Biotechnology","Environmental Science","Political Science",
  "International Relations","Graphic Design","Media Studies","Education","Social Work",
  "Public Health","Accounting","Supply Chain Management","Physics","Mathematics",
  "Chemistry","Biology","Philosophy","History","Literature","Linguistics",
  "Human Resources","Cybersecurity","Cloud Computing","Software Engineering",
  "Robotics","Aerospace Engineering",
];

const normalizeUniversity = (uni, source = 'admin') => {
  const name    = uni.INSTNM || uni.universityName || 'Unknown University';
  const city    = uni.CITY   || uni.city   || uni.location?.city  || '';
  const state   = uni.STABBR || uni.state  || uni.location?.state || '';
  const country = uni.country || uni.location?.country || uni.COUNTRY || 'USA';
  let programs = [];
  if (Array.isArray(uni.programs) && uni.programs.length > 0) {
    programs = uni.programs.map((p, i) => {
      if (typeof p === 'string') return { id:`prog-str-${i}`,name:p,title:p,program_name:p,level:'Undergraduate',studyMode:'On Campus',duration:'3-4 years' };
      const resolved = p.name||p.title||p.program_name||`Program ${i+1}`;
      return { ...p,name:resolved,title:resolved,program_name:p.program_name||resolved };
    });
  } else if (uni.GUS_DATA?.programs_data?.length) {
    programs = uni.GUS_DATA.programs_data.map((p,i) => { const r=p.title||p.program_name||`Program ${i+1}`; return {...p,name:r,title:r,program_name:p.program_name||r}; });
  } else if (uni.GUS_DATA?.major_areas?.length) {
    uni.GUS_DATA.major_areas.forEach(area => (area.specific_programs||[]).forEach(p => {
      const pName=p.program_name||'Unknown Program';
      programs.push({name:pName,title:pName,program_name:pName,level:uni.GUS_DATA?.level||'Undergraduate',studyMode:'On Campus',duration:'3-4 years',majorArea:area.major_area});
    }));
  } else if (uni.metadata?.programs?.length) {
    programs = uni.metadata.programs.map((p,i) => { const r=p.title||p.program_name||p.name||`Program ${i+1}`; return {...p,name:r,title:r,program_name:p.program_name||r}; });
  }
  return {
    ...uni,
    _normalizedId: uni.UNITID?.toString()||uni.universityCode||uni._id?.toString()||'',
    INSTNM:name, CITY:city, STABBR:state,
    location:{city,state,country,...(typeof uni.location==='object'?uni.location:{})},
    programs, _source:source,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: detect if a university is direct-apply (no courses required)
// ─────────────────────────────────────────────────────────────────────────────
const isDirectApplyUniversity = (u) =>
  !!(u.isKansas || u.isDirectApply ||
    (u.INSTNM || u.universityName || u.name || '').toLowerCase().includes('kansas'));

const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token     = localStorage.getItem('token');
  const userType  = localStorage.getItem('studentType') || 'firstyear';

  const [profileImage, setProfileImage]   = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [saving,       setSaving]         = useState(false);
  const [loading,      setLoading]        = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error,        setError]          = useState('');
  const [toast,        setToast]          = useState({ show: false, message: '', type: 'success' });
  const [showSuccess,  setShowSuccess]    = useState(false);

  const [showRequestPopup,  setShowRequestPopup]  = useState(false);
  const [pendingRequest,    setPendingRequest]     = useState(null);
  const [approvedUniName,   setApprovedUniName]   = useState(null);
  const [resultBanner,      setResultBanner]       = useState(null);

  const bgPollRef     = useRef(null);
  const bgSeenIds     = useRef(new Set());
  const bgResolved    = useRef(false);
  const bgPendingName = useRef(null);

  const [basicInfo,  setBasicInfo]  = useState({ fullName:"",email:userEmail,mobile:"",dob:"",gender:"",nationality:"",residence:"" });
  const [education,  setEducation]  = useState({ qualification:"",institution:"",field:"",year:"",cgpa:"" });
  const [eligibleProgram,       setEligibleProgram]       = useState("");
  const [selectedUniversities,  setSelectedUniversities]  = useState([]);
  const [universities,          setUniversities]          = useState([]);
  const [filteredUniversities,  setFilteredUniversities]  = useState([]);
  const [searchTerm,            setSearchTerm]            = useState("");
  const [universityCourses,     setUniversityCourses]     = useState({});
  const [loadingCourses,        setLoadingCourses]        = useState(false);
  const [showCourseModal,       setShowCourseModal]       = useState(false);
  const [currentUniversity,     setCurrentUniversity]     = useState(null);
  const [currentUniversityCourses, setCurrentUniversityCourses] = useState([]);
  const [filteredCourses,       setFilteredCourses]       = useState([]);
  const [tempSelectedCourses,   setTempSelectedCourses]   = useState([]);
  const [courseSearchTerm,      setCourseSearchTerm]      = useState("");
  const [courseFilter,          setCourseFilter]          = useState({ level:"",studyMode:"",majorArea:"" });

  const [showRequestModal,  setShowRequestModal]  = useState(false);
  const [requestForm,       setRequestForm]       = useState({ universityName:"",country:"" });
  const [requestFormErrors, setRequestFormErrors] = useState({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess,    setRequestSuccess]    = useState(false);
  const [reqCourseInput,    setReqCourseInput]    = useState("");
  const [reqCourses,        setReqCourses]        = useState([]);
  const [reqSuggestions,    setReqSuggestions]    = useState([]);
  const [showReqSuggestions,setShowReqSuggestions]= useState(false);
  const reqCourseInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show:true,message,type });
    setTimeout(() => setToast({ show:false,message:'',type:'success' }), 4000);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) { setFetchingProfile(false); return; }
      try {
        const res = await axios.get(`${API_URL}/api/user/profile`, { headers:{ Authorization:`Bearer ${token}` } });
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          setBasicInfo(p.basicInfo||{fullName:"",email:userEmail,mobile:"",dob:"",gender:"",nationality:"",residence:""});
          setEducation(p.education||{qualification:"",institution:"",field:"",year:"",cgpa:""});
          setEligibleProgram(p.eligibleProgram||"");
          setSelectedUniversities(p.selectedUniversities?.length>0?p.selectedUniversities:[]);
          if (p.profileImage) setImagePreview(p.profileImage);
        }
      } catch (e) {
        if (e.response?.status !== 404) setError(`Server error: ${e.response?.status}`);
      } finally { setFetchingProfile(false); }
    };
    load();
  }, [token, userEmail]);

  useEffect(() => {
    if (localStorage.getItem('profileCompleted')==='true' && !fetchingProfile && selectedUniversities.length>0)
      navigateToDashboard();
  }, [fetchingProfile, selectedUniversities]);

  useEffect(() => { fetchUniversities(); }, []);

  useEffect(() => {
    let filtered = [...universities];
    if (eligibleProgram==="Bachelor") filtered=filtered.filter(u=>u._source==='bachelors'||u._source==='admin');
    else if (eligibleProgram==="Master") filtered=filtered.filter(u=>u._source==='masters'||u._source==='admin');
    if (searchTerm.trim()) {
      const t=searchTerm.toLowerCase();
      filtered=filtered.filter(u=>
        (u.INSTNM||'').toLowerCase().includes(t)||(u.CITY||u.location?.city||'').toLowerCase().includes(t)||
        (u.STABBR||u.location?.state||'').toLowerCase().includes(t)||(u.IALIAS||'').toLowerCase().includes(t)||
        (u.universityCode||'').toLowerCase().includes(t)
      );
    }
    setFilteredUniversities(filtered);
  }, [eligibleProgram, searchTerm, universities]);

  useEffect(() => { if (currentUniversityCourses.length>0) applyCourseFilers(); }, [courseSearchTerm,courseFilter,currentUniversityCourses]);

  useEffect(() => {
    const t=reqCourseInput.trim().toLowerCase();
    if (!t) { setReqSuggestions([]); setShowReqSuggestions(false); return; }
    const s=COURSE_SUGGESTIONS_LIST.filter(c=>c.toLowerCase().includes(t)&&!reqCourses.includes(c)).slice(0,6);
    setReqSuggestions(s); setShowReqSuggestions(s.length>0);
  }, [reqCourseInput, reqCourses]);

  useEffect(() => { return () => clearInterval(bgPollRef.current); }, []);

  const fetchUniversities = async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const fetchAdmin = async () => {
        let all=[]; let page=1;
        while (true) {
          try {
            const r=await axios.get(`${API_URL}/api/admin/universities`,{params:{page,limit:100},headers:{Authorization:`Bearer ${token}`}});
            const d=r.data?.data||[];
            if (!Array.isArray(d)||!d.length) break;
            all=[...all,...d];
            if (d.length<100) break;
            page++;
          } catch { break; }
        }
        return all;
      };
      const [adminData,bachRes,mastRes] = await Promise.all([
        fetchAdmin(),
        axios.get(`${API_URL}/api/bachelors/universities`,{params:{limit:500},headers:{Authorization:`Bearer ${token}`}}).catch(()=>({data:{success:false,data:[]}})),
        axios.get(`${API_URL}/api/masters/universities`,{params:{limit:500},headers:{Authorization:`Bearer ${token}`}}).catch(()=>({data:{success:false,data:[]}})),
      ]);
      let all=[];
      if (Array.isArray(adminData)&&adminData.length) all=[...all,...adminData.map(u=>normalizeUniversity(u,'admin'))];
      if (bachRes.data?.success) all=[...all,...bachRes.data.data.map(u=>normalizeUniversity(u,'bachelors'))];
      if (mastRes.data?.success) all=[...all,...mastRes.data.data.map(u=>normalizeUniversity(u,'masters'))];
      const cache={};
      for (const u of all) { if (u._normalizedId&&u.programs?.length) cache[u._normalizedId]=buildCourses(u); }
      setUniversityCourses(cache);
      setUniversities(all);
    } catch (e) {
      if (e.response?.status===401) { setError("Session expired. Please login again."); setTimeout(()=>navigate('/login'),2000); }
      else setError(e.response?.data?.message||"Failed to load universities.");
    } finally { setLoading(false); }
  };

  const buildCourses = (university) => {
    const city=university.CITY||''; const state=university.STABBR||'';
    return (university.programs||[]).map((p,i) => {
      if (typeof p==='string') return {id:`prog-${university._normalizedId}-${i}`,title:p,name:p,program_name:p,level:'Undergraduate',studyMode:'On Campus',duration:'3-4 years',locations:[`${city}, ${state}`],majorArea:'General',description:`${p} at ${university.INSTNM}`};
      const name=p.name||p.title||p.program_name||`Program ${i+1}`;
      return {id:p.id||p._id||`prog-${university._normalizedId}-${i}`,title:name,name,program_name:p.program_name||name,level:p.level||'Undergraduate',studyMode:p.studyMode||'On Campus',duration:p.duration||'3-4 years',locations:p.locations||[`${city}, ${state}`],majorArea:p.majorArea||'',description:p.description||`${name} at ${university.INSTNM}`};
    });
  };

  const applyCourseFilers = () => {
    let f=[...currentUniversityCourses];
    if (courseSearchTerm.trim()) { const t=courseSearchTerm.toLowerCase(); f=f.filter(c=>(c.title||'').toLowerCase().includes(t)||(c.majorArea||'').toLowerCase().includes(t)||(c.level||'').toLowerCase().includes(t)); }
    if (courseFilter.level) f=f.filter(c=>(c.level||'').toLowerCase()===courseFilter.level.toLowerCase());
    if (courseFilter.studyMode) f=f.filter(c=>(c.studyMode||'').toLowerCase().includes(courseFilter.studyMode.toLowerCase()));
    if (courseFilter.majorArea) f=f.filter(c=>(c.majorArea||'').toLowerCase().includes(courseFilter.majorArea.toLowerCase()));
    setFilteredCourses(f);
  };

  const getUniKey = (u) => u._normalizedId||u.UNITID?.toString()||u._id?.toString()||'';
  const detectProgram = (q) => { if(q==="12th"||q==="High School") return "Bachelor"; if(q==="Bachelor"||q==="Bachelor's Degree") return "Master"; if(q==="Master"||q==="Master's Degree") return "PhD"; return ""; };

  const startBackgroundPoll = useCallback((uniName) => {
    if (bgPollRef.current) return;
    bgPendingName.current=uniName?.toLowerCase()||"";
    bgResolved.current=false;
    const poll = async () => {
      if (bgResolved.current||!token) return;
      try {
        const res=await axios.get(`${API_URL}/api/user/notifications`,{headers:{Authorization:`Bearer ${token}`}});
        const all=res.data?.notifications||res.data?.data||[];
        const matches=(n)=>!bgSeenIds.current.has(n._id)&&(!bgPendingName.current||n.message?.toLowerCase().includes(bgPendingName.current));
        const approved=all.find(n=>n.type==="UNIVERSITY_APPROVED"&&matches(n));
        const rejected=all.find(n=>n.type==="UNIVERSITY_REJECTED"&&matches(n));
        if (approved||rejected) {
          bgResolved.current=true; clearInterval(bgPollRef.current); bgPollRef.current=null;
          const n=approved||rejected; bgSeenIds.current.add(n._id);
          if (approved) {
            const name=uniName||extractNameFromMsg(approved.message);
            setApprovedUniName(name); setSearchTerm(name); await fetchUniversities();
            setResultBanner({type:'approved',uniName:name}); showToast(`🎉 "${name}" is now available!`,'success');
          } else {
            const name=uniName||extractNameFromMsg(rejected.message);
            const reason=extractReasonFromMsg(rejected.message);
            setResultBanner({type:'rejected',uniName:name,reason}); showToast(`Your request for "${name}" was not approved.`,'warning');
          }
          try { await axios.patch(`${API_URL}/api/user/notifications/${n._id}/read`,{},{headers:{Authorization:`Bearer ${token}`}}); } catch (_) {}
        }
      } catch (_) {}
    };
    poll(); bgPollRef.current=setInterval(poll,12000);
  }, [token, showToast]);

  const extractNameFromMsg   = (msg="") => msg.match(/"([^"]+)"/)?.[1]||"";
  const extractReasonFromMsg = (msg="") => msg.match(/[Rr]eason[:\s]+(.+)/)?.[1]?.trim()||null;

  const handlePopupApproved = useCallback(async ({universityName}) => {
    setShowRequestPopup(false); setPendingRequest(null);
    bgResolved.current=true; clearInterval(bgPollRef.current); bgPollRef.current=null;
    await fetchUniversities(); setApprovedUniName(universityName); setSearchTerm(universityName);
    setResultBanner({type:'approved',uniName:universityName}); showToast(`🎉 "${universityName}" is now available!`,'success');
  }, [showToast]);

  const handlePopupRejected = useCallback(({universityName,reason}) => {
    setShowRequestPopup(false); setPendingRequest(null);
    bgResolved.current=true; clearInterval(bgPollRef.current); bgPollRef.current=null;
    setResultBanner({type:'rejected',uniName:universityName,reason}); showToast(`Your request for "${universityName}" was not approved.`,'warning');
  }, [showToast]);

  const handlePopupDismiss = useCallback(() => {
    setShowRequestPopup(false);
    if (pendingRequest?.universityName&&!bgResolved.current) startBackgroundPoll(pendingRequest.universityName);
  }, [pendingRequest, startBackgroundPoll]);

  const openRequestModal = () => {
    setRequestForm({universityName:searchTerm||"",country:""});
    setRequestFormErrors({}); setRequestSuccess(false);
    setReqCourses([]); setReqCourseInput(""); setReqSuggestions([]); setShowReqSuggestions(false);
    setShowRequestModal(true); document.body.style.overflow='hidden';
  };
  const closeRequestModal = () => {
    setShowRequestModal(false); setRequestForm({universityName:"",country:""});
    setRequestFormErrors({}); setRequestSuccess(false); setReqCourses([]); setReqCourseInput("");
    document.body.style.overflow='auto';
  };
  const addReqCourse = (name) => {
    const t=name.trim().replace(/,+$/,'');
    if (!t||reqCourses.includes(t)) { setReqCourseInput(""); return; }
    if (reqCourses.length>=5) { setRequestFormErrors(p=>({...p,courses:"Max 5 courses"})); return; }
    setReqCourses(p=>[...p,t]); setReqCourseInput(""); setReqSuggestions([]); setShowReqSuggestions(false);
    setRequestFormErrors(p=>({...p,courses:null})); setTimeout(()=>reqCourseInputRef.current?.focus(),0);
  };
  const removeReqCourse    = (c) => setReqCourses(p=>p.filter(x=>x!==c));
  const handleReqCourseKey = (e) => {
    if (e.key==='Enter'||e.key===',') { e.preventDefault(); if(reqCourseInput.trim()) addReqCourse(reqCourseInput); }
    else if (e.key==='Backspace'&&!reqCourseInput&&reqCourses.length) setReqCourses(p=>p.slice(0,-1));
  };
  const validateRequestForm = () => {
    const err={};
    if (!requestForm.universityName.trim()) err.universityName="University name is required";
    if (!requestForm.country.trim()) err.country="Country is required";
    if (!reqCourses.length) err.courses="Please add at least one course";
    setRequestFormErrors(err); return !Object.keys(err).length;
  };
  const handleSubmitRequest = async () => {
    if (!validateRequestForm()) return;
    setSubmittingRequest(true);
    try {
      const res=await axios.post(`${API_URL}/api/user/university/request`,
        {universityName:requestForm.universityName.trim(),country:requestForm.country.trim(),interestedCourses:reqCourses},
        {headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
      if (res.data.success) {
        const pending={universityName:requestForm.universityName.trim(),country:requestForm.country.trim(),courses:[...reqCourses]};
        setRequestSuccess(true);
        setTimeout(()=>{ closeRequestModal(); setPendingRequest(pending); setShowRequestPopup(true); },700);
      } else setRequestFormErrors({submit:res.data.message||"Failed to submit request."});
    } catch (e) { setRequestFormErrors({submit:e.response?.data?.message||"Failed to submit request."}); }
    finally { setSubmittingRequest(false); }
  };

  const openCourseModal = (uni) => {
    const key=getUniKey(uni); const fresh=universities.find(u=>getUniKey(u)===key)||uni;
    const courses=universityCourses[key]||buildCourses(fresh);
    if (!courses.length) { toggleUniversity(uni); return; }
    setCurrentUniversity(fresh); setCurrentUniversityCourses(courses); setFilteredCourses(courses);
    setCourseSearchTerm(""); setCourseFilter({level:"",studyMode:"",majorArea:""});
    const existing=selectedUniversities.find(u=>getUniKey(u)===key);
    setTempSelectedCourses([...(existing?.selectedCourses||[])]);
    setShowCourseModal(true); document.body.style.overflow='hidden';
  };
  const closeCourseModal = () => {
    setShowCourseModal(false); setCurrentUniversity(null); setTempSelectedCourses([]);
    setCourseSearchTerm(""); setCourseFilter({level:"",studyMode:"",majorArea:""}); document.body.style.overflow='auto';
  };
  const toggleTempCourse = (course) => {
    setTempSelectedCourses(prev => {
      const sel=prev.some(c=>c.id===course.id);
      if (sel) return prev.filter(c=>c.id!==course.id);
      if (prev.length<2) return [...prev,course];
      setError('Max 2 courses per university'); setTimeout(()=>setError(''),2000); return prev;
    });
  };
  const saveCourseSelection = () => {
    if (!currentUniversity) return;
    const key=getUniKey(currentUniversity);
    const uniWithCourses={...currentUniversity,selectedCourses:tempSelectedCourses.map(c=>({
      id:c.id,title:c.title||c.name||c.program_name||'Course',name:c.name||c.title||c.program_name||'Course',
      program_name:c.program_name||c.title||c.name||'',level:c.level,studyMode:c.studyMode,duration:c.duration,
      locations:c.locations,majorArea:c.majorArea,description:c.description,
    }))};
    setSelectedUniversities(prev=>prev.some(u=>getUniKey(u)===key)?prev.map(u=>getUniKey(u)===key?uniWithCourses:u):prev.length<5?[...prev,uniWithCourses]:prev);
    closeCourseModal(); setShowSuccess(true); setTimeout(()=>setShowSuccess(false),1500);
  };
  const toggleUniversity = (uni) => {
    if (!uni) return;
    const key=getUniKey(uni);
    const isSel=selectedUniversities.some(u=>getUniKey(u)===key);
    if (isSel) { setSelectedUniversities(p=>p.filter(u=>getUniKey(u)!==key)); }
    else if (selectedUniversities.length<5) {
      const fresh=universities.find(u=>getUniKey(u)===key)||uni;
      const courses=universityCourses[key]||buildCourses(fresh);
      if (!courses.length) {
        setSelectedUniversities(p=>[...p,{...fresh,selectedCourses:[],isDirectApply:true}]);
        setShowSuccess(true); setTimeout(()=>setShowSuccess(false),1500);
      } else { openCourseModal(fresh); }
    } else { setError("Max 5 universities"); setTimeout(()=>setError(''),2000); }
  };

  const validateStep1 = () => {
    const e={};
    if (!basicInfo.fullName) e.fullName="Full name is required";
    if (!basicInfo.mobile) e.mobile="Mobile is required";
    if (!basicInfo.dob) e.dob="Date of birth is required";
    if (!basicInfo.gender) e.gender="Gender is required";
    if (!basicInfo.nationality) e.nationality="Nationality is required";
    if (!basicInfo.residence) e.residence="Country of residence is required";
    if (basicInfo.mobile&&!/^[0-9+\-\s()]{10,15}$/.test(basicInfo.mobile)) e.mobile="Enter a valid mobile number";
    setValidationErrors(e); return !Object.keys(e).length;
  };
  const validateStep2 = () => {
    const e={};
    if (!education.qualification) e.qualification="Qualification is required";
    if (!education.institution) e.institution="Institution is required";
    if (!education.field) e.field="Field of study is required";
    if (!education.year) e.year="Year is required";
    if (!education.cgpa) e.cgpa="CGPA/Percentage is required";
    if (education.year&&!/^\d{4}$/.test(education.year)) e.year="Enter a valid year (YYYY)";
    setValidationErrors(e); return !Object.keys(e).length;
  };

  // ✅ FIXED validateStep3 — checks both isDirectApply AND isKansas AND name
  const validateStep3 = () => {
    if (selectedUniversities.length<3) {
      setError('Please select at least 3 universities'); setTimeout(()=>setError(''),3000); return false;
    }
    for (const u of selectedUniversities) {
      if (!isDirectApplyUniversity(u) && !(u.selectedCourses?.length)) {
        setError(`Please select at least one course for ${u.INSTNM||u.name||'this university'}`);
        setTimeout(()=>setError(''),3000); return false;
      }
    }
    return true;
  };

  const isStep1Valid = () => basicInfo.fullName&&basicInfo.mobile&&basicInfo.dob&&basicInfo.gender&&basicInfo.nationality&&basicInfo.residence;
  const isStep2Valid = () => education.qualification&&education.institution&&education.field&&education.year&&education.cgpa;

  // ✅ FIXED isStep3Valid — uses isDirectApplyUniversity helper
  const isStep3Valid = () => {
    if (selectedUniversities.length<3) return false;
    return selectedUniversities.every(u => isDirectApplyUniversity(u) || (u.selectedCourses?.length>0));
  };

  const navigateToDashboard = () => navigate(userType==='transfer'?'/transfer/dashboard':'/firstyear/dashboard');

  const handleImageUpload = (e) => {
    const file=e.target.files[0]; if (!file) return;
    if (file.size>5*1024*1024) { setError("Image must be under 5 MB"); return; }
    if (!file.type.startsWith('image/')) { setError("Please upload an image file"); return; }
    setProfileImage(file);
    const reader=new FileReader(); reader.onloadend=()=>setImagePreview(reader.result); reader.readAsDataURL(file);
  };
  const uploadProfileImage = async () => {
    if (!profileImage||!token) return;
    try { await axios.patch(`${API_URL}/api/user/profile/image`,{profileImage:imagePreview},{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}}); } catch (_) {}
  };

  // ✅ FIXED handleSubmitProfile — sets BOTH isKansas AND isDirectApply
  const handleSubmitProfile = async () => {
    if (!token) { setError("You must be logged in."); return; }
    if (!validateStep3()) return;
    setSaving(true); setError('');
    let formattedUniversities = [];
    try {
      if (profileImage) await uploadProfileImage();

      formattedUniversities = selectedUniversities.map(u => {
        const city  = u.CITY   || u.city  || u.location?.city  || '';
const state = u.STABBR || u.state || u.location?.state || '';
        // ✅ detect direct-apply using the shared helper
        const isDirect = isDirectApplyUniversity(u);

        return {
          id:    u.id || u.UNITID?.toString() || u.universityCode || u._id?.toString() || u._normalizedId || '',
          unitid: u.UNITID || null,
          name:  u.INSTNM  || u.universityName || u.name || 'Unknown University',
          location: [city,state].filter(Boolean).join(', ') || 'Location not specified',
          city, state,
          country: u.location?.country || u.country || u.COUNTRY || 'USA',
          isKansas:      isDirect,   // ✅ backend controller checks this
          isDirectApply: isDirect,   // ✅ model pre-save hook checks this
          selectedCourses: isDirect
            ? []  // direct-apply → empty courses array, no validation error
            : (u.selectedCourses||[]).map(c => ({
                id:           c.id           || `course-${Math.random()}`,
                title:        c.title        || c.name || c.program_name || 'Program',
                name:         c.name         || c.title || c.program_name || 'Program',
                program_name: c.program_name || c.title || c.name || '',
                level:        c.level        || '',
                studyMode:    c.studyMode    || '',
                duration:     c.duration     || '',
                locations:    Array.isArray(c.locations) ? c.locations : [],
                majorArea:    c.majorArea    || '',
                description:  c.description  || '',
              })),
        };
      });

      const profileData = {
        profileImage:imagePreview, basicInfo, education, eligibleProgram,
        selectedUniversities:formattedUniversities,
        profileCompleted:true, completedAt:new Date().toISOString(),
      };

      if (JSON.stringify(profileData).length>500000) {
        setError("Profile data too large. Reduce course selections."); setSaving(false); return;
      }

      const res = await axios.post(`${API_URL}/api/user/profile`, profileData, {
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      });

      if (res.data.success) {
        localStorage.setItem('userProfile',JSON.stringify(profileData));
        localStorage.setItem('profileCompleted','true');
        showToast("Profile submitted! Redirecting…","success");
        setTimeout(navigateToDashboard,1500);
      } else {
        setError(res.data.message||"Failed to save profile.");
      }
    } catch (e) {
      console.error('❌ Profile submit error:', e.response?.data);
      let msg="Failed to save profile.";
      if (e.response?.status===401) { msg="Session expired."; setTimeout(()=>navigate('/login'),2000); }
      else if (e.response?.status===400) msg=e.response.data.errors?.join(', ')||e.response.data.message||msg;
      else if (e.response?.data?.message) msg=e.response.data.message;
      setError(msg);
      const profileData={basicInfo,education,eligibleProgram,selectedUniversities:formattedUniversities,profileCompleted:true};
      localStorage.setItem('userProfile',JSON.stringify(profileData));
      localStorage.setItem('profileCompleted','true');
      showToast("Saved locally. Redirecting…","warning");
      setTimeout(navigateToDashboard,1500);
    } finally { setSaving(false); }
  };

  const handleSaveProgress = (next) => {
    if (step===1&&!validateStep1()) return;
    if (step===2&&!validateStep2()) return;
    if (step===3&&next===4&&!validateStep3()) return;
    setStep(next); window.scrollTo({top:0,behavior:'smooth'});
  };

  const getInitials     = (n="") => n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||"UNI";
  const getUserInitials = () => basicInfo.fullName?basicInfo.fullName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase():(userEmail?.[0]?.toUpperCase()||'U');
  const getLevelColor = (l="") => { const s=l.toLowerCase(); if(s.includes('bachelor')||s.includes('undergraduate')) return '#4CAF50'; if(s.includes('master')||s.includes('graduate')||s.includes('mba')) return '#FF9800'; if(s.includes('phd')||s.includes('doctorate')) return '#F44336'; if(s.includes('diploma')) return '#9C27B0'; if(s.includes('certificate')) return '#00BCD4'; return '#757575'; };
  const getStudyModeColor = (m="") => { const s=m.toLowerCase(); if(s.includes('online')) return '#2196F3'; if(s.includes('campus')) return '#FFC107'; if(s.includes('hybrid')||s.includes('blended')) return '#9C27B0'; if(s.includes('distance')) return '#00BCD4'; return '#757575'; };
  const getSourceLabel = (u) => { if(u._source==='bachelors') return "🎓 Bachelor's"; if(u._source==='masters') return "📘 Master's"; return null; };

  if (fetchingProfile) {
    return (<div className="profile-wrapper"><div className="loading-screen"><div className="loading-spinner-large" /><p>Loading your profile…</p></div></div>);
  }

  return (
    <div className="profile-wrapper">

      {showRequestPopup && (
        <UniversityRequestPopup token={token} pendingRequest={pendingRequest}
          onApproved={handlePopupApproved} onRejected={handlePopupRejected} onDismiss={handlePopupDismiss} />
      )}

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span>{toast.type==='success'?'✅':toast.type==='warning'?'⚠️':'❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-animation"><div className="checkmark-circle"><div className="checkmark" /></div></div>
        </div>
      )}

      <div className="userprofile-profile-header">
        <div className="header-container">
          <div className="profile-image-wrapper">
            <div className="profile-image-container">
              {imagePreview?<img src={imagePreview} alt="Profile" className="profile-image" />:<div className="profile-image-placeholder"><span className="placeholder-initials">{getUserInitials()}</span></div>}
              <label htmlFor="profile-upload" className="image-upload-label">
                <input type="file" id="profile-upload" accept="image/*" onChange={handleImageUpload} className="image-upload-input" />
                <span className="upload-icon">+</span>
              </label>
            </div>
          </div>
          <div className="header-title-section">
            <h1 className="header-title">Complete Your Profile</h1>
            <p className="header-email">{basicInfo.email}</p>
          </div>
          <button className="header-cancel-btn ripple-effect" onClick={()=>{ if(window.confirm("Cancel? Your progress will be lost.")) navigateToDashboard(); }}>Cancel</button>
        </div>
      </div>

      <div className="userprofile-profile-content">

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span><span>{error}</span>
            {error.includes("connect")&&<button className="retry-btn ripple-effect" onClick={fetchUniversities}>Retry</button>}
          </div>
        )}

        {resultBanner && (
          <div className={`urp-result-banner urp-banner-${resultBanner.type}`}>
            <span className="urp-banner-icon">{resultBanner.type==='approved'?'🎉':'❌'}</span>
            <div className="urp-banner-text">
              {resultBanner.type==='approved'
                ?<><strong>"{resultBanner.uniName}"</strong> was approved and is now in your list! Search for it below.</>
                :<><strong>"{resultBanner.uniName}"</strong> request was not approved.{resultBanner.reason?` Reason: ${resultBanner.reason}`:''} Please select from available universities.</>}
            </div>
            <button className="urp-banner-close" onClick={()=>setResultBanner(null)}>×</button>
          </div>
        )}

        <div className="userprofile-progress-container">
          <div className="progress-steps-horizontal">
            {[{num:1,label:"Basic Info"},{num:2,label:"Education"},{num:3,label:"Universities & Courses"},{num:4,label:"Review"}].map(({num,label})=>(
              <div key={num} className={`step-horizontal ${step===num?'active':''} ${step>num?'completed':''}`}>
                <span className="step-number-horizontal">{num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1 */}
        {step===1&&(
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Personal Information</h2><p>Tell us about yourself</p></div>
            <div className="form-fields">
              {[{label:"Full Name",key:"fullName",type:"text",placeholder:"John Doe"},{label:"Mobile Number",key:"mobile",type:"tel",placeholder:"+1 9876543210"},{label:"Date of Birth",key:"dob",type:"date",placeholder:""},{label:"Nationality",key:"nationality",type:"text",placeholder:"e.g., Indian, American"},{label:"Country of Residence",key:"residence",type:"text",placeholder:"e.g., India, USA, UK"}].map(({label,key,type,placeholder})=>(
                <div className="form-row" key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={placeholder} value={basicInfo[key]}
                    onChange={e=>{setBasicInfo({...basicInfo,[key]:e.target.value});if(validationErrors[key])setValidationErrors({...validationErrors,[key]:null});}}
                    className={validationErrors[key]?'error':''} />
                  {validationErrors[key]&&<span className="field-error">{validationErrors[key]}</span>}
                </div>
              ))}
              <div className="form-row"><label>Email ID</label><input type="email" value={basicInfo.email} disabled className="disabled-input" /><span className="email-note">Auto-filled from your account</span></div>
              <div className="form-row">
                <label>Gender</label>
                <select value={basicInfo.gender} onChange={e=>{setBasicInfo({...basicInfo,gender:e.target.value});if(validationErrors.gender)setValidationErrors({...validationErrors,gender:null});}} className={validationErrors.gender?'error':''}>
                  <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                </select>
                {validationErrors.gender&&<span className="field-error">{validationErrors.gender}</span>}
              </div>
            </div>
            <div className="form-actions"><button className="continue-btn ripple-effect" onClick={()=>handleSaveProgress(2)} disabled={!isStep1Valid()}>Continue to Education →</button></div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2&&(
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Education Background</h2><p>Tell us about your academic journey</p></div>
            <div className="form-fields">
              <div className="form-row">
                <label>Highest Qualification Completed</label>
                <select value={education.qualification} onChange={e=>{const v=e.target.value;setEducation({...education,qualification:v});setEligibleProgram(detectProgram(v));if(validationErrors.qualification)setValidationErrors({...validationErrors,qualification:null});}} className={validationErrors.qualification?'error':''}>
                  <option value="">Select Qualification</option><option value="12th">12th / High School</option><option value="Bachelor">Bachelor's Degree</option><option value="Master">Master's Degree</option>
                </select>
                {validationErrors.qualification&&<span className="field-error">{validationErrors.qualification}</span>}
              </div>
              {[{label:"University / School Name",key:"institution",placeholder:"Enter institution name"},{label:"Field of Study",key:"field",placeholder:"e.g., Computer Science, Business"},{label:"Year of Passing",key:"year",placeholder:"e.g., 2023"},{label:"Percentage / CGPA",key:"cgpa",placeholder:"e.g., 85% or 8.5"}].map(({label,key,placeholder})=>(
                <div className="form-row" key={key}>
                  <label>{label}</label>
                  <input type="text" placeholder={placeholder} value={education[key]}
                    onChange={e=>{setEducation({...education,[key]:e.target.value});if(validationErrors[key])setValidationErrors({...validationErrors,[key]:null});}}
                    className={validationErrors[key]?'error':''} />
                  {validationErrors[key]&&<span className="field-error">{validationErrors[key]}</span>}
                </div>
              ))}
            </div>
            {eligibleProgram&&(<div className="eligibility-badge"><span className="badge-icon">🎓</span><span>You are eligible for: <strong>{eligibleProgram} Programs</strong></span></div>)}
            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={()=>setStep(1)}>← Back</button>
              <button className="continue-btn ripple-effect" onClick={()=>handleSaveProgress(3)} disabled={!isStep2Valid()}>Continue to Universities & Courses →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3&&(
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Select Universities &amp; Courses</h2><p>Choose at least 3 universities and select up to 2 courses for each</p></div>
            {eligibleProgram&&(<div className="program-indicator"><span>Showing universities for: <strong>{eligibleProgram} Program</strong></span></div>)}
            <div className="university-controls">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input type="text" className="search-input" placeholder="Search universities by name, city, country…"
                  value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                {searchTerm&&(<button className="search-clear-btn" onClick={()=>{setSearchTerm("");setApprovedUniName(null);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#94a3b8',padding:'0 8px'}}>×</button>)}
              </div>
              <div className="selection-counter"><span className="counter-number">{selectedUniversities.length}</span><span>/5 selected</span></div>
            </div>

            {loading?(
              <div className="loading-state"><div className="loading-spinner" /><p>Loading universities…</p><button className="retry-small-btn ripple-effect" onClick={fetchUniversities}>Retry</button></div>
            ):(
              <>
                <div className="universities-grid">
                  {filteredUniversities.length>0?filteredUniversities.map(uni=>{
                    const key=getUniKey(uni);
                    const isSel=selectedUniversities.some(u=>getUniKey(u)===key);
                    const progCount=uni.programs?.length||0;
                    const isDirect=progCount===0;
                    const selUni=selectedUniversities.find(u=>getUniKey(u)===key);
                    const selCourses=selUni?.selectedCourses||[];
                    const srcLabel=getSourceLabel(uni);
                    const isHighlighted=approvedUniName&&(uni.INSTNM||'').toLowerCase().includes(approvedUniName.toLowerCase());
                    return (
                      <div key={key||Math.random()} className="university-card-wrapper">
                        <div className={`university-card ${isSel?'selected':''} ${isDirect?'direct-apply':''} ${isHighlighted?'urp-highlight-card':''}`} onClick={()=>toggleUniversity(uni)}>
                          {isHighlighted&&<div className="urp-new-badge">✨ Just Added!</div>}
                          <div className="university-logo">{getInitials(uni.INSTNM)}</div>
                          <div className="university-details">
                            <h4>{uni.INSTNM||uni.universityName||uni.name||'Unknown University'}</h4>
                            <p>{uni.CITY||uni.location?.city||''}{(uni.CITY||uni.location?.city)&&(uni.STABBR||uni.location?.state)?', ':''}{uni.STABBR||uni.location?.state||''}</p>
                            {progCount>0&&<span className="program-badge">{progCount} courses available</span>}
                            {isDirect&&<span className="direct-apply-badge">Direct Apply</span>}
                            {srcLabel&&<span className="source-label-badge">{srcLabel}</span>}
                          </div>
                          {isSel&&<span className="check-mark">✓</span>}
                        </div>
                        {isSel&&!isDirect&&selCourses.length>0&&(
                          <div className="selected-courses-preview">
                            <span className="preview-label">Selected courses:</span>
                            <div className="preview-courses">{selCourses.map((c,i)=><span key={i} className="preview-course-tag">{c.title||c.name||c.program_name||'Course'}</span>)}</div>
                            <button className="edit-courses-btn ripple-effect" onClick={e=>{e.stopPropagation();openCourseModal(uni);}}>Edit Courses</button>
                          </div>
                        )}
                        {isSel&&!isDirect&&selCourses.length===0&&(
                          <div className="selected-courses-preview warning">
                            <span className="preview-label">⚠️ No courses selected</span>
                            <button className="edit-courses-btn ripple-effect" onClick={e=>{e.stopPropagation();openCourseModal(uni);}}>Select Courses</button>
                          </div>
                        )}
                      </div>
                    );
                  }):(
                    <div className="no-results">
                      <p>No universities found{searchTerm?` matching "${searchTerm}"`:''}.  </p>
                      {searchTerm&&<button className="retry-btn ripple-effect" onClick={()=>setSearchTerm('')}>Clear Search</button>}
                    </div>
                  )}
                </div>
                <div className="request-university-banner">
                  <div className="request-banner-content">
                    <div className="request-banner-icon">🏛️</div>
                    <div className="request-banner-text"><strong>Can't find your university?</strong><p>Submit a request and our team will add it for you.</p></div>
                    <button className="request-university-btn ripple-effect" onClick={openRequestModal}>+ Request New University</button>
                  </div>
                </div>
              </>
            )}
            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={()=>setStep(2)}>← Back</button>
              <button className="continue-btn ripple-effect" onClick={()=>handleSaveProgress(4)} disabled={!isStep3Valid()}>Continue to Review →</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step===4&&(
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Review Your Profile</h2><p>Verify everything before submitting</p></div>
            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                {[['Full Name',basicInfo.fullName],['Email',basicInfo.email],['Mobile',basicInfo.mobile],['Date of Birth',basicInfo.dob],['Gender',basicInfo.gender],['Nationality',basicInfo.nationality],['Residence',basicInfo.residence]].map(([l,v])=>(
                  <p key={l}><strong>{l}:</strong> {v||'Not provided'}</p>
                ))}
              </div>
            </div>
            <div className="review-section">
              <h3>Education Background</h3>
              <div className="review-grid">
                {[['Qualification',education.qualification],['Institution',education.institution],['Field',education.field],['Year',education.year],['CGPA',education.cgpa]].map(([l,v])=>(
                  <p key={l}><strong>{l}:</strong> {v||'Not provided'}</p>
                ))}
              </div>
            </div>
            <div className="review-section">
              <h3>Selected Universities &amp; Courses ({selectedUniversities.length})</h3>
              <div className="universities-list">
                {selectedUniversities.length>0?selectedUniversities.map((uni,i)=>{
                  const courses=uni.selectedCourses||[];
                  const isDirect=isDirectApplyUniversity(uni)||(!courses.length&&!(uni.programs?.length));
                  const city=uni.CITY||uni.city||uni.location?.city||'';
                  const state=uni.STABBR||uni.state||uni.location?.state||'';
                  const country=uni.location?.country||uni.country||uni.COUNTRY||'USA';
                  const locStr=[city,state,country].filter(Boolean).join(', ');
                  const website=uni.WEBADDR||uni.website||uni.contact?.website||'';
                  return (
                    <div key={getUniKey(uni)||i} className="review-university-item">
                      <p className="review-university-name">
                        <strong>{i+1}. {uni.INSTNM||uni.universityName||uni.name||'Unknown'}</strong>
                        {isDirect&&<span className="direct-apply-tag"> (Direct Apply)</span>}
                        {uni._source==='bachelors'&&<span className="source-tag bachelors-tag"> 🎓 Bachelor's</span>}
                        {uni._source==='masters'&&<span className="source-tag masters-tag"> 📘 Master's</span>}
                      </p>
                      <div className="review-uni-details">
                        {locStr&&<p className="review-detail-item"><span className="review-detail-label">📍 Location:</span><span>{locStr}</span></p>}
                        {website&&<p className="review-detail-item"><span className="review-detail-label">🌐 Website:</span><a href={website.startsWith('http')?website:`https://${website}`} target="_blank" rel="noopener noreferrer">{website}</a></p>}
                      </div>
                      {isDirect&&<div className="direct-apply-review-note"><span>✅ Direct application — no course pre-selection required.</span></div>}
                      {!isDirect&&courses.length>0&&(
                        <div className="review-courses-list">
                          <p className="courses-label">Selected Courses ({courses.length}):</p>
                          <ul>{courses.map((c,ci)=><li key={ci}>{c.title||c.name||c.program_name||'Course'}{c.level&&<span className="course-level"> - {c.level}</span>}{c.studyMode&&<span className="course-mode"> ({c.studyMode})</span>}{c.duration&&<span className="course-duration"> · {c.duration}</span>}</li>)}</ul>
                        </div>
                      )}
                      {!isDirect&&!courses.length&&<p className="warning-text">⚠️ No courses selected</p>}
                    </div>
                  );
                }):<p>No universities selected</p>}
              </div>
            </div>
            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={()=>setStep(3)}>← Back</button>
              <button className="submit-btn ripple-effect" onClick={handleSubmitProfile} disabled={saving||!isStep3Valid()}>{saving?'Submitting…':'Submit Profile'}</button>
            </div>
          </div>
        )}

        <div className="bottom-progress">
          <div className="progress-steps-horizontal">
            {[{num:1,label:"Basic Info"},{num:2,label:"Education"},{num:3,label:"Universities & Courses"},{num:4,label:"Review"}].map(({num,label})=>(
              <div key={num} className={`step-horizontal ${step===num?'active':''} ${step>num?'completed':''}`}>
                <span className="step-number-horizontal">{num}</span><span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Selection Modal */}
      {showCourseModal&&currentUniversity&&(
        <div className="modal-overlay" onClick={closeCourseModal}>
          <div className="modal-content course-modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Select Courses for {currentUniversity.INSTNM}</h3><button className="modal-close-btn ripple-effect" onClick={closeCourseModal}>×</button></div>
            <div className="modal-body">
              <p className="course-selection-info">Select up to 2 courses</p>
              <div className="selected-count">Selected: {tempSelectedCourses.length}/2</div>
              <div className="course-search-section">
                <div className="course-search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input type="text" className="course-search-input" placeholder="Search courses…" value={courseSearchTerm} onChange={e=>setCourseSearchTerm(e.target.value)} />
                  {courseSearchTerm&&<button className="clear-search-btn" onClick={()=>setCourseSearchTerm("")}>×</button>}
                </div>
              </div>
              {loadingCourses?(<div className="courses-loading"><div className="spinner-small" /><p>Loading…</p></div>
              ):filteredCourses.length>0?(
                <div className="courses-grid">
                  {filteredCourses.map((c,i)=>{
                    const isSel=tempSelectedCourses.some(x=>x.id===c.id);
                    const name=c.title||c.name||c.program_name||'Course';
                    return (
                      <div key={c.id||i} className={`course-card ${isSel?'selected':''}`} onClick={()=>toggleTempCourse(c)}>
                        <h4 className="course-title">{name}</h4>
                        <div className="course-badges">
                          {c.level&&<span className="course-level-badge" style={{backgroundColor:getLevelColor(c.level)}}>{c.level}</span>}
                          {c.studyMode&&<span className="course-mode-badge" style={{backgroundColor:getStudyModeColor(c.studyMode)}}>{c.studyMode}</span>}
                        </div>
                        {c.duration&&<span className="course-duration">{c.duration}</span>}
                        {c.majorArea&&<span className="course-major">{c.majorArea}</span>}
                        {isSel&&<span className="course-selected-check">✓ Selected</span>}
                      </div>
                    );
                  })}
                </div>
              ):(<div className="no-courses"><p>No courses found.</p>{courseSearchTerm&&<button className="clear-filters-btn" onClick={()=>setCourseSearchTerm("")}>Clear Search</button>}</div>)}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn ripple-effect" onClick={closeCourseModal}>Cancel</button>
              <button className="save-btn ripple-effect" onClick={saveCourseSelection} disabled={!tempSelectedCourses.length}>Save Selection ({tempSelectedCourses.length}/2)</button>
            </div>
          </div>
        </div>
      )}

      {/* Request University Modal */}
      {showRequestModal&&(
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content request-university-modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>🏛️ Request a New University</h3><button className="modal-close-btn ripple-effect" onClick={closeRequestModal}>×</button></div>
            {requestSuccess?(
              <div className="request-success-state"><div className="request-success-icon">✅</div><h4>Submitted! Opening status window…</h4></div>
            ):(
              <div className="modal-body">
                <p className="request-modal-desc">Can't find your university? Fill in the details and our team will review and add it.</p>
                {requestFormErrors.submit&&<div className="request-submit-error"><span>⚠️ {requestFormErrors.submit}</span></div>}
                <div className="form-fields">
                  <div className="form-row">
                    <label>University Name <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., Harvard University" value={requestForm.universityName}
                      onChange={e=>{setRequestForm({...requestForm,universityName:e.target.value});if(requestFormErrors.universityName)setRequestFormErrors({...requestFormErrors,universityName:null});}}
                      className={requestFormErrors.universityName?'error':''} />
                    {requestFormErrors.universityName&&<span className="field-error">{requestFormErrors.universityName}</span>}
                  </div>
                  <div className="form-row">
                    <label>Country <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., United States" value={requestForm.country}
                      onChange={e=>{setRequestForm({...requestForm,country:e.target.value});if(requestFormErrors.country)setRequestFormErrors({...requestFormErrors,country:null});}}
                      className={requestFormErrors.country?'error':''} />
                    {requestFormErrors.country&&<span className="field-error">{requestFormErrors.country}</span>}
                  </div>
                  <div className="form-row" style={{position:'relative'}}>
                    <label>Courses of Interest <span className="required-star">*</span><span className="optional-label"> — up to 5</span></label>
                    <div className={`course-tag-input-wrapper${requestFormErrors.courses?' error-border':''}`}>
                      {reqCourses.map((c,i)=>(<span key={i} className="course-tag">{c}<button type="button" className="course-tag-remove" onClick={()=>removeReqCourse(c)}>×</button></span>))}
                      {reqCourses.length<5&&(
                        <input ref={reqCourseInputRef} type="text" className="course-tag-input"
                          placeholder={reqCourses.length===0?"Type a course and press Enter…":"Add another…"}
                          value={reqCourseInput} onChange={e=>setReqCourseInput(e.target.value)}
                          onKeyDown={handleReqCourseKey}
                          onFocus={()=>{if(reqSuggestions.length)setShowReqSuggestions(true);}}
                          onBlur={()=>setTimeout(()=>setShowReqSuggestions(false),150)}
                          autoComplete="off" />
                      )}
                    </div>
                    <span className="course-tag-hint">Press Enter or , to add · Backspace to remove</span>
                    {showReqSuggestions&&reqSuggestions.length>0&&(
                      <div className="course-suggestions-dropdown">
                        {reqSuggestions.map((s,i)=><button key={i} type="button" className="course-suggestion-item" onMouseDown={()=>addReqCourse(s)}>{s}</button>)}
                      </div>
                    )}
                    {requestFormErrors.courses&&<span className="field-error">{requestFormErrors.courses}</span>}
                  </div>
                </div>
                <div className="request-info-note"><span>ℹ️</span><p>A status popup will appear so you can track the admin's response in real time.</p></div>
              </div>
            )}
            {!requestSuccess&&(
              <div className="modal-footer">
                <button className="cancel-btn ripple-effect" onClick={closeRequestModal} disabled={submittingRequest}>Cancel</button>
                <button className="save-btn ripple-effect" onClick={handleSubmitRequest} disabled={submittingRequest}>
                  {submittingRequest?<span className="btn-loading"><span className="btn-spinner"/>Submitting…</span>:'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;