// src/components/UserProfile.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from '../api/axiosInstance';
import "./UserProfile.css";
import EdutechLogo from "./../assets/Edutech-logo.svg";



const URP_POLL_MS = 12000;
const URP_WAIT_MS = 10 * 60 * 1000;

const SEGMENTS = {
  UG: [
    { id: 'ug-science',   name: 'Science'  },
    { id: 'ug-commerce',  name: 'Commerce' },
    { id: 'ug-arts',      name: 'Arts'     },
  ],
  PG: [
    { id: 'pg-engineering', name: 'Engineering'   },
    { id: 'pg-business',    name: 'Business'      },
    { id: 'pg-medical',     name: 'Medical'       },
    { id: 'pg-arts-sci',    name: 'Arts & Science'},
  ],
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

// ─────────────────────────────────────────────────────────────────────────────
// INLINE STYLES
// ─────────────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('urp-styles')) {
  const s = document.createElement('style');
  s.id = 'urp-styles';
  s.textContent = `
.urp-overlay{position:fixed;inset:0;z-index:99999;background:rgba(8,12,36,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:urp-fade-in .2s ease-out}
@keyframes urp-fade-in{from{opacity:0}to{opacity:1}}
.urp-card{background:#fff;border-radius:20px;width:100%;max-width:400px;position:relative;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.26),0 8px 24px rgba(0,0,0,.1);animation:urp-slide-up .38s cubic-bezier(.34,1.56,.64,1)}
@keyframes urp-slide-up{from{opacity:0;transform:translateY(28px) scale(.93)}to{opacity:1;transform:translateY(0) scale(1)}}
.urp-phase-waiting{border-top:4px solid #6366f1}
.urp-phase-approved{border-top:4px solid #10b981}
.urp-phase-rejected{border-top:4px solid #ef4444}
.urp-phase-timeout{border-top:4px solid #f59e0b}
.urp-body{padding:24px 22px 22px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;position:relative}
.urp-close{position:absolute;top:10px;right:12px;width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
.urp-close:hover{background:#e2e8f0;color:#1e293b}
.urp-title{font-size:19px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-.3px;line-height:1.25}
.urp-title-green{color:#065f46}.urp-title-red{color:#7f1d1d}
.urp-desc{font-size:13px;color:#475569;margin:0;line-height:1.6;max-width:340px}
.urp-highlight{color:#1e293b}
.urp-rings{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.urp-ring{position:absolute;border-radius:50%;border:2px solid transparent}
.urp-ring-1{inset:0;border-top-color:#6366f1;border-right-color:#6366f1;animation:urp-spin 1.4s linear infinite}
.urp-ring-2{inset:8px;border-bottom-color:#8b5cf6;border-left-color:#8b5cf6;animation:urp-spin 2s linear infinite reverse}
.urp-ring-3{inset:16px;border-top-color:#a78bfa;animation:urp-spin 2.8s linear infinite}
@keyframes urp-spin{to{transform:rotate(360deg)}}
.urp-center-logo{position:relative;z-index:2;width:36px;height:36px;display:flex;align-items:center;justify-content:center}
.urp-center-logo img{width:100%;height:100%;object-fit:contain}
.urp-chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.urp-chip{background:#ede9fe;color:#5b21b6;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600}
.urp-status-badge{display:inline-flex;align-items:center;gap:7px;background:#f0f0ff;border:1px solid #c7d2fe;border-radius:999px;padding:7px 16px;font-size:12px;color:#4338ca;font-weight:600}
.urp-pulse{width:7px;height:7px;border-radius:50%;background:#6366f1;flex-shrink:0;animation:urp-pulse-anim 1.3s ease-in-out infinite}
@keyframes urp-pulse-anim{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.45}}
.urp-progress-track{width:100%;height:5px;background:#e2e8f0;border-radius:999px;overflow:hidden}
.urp-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:999px;transition:width 1s linear}
.urp-timer{width:100%;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
.urp-timer-value{font-weight:700;font-variant-numeric:tabular-nums;color:#6366f1;font-size:12px}
.urp-note{font-size:11px;color:#94a3b8;margin:0;line-height:1.5;max-width:320px}
.urp-burst{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.urp-burst-dot{position:absolute;width:7px;height:7px;border-radius:2px;animation:urp-burst-fly .7s ease-out forwards}
.urp-bd-0{background:#10b981;top:2px;left:34px;animation-delay:.30s}
.urp-bd-1{background:#f59e0b;top:8px;right:4px;animation-delay:.35s}
.urp-bd-2{background:#6366f1;top:34px;right:2px;animation-delay:.40s}
.urp-bd-3{background:#ef4444;bottom:8px;right:8px;animation-delay:.45s}
.urp-bd-4{background:#3b82f6;bottom:2px;left:34px;animation-delay:.30s}
.urp-bd-5{background:#ec4899;bottom:8px;left:4px;animation-delay:.35s}
.urp-bd-6{background:#10b981;top:34px;left:2px;animation-delay:.40s}
.urp-bd-7{background:#a78bfa;top:2px;left:10px;animation-delay:.45s}
.urp-bd-8{background:#fbbf24;top:2px;right:14px;animation-delay:.50s}
.urp-bd-9{background:#34d399;bottom:6px;right:20px;animation-delay:.55s}
@keyframes urp-burst-fly{0%{opacity:0;transform:scale(0) rotate(0deg)}60%{opacity:1;transform:scale(1.3) rotate(200deg) translate(10px,-14px)}100%{opacity:0;transform:scale(.8) rotate(360deg) translate(18px,-26px)}}
.urp-check-wrap{position:relative;z-index:2}
.urp-check-svg{width:64px;height:64px}
.urp-circle{fill:none;stroke:#10b981;stroke-width:2;stroke-dasharray:160;stroke-dashoffset:160;animation:urp-draw .55s cubic-bezier(.65,0,.45,1) .1s forwards}
.urp-tick{fill:none;stroke:#10b981;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:50;stroke-dashoffset:50;animation:urp-draw .35s ease-out .6s forwards}
@keyframes urp-draw{to{stroke-dashoffset:0}}
.urp-reject-wrap{display:flex;align-items:center;justify-content:center}
.urp-reject-circle{width:64px;height:64px;border-radius:50%;background:#fee2e2;border:2px solid #fca5a5;display:flex;align-items:center;justify-content:center;animation:urp-slide-up .45s cubic-bezier(.34,1.56,.64,1)}
.urp-reject-x{display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:28px;font-weight:700}
.urp-timeout-icon{display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:44px;animation:urp-float 3s ease-in-out infinite}
@keyframes urp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.urp-reason{width:100%;background:#fff1f2;border:1px dashed #fca5a5;border-radius:10px;padding:12px 14px;text-align:left}
.urp-reason-label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#ef4444;margin-bottom:5px}
.urp-reason-text{font-size:12px;color:#7f1d1d;margin:0;line-height:1.5;font-style:italic}
.urp-infobox{width:100%;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;text-align:left}
.urp-infobox-green{background:#f0fdf4;border:1px solid #bbf7d0}
.urp-infobox-red{background:#fff7f7;border:1px solid #fecaca}
.urp-infobox-amber{background:#fffbeb;border:1px solid #fde68a}
.urp-inforow{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#334155;line-height:1.5}
.urp-infoicon{display:flex;align-items:center;flex-shrink:0;margin-top:1px}
.urp-btn-primary{width:100%;padding:12px 18px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .18s,box-shadow .18s;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;letter-spacing:-.2px}
.urp-btn-green{background:linear-gradient(135deg,#10b981,#059669)}
.urp-btn-blue{background:linear-gradient(135deg,#3b82f6,#2563eb)}
.urp-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.16)}
.urp-btn-primary:active{transform:translateY(0);box-shadow:none}
.urp-btn-ghost{width:100%;padding:10px 18px;border:1.5px solid #e2e8f0;border-radius:12px;background:transparent;font-size:13px;font-weight:600;color:#475569;cursor:pointer;transition:border-color .15s,color .15s,background .15s}
.urp-btn-ghost:hover{border-color:#6366f1;color:#6366f1;background:#f0f0ff}
.urp-btn-link{background:none;border:none;font-size:12px;color:#94a3b8;cursor:pointer;padding:3px;text-decoration:underline;transition:color .15s}
.urp-btn-link:hover{color:#475569}
.urp-highlight-card{border:2px solid #10b981 !important;box-shadow:0 0 0 3px rgba(16,185,129,.15) !important;animation:urp-highlight-pulse 2s ease-in-out 3}
@keyframes urp-highlight-pulse{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,.15)}50%{box-shadow:0 0 0 6px rgba(16,185,129,.28)}}
.urp-new-badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(16,185,129,.4);z-index:10}
.urp-result-banner{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;margin-bottom:14px;font-size:13px;line-height:1.5;position:relative}
.urp-banner-approved{background:#f0fdf4;border:1px solid #86efac;color:#065f46}
.urp-banner-rejected{background:#fff7f7;border:1px solid #fca5a5;color:#7f1d1d}
.urp-banner-icon{display:flex;align-items:center;flex-shrink:0;margin-top:1px}
.urp-banner-text{flex:1}
.urp-banner-text strong{font-weight:700}
.urp-banner-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.5;padding:0 2px;flex-shrink:0;display:flex;align-items:center}
.urp-banner-close:hover{opacity:1}
@media(max-width:480px){.urp-card{border-radius:16px}.urp-body{padding:20px 16px 18px;gap:12px}.urp-title{font-size:17px}}
.branch-step-wrapper{display:flex;flex-direction:column;align-items:center;gap:2rem;padding:1rem 0}
.branch-step-label{font-size:.85rem;color:#64748b;text-align:center;margin-bottom:.25rem}
.branch-cards-row{display:flex;gap:1.25rem;justify-content:center;width:100%;flex-wrap:wrap}
.branch-card{flex:1;min-width:200px;max-width:280px;border:2.5px solid #e2e8f0;border-radius:20px;padding:2rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:1rem;cursor:pointer;transition:all .22s cubic-bezier(.34,1.4,.64,1);background:#fff;position:relative;overflow:hidden}
.branch-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(99,102,241,.14)}
.branch-card.selected{border-color:#6366f1;background:linear-gradient(145deg,#f5f3ff,#eef2ff);box-shadow:0 8px 24px rgba(99,102,241,.18)}
.branch-card.ug-card.selected{border-color:#10b981;background:linear-gradient(145deg,#f0fdf4,#ecfdf5);box-shadow:0 8px 24px rgba(16,185,129,.18)}
.branch-card-title{font-size:1.15rem;font-weight:800;color:#1e293b;letter-spacing:-.3px}
.branch-card.selected .branch-card-title{color:#6366f1}
.branch-card.ug-card.selected .branch-card-title{color:#10b981}
.branch-card-subtitle{font-size:.78rem;color:#64748b;text-align:center;line-height:1.5}
.branch-card-tag{font-size:.65rem;font-weight:700;padding:.22rem .65rem;border-radius:999px;letter-spacing:.3px;text-transform:uppercase}
.branch-card-tag.pg-tag{background:#ede9fe;color:#5b21b6}
.branch-card-tag.ug-tag{background:#dcfce7;color:#15803d}
.branch-selected-indicator{display:inline-block;width:18px;height:18px;border-radius:50%;background:#6366f1;position:absolute;top:12px;right:12px}
.branch-card.ug-card.selected .branch-selected-indicator{background:#10b981}
.branch-info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:.875rem 1rem;font-size:.8rem;color:#475569;line-height:1.6;width:100%;max-width:480px;text-align:center}
.branch-info-box strong{color:#6366f1}
.segment-section{margin:0 0 1.5rem;padding:1rem;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0}
.segment-section-label{font-size:.8rem;font-weight:700;color:#475569;margin-bottom:.75rem;display:block;text-transform:uppercase;letter-spacing:.4px}
.segment-chips-row{display:flex;flex-wrap:wrap;gap:.5rem}
.segment-chip{padding:.45rem 1rem;border-radius:999px;border:2px solid #e2e8f0;background:#fff;font-size:.8rem;font-weight:600;color:#475569;cursor:pointer;transition:all .18s}
.segment-chip:hover{border-color:#6366f1;color:#6366f1}
.segment-chip.active-pg{border-color:#6366f1;background:#ede9fe;color:#5b21b6}
.segment-chip.active-ug{border-color:#10b981;background:#dcfce7;color:#15803d}
`;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE UNIVERSITY
// ─────────────────────────────────────────────────────────────────────────────
const normalizeUniversity = (uni, source = 'bachelors') => {
  let resolvedSource = source;
  if (uni.degree === 'master' || uni.educationLevel === 'Postgraduate') resolvedSource = 'masters';
  else if (uni.degree === 'bachelor' || uni.educationLevel === 'Undergraduate') resolvedSource = 'bachelors';
  else if (uni.universityType === 'Master') resolvedSource = 'masters';
  else if (uni.universityType === 'Bachelor') resolvedSource = 'bachelors';

  const name    = uni.INSTNM      || uni.universityName || uni.name || 'Unknown University';
  const city    = uni.CITY        || uni.city           || uni.location?.city  || '';
  const state   = uni.STABBR      || uni.state          || uni.location?.state || '';
  const country = uni.country     || uni.location?.country || uni.COUNTRY || 'USA';
  const unitid  = uni.UNITID      || uni.universityCode || uni._id?.toString() || '';

  let programs = [];
  if (Array.isArray(uni.programs) && uni.programs.length > 0) {
    programs = uni.programs.map((p, i) => {
      if (typeof p === 'string') {
        return {
          id: `prog-str-${resolvedSource}-${i}`,
          name: p, title: p, program_name: p,
          level: resolvedSource === 'masters' ? 'Master' : 'Bachelor',
          studyMode: 'On Campus',
          duration: resolvedSource === 'masters' ? '2 years' : '4 years',
        };
      }
      const resolved = p.name || p.title || p.program_name || `Program ${i + 1}`;
      return { ...p, name: resolved, title: resolved, program_name: p.program_name || resolved };
    });
  }
  if (!programs.length && uni.metadata?.programs?.length) {
    programs = uni.metadata.programs.map((p, i) => {
      const r = p.title || p.program_name || p.name || `Program ${i + 1}`;
      return { ...p, name: r, title: r, program_name: p.program_name || r };
    });
  }

  return {
    ...uni,
    _normalizedId: unitid,
    _source: resolvedSource,
    universityType: resolvedSource === 'masters' ? 'Master' : 'Bachelor',
    INSTNM: name, CITY: city, STABBR: state,
    location: { city, state, country, ...(typeof uni.location === 'object' ? uni.location : {}) },
    programs,
  };
};

const isDirectApplyUniversity = (u) =>
  !!(u.isKansas || u.isDirectApply ||
    (u.INSTNM || u.universityName || u.name || '').toLowerCase().includes('kansas'));

// ─────────────────────────────────────────────────────────────────────────────
// URP POPUP
// ─────────────────────────────────────────────────────────────────────────────
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
      const res = await axiosInstance.get('/api/user/notifications');
      const all = res.data?.notifications || res.data?.data || [];
      const uniLower = (pendingRequest?.universityName || "").toLowerCase();
      const matches = (n) =>
        !seenIds.current.has(n._id) &&
        (!uniLower || n.message?.toLowerCase().includes(uniLower));
      const approved = all.find(n => n.type === "UNIVERSITY_APPROVED" && matches(n));
      const rejected = all.find(n => n.type === "UNIVERSITY_REJECTED" && matches(n));
      if (approved) {
        resolvedRef.current = true; seenIds.current.add(approved._id);
        clearInterval(pollRef.current); clearInterval(timerRef.current);
        setResultData({ universityName: pendingRequest?.universityName || urpExtractName(approved.message) });
        setPhase("approved"); urpMarkRead(approved._id);
      } else if (rejected) {
        resolvedRef.current = true; seenIds.current.add(rejected._id);
        clearInterval(pollRef.current); clearInterval(timerRef.current);
        setResultData({
          universityName: pendingRequest?.universityName || urpExtractName(rejected.message),
          reason: urpExtractReason(rejected.message),
        });
        setPhase("rejected"); urpMarkRead(rejected._id);
      }
    } catch (_) {}
  }, [token, pendingRequest]);

  React.useEffect(() => {
    urpPoll();
    pollRef.current = setInterval(urpPoll, URP_POLL_MS);
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); clearInterval(dotsRef.current); };
  }, [urpPoll]);

  const urpMarkRead = async (id) => {
    try {
   await axiosInstance.patch(`/api/user/notifications/${id}/read`, {});
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
            <button className="urp-close" onClick={handleDismiss} aria-label="Close">x</button>
            <div className="urp-rings">
              <div className="urp-ring urp-ring-1" /><div className="urp-ring urp-ring-2" /><div className="urp-ring urp-ring-3" />
              <div className="urp-center-logo"><img src={EdutechLogo} alt="Edutech" /></div>
            </div>
            <h2 className="urp-title">Request Sent!</h2>
            <p className="urp-desc">Your request for <strong className="urp-highlight">"{pendingRequest?.universityName}"</strong> has been sent to the admin team.</p>
            {pendingRequest?.courses?.length > 0 && (
              <div className="urp-chips">{pendingRequest.courses.map((c, i) => <span key={i} className="urp-chip">{c}</span>)}</div>
            )}
            <div className="urp-status-badge"><span className="urp-pulse" />Waiting for admin review{dots}</div>
            <div className="urp-progress-track"><div className="urp-progress-fill" style={{ width: `${progressPct}%` }} /></div>
            <div className="urp-timer"><span>Time remaining</span><span className="urp-timer-value">{fmtTime(timeLeft)}</span></div>
            <p className="urp-note">Stay here to be notified instantly, or close and continue selecting other universities.</p>
            <button className="urp-btn-ghost" onClick={handleDismiss}>Continue Without Waiting</button>
          </div>
        )}
        {phase === "approved" && (
          <div className="urp-body">
            <div className="urp-burst">
              {[...Array(10)].map((_, i) => <div key={i} className={`urp-burst-dot urp-bd-${i}`} />)}
              <div className="urp-check-wrap"><svg className="urp-check-svg" viewBox="0 0 52 52"><circle className="urp-circle" cx="26" cy="26" r="24" /><path className="urp-tick" d="M14 27l8 8 16-16" /></svg></div>
            </div>
            <h2 className="urp-title urp-title-green">University Approved!</h2>
            <p className="urp-desc"><strong>"{resultData?.universityName}"</strong> has been added and is now visible in your list below.</p>
            <div className="urp-infobox urp-infobox-green">
              <div className="urp-inforow"><span>University is now in your search list</span></div>
              <div className="urp-inforow"><span>Search for it by name and click to select</span></div>
              <div className="urp-inforow"><span>Then pick 1 course from it</span></div>
            </div>
            <button className="urp-btn-primary urp-btn-green" onClick={handleApprovedAction}>Find and Select University</button>
            <button className="urp-btn-link" onClick={handleDismiss}>I'll do it later</button>
          </div>
        )}
        {phase === "rejected" && (
          <div className="urp-body">
            <div className="urp-reject-wrap"><div className="urp-reject-circle"><span className="urp-reject-x">X</span></div></div>
            <h2 className="urp-title urp-title-red">Request Not Approved</h2>
            <p className="urp-desc">Sorry, <strong>"{resultData?.universityName}"</strong> could not be added at this time.</p>
            {resultData?.reason && (<div className="urp-reason"><span className="urp-reason-label">Admin's note</span><p className="urp-reason-text">"{resultData.reason}"</p></div>)}
            <div className="urp-infobox urp-infobox-red">
              <div className="urp-inforow"><span>Please select from available universities below</span></div>
              <div className="urp-inforow"><span>You can re-submit with the official name</span></div>
            </div>
            <button className="urp-btn-primary urp-btn-blue" onClick={handleRejectedAction}>Select from Available Universities</button>
            <button className="urp-btn-link" onClick={handleDismiss}>Dismiss</button>
          </div>
        )}
        {phase === "timeout" && (
          <div className="urp-body">
            <div className="urp-timeout-icon">&#9201;</div>
            <h2 className="urp-title">Still Processing...</h2>
            <p className="urp-desc">Your request is still being reviewed. Admins usually respond within a few hours.</p>
            <div className="urp-infobox urp-infobox-amber">
              <div className="urp-inforow"><span>You'll be notified once admin responds</span></div>
              <div className="urp-inforow"><span>For now, select from existing universities</span></div>
            </div>
            <button className="urp-btn-primary" onClick={handleDismiss}>Continue Selecting Universities</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token     = localStorage.getItem('token');
  const userType  = localStorage.getItem('studentType') || 'firstyear';

  const [profileImage,    setProfileImage]    = useState(null);
  const [imagePreview,    setImagePreview]    = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error,           setError]           = useState('');
  const [toast,           setToast]           = useState({ show: false, message: '', type: 'success' });
  const [showSuccess,     setShowSuccess]     = useState(false);

  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [pendingRequest,   setPendingRequest]   = useState(null);
  const [approvedUniName,  setApprovedUniName]  = useState(null);
  const [resultBanner,     setResultBanner]     = useState(null);

  const bgPollRef     = useRef(null);
  const bgSeenIds     = useRef(new Set());
  const bgResolved    = useRef(false);
  const bgPendingName = useRef(null);

  // ── Core state ────────────────────────────────────────────────────────────
  const [basicInfo, setBasicInfo] = useState({
    fullName: '', email: userEmail, mobile: '', dob: '', gender: '', nationality: '', residence: '',
  });

  const [programType,  setProgramType]  = useState('');
  const [education,    setEducation]    = useState({ qualification: '', institution: '', field: '', cgpa: '' });
  const [selectedSegment, setSelectedSegment] = useState(null);

  // ── NEW: Course Interest state (Step 3) ───────────────────────────────────
  const [interestedCourses,     setInterestedCourses]     = useState([]);
  const [courseInterestInput,   setCourseInterestInput]   = useState('');
  const [courseInterestSuggest, setCourseInterestSuggest] = useState([]);
  const [showCourseInterestDdp, setShowCourseInterestDdp] = useState(false);
  const courseInterestInputRef = useRef(null);

  // ── Universities ──────────────────────────────────────────────────────────
  const [selectedUniversities,     setSelectedUniversities]     = useState([]);
  const [universities,             setUniversities]             = useState([]);
  const [filteredUniversities,     setFilteredUniversities]     = useState([]);
  const [searchTerm,               setSearchTerm]               = useState('');
  const [universityCourses,        setUniversityCourses]        = useState({});
  const [showCourseModal,          setShowCourseModal]          = useState(false);
  const [currentUniversity,        setCurrentUniversity]        = useState(null);
  const [currentUniversityCourses, setCurrentUniversityCourses] = useState([]);
  const [filteredCourses,          setFilteredCourses]          = useState([]);
  const [tempSelectedCourses,      setTempSelectedCourses]      = useState([]);
  const [courseSearchTerm,         setCourseSearchTerm]         = useState('');
  const [courseFilter,             setCourseFilter]             = useState({ level: '', studyMode: '', majorArea: '' });

  const [showRequestModal,   setShowRequestModal]   = useState(false);
  const [requestForm,        setRequestForm]        = useState({ universityName: '', country: '' });
  const [requestFormErrors,  setRequestFormErrors]  = useState({});
  const [submittingRequest,  setSubmittingRequest]  = useState(false);
  const [requestSuccess,     setRequestSuccess]     = useState(false);
  const [reqCourseInput,     setReqCourseInput]     = useState('');
  const [reqCourses,         setReqCourses]         = useState([]);
  const [reqSuggestions,     setReqSuggestions]     = useState([]);
  const [showReqSuggestions, setShowReqSuggestions] = useState(false);
  const reqCourseInputRef = useRef(null);
  const [validationErrors,   setValidationErrors]   = useState({});

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  }, []);

  // ── Load existing profile ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!token) { setFetchingProfile(false); return; }
      try {
       const res = await axiosInstance.get('/api/user/profile');
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          setBasicInfo(p.basicInfo || { fullName: '', email: userEmail, mobile: '', dob: '', gender: '', nationality: '', residence: '' });
          setEducation(p.education || { qualification: '', institution: '', field: '', cgpa: '' });
          if (p.programType)        setProgramType(p.programType);
          if (p.selectedSegment)    setSelectedSegment(p.selectedSegment);
          if (p.interestedCourses)  setInterestedCourses(p.interestedCourses);
          if (p.selectedUniversities?.length > 0) setSelectedUniversities(p.selectedUniversities);
          if (p.profileImage) setImagePreview(p.profileImage);

          if (p.profileCompleted === true && p.selectedUniversities?.length > 0) {
            localStorage.setItem('profileCompleted', 'true');
            localStorage.setItem('userProfile', JSON.stringify(p));
            const type = localStorage.getItem('studentType') || 'firstyear';
            navigate(type === 'transfer' ? '/transfer/dashboard' : '/firstyear/dashboard');
            return;
          }
        }
      } catch (e) {
        if (e.response?.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (e.response?.status !== 404) {
          console.warn('Profile fetch error:', e.response?.status, e.message);
        }
      } finally {
        setFetchingProfile(false);
      }
    };
    load();
  }, [token, userEmail, navigate]);

  // ── Fetch universities when entering Step 4 ───────────────────────────────
  useEffect(() => {
    if (step === 4 && universities.length === 0) fetchUniversities();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter universities by search ─────────────────────────────────────────
  useEffect(() => {
    let filtered = [...universities];
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.INSTNM || '').toLowerCase().includes(t) ||
        (u.CITY   || u.location?.city  || '').toLowerCase().includes(t) ||
        (u.STABBR || u.location?.state || '').toLowerCase().includes(t) ||
        (u._normalizedId || '').toLowerCase().includes(t)
      );
    }
    setFilteredUniversities(filtered);
  }, [searchTerm, universities]);

  useEffect(() => {
    if (currentUniversityCourses.length > 0) applyCourseFilers();
  }, [courseSearchTerm, courseFilter, currentUniversityCourses]); // eslint-disable-line

  // ── Request modal course suggestions ─────────────────────────────────────
  useEffect(() => {
    const t = reqCourseInput.trim().toLowerCase();
    if (!t) { setReqSuggestions([]); setShowReqSuggestions(false); return; }
    const s = COURSE_SUGGESTIONS_LIST.filter(c => c.toLowerCase().includes(t) && !reqCourses.includes(c)).slice(0, 6);
    setReqSuggestions(s); setShowReqSuggestions(s.length > 0);
  }, [reqCourseInput, reqCourses]);

  // ── NEW: Step 3 course interest suggestions ───────────────────────────────
  useEffect(() => {
    const t = courseInterestInput.trim().toLowerCase();
    if (!t) { setCourseInterestSuggest([]); setShowCourseInterestDdp(false); return; }
    // Use real program names from loaded universities, fall back to static list
    const pool = universities.length > 0
      ? [...new Set(universities.flatMap(u =>
          (u.programs || []).map(p => typeof p === 'string' ? p : p.name || p.title || '').filter(Boolean)
        ))]
      : COURSE_SUGGESTIONS_LIST;
    const hits = pool.filter(c => c.toLowerCase().includes(t) && !interestedCourses.includes(c)).slice(0, 7);
    setCourseInterestSuggest(hits);
    setShowCourseInterestDdp(hits.length > 0);
  }, [courseInterestInput, interestedCourses, universities]);

  useEffect(() => { return () => clearInterval(bgPollRef.current); }, []);

  // ── When programType changes: reset dependent state ───────────────────────
  const handleProgramTypeSelect = (type) => {
    if (programType === type) return;
    setProgramType(type);
    setEducation({ qualification: '', institution: '', field: '', cgpa: '' });
    setSelectedSegment(null);
    setInterestedCourses([]);
    setCourseInterestInput('');
    setSelectedUniversities([]);
    setUniversities([]);
    setSearchTerm('');
  };

  // ── fetchUniversities ─────────────────────────────────────────────────────
  const fetchUniversities = useCallback(async () => {
    if (!token || !programType) return;
    setLoading(true); setError('');
    try {
     const res = await axiosInstance.get('/api/admin/universities', {
  params: { stream: programType, limit: 300 },
});

      if (!res?.data?.success) { setError('Failed to load universities. Please try again.'); return; }

      let bachelorsList = [];
      let mastersList   = [];

      if (Array.isArray(res.data.data)) {
        bachelorsList = res.data.data.filter(u =>
          u.degree === 'bachelor' || u.educationLevel === 'Undergraduate' ||
          u.universityType === 'Bachelor' || u._source === 'bachelors'
        );
        mastersList = res.data.data.filter(u =>
          u.degree === 'master' || u.educationLevel === 'Postgraduate' ||
          u.universityType === 'Master' || u._source === 'masters'
        );
      } else {
        bachelorsList = res.data.data?.bachelors || [];
        mastersList   = res.data.data?.masters   || [];
      }

      const sourceList = programType === 'PG' ? mastersList : bachelorsList;
      const srcLabel   = programType === 'PG' ? 'masters'   : 'bachelors';

      const cache = {};
      const all   = [];

      for (const u of sourceList) {
        const norm = normalizeUniversity(u, srcLabel);
        const key  = norm._id?.toString() || norm._normalizedId || norm.UNITID?.toString();
        if (key) norm._normalizedId = key;
        all.push(norm);
        if (key && norm.programs?.length) cache[key] = buildCourses(norm);
      }

      const seen    = new Set();
      const deduped = all.filter(u => {
        const name = (u.INSTNM || u.universityName || u.name || '').toLowerCase().trim();
        if (seen.has(name)) return false;
        seen.add(name); return true;
      });

      setUniversityCourses(cache);
      setUniversities(deduped);
      if (deduped.length === 0) setError('No universities found. Please contact your administrator.');
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(e.response?.data?.message || 'Failed to load universities. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, programType, navigate]);

  const buildCourses = (university) => {
    const city   = university.CITY   || university.city  || '';
    const state  = university.STABBR || university.state || '';
    const locStr = [city, state].filter(Boolean).join(', ');
    return (university.programs || []).map((p, i) => {
      if (typeof p === 'string') {
        return {
          id: `prog-${university._normalizedId}-${i}`,
          title: p, name: p, program_name: p,
          level:     university._source === 'masters' ? 'Master' : 'Undergraduate',
          studyMode: 'On Campus',
          duration:  university._source === 'masters' ? '2 years' : '3-4 years',
          locations: [locStr].filter(Boolean),
          majorArea: 'General',
          description: `${p} at ${university.INSTNM}`,
        };
      }
      const name = p.name || p.title || p.program_name || `Program ${i + 1}`;
      return {
        id:           p.id || p._id || `prog-${university._normalizedId}-${i}`,
        title:        name, name, program_name: p.program_name || name,
        level:        p.level     || (university._source === 'masters' ? 'Master' : 'Undergraduate'),
        studyMode:    p.studyMode || 'On Campus',
        duration:     p.duration  || (university._source === 'masters' ? '2 years' : '3-4 years'),
        locations:    p.locations || [locStr].filter(Boolean),
        majorArea:    p.majorArea || '',
        description:  p.description || `${name} at ${university.INSTNM}`,
      };
    });
  };

  const applyCourseFilers = () => {
    let f = [...currentUniversityCourses];
    if (courseSearchTerm.trim()) {
      const t = courseSearchTerm.toLowerCase();
      f = f.filter(c =>
        (c.title || '').toLowerCase().includes(t) ||
        (c.majorArea || '').toLowerCase().includes(t) ||
        (c.level || '').toLowerCase().includes(t)
      );
    }
    if (courseFilter.level)     f = f.filter(c => (c.level || '').toLowerCase() === courseFilter.level.toLowerCase());
    if (courseFilter.studyMode) f = f.filter(c => (c.studyMode || '').toLowerCase().includes(courseFilter.studyMode.toLowerCase()));
    if (courseFilter.majorArea) f = f.filter(c => (c.majorArea || '').toLowerCase().includes(courseFilter.majorArea.toLowerCase()));
    setFilteredCourses(f);
  };

  const getUniKey = (u) =>
    u._normalizedId || u._id?.toString() || u.UNITID?.toString() || u.universityCode || '';

  // ── Auto-set qualification based on programType ───────────────────────────
  useEffect(() => {
    if (programType === 'UG' && education.qualification !== '12th') {
      setEducation(prev => ({ ...prev, qualification: '12th' }));
    } else if (programType === 'PG' && education.qualification !== 'Bachelor') {
      setEducation(prev => ({ ...prev, qualification: 'Bachelor' }));
    }
  }, [programType]); // eslint-disable-line

  // ── Background poll ───────────────────────────────────────────────────────
  const startBackgroundPoll = useCallback((uniName) => {
    if (bgPollRef.current) return;
    bgPendingName.current = uniName?.toLowerCase() || '';
    bgResolved.current = false;
    const poll = async () => {
      if (bgResolved.current || !token) return;
      try {
        const res = await axiosInstance.get('/api/user/notifications');
        const all = res.data?.notifications || res.data?.data || [];
        const matches = (n) => !bgSeenIds.current.has(n._id) && (!bgPendingName.current || n.message?.toLowerCase().includes(bgPendingName.current));
        const approved = all.find(n => n.type === 'UNIVERSITY_APPROVED' && matches(n));
        const rejected = all.find(n => n.type === 'UNIVERSITY_REJECTED' && matches(n));
        if (approved || rejected) {
          bgResolved.current = true; clearInterval(bgPollRef.current); bgPollRef.current = null;
          const n = approved || rejected; bgSeenIds.current.add(n._id);
          if (approved) {
            const name = uniName || extractNameFromMsg(approved.message);
            setApprovedUniName(name); setSearchTerm(name);
            await fetchUniversities();
            setResultBanner({ type: 'approved', uniName: name });
            showToast(`"${name}" is now available!`, 'success');
          } else {
            const name   = uniName || extractNameFromMsg(rejected.message);
            const reason = extractReasonFromMsg(rejected.message);
            setResultBanner({ type: 'rejected', uniName: name, reason });
            showToast(`Your request for "${name}" was not approved.`, 'warning');
          }
          try { await axiosInstance.patch(`/api/user/notifications/${n._id}/read`, {}); } catch (_) {}
        }
      } catch (_) {}
    };
    poll(); bgPollRef.current = setInterval(poll, 12000);
  }, [token, showToast, fetchUniversities]);

  const extractNameFromMsg   = (msg = "") => msg.match(/"([^"]+)"/)?.[1] || '';
  const extractReasonFromMsg = (msg = "") => msg.match(/[Rr]eason[:\s]+(.+)/)?.[1]?.trim() || null;

  const handlePopupApproved = useCallback(async ({ universityName }) => {
    setShowRequestPopup(false); setPendingRequest(null);
    bgResolved.current = true; clearInterval(bgPollRef.current); bgPollRef.current = null;
    await fetchUniversities(); setApprovedUniName(universityName); setSearchTerm(universityName);
    setResultBanner({ type: 'approved', uniName: universityName });
    showToast(`"${universityName}" is now available!`, 'success');
  }, [showToast, fetchUniversities]);

  const handlePopupRejected = useCallback(({ universityName, reason }) => {
    setShowRequestPopup(false); setPendingRequest(null);
    bgResolved.current = true; clearInterval(bgPollRef.current); bgPollRef.current = null;
    setResultBanner({ type: 'rejected', uniName: universityName, reason });
    showToast(`Your request for "${universityName}" was not approved.`, 'warning');
  }, [showToast]);

  const handlePopupDismiss = useCallback(() => {
    setShowRequestPopup(false);
    if (pendingRequest?.universityName && !bgResolved.current) startBackgroundPoll(pendingRequest.universityName);
  }, [pendingRequest, startBackgroundPoll]);

  // ── Request modal helpers ─────────────────────────────────────────────────
  const openRequestModal = () => {
    setRequestForm({ universityName: searchTerm || '', country: '' });
    setRequestFormErrors({}); setRequestSuccess(false);
    setReqCourses([]); setReqCourseInput(''); setReqSuggestions([]); setShowReqSuggestions(false);
    setShowRequestModal(true); document.body.style.overflow = 'hidden';
  };
  const closeRequestModal = () => {
    setShowRequestModal(false); setRequestForm({ universityName: '', country: '' });
    setRequestFormErrors({}); setRequestSuccess(false); setReqCourses([]); setReqCourseInput('');
    document.body.style.overflow = 'auto';
  };
  const addReqCourse = (name) => {
    const t = name.trim().replace(/,+$/, '');
    if (!t || reqCourses.includes(t)) { setReqCourseInput(''); return; }
    if (reqCourses.length >= 5) { setRequestFormErrors(p => ({ ...p, courses: 'Max 5 courses' })); return; }
    setReqCourses(p => [...p, t]); setReqCourseInput(''); setReqSuggestions([]); setShowReqSuggestions(false);
    setRequestFormErrors(p => ({ ...p, courses: null }));
    setTimeout(() => reqCourseInputRef.current?.focus(), 0);
  };
  const removeReqCourse    = (c) => setReqCourses(p => p.filter(x => x !== c));
  const handleReqCourseKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (reqCourseInput.trim()) addReqCourse(reqCourseInput); }
    else if (e.key === 'Backspace' && !reqCourseInput && reqCourses.length) setReqCourses(p => p.slice(0, -1));
  };
  const validateRequestForm = () => {
    const err = {};
    if (!requestForm.universityName.trim()) err.universityName = 'University name is required';
    if (!requestForm.country.trim())        err.country        = 'Country is required';
    if (!reqCourses.length)                 err.courses        = 'Please add at least one course';
    setRequestFormErrors(err); return !Object.keys(err).length;
  };

  const handleSubmitRequest = async () => {
    if (!validateRequestForm()) return;
    setSubmittingRequest(true);
    try {
      const res = await axiosInstance.post('/api/admin/university-request', {
  universityName: requestForm.universityName.trim(),
  country: requestForm.country.trim(),
  interestedCourses: reqCourses,
  programType,
});
      if (res?.data?.success) {
        const pending = { universityName: requestForm.universityName.trim(), country: requestForm.country.trim(), courses: [...reqCourses] };
        setRequestSuccess(true);
        setTimeout(() => { closeRequestModal(); setPendingRequest(pending); setShowRequestPopup(true); }, 700);
      } else {
        setRequestFormErrors({ submit: res?.data?.message || 'Failed to submit request.' });
      }
    } catch (e) {
      setRequestFormErrors({ submit: e.response?.data?.message || 'Failed to submit request.' });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ── Course modal helpers ──────────────────────────────────────────────────
 const openCourseModal = (uni) => {
  const key        = getUniKey(uni);
  const fresh      = universities.find(u => getUniKey(u) === key) || uni;
  const allCourses = universityCourses[key] || buildCourses(fresh);
  if (!allCourses.length) { toggleUniversity(uni); return; }

  // ✅ Filter courses to only those matching interestedCourses
  const visibleCourses = interestedCourses.length > 0
    ? allCourses.filter(c =>
        interestedCourses.some(interest =>
          (c.title || c.name || c.program_name || '')
            .toLowerCase()
            .includes(interest.toLowerCase())
        )
      )
    : allCourses;

  // ✅ Fall back to all courses if no matches found
  const finalCourses = visibleCourses.length > 0 ? visibleCourses : allCourses;

  setCurrentUniversity(fresh);
  setCurrentUniversityCourses(finalCourses);
  setFilteredCourses(finalCourses);
  setCourseSearchTerm(''); setCourseFilter({ level: '', studyMode: '', majorArea: '' });
  const existing = selectedUniversities.find(u => getUniKey(u) === key);
  setTempSelectedCourses([...(existing?.selectedCourses || [])]);
  setShowCourseModal(true); document.body.style.overflow = 'hidden';
};
const closeCourseModal = () => {
  setShowCourseModal(false); setCurrentUniversity(null); setTempSelectedCourses([]);
  setCourseSearchTerm(''); setCourseFilter({ level: '', studyMode: '', majorArea: '' });
  document.body.style.overflow = '';  // ✅ empty string fully removes the inline style
};
  const toggleTempCourse = (course) => {
    setTempSelectedCourses(prev => {
      const sel = prev.some(c => c.id === course.id);
      if (sel) return prev.filter(c => c.id !== course.id);
      if (prev.length < 1) return [...prev, course];
      setError('Max 1 course per university'); setTimeout(() => setError(''), 2000);
      return prev;
    });
  };
const saveCourseSelection = () => {
  if (!currentUniversity) return;
  const key = getUniKey(currentUniversity);
  const uniWithCourses = {
    ...currentUniversity,
    selectedCourses: tempSelectedCourses.map(c => ({
      id: c.id, title: c.title || c.name || c.program_name || 'Course',
      name: c.name || c.title || c.program_name || 'Course',
      program_name: c.program_name || c.title || c.name || '',
      level: c.level, studyMode: c.studyMode, duration: c.duration,
      locations: c.locations, majorArea: c.majorArea, description: c.description,
    })),
  };
  setSelectedUniversities(prev =>
    prev.some(u => getUniKey(u) === key)
      ? prev.map(u => getUniKey(u) === key ? uniWithCourses : u)
      : prev.length < 2 ? [...prev, uniWithCourses] : prev
  );
  // ✅ Close modal first, restore scroll, then briefly show success
  setShowCourseModal(false);
  setCurrentUniversity(null);
  setTempSelectedCourses([]);
  setCourseSearchTerm('');
  setCourseFilter({ level: '', studyMode: '', majorArea: '' });
  document.body.style.overflow = '';   // ✅ clear completely instead of 'auto'
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 1200);
};
  const toggleUniversity = (uni) => {
    if (!uni) return;
    const key   = getUniKey(uni);
    const isSel = selectedUniversities.some(u => getUniKey(u) === key);
    if (isSel) {
      setSelectedUniversities(p => p.filter(u => getUniKey(u) !== key));
    } else if (selectedUniversities.length < 2) {
      const fresh   = universities.find(u => getUniKey(u) === key) || uni;
      const courses = universityCourses[key] || buildCourses(fresh);
      if (!courses.length) {
        setSelectedUniversities(p => [...p, { ...fresh, selectedCourses: [], isDirectApply: true }]);
        setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500);
      } else {
        openCourseModal(fresh);
      }
    } else {
      setError('Max 2 universities'); setTimeout(() => setError(''), 2000);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!basicInfo.fullName)    e.fullName    = 'Full name is required';
    if (!basicInfo.mobile)      e.mobile      = 'Mobile is required';
    if (!basicInfo.dob)         e.dob         = 'Date of birth is required';
    if (!basicInfo.gender)      e.gender      = 'Gender is required';
    if (!basicInfo.nationality) e.nationality = 'Nationality is required';
    if (!basicInfo.residence)   e.residence   = 'Country of residence is required';
    if (basicInfo.mobile && !/^[0-9+\-\s()]{10,15}$/.test(basicInfo.mobile)) e.mobile = 'Enter a valid mobile number';
    setValidationErrors(e); return !Object.keys(e).length;
  };
  const validateStep2 = () => {
    if (!programType) { setError('Please select PG or UG to continue'); setTimeout(() => setError(''), 3000); return false; }
    return true;
  };
// AFTER
const validateStep3 = () => {
  const e = {};
  if (!education.institution)   e.institution   = 'Institution is required';
  if (!education.cgpa)          e.cgpa          = 'CGPA/Percentage is required';
  if (!education.qualification) e.qualification = 'Qualification is required';
  setValidationErrors(e); return !Object.keys(e).length;
};
  const validateStep4 = () => {
    if (selectedUniversities.length < 2) {
      setError('Please select 2 universities'); setTimeout(() => setError(''), 3000); return false;
    }
    for (const u of selectedUniversities) {
      if (!isDirectApplyUniversity(u) && !(u.selectedCourses?.length)) {
        setError(`Please select at least one course for ${u.INSTNM || u.name || 'this university'}`);
        setTimeout(() => setError(''), 3000); return false;
      }
    }
    return true;
  };

  const isStep1Valid = () => basicInfo.fullName && basicInfo.mobile && basicInfo.dob && basicInfo.gender && basicInfo.nationality && basicInfo.residence;
  const isStep2Valid = () => !!programType;
 const isStep3Valid = () => !!(education.qualification && education.institution && education.cgpa);
  const isStep4Valid = () => selectedUniversities.length >= 2 && selectedUniversities.every(u => isDirectApplyUniversity(u) || u.selectedCourses?.length > 0);

  const navigateToDashboard = () => navigate(userType === 'transfer' ? '/transfer/dashboard' : '/firstyear/dashboard');

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    setProfileImage(file);
    const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file);
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !token) return;
    try {
      await axiosInstance.patch('/api/user/profile/image', { profileImage: imagePreview });
    } catch (_) {}
  };

// ── handleSubmitProfile ───────────────────────────────────────────────────
  const handleSubmitProfile = async () => {
    if (!token) { setError('You must be logged in.'); return; }
    if (!validateStep4()) return;
    setSaving(true); setError('');
    let formattedUniversities = [];
    try {
      if (profileImage) await uploadProfileImage();

   formattedUniversities = selectedUniversities.map(u => {
        const city     = u.CITY   || u.city  || u.location?.city  || '';
        const state    = u.STABBR || u.state || u.location?.state || '';
        const isDirect = isDirectApplyUniversity(u);

        // ✅ FIX: build id more defensively, fallback to a generated one
        const resolvedId = (
          u.id ||
          u.UNITID?.toString() ||
          u.universityCode ||
          u._id?.toString() ||
          u._normalizedId ||
          `uni-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        );

        // ✅ FIX: ensure name is never empty
        const resolvedName = (
          u.INSTNM || u.universityName || u.name || ''
        ).trim() || 'Unknown University';

        return {
          id:             resolvedId,
          unitid:         u.UNITID || null,
          name:           resolvedName,
          location:       [city, state].filter(Boolean).join(', ') || 'Location not specified',
          city, state,
          country:        u.location?.country || u.country || u.COUNTRY || 'USA',
          isKansas:       isDirect,
          isDirectApply:  isDirect,
          universityType: u.universityType || (u._source === 'masters' ? 'Master' : 'Bachelor'),
          selectedCourses: isDirect ? [] : (u.selectedCourses || []).map(c => ({
            id:           c.id           || `course-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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

      const eligibleProgram = programType === 'UG' ? 'Bachelor' : 'Master';

      // ✅ FIX: always include field as empty string and enforce correct qualification
      const fixedEducation = {
        ...education,
        field: education.field || '',
        qualification: programType === 'UG' ? '12th' : 'Bachelor',
      };

      const profileData = {
        profileImage: imagePreview,
        basicInfo,
        education: fixedEducation,
        programType,
        eligibleProgram,
        selectedSegment,
        interestedCourses,
        selectedUniversities: formattedUniversities,
        profileCompleted: true,
        completedAt: new Date().toISOString(),
      };

      if (JSON.stringify(profileData).length > 500000) {
        setError('Profile data too large. Reduce course selections.'); setSaving(false); return;
      }

      const res = await axiosInstance.post('/api/user/profile', profileData);

      if (res.data.success) {
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        localStorage.setItem('profileCompleted', 'true');
        showToast('Profile submitted! Redirecting...', 'success');
        setTimeout(navigateToDashboard, 1500);
      } else {
        setError(res.data.message || 'Failed to save profile.');
      }
    } catch (e) {
      console.error('Profile submit error:', e.response?.data);
      let msg = 'Failed to save profile.';
      if (e.response?.status === 401) { msg = 'Session expired.'; setTimeout(() => navigate('/login'), 2000); }
      else if (e.response?.status === 400) msg = e.response.data.errors?.join(', ') || e.response.data.message || msg;
      else if (e.response?.data?.message) msg = e.response.data.message;
      setError(msg);
      // ✅ FIX: same fixedEducation applied to the local fallback save
      const profileData = {
        basicInfo,
        education: {
          ...education,
          field: education.field || '',
          qualification: programType === 'UG' ? '12th' : 'Bachelor',
        },
        programType,
        selectedSegment,
        interestedCourses,
        selectedUniversities: formattedUniversities,
        profileCompleted: true,
      };
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      localStorage.setItem('profileCompleted', 'true');
      showToast('Saved locally. Redirecting...', 'warning');
      setTimeout(navigateToDashboard, 1500);
    } finally { setSaving(false); }
  };
  const handleSaveProgress = (next) => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && next === 5 && !validateStep4()) return;
    if (next === 4) { setUniversities([]); setSelectedUniversities([]); }
    setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitials     = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'UN';
  const getUserInitials = () => basicInfo.fullName
    ? basicInfo.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : (userEmail?.[0]?.toUpperCase() || 'U');

  const getLevelColor = (l = '') => {
    const s = l.toLowerCase();
    if (s.includes('bachelor') || s.includes('undergraduate')) return '#4CAF50';
    if (s.includes('master')   || s.includes('graduate') || s.includes('mba')) return '#FF9800';
    if (s.includes('phd')      || s.includes('doctorate')) return '#F44336';
    if (s.includes('diploma'))     return '#9C27B0';
    if (s.includes('certificate')) return '#00BCD4';
    return '#757575';
  };
  const getStudyModeColor = (m = '') => {
    const s = m.toLowerCase();
    if (s.includes('online'))                           return '#2196F3';
    if (s.includes('campus'))                           return '#FFC107';
    if (s.includes('hybrid') || s.includes('blended')) return '#9C27B0';
    if (s.includes('distance'))                         return '#00BCD4';
    return '#757575';
  };
  const getSourceLabel = (u) => {
    if (u._source === 'bachelors') return "Bachelor's";
    if (u._source === 'masters')   return "Master's";
    return null;
  };

  if (fetchingProfile) {
    return (
      <div className="profile-wrapper">
        <div className="loading-screen">
          <div className="loading-spinner-large" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const STEPS = [
    { num: 1, label: 'Basic Info'   },
    { num: 2, label: 'Study Level'  },
    { num: 3, label: 'Academics'    },
    { num: 4, label: 'Universities' },
    { num: 5, label: 'Review'       },
  ];

  const segments = programType ? SEGMENTS[programType] : [];

  // ── Accent colours keyed to programType ──────────────────────────────────
  const accentBg    = programType === 'PG' ? '#ede9fe' : '#dcfce7';
  const accentColor = programType === 'PG' ? '#5b21b6' : '#15803d';
  const accentBorder= programType === 'PG' ? '#6366f1' : '#10b981';
  const accentHl    = programType === 'PG' ? '#6366f1' : '#10b981';

  return (
    <div className="profile-wrapper">

      {showRequestPopup && (
        <UniversityRequestPopup token={token} pendingRequest={pendingRequest}
          onApproved={handlePopupApproved} onRejected={handlePopupRejected} onDismiss={handlePopupDismiss} />
      )}

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}><span>{toast.message}</span></div>
      )}

      {showSuccess && (
  <div className="success-animation-overlay">
    <div className="success-animation">
      <div className="checkmark-circle">
        <div className="userprofile-checkmark" />  {/* ✅ correct class name */}
      </div>
    </div>
  </div>
)}

      <div className="userprofile-profile-header">
        <div className="header-container">
          <div className="header-logo-wrapper">
            <img src={EdutechLogo} alt="Edutech Logo" className="header-logo-img" />
          </div>
          <div className="header-title-section">
            <h1 className="header-title">Complete Your Profile</h1>
            <p className="header-email">{basicInfo.email || userEmail}</p>
          </div>
        </div>
      </div>

      <div className="userprofile-profile-content">

        {error && (
          <div className="error-message">
            <span>{error}</span>
            {(error.includes('connect') || error.includes('load')) && (
              <button className="retry-btn" onClick={() => fetchUniversities()}>Retry</button>
            )}
          </div>
        )}

        {resultBanner && (
          <div className={`urp-result-banner urp-banner-${resultBanner.type}`}>
            <div className="urp-banner-text">
              {resultBanner.type === 'approved'
                ? <><strong>"{resultBanner.uniName}"</strong> was approved and is now in your list! Search for it below.</>
                : <><strong>"{resultBanner.uniName}"</strong> request was not approved.{resultBanner.reason ? ` Reason: ${resultBanner.reason}` : ''} Please select from available universities.</>
              }
            </div>
            <button className="urp-banner-close" onClick={() => setResultBanner(null)}>x</button>
          </div>
        )}

        {/* Progress bar */}
        <div className="userprofile-progress-container">
          <div className="progress-steps-horizontal">
            {STEPS.map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{step > num ? '✓' : num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: Basic Info ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Personal Information</h2></div>
            <div className="profile-photo-upload-section">
              <div className="profile-photo-avatar">
                {imagePreview
                  ? <img src={imagePreview} alt="Profile" className="profile-photo-preview" />
                  : <div className="profile-photo-placeholder">{getUserInitials()}</div>
                }
                <label htmlFor="profile-photo-input-step1" className="profile-photo-edit-btn" title="Change photo">+</label>
                <input type="file" id="profile-photo-input-step1" accept="image/*" onChange={handleImageUpload} className="profile-photo-input" />
              </div>
              <div className="profile-photo-info">
                <span className="profile-photo-label">Profile Photo</span>
                <span className="profile-photo-hint">JPG, PNG or GIF - Max 5 MB</span>
                <label htmlFor="profile-photo-input-step1" className="profile-photo-upload-btn">
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
              </div>
            </div>
            <div className="form-fields">
              {[
                { label: 'Full Name',            key: 'fullName',    type: 'text', placeholder: 'John Doe'              },
                { label: 'Mobile Number',        key: 'mobile',      type: 'tel',  placeholder: '+1 9876543210'         },
                { label: 'Date of Birth',        key: 'dob',         type: 'date', placeholder: ''                      },
                { label: 'Nationality',          key: 'nationality', type: 'text', placeholder: 'e.g., Indian, American'},
                { label: 'Country of Residence', key: 'residence',   type: 'text', placeholder: 'e.g., India, USA, UK' },
              ].map(({ label, key, type, placeholder }) => (
                <div className="form-row" key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={placeholder} value={basicInfo[key]}
                    onChange={e => { setBasicInfo({ ...basicInfo, [key]: e.target.value }); if (validationErrors[key]) setValidationErrors({ ...validationErrors, [key]: null }); }}
                    className={validationErrors[key] ? 'error' : ''} />
                  {validationErrors[key] && <span className="field-error">{validationErrors[key]}</span>}
                </div>
              ))}
              <div className="form-row">
                <label>Email ID</label>
                <input type="email" value={basicInfo.email} disabled className="disabled-input" />
                <span className="email-note">Auto-filled from your account</span>
              </div>
              <div className="form-row">
                <label>Gender</label>
                <select value={basicInfo.gender}
                  onChange={e => { setBasicInfo({ ...basicInfo, gender: e.target.value }); if (validationErrors.gender) setValidationErrors({ ...validationErrors, gender: null }); }}
                  className={validationErrors.gender ? 'error' : ''}>
                  <option value="">Select Gender</option>
                  <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                </select>
                {validationErrors.gender && <span className="field-error">{validationErrors.gender}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="continue-btn" onClick={() => handleSaveProgress(2)} disabled={!isStep1Valid()}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PG / UG Selection ───────────────────────────────────── */}
        {step === 2 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Select Study Level</h2>
              <p>Are you looking for Postgraduate (PG) or Undergraduate (UG) programs?</p>
            </div>
            <div className="branch-step-wrapper">
              <p className="branch-step-label">Choose the level of study you want to pursue</p>
              <div className="branch-cards-row">
                <div className={`branch-card${programType === 'PG' ? ' selected' : ''}`} onClick={() => handleProgramTypeSelect('PG')}>
                  {programType === 'PG' && <span className="branch-selected-indicator" />}
                  <div className="branch-card-title">PG</div>
                  <div className="branch-card-subtitle">Postgraduate programs<br />Master's &middot; MBA &middot; PhD</div>
                  <span className="branch-card-tag pg-tag">Postgraduate</span>
                </div>
                <div className={`branch-card ug-card${programType === 'UG' ? ' selected' : ''}`} onClick={() => handleProgramTypeSelect('UG')}>
                  {programType === 'UG' && <span className="branch-selected-indicator" />}
                  <div className="branch-card-title">UG</div>
                  <div className="branch-card-subtitle">Undergraduate programs<br />Bachelor's &middot; Diploma</div>
                  <span className="branch-card-tag ug-tag">Undergraduate</span>
                </div>
              </div>
              {programType && (
                <div className="branch-info-box">
                  {programType === 'PG'
                    ? <>You'll see <strong>Postgraduate universities</strong> — Master's, MBA and PhD programs based on your background.</>
                    : <>You'll see <strong>Undergraduate universities</strong> — Bachelor's degree programs suited to your qualification.</>
                  }
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(1)}>Back</button>
              <button className="continue-btn" onClick={() => handleSaveProgress(3)} disabled={!isStep2Valid()}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Academic Details ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Education Background</h2>
              <p>Tell us about your {programType === 'PG' ? 'postgraduate' : 'undergraduate'} background</p>
            </div>
            <div className="form-fields">

              {/* Qualification — auto-set, read-only */}
              <div className="form-row">
                <label>Highest Qualification</label>
                <input
                  type="text"
                  value={programType === 'PG' ? "Bachelor's Degree" : "12th / High School"}
                  disabled
                  className="disabled-input"
                />
              </div>

              {/* Segment chips */}
              {segments.length > 0 && (
                <div className="segment-section">
                  <span className="segment-section-label">
                    What field are you interested in?
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>(optional)</span>
                  </span>
                  <div className="segment-chips-row">
                    {segments.map(seg => {
                      const isActive = selectedSegment?.id === seg.id;
                      const activeClass = isActive ? (programType === 'PG' ? 'active-pg' : 'active-ug') : '';
                      return (
                        <button key={seg.id} className={`segment-chip ${activeClass}`}
                          onClick={() => setSelectedSegment(isActive ? null : seg)}>
                          {seg.name}{isActive && ' ✕'}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSegment && (
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                      Selected: <strong>{selectedSegment.name}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* ── Course Interest Tag Input ──────────────────────────────── */}
              <div className="form-row" style={{ position: 'relative' }}>
                <label>
                  Courses of Interest
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>(optional · up to 5)</span>
                </label>

                <div
                  style={{
                    display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
                    minHeight: '44px', border: `1.5px solid ${interestedCourses.length ? accentBorder : '#e2e8f0'}`,
                    borderRadius: '10px', padding: '6px 10px', background: '#fff', cursor: 'text',
                    transition: 'border-color .18s',
                  }}
                  onClick={() => courseInterestInputRef.current?.focus()}
                >
                  {interestedCourses.map((course, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: accentBg, color: accentColor,
                      borderRadius: '999px', padding: '3px 10px', fontSize: '12px',
                      fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {course}
                      <button
                        type="button"
                        onClick={() => setInterestedCourses(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1, color: 'inherit', opacity: 0.7, fontSize: '13px' }}
                        aria-label={`Remove ${course}`}
                      >✕</button>
                    </span>
                  ))}

                  {interestedCourses.length < 5 && (
                    <input
                      ref={courseInterestInputRef}
                      type="text"
                      value={courseInterestInput}
                      placeholder={interestedCourses.length === 0 ? 'Type a course, e.g. Computer Science…' : 'Add another…'}
                      autoComplete="off"
                      style={{
                        flex: 1, minWidth: '140px', border: 'none', outline: 'none',
                        fontSize: '13px', color: '#1e293b', background: 'transparent', padding: '2px 0',
                      }}
                      onChange={e => setCourseInterestInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const val = courseInterestInput.trim().replace(/,+$/, '');
                          if (!val || interestedCourses.includes(val)) { setCourseInterestInput(''); return; }
                          setInterestedCourses(prev => [...prev, val]);
                          setCourseInterestInput('');
                          setCourseInterestSuggest([]);
                          setShowCourseInterestDdp(false);
                        } else if (e.key === 'Backspace' && !courseInterestInput && interestedCourses.length) {
                          setInterestedCourses(prev => prev.slice(0, -1));
                        }
                      }}
                      onFocus={() => { if (courseInterestSuggest.length) setShowCourseInterestDdp(true); }}
                      onBlur={() => setTimeout(() => setShowCourseInterestDdp(false), 150)}
                    />
                  )}
                </div>

                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Press <strong>Enter</strong> or <strong>,</strong> to add · <strong>Backspace</strong> to remove last
                </span>

                {/* Suggestions dropdown */}
                {showCourseInterestDdp && courseInterestSuggest.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,.10)', overflow: 'hidden', marginTop: '4px',
                  }}>
                    {courseInterestSuggest.map((suggestion, i) => {
                      const t   = courseInterestInput.trim().toLowerCase();
                      const idx = suggestion.toLowerCase().indexOf(t);
                      return (
                        <button
                          key={i}
                          type="button"
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '9px 14px', border: 'none', background: 'none',
                            fontSize: '13px', color: '#1e293b', cursor: 'pointer',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = accentBg; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'none'; }}
                          onMouseDown={() => {
                            setInterestedCourses(prev => [...prev, suggestion]);
                            setCourseInterestInput('');
                            setCourseInterestSuggest([]);
                            setShowCourseInterestDdp(false);
                            setTimeout(() => courseInterestInputRef.current?.focus(), 0);
                          }}
                        >
                          {idx === -1 ? suggestion : (
                            <>
                              {suggestion.slice(0, idx)}
                              <strong style={{ color: accentHl }}>{suggestion.slice(idx, idx + t.length)}</strong>
                              {suggestion.slice(idx + t.length)}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* ── End Course Interest ───────────────────────────────────── */}

              {/* University / School Name */}
              <div className="form-row">
                <label>University / School Name</label>
                <input type="text" placeholder="Enter institution name" value={education.institution}
                  onChange={e => { setEducation({ ...education, institution: e.target.value }); if (validationErrors.institution) setValidationErrors({ ...validationErrors, institution: null }); }}
                  className={validationErrors.institution ? 'error' : ''} />
                {validationErrors.institution && <span className="field-error">{validationErrors.institution}</span>}
              </div>

            

              {/* CGPA */}
              <div className="form-row">
                <label>Percentage / CGPA</label>
                <input type="text" placeholder="e.g., 85% or 8.5" value={education.cgpa}
                  onChange={e => { setEducation({ ...education, cgpa: e.target.value }); if (validationErrors.cgpa) setValidationErrors({ ...validationErrors, cgpa: null }); }}
                  className={validationErrors.cgpa ? 'error' : ''} />
                {validationErrors.cgpa && <span className="field-error">{validationErrors.cgpa}</span>}
              </div>

            </div>
            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(2)}>Back</button>
              <button className="continue-btn" onClick={() => handleSaveProgress(4)} disabled={!isStep3Valid()}>
                Show Universities
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Universities ─────────────────────────────────────────── */}
        {step === 4 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>{programType === 'PG' ? 'Postgraduate' : 'Undergraduate'} Universities</h2>
              <p>
                Choose 2 universities and select 1 course for each
                <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: accentBg, color: accentColor }}>
                  {programType}
                </span>
              </p>
            </div>

            {segments.length > 0 && (
              <div className="segment-section">
                <span className="segment-section-label">
                  Filter by Segment {selectedSegment && <span style={{ color: accentColor }}>— {selectedSegment.name}</span>}
                </span>
                <div className="segment-chips-row">
                  {segments.map(seg => {
                    const isActive = selectedSegment?.id === seg.id;
                    const activeClass = isActive ? (programType === 'PG' ? 'active-pg' : 'active-ug') : '';
                    return (
                      <button key={seg.id} className={`segment-chip ${activeClass}`}
                        onClick={() => setSelectedSegment(isActive ? null : seg)}>
                        {seg.name}{isActive && ' ✕'}
                      </button>
                    );
                  })}
                </div>
                {selectedSegment && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                    Showing universities matching <strong>{selectedSegment.name}</strong>. Click the segment again to remove the filter.
                  </p>
                )}
              </div>
            )}

            <div className="university-controls">
              <div className="search-wrapper">
                <span className="search-icon">&#128269;</span>
                <input type="text" className="search-input" placeholder="Search universities by name, city..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <button className="search-clear-btn" onClick={() => { setSearchTerm(''); setApprovedUniName(null); }}>x</button>
                )}
              </div>
              <div className="selection-counter"><span className="counter-number">{selectedUniversities.length}</span>/2</div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading universities...</p>
                <button className="retry-small-btn" onClick={() => fetchUniversities()}>Retry</button>
              </div>
            ) : (
              <>
                <div className="universities-grid">
                  {filteredUniversities.length > 0 ? filteredUniversities.map(uni => {
                    const key        = getUniKey(uni);
                    const isSel      = selectedUniversities.some(u => getUniKey(u) === key);
                    const progCount  = uni.programs?.length || 0;
                    const isDirect   = progCount === 0;
                    const selUni     = selectedUniversities.find(u => getUniKey(u) === key);
                    const selCourses = selUni?.selectedCourses || [];
                    const srcLabel   = getSourceLabel(uni);
                    const isHighlighted = approvedUniName && (uni.INSTNM || '').toLowerCase().includes(approvedUniName.toLowerCase());

                    return (
                      <div key={key || Math.random()} className="university-card-wrapper">
                        <div
                          className={`university-card ${isSel ? 'selected' : ''} ${isDirect ? 'direct-apply' : ''} ${isHighlighted ? 'urp-highlight-card' : ''}`}
                          onClick={() => toggleUniversity(uni)}
                        >
                          {isHighlighted && <div className="urp-new-badge">Just Added</div>}
                          <div className="university-logo">{getInitials(uni.INSTNM)}</div>
                          <div className="university-details">
                            <h4>{uni.INSTNM || uni.universityName || uni.name || 'Unknown University'}</h4>
                            <p className="uni-location">
                              {[uni.CITY || uni.location?.city, uni.STABBR || uni.location?.state].filter(Boolean).join(', ') || 'Location N/A'}
                            </p>
                            <div className="uni-badges">
                              {progCount > 0 && <span className="program-badge">{progCount} courses</span>}
                              {isDirect    && <span className="direct-apply-badge">Direct Apply</span>}
                              {srcLabel    && <span className="source-label-badge">{srcLabel}</span>}
                            </div>
                          </div>
                          {isSel && <span className="check-mark">&#10003;</span>}
                        </div>

                        {isSel && !isDirect && selCourses.length > 0 && (
                          <div className="selected-courses-preview">
                            <span className="preview-label">Selected:</span>
                            <div className="preview-courses">
                              {selCourses.map((c, i) => (
                                <span key={i} className="preview-course-tag">{c.title || c.name || c.program_name || 'Course'}</span>
                              ))}
                            </div>
                            <button className="edit-courses-btn" onClick={e => { e.stopPropagation(); openCourseModal(uni); }}>Edit</button>
                          </div>
                        )}
                        {isSel && !isDirect && selCourses.length === 0 && (
                          <div className="selected-courses-preview warning">
                            <span className="preview-label">No courses selected</span>
                            <button className="edit-courses-btn" onClick={e => { e.stopPropagation(); openCourseModal(uni); }}>Select</button>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="no-results">
                      <p>No {programType === 'PG' ? 'postgraduate' : 'undergraduate'} universities found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                      <div className="no-results-actions">
                        {searchTerm && <button className="retry-btn" onClick={() => setSearchTerm('')}>Clear Search</button>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-university-banner">
                  <div className="request-banner-content">
                    <div className="request-banner-icon">&#127979;</div>
                    <div className="request-banner-text">
                      <strong>Can't find your university?</strong>
                      <p>Submit a request and our team will add it.</p>
                    </div>
                    <button className="request-university-btn" onClick={openRequestModal}>+ Request</button>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(3)}>Back</button>
              <button className="continue-btn" onClick={() => handleSaveProgress(5)} disabled={!isStep4Valid()}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Review ──────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Review Your Profile</h2><p>Verify everything before submitting</p></div>

            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                {[
                  ['Full Name',     basicInfo.fullName   ],
                  ['Email',         basicInfo.email      ],
                  ['Mobile',        basicInfo.mobile     ],
                  ['Date of Birth', basicInfo.dob        ],
                  ['Gender',        basicInfo.gender     ],
                  ['Nationality',   basicInfo.nationality],
                  ['Residence',     basicInfo.residence  ],
                ].map(([l, v]) => (
                  <p key={l}><strong>{l}:</strong> {v || 'Not provided'}</p>
                ))}
              </div>
            </div>

            <div className="review-section">
              <h3>Academic Details</h3>
              <div className="review-grid">
                {[
                  ['Study Level',    programType === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)'],
                  ['Qualification',  education.qualification],
                  ['Institution',    education.institution  ],
                  ['Field of Study', education.field        ],
                  ['CGPA / Grade',   education.cgpa         ],
                ].map(([l, v]) => (
                  <p key={l}><strong>{l}:</strong> {v || 'Not provided'}</p>
                ))}
                {selectedSegment && <p><strong>Segment:</strong> {selectedSegment.name}</p>}
                {interestedCourses.length > 0 && (
                  <p><strong>Courses of Interest:</strong> {interestedCourses.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="review-section">
              <h3>Selected Universities</h3>
              <div className="universities-list">
                {selectedUniversities.length > 0 ? selectedUniversities.map((uni, i) => {
                  const courses  = uni.selectedCourses || [];
                  const isDirect = isDirectApplyUniversity(uni) || (!courses.length && !(uni.programs?.length));
                  const city    = uni.CITY   || uni.city  || uni.location?.city  || '';
                  const state   = uni.STABBR || uni.state || uni.location?.state || '';
                  const country = uni.location?.country || uni.country || uni.COUNTRY || 'USA';
                  const locStr  = [city, state, country].filter(Boolean).join(', ');
                  const website = uni.WEBADDR || uni.website || uni.contact?.website || '';
                  return (
                    <div key={getUniKey(uni) || i} className="review-university-item">
                      <p className="review-university-name">
                        <strong>{i + 1}. {uni.INSTNM || uni.universityName || uni.name || 'Unknown'}</strong>
                        {isDirect && <span className="direct-apply-tag">Direct Apply</span>}
                        {uni._source === 'bachelors' && <span className="source-tag bachelors-tag">Bachelor's</span>}
                        {uni._source === 'masters'   && <span className="source-tag masters-tag">Master's</span>}
                      </p>
                      <div className="review-uni-details">
                        {locStr  && <p className="review-detail-item"><span className="review-detail-label">Location:</span><span>{locStr}</span></p>}
                        {website && <p className="review-detail-item"><span className="review-detail-label">Website:</span><a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">{website}</a></p>}
                      </div>
                      {isDirect && <div className="direct-apply-review-note">Direct application — no course pre-selection required.</div>}
                      {!isDirect && courses.length > 0 && (
                        <div className="review-courses-list">
                          <p className="courses-label">Selected Courses ({courses.length}):</p>
                          <ul>{courses.map((c, ci) => (
                            <li key={ci}>
                              {c.title || c.name || c.program_name || 'Course'}
                              {c.level     && <span className="course-level"> &middot; {c.level}</span>}
                              {c.studyMode && <span className="course-mode"> &middot; {c.studyMode}</span>}
                              {c.duration  && <span className="course-duration"> &middot; {c.duration}</span>}
                            </li>
                          ))}</ul>
                        </div>
                      )}
                      {!isDirect && !courses.length && <p className="warning-text">No courses selected</p>}
                    </div>
                  );
                }) : <p>No universities selected</p>}
              </div>
            </div>

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(4)}>Back</button>
              <button className="submit-btn" onClick={handleSubmitProfile} disabled={saving || !isStep4Valid()}>
                {saving ? 'Submitting...' : 'Submit Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom progress bar */}
        <div className="bottom-progress">
          <div className="progress-steps-horizontal">
            {STEPS.map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{step > num ? '✓' : num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course Selection Modal ───────────────────────────────────────── */}
      {showCourseModal && currentUniversity && (
        <div className="modal-overlay" onClick={closeCourseModal}>
          <div className="modal-content course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Courses — {currentUniversity.INSTNM}</h3>
              <button className="modal-close-btn" onClick={closeCourseModal}>x</button>
            </div>
            <div className="modal-body">
              <p className="course-selection-info">Select 1 course</p>
              <div className="selected-count">Selected: {tempSelectedCourses.length}/1</div>
              <div className="course-search-section">
                <div className="course-search-wrapper">
                  <input type="text" className="course-search-input" placeholder="Search courses..."
                    value={courseSearchTerm} onChange={e => setCourseSearchTerm(e.target.value)} />
                  {courseSearchTerm && <button className="clear-search-btn" onClick={() => setCourseSearchTerm('')}>x</button>}
                </div>
              </div>
              {filteredCourses.length > 0 ? (
                <div className="courses-grid">
                  {filteredCourses.map((c, i) => {
                    const isSel = tempSelectedCourses.some(x => x.id === c.id);
                    const name  = c.title || c.name || c.program_name || 'Course';
                    return (
                      <div key={c.id || i} className={`course-card ${isSel ? 'selected' : ''}`} onClick={() => toggleTempCourse(c)}>
                        <h4 className="course-title">{name}</h4>
                        <div className="course-badges">
                          {c.level     && <span className="course-level-badge" style={{ backgroundColor: getLevelColor(c.level) }}>{c.level}</span>}
                          {c.studyMode && <span className="course-mode-badge"  style={{ backgroundColor: getStudyModeColor(c.studyMode) }}>{c.studyMode}</span>}
                        </div>
                        {c.duration  && <span className="course-duration">{c.duration}</span>}
                        {c.majorArea && <span className="course-major">{c.majorArea}</span>}
                        {isSel && <span className="course-selected-check">Selected</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-courses">
                  <p>No courses found.</p>
                  {courseSearchTerm && <button className="clear-filters-btn" onClick={() => setCourseSearchTerm('')}>Clear Search</button>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeCourseModal}>Cancel</button>
              <button className="save-btn" onClick={saveCourseSelection} disabled={!tempSelectedCourses.length}>
                Save ({tempSelectedCourses.length}/1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request University Modal ─────────────────────────────────────── */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content request-university-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request a University</h3>
              <button className="modal-close-btn" onClick={closeRequestModal}>x</button>
            </div>
            {requestSuccess ? (
              <div className="request-success-state">
                <div className="request-success-icon">&#10003;</div>
                <h4>Submitted! Opening status window...</h4>
              </div>
            ) : (
              <div className="modal-body">
                <p className="request-modal-desc">Can't find your university? Fill in the details and our team will review and add it.</p>
                {requestFormErrors.submit && <div className="request-submit-error">{requestFormErrors.submit}</div>}
                <div className="form-fields">
                  <div className="form-row">
                    <label>University Name <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., Harvard University" value={requestForm.universityName}
                      onChange={e => { setRequestForm({ ...requestForm, universityName: e.target.value }); if (requestFormErrors.universityName) setRequestFormErrors({ ...requestFormErrors, universityName: null }); }}
                      className={requestFormErrors.universityName ? 'error' : ''} />
                    {requestFormErrors.universityName && <span className="field-error">{requestFormErrors.universityName}</span>}
                  </div>
                  <div className="form-row">
                    <label>Country <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., United States" value={requestForm.country}
                      onChange={e => { setRequestForm({ ...requestForm, country: e.target.value }); if (requestFormErrors.country) setRequestFormErrors({ ...requestFormErrors, country: null }); }}
                      className={requestFormErrors.country ? 'error' : ''} />
                    {requestFormErrors.country && <span className="field-error">{requestFormErrors.country}</span>}
                  </div>
                  <div className="form-row" style={{ position: 'relative' }}>
                    <label>Courses of Interest <span className="required-star">*</span><span className="optional-label"> — up to 5</span></label>
                    <div className={`course-tag-input-wrapper${requestFormErrors.courses ? ' error-border' : ''}`}>
                      {reqCourses.map((c, i) => (
                        <span key={i} className="course-tag">{c}<button type="button" className="course-tag-remove" onClick={() => removeReqCourse(c)}>x</button></span>
                      ))}
                      {reqCourses.length < 5 && (
                        <input ref={reqCourseInputRef} type="text" className="course-tag-input"
                          placeholder={reqCourses.length === 0 ? 'Type a course and press Enter...' : 'Add another...'}
                          value={reqCourseInput} onChange={e => setReqCourseInput(e.target.value)}
                          onKeyDown={handleReqCourseKey}
                          onFocus={() => { if (reqSuggestions.length) setShowReqSuggestions(true); }}
                          onBlur={() => setTimeout(() => setShowReqSuggestions(false), 150)}
                          autoComplete="off" />
                      )}
                    </div>
                    <span className="course-tag-hint">Press Enter or , to add &middot; Backspace to remove</span>
                    {showReqSuggestions && reqSuggestions.length > 0 && (
                      <div className="course-suggestions-dropdown">
                        {reqSuggestions.map((s, i) => (
                          <button key={i} type="button" className="course-suggestion-item" onMouseDown={() => addReqCourse(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                    {requestFormErrors.courses && <span className="field-error">{requestFormErrors.courses}</span>}
                  </div>
                </div>
                <div className="request-info-note">
                  <p>A status popup will appear so you can track the admin's response in real time.</p>
                </div>
              </div>
            )}
            {!requestSuccess && (
              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeRequestModal} disabled={submittingRequest}>Cancel</button>
                <button className="save-btn" onClick={handleSubmitRequest} disabled={submittingRequest}>
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
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