import React, { useState } from "react";
import API_BASE_URL from "../../config/api";
import "./Masters.css";
/* ─── SVG Icon Components ─────────────────────────────── */
const IconBuilding = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/>
  </svg>
);
const IconArrowLeft = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconArrowRight = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconCheckCircle = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconEye = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEdit = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconX = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconWarning = ({ size = 15, color = "#991b1b" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconChevronDown = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* ─── Inline Styles ───────────────────────────────────── */
const S = {
  // Layout
  container: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "12px 10px 80px",
    background: "#f0f4f8",
    minHeight: "100vh",
    fontFamily: "'Inter', system-ui, sans-serif",
    boxSizing: "border-box",
  },
  // Header
  header: {
    background: "transparent",
    borderRadius: 0,
    padding: "0 12px",
    marginBottom: 12,
    color: "#1e293b",
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 0,
    color: "#1e293b",
    letterSpacing: "-0.3px",
  },
  headerSub: {
    fontSize: 11.5,
    opacity: 1,
    color: "#64748b",
    marginTop: 4,
    fontWeight: 400,
  },
  // Form card
  formCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "16px 14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: 10,
  },
  formCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  // Progress bar
  progressWrap: {
    background: "#fff",
    borderRadius: 14,
    padding: "12px 14px",
    marginBottom: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    position: "relative",
    top: 0,
    zIndex: 1,
  },
  progressTrack: {
    display: "flex",
    alignItems: "center",
    gap: 0,
  },
  progressStep: (active, completed) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
  }),
  progressDot: (active, completed) => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: completed ? "#10b981" : active ? "#0891b2" : "#e2e8f0",
    color: completed || active ? "#fff" : "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 11,
    marginBottom: 4,
    border: active ? "2px solid #0891b2" : completed ? "2px solid #10b981" : "2px solid #e2e8f0",
    boxShadow: active ? "0 0 0 3px rgba(8,145,178,0.15)" : "none",
    transition: "all 0.2s",
    flexShrink: 0,
  }),
  progressLabel: (active) => ({
    fontSize: 9.5,
    fontWeight: active ? 700 : 500,
    color: active ? "#0891b2" : "#94a3b8",
    textAlign: "center",
    whiteSpace: "nowrap",
  }),
  progressLine: (completed) => ({
    height: 2,
    flex: 1,
    background: completed ? "#10b981" : "#e2e8f0",
    marginBottom: 18,
    transition: "background 0.3s",
  }),
  // Section title
  sectionTitle: {
    fontSize: 10,
    fontWeight: 800,
    color: "#0891b2",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 12,
    paddingLeft: 10,
    borderLeft: "3px solid #0891b2",
  },
  // Form group
  group: { marginBottom: 12 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#334155",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 9,
    fontSize: 13,
    color: "#1e293b",
    background: "#fff",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorMsg: {
    display: "block",
    fontSize: 11,
    color: "#ef4444",
    fontWeight: 600,
    marginTop: 3,
  },
  hint: {
    display: "block",
    fontSize: 10.5,
    color: "#94a3b8",
    marginTop: 3,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  // Checkbox label
  checkLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 7,
    padding: "7px 9px",
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    color: "#334155",
    lineHeight: 1.4,
  },
  checkLabelChecked: {
    borderColor: "#0891b2",
    background: "#f0f9ff",
  },
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    marginTop: 6,
  },
  // Program category (collapsible)
  catHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 12px",
    background: "#f8fafc",
    borderRadius: 9,
    cursor: "pointer",
    marginBottom: 0,
    border: "1.5px solid #e2e8f0",
    userSelect: "none",
  },
  catTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0891b2",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  catCount: {
    background: "#e0f7fa",
    color: "#0e7490",
    borderRadius: 50,
    padding: "1px 7px",
    fontSize: 10,
    fontWeight: 700,
  },
  catCheckedCount: {
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 50,
    padding: "1px 7px",
    fontSize: 10,
    fontWeight: 700,
    marginLeft: 4,
  },
  catBody: {
    border: "1.5px solid #e2e8f0",
    borderTop: "none",
    borderRadius: "0 0 9px 9px",
    padding: "8px",
    marginBottom: 6,
    background: "#fff",
  },
  catWrap: { marginBottom: 6 },
  // Program checkbox item
  progItem: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "6px 8px",
    borderRadius: 7,
    border: "1.5px solid #e2e8f0",
    cursor: "pointer",
    background: "#fff",
    marginBottom: 4,
    fontSize: 12,
    color: "#1e293b",
    fontWeight: 500,
  },
  progItemChecked: {
    borderColor: "#0891b2",
    background: "#f0f9ff",
  },
  progBadge: {
    fontSize: 9.5,
    fontWeight: 700,
    background: "#e0f7fa",
    color: "#0e7490",
    borderRadius: 4,
    padding: "1px 6px",
    marginLeft: "auto",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  // Intake chips
  intakeGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  intakeChip: (checked) => ({
    padding: "5px 11px",
    borderRadius: 18,
    border: `1.5px solid ${checked ? "#0891b2" : "#e2e8f0"}`,
    background: checked ? "#f0f9ff" : "#fff",
    color: checked ? "#0891b2" : "#64748b",
    fontSize: 11.5,
    fontWeight: checked ? 700 : 500,
    cursor: "pointer",
    userSelect: "none",
  }),
  // Requirement tag
  reqTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 9px",
    background: "#f0f9ff",
    border: "1.5px solid #bae6fd",
    borderRadius: 18,
    fontSize: 11.5,
    color: "#0e7490",
    fontWeight: 600,
  },
  reqTagBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  // Navigation
  navBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    borderTop: "1.5px solid #e2e8f0",
    padding: "10px 14px",
    display: "flex",
    gap: 8,
    zIndex: 200,
    maxWidth: 520,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  btnPrev: {
    flex: 1,
    padding: "11px 0",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    fontFamily: "inherit",
  },
  btnNext: {
    flex: 2,
    padding: "11px 0",
    borderRadius: 10,
    border: "none",
    background: "#0891b2",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    boxShadow: "0 4px 12px rgba(8,145,178,0.3)",
    fontFamily: "inherit",
  },
  btnSubmit: {
    flex: 2,
    padding: "11px 0",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#10b981,#059669)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
    fontFamily: "inherit",
  },
  btnPreview: {
    flex: 1,
    padding: "11px 0",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#0891b2",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    fontFamily: "inherit",
  },
  // Error banner
  errBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fef2f2",
    border: "1.5px solid #fca5a5",
    borderRadius: 10,
    padding: "9px 12px",
    marginBottom: 10,
    fontSize: 12.5,
    color: "#991b1b",
    fontWeight: 500,
  },
  // Loading overlay
  loadingOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
  },
  loadingBox: {
    background: "#fff",
    padding: "16px 28px",
    borderRadius: 12,
    fontWeight: 700,
    color: "#0891b2",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    fontSize: 14,
  },
  // Preview modal (bottom sheet)
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  previewSheet: {
    background: "#fff",
    borderRadius: "16px 16px 0 0",
    width: "100%",
    maxWidth: 520,
    maxHeight: "92dvh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  previewHandle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px 10px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    flexShrink: 0,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },
  previewCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#e2e8f0",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  previewBody: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
  },
  previewSection: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px",
    marginBottom: 10,
  },
  previewSectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0891b2",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  previewRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 4,
  },
  previewItem: { marginBottom: 6 },
  previewLabelSmall: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  previewVal: {
    fontSize: 12.5,
    color: "#1e293b",
    fontWeight: 500,
    marginTop: 1,
  },
  previewFooter: {
    display: "flex",
    gap: 8,
    padding: "12px 14px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
    flexShrink: 0,
  },
  programTagsWrap: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 },
  programTagSmall: {
    background: "#f0f9ff",
    border: "1.5px solid #bae6fd",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: "#0e7490",
  },
  intakeTagSmall: {
    background: "#f0f9ff",
    color: "#0891b2",
    border: "1.5px solid #bae6fd",
    borderRadius: 18,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
  },
  statusActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #6ee7b7",
    borderRadius: 18,
    padding: "2px 9px",
    fontSize: 11,
    fontWeight: 700,
  },
  statusInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
    borderRadius: 18,
    padding: "2px 9px",
    fontSize: 11,
    fontWeight: 700,
  },
  featuredBadge: {
    background: "linear-gradient(135deg,#0891b2,#0e7490)",
    color: "#fff",
    padding: "2px 9px",
    borderRadius: 18,
    fontSize: 11,
    fontWeight: 700,
  },
  spinnerSmall: {
    display: "inline-block",
    width: 13,
    height: 13,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
};

/* ─── Collapsible Program Category ────────────────────── */
const ProgramCategory = ({ category, programs, selectedPrograms, onToggle }) => {
  const [open, setOpen] = useState(false);
  const checkedCount = programs.filter(p => selectedPrograms.includes(p.name)).length;

  return (
    <div style={S.catWrap}>
      <div style={S.catHeader} onClick={() => setOpen(o => !o)}>
        <div style={S.catTitle}>
          <span>{category}</span>
          <span style={S.catCount}>{programs.length}</span>
          {checkedCount > 0 && <span style={S.catCheckedCount}>✓{checkedCount}</span>}
        </div>
        <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display:"flex", alignItems:"center" }}>
          <IconChevronDown size={14} color="#0891b2" />
        </div>
      </div>
      {open && (
        <div style={S.catBody}>
          {programs.map(prog => {
            const checked = selectedPrograms.includes(prog.name);
            return (
              <div
                key={prog.name}
                style={{ ...S.progItem, ...(checked ? S.progItemChecked : {}) }}
                onClick={() => onToggle(prog.name)}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(prog.name)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 14, height: 14, accentColor: "#0891b2", flexShrink: 0, cursor: "pointer" }}
                />
                <span style={{ flex: 1, fontSize: 12, lineHeight: 1.35 }}>{prog.name}</span>
                <span style={S.progBadge}>{prog.level}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────── */
const MastersAdminTemplate = () => {
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);


  const getAvailableIntakes = () => {
    const currentYear = new Date().getFullYear();
    const intakes = [];
    const seasons = ["Fall", "Spring", "Summer"];
    const currentMonth = new Date().getMonth();
    for (let year = currentYear; year <= currentYear + 3; year++) {
      seasons.forEach(season => {
        if (year === currentYear) {
          if (season === "Spring" && currentMonth > 4) return;
          if (season === "Summer" && currentMonth > 7) return;
          if (season === "Fall" && currentMonth > 10 && year === currentYear) return;
        }
        intakes.push(`${season} ${year}`);
      });
    }
    return intakes.sort((a, b) => {
      const yearA = parseInt(a.split(' ')[1]), yearB = parseInt(b.split(' ')[1]);
      if (yearA !== yearB) return yearA - yearB;
      const so = { "Spring": 0, "Summer": 1, "Fall": 2 };
      return so[a.split(' ')[0]] - so[b.split(' ')[0]];
    });
  };

  const availableIntakes = getAvailableIntakes();

  const programCategories = [
    { name: "Computer Science (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Information Technology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Data Science (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Artificial Intelligence (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Cybersecurity (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Software Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Computer Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Information Systems (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Cloud Computing (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Web Development (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Mobile App Development (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Game Development (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Network Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Bioinformatics (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Mechanical Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Electrical Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Civil Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Chemical Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Aerospace Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Biomedical Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Industrial Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Environmental Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Robotics Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Mechatronics Engineering (MEng)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Business Administration (MBA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Finance (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Marketing (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Accounting (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "International Business (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Entrepreneurship (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Human Resources (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Supply Chain Management (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Economics (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Real Estate (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Hospitality Management (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "English Literature (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Creative Writing (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Linguistics (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Philosophy (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "History (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Fine Arts (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Graphic Design (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Film Studies (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Photography (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Music (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Theatre Arts (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Psychology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Clinical Psychology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Cognitive Psychology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Forensic Psychology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Sociology (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Political Science (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "International Relations (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Criminology (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Social Work (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Public Policy (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Physics (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Chemistry (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Biology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Mathematics (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Statistics (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Environmental Science (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Neuroscience (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Biochemistry (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Medicine (MD)", level: "Master", duration: "5 years", studyMode: "On Campus" },
    { name: "Nursing (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Dentistry (MDS)", level: "Master", duration: "5 years", studyMode: "On Campus" },
    { name: "Physiotherapy (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Public Health (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Pharmacology (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Law (LLM)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Criminal Justice (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Education (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Special Education (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Architecture (MArch)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Interior Design (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "UX/UI Design (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Fashion Design (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Journalism (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Media Studies (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Digital Media (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Communication Studies (MA)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Agriculture (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Food Science (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Renewable Energy (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Sustainability (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Actuarial Science (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Financial Mathematics (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
    { name: "Applied Mathematics (MSc)", level: "Master", duration: "3 years", studyMode: "On Campus" },
  ];

  const groupedPrograms = {
    "Computer Science & IT": programCategories.filter(p =>
      p.name.includes("Computer") || p.name.includes("Data") || p.name.includes("AI") ||
      p.name.includes("Cyber") || p.name.includes("Software") || p.name.includes("IT") ||
      p.name.includes("Cloud") || p.name.includes("Web") || p.name.includes("Mobile") ||
      p.name.includes("Game Development") || p.name.includes("Network") || p.name.includes("Bioinformatics")),
    "Engineering": programCategories.filter(p =>
      p.name.includes("Engineering") || p.name.includes("Robotics") || p.name.includes("Mechatronics")),
    "Business & Management": programCategories.filter(p =>
      p.name.includes("Business") || p.name.includes("Finance") || p.name.includes("Marketing") ||
      p.name.includes("Accounting") || p.name.includes("Economics") || p.name.includes("Management") ||
      p.name.includes("Entrepreneurship") || p.name.includes("Human Resources") || p.name.includes("Supply Chain") ||
      p.name.includes("Real Estate") || p.name.includes("Hospitality")),
    "Arts & Humanities": programCategories.filter(p =>
      p.name.includes("Literature") || p.name.includes("Creative Writing") || p.name.includes("Linguistics") ||
      p.name.includes("Philosophy") || p.name.includes("History") || p.name.includes("Fine Arts") ||
      p.name.includes("Graphic Design") || p.name.includes("Film") || p.name.includes("Photography") ||
      p.name.includes("Music") || p.name.includes("Theatre")),
    "Social Sciences & Psychology": programCategories.filter(p =>
      p.name.includes("Psychology") || p.name.includes("Sociology") || p.name.includes("Political") ||
      p.name.includes("International Relations") || p.name.includes("Criminology") || p.name.includes("Social Work") ||
      p.name.includes("Public Policy")),
    "Natural Sciences": programCategories.filter(p =>
      p.name.includes("Physics") || p.name.includes("Chemistry") || p.name.includes("Biology") ||
      p.name.includes("Mathematics") || p.name.includes("Statistics") || p.name.includes("Environmental Science") ||
      p.name.includes("Neuroscience") || p.name.includes("Biochemistry") || p.name.includes("Actuarial") ||
      p.name.includes("Financial Mathematics") || p.name.includes("Applied Mathematics")),
    "Medical & Health": programCategories.filter(p =>
      p.name.includes("Medicine") || p.name.includes("Nursing") || p.name.includes("Dentistry") ||
      p.name.includes("Physiotherapy") || p.name.includes("Public Health") || p.name.includes("Pharmacology")),
    "Law & Education": programCategories.filter(p =>
      p.name.includes("Law") || p.name.includes("Criminal Justice") || p.name.includes("Education")),
    "Design & Architecture": programCategories.filter(p =>
      p.name.includes("Architecture") || p.name.includes("Interior Design") || p.name.includes("UX/UI") ||
      p.name.includes("Fashion Design")),
    "Media & Communications": programCategories.filter(p =>
      p.name.includes("Journalism") || p.name.includes("Media") || p.name.includes("Digital Media") ||
      p.name.includes("Communication Studies")),
    "Agriculture & Environment": programCategories.filter(p =>
      p.name.includes("Agriculture") || p.name.includes("Food Science") || p.name.includes("Renewable") ||
      p.name.includes("Sustainability")),
  };

  const [formData, setFormData] = useState({
    universityName: "", universityCode: "", establishedYear: "", universityType: "",
    accreditation: "", ranking: "", website: "", country: "", state: "", city: "",
    address: "", zipCode: "", adminEmail: "", adminPhone: "", admissionEmail: "", admissionPhone: "",
    programs: [], intakes: availableIntakes.slice(0, 3),
    applicationDeadlines: { earlyDecision: "", earlyAction: "", regularDecision: "", rolling: "" },
    tuitionFees: { inState: "", outOfState: "", international: "", roomAndBoard: "" },
    minimumGPA: "", satRequirements: { math: "", reading: "", total: "" },
    actRequirements: { composite: "" }, englishTests: ["TOEFL iBT", "IELTS Academic"],
    applicationRequirements: [], universityLogo: null, coverImage: null, isActive: true, featured: false
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const countries = [
    "United States","United Kingdom","Canada","Australia","New Zealand","Germany","France","Netherlands",
    "Sweden","Switzerland","Ireland","Singapore","Japan","South Korea","China","India","Italy","Spain",
    "Denmark","Finland","Norway","Belgium","Austria","Hong Kong","Malaysia","UAE","Saudi Arabia","Qatar",
    "South Africa","Brazil","Mexico","Thailand","Vietnam","Philippines","Indonesia","Pakistan","Bangladesh",
    "Sri Lanka","Nepal","Kenya","Nigeria","Egypt","Morocco","Israel","Turkey","Russia","Poland","Portugal"
  ].sort();

  const statesByCountry = {
    "United States": ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Other"],
    "United Kingdom": ["England","Scotland","Wales","Northern Ireland","Other"],
    "Canada": ["Alberta","British Columbia","Manitoba","Ontario","Quebec","Saskatchewan","Other"],
    "Australia": ["New South Wales","Victoria","Queensland","Western Australia","South Australia","Tasmania","Other"],
    "India": ["Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Maharashtra","Delhi","Uttar Pradesh","Gujarat","West Bengal","Other"],
    "Germany": ["Baden-Württemberg","Bayern","Berlin","Hamburg","Hessen","Nordrhein-Westfalen","Other"],
    "default": ["Other"]
  };

  const universityTypes = ["Public University","Private University","Ivy League","Liberal Arts College","Research University","Community College","Technical Institute","Art School"];

  const commonRequirements = [
    "Official High School Transcripts","Letters of Recommendation","Personal Essay / Statement of Purpose",
    "SAT or ACT Scores","English Proficiency Test Scores","Application Fee","Portfolio (for Art Programs)",
    "Interview","Extracurricular Activities List","GRE/GMAT Scores","Work Experience","Research Proposal",
    "Resume/CV","Writing Sample","Financial Affidavit","Passport Copy"
  ];

  const getAuthToken = () =>
    localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") setFormData(prev => ({ ...prev, [name]: files[0] }));
    else if (type === "checkbox") setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "state") setIsOtherSelected(value === "Other");
    if (name === "country") { setFormData(prev => ({ ...prev, [name]: value, state: "" })); setIsOtherSelected(false); }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleNestedChange = (cat, field, value) => {
    setFormData(prev => ({ ...prev, [cat]: { ...prev[cat], [field]: value } }));
  };

  const handleArrayInput = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleRequirementAdd = (req) => {
    if (req && !formData.applicationRequirements.includes(req))
      setFormData(prev => ({ ...prev, applicationRequirements: [...prev.applicationRequirements, req] }));
  };

  const handleRequirementRemove = (idx) => {
    setFormData(prev => ({ ...prev, applicationRequirements: prev.applicationRequirements.filter((_, i) => i !== idx) }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.universityName.trim()) e.universityName = "Required";
    if (!formData.universityCode.trim()) e.universityCode = "Required";
    if (!formData.establishedYear) e.establishedYear = "Required";
    if (!formData.universityType) e.universityType = "Required";
    if (!formData.website.trim()) e.website = "Required";
    if (!formData.country) e.country = "Required";
    if (!formData.state.trim()) e.state = "Required";
    if (!formData.city.trim()) e.city = "Required";
    if (!formData.address.trim()) e.address = "Required";
    if (!formData.zipCode.trim()) e.zipCode = "Required";
    if (!formData.adminEmail.trim()) e.adminEmail = "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) e.adminEmail = "Valid email required";
    if (!formData.admissionEmail.trim()) e.admissionEmail = "Required";
    if (!formData.adminPhone.trim()) e.adminPhone = "Required";
    if (formData.programs.length === 0) e.programs = "Select at least one program";
    if (!formData.tuitionFees.inState) e.tuitionInState = "Required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 5) return;
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      const token = getAuthToken();
      if (!token) { setApiError('Please login to continue'); return; }
      setLoading(true); setApiError(null);
      try {
        const selectedPrograms = formData.programs.map(pName => {
          const det = programCategories.find(p => p.name === pName) || { name: pName, level: "Master", duration: "3 years", studyMode: "On Campus" };
          return { name: det.name, title: det.name, level: det.level, duration: det.duration, studyMode: det.studyMode };
        });
        const universityData = { ...formData, programs: selectedPrograms, source: 'masters', programLevel: 'master' };
        delete universityData.universityLogo; delete universityData.coverImage;
        const url = editingUniversity ? `${API_BASE_URL}/api/masters/universities/${editingUniversity._id}` : `${API_BASE_URL}/api/masters/universities`;
        const method = editingUniversity ? 'PUT' : 'POST';
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(universityData) });
        if (response.status === 401 || response.status === 403) {
          setApiError('Admin session expired. Please login again.');
          return;
        }
        const data = await response.json();
        if (data.success) { alert(`✅ University ${editingUniversity ? 'updated' : 'created'} successfully!`); resetForm(); setEditingUniversity(null); }
        else { setApiError(data.message || 'Error saving university'); }
      } catch { setApiError('Network error. Please check if backend is running.'); }
      finally { setLoading(false); }
    } else { setErrors(newErrors); }
  };

  const resetForm = () => {
    setFormData({
      universityName: "", universityCode: "", establishedYear: "", universityType: "",
      accreditation: "", ranking: "", website: "", country: "", state: "", city: "",
      address: "", zipCode: "", adminEmail: "", adminPhone: "", admissionEmail: "", admissionPhone: "",
      programs: [], intakes: availableIntakes.slice(0, 3),
      applicationDeadlines: { earlyDecision: "", earlyAction: "", regularDecision: "", rolling: "" },
      tuitionFees: { inState: "", outOfState: "", international: "", roomAndBoard: "" },
      minimumGPA: "", satRequirements: { math: "", reading: "", total: "" },
      actRequirements: { composite: "" }, englishTests: ["TOEFL iBT", "IELTS Academic"],
      applicationRequirements: [], universityLogo: null, coverImage: null, isActive: true, featured: false
    });
    setIsOtherSelected(false); setCurrentStep(1); setErrors({});
  };

  const getYearRange = () => { const y = new Date().getFullYear(); return `${y}–${y + 3}`; };

  const inputStyle = (hasError) => ({ ...S.input, ...(hasError ? S.inputError : {}) });

  /* ── Step renders ── */
  const renderStep1 = () => (
    <div className="masters-form-card" style={S.formCard}>
      <div style={S.sectionTitle}>Basic Information</div>
      <div style={S.group}>
        <label style={S.label}>University Name *</label>
        <input style={inputStyle(errors.universityName)} name="universityName" value={formData.universityName} onChange={handleChange} placeholder="e.g., Harvard University"/>
        {errors.universityName && <span style={S.errorMsg}>{errors.universityName}</span>}
      </div>
      <div style={S.row}>
        <div style={S.group}>
          <label style={S.label}>Code *</label>
          <input style={inputStyle(errors.universityCode)} name="universityCode" value={formData.universityCode} onChange={handleChange} placeholder="HARV001"/>
          {errors.universityCode && <span style={S.errorMsg}>{errors.universityCode}</span>}
        </div>
        <div style={S.group}>
          <label style={S.label}>Est. Year *</label>
          <input style={inputStyle(errors.establishedYear)} type="number" name="establishedYear" value={formData.establishedYear} onChange={handleChange} placeholder="1636" min="1000" max={new Date().getFullYear()}/>
          {errors.establishedYear && <span style={S.errorMsg}>{errors.establishedYear}</span>}
        </div>
      </div>
      <div style={S.group}>
        <label style={S.label}>University Type *</label>
        <select style={inputStyle(errors.universityType)} name="universityType" value={formData.universityType} onChange={handleChange}>
          <option value="">Select type</option>
          {universityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.universityType && <span style={S.errorMsg}>{errors.universityType}</span>}
      </div>
      <div style={S.row}>
        <div style={S.group}>
          <label style={S.label}>Accreditation</label>
          <input style={S.input} name="accreditation" value={formData.accreditation} onChange={handleChange} placeholder="e.g., AACSB"/>
        </div>
        <div style={S.group}>
          <label style={S.label}>Ranking</label>
          <input style={S.input} name="ranking" value={formData.ranking} onChange={handleChange} placeholder="e.g., #15"/>
        </div>
      </div>
      <div style={S.group}>
        <label style={S.label}>Website *</label>
        <input style={inputStyle(errors.website)} type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://university.edu"/>
        {errors.website && <span style={S.errorMsg}>{errors.website}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const states = formData.country
      ? [...(statesByCountry[formData.country] || statesByCountry["default"])].sort((a, b) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b))
      : [];
    return (
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Location Details</div>
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>Country *</label>
            <select style={inputStyle(errors.country)} name="country" value={formData.country} onChange={handleChange}>
              <option value="">Select</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.country && <span style={S.errorMsg}>{errors.country}</span>}
          </div>
          <div style={S.group}>
            <label style={S.label}>State/Province *</label>
            <select style={inputStyle(errors.state)} name="state" value={isOtherSelected ? "Other" : formData.state} onChange={handleChange} disabled={!formData.country}>
              <option value="">{formData.country ? "Select" : "Country first"}</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <span style={S.errorMsg}>{errors.state}</span>}
          </div>
        </div>
        {isOtherSelected && (
          <div style={S.group}>
            <label style={S.label}>Enter State/Province *</label>
            <input style={inputStyle(errors.state)} value={formData.state === "Other" ? "" : formData.state} onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="Type state/province"/>
          </div>
        )}
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>City *</label>
            <input style={inputStyle(errors.city)} name="city" value={formData.city} onChange={handleChange} placeholder="City"/>
            {errors.city && <span style={S.errorMsg}>{errors.city}</span>}
          </div>
          <div style={S.group}>
            <label style={S.label}>ZIP/Postal *</label>
            <input style={inputStyle(errors.zipCode)} name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="02138"/>
            {errors.zipCode && <span style={S.errorMsg}>{errors.zipCode}</span>}
          </div>
        </div>
        <div style={S.group}>
          <label style={S.label}>Address *</label>
          <textarea style={{ ...S.input, resize: "vertical", minHeight: 70 }} name="address" value={formData.address} onChange={handleChange} placeholder="Street address, building..."/>
          {errors.address && <span style={S.errorMsg}>{errors.address}</span>}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="masters-form-card" style={S.formCard}>
      <div style={S.sectionTitle}>Contact Information</div>
      <div style={S.row}>
        <div style={S.group}>
          <label style={S.label}>Admin Email *</label>
          <input style={inputStyle(errors.adminEmail)} type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} placeholder="admin@uni.edu"/>
          {errors.adminEmail && <span style={S.errorMsg}>{errors.adminEmail}</span>}
        </div>
        <div style={S.group}>
          <label style={S.label}>Admin Phone *</label>
          <input style={inputStyle(errors.adminPhone)} type="tel" name="adminPhone" value={formData.adminPhone} onChange={handleChange} placeholder="+1 617-495-0000"/>
          {errors.adminPhone && <span style={S.errorMsg}>{errors.adminPhone}</span>}
        </div>
      </div>
      <div style={S.row}>
        <div style={S.group}>
          <label style={S.label}>Admission Email *</label>
          <input style={inputStyle(errors.admissionEmail)} type="email" name="admissionEmail" value={formData.admissionEmail} onChange={handleChange} placeholder="admissions@uni.edu"/>
          {errors.admissionEmail && <span style={S.errorMsg}>{errors.admissionEmail}</span>}
        </div>
        <div style={S.group}>
          <label style={S.label}>Admission Phone</label>
          <input style={S.input} type="tel" name="admissionPhone" value={formData.admissionPhone} onChange={handleChange} placeholder="+1 617-495-1551"/>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <>
      {/* Programs */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Programs Offered</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Tap a category to expand</span>
          {formData.programs.length > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0891b2", background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 18, padding: "2px 9px" }}>
              {formData.programs.length} selected
            </span>
          )}
        </div>
        {Object.entries(groupedPrograms).map(([cat, progs]) =>
          progs.length > 0 && (
            <ProgramCategory
              key={cat}
              category={cat}
              programs={progs}
              selectedPrograms={formData.programs}
              onToggle={(name) => handleArrayInput('programs', name)}
            />
          )
        )}
        {errors.programs && <span style={{ ...S.errorMsg, marginTop: 6 }}>{errors.programs}</span>}
      </div>

      {/* Intakes */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Available Intakes ({getYearRange()})</div>
        <div style={S.intakeGrid}>
          {availableIntakes.map(intake => (
            <div key={intake} style={S.intakeChip(formData.intakes.includes(intake))} onClick={() => handleArrayInput('intakes', intake)}>
              {intake}
            </div>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Application Deadlines</div>
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>Early Decision</label>
            <input style={S.input} value={formData.applicationDeadlines.earlyDecision} onChange={e => handleNestedChange('applicationDeadlines','earlyDecision',e.target.value)} placeholder="Nov 1, 2026"/>
          </div>
          <div style={S.group}>
            <label style={S.label}>Early Action</label>
            <input style={S.input} value={formData.applicationDeadlines.earlyAction} onChange={e => handleNestedChange('applicationDeadlines','earlyAction',e.target.value)} placeholder="Nov 15, 2026"/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>Regular Decision</label>
            <input style={S.input} value={formData.applicationDeadlines.regularDecision} onChange={e => handleNestedChange('applicationDeadlines','regularDecision',e.target.value)} placeholder="Jan 1, 2027"/>
          </div>
          <div style={S.group}>
            <label style={S.label}>Rolling</label>
            <input style={S.input} value={formData.applicationDeadlines.rolling} onChange={e => handleNestedChange('applicationDeadlines','rolling',e.target.value)} placeholder="Ongoing"/>
          </div>
        </div>
      </div>

      {/* Tuition */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Tuition Fees (Annual)</div>
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>In-State/Local *</label>
            <input style={inputStyle(errors.tuitionInState)} value={formData.tuitionFees.inState} onChange={e => handleNestedChange('tuitionFees','inState',e.target.value)} placeholder="$"/>
            {errors.tuitionInState && <span style={S.errorMsg}>{errors.tuitionInState}</span>}
          </div>
          <div style={S.group}>
            <label style={S.label}>Out-of-State</label>
            <input style={S.input} value={formData.tuitionFees.outOfState} onChange={e => handleNestedChange('tuitionFees','outOfState',e.target.value)} placeholder="$"/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>International</label>
            <input style={S.input} value={formData.tuitionFees.international} onChange={e => handleNestedChange('tuitionFees','international',e.target.value)} placeholder="$"/>
          </div>
          <div style={S.group}>
            <label style={S.label}>Room &amp; Board</label>
            <input style={S.input} value={formData.tuitionFees.roomAndBoard} onChange={e => handleNestedChange('tuitionFees','roomAndBoard',e.target.value)} placeholder="$"/>
          </div>
        </div>
      </div>

      {/* Test Scores */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Test Score Requirements</div>
        <div style={S.group}>
          <label style={S.label}>Minimum GPA</label>
          <input style={S.input} name="minimumGPA" value={formData.minimumGPA} onChange={handleChange} placeholder="e.g., 3.0 on 4.0 scale"/>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>SAT (if applicable)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={S.group}>
            <label style={S.label}>Math</label>
            <input style={S.input} value={formData.satRequirements.math} onChange={e => handleNestedChange('satRequirements','math',e.target.value)} placeholder="600-800"/>
          </div>
          <div style={S.group}>
            <label style={S.label}>Reading</label>
            <input style={S.input} value={formData.satRequirements.reading} onChange={e => handleNestedChange('satRequirements','reading',e.target.value)} placeholder="600-800"/>
          </div>
          <div style={S.group}>
            <label style={S.label}>Total</label>
            <input style={S.input} value={formData.satRequirements.total} onChange={e => handleNestedChange('satRequirements','total',e.target.value)} placeholder="1200-1600"/>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>ACT (if applicable)</div>
        <div style={{ maxWidth: 140 }}>
          <label style={S.label}>Composite</label>
          <input style={S.input} value={formData.actRequirements.composite} onChange={e => handleNestedChange('actRequirements','composite',e.target.value)} placeholder="25-32"/>
        </div>
      </div>
    </>
  );

  const renderStep5 = () => (
    <>
      {/* Requirements */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Application Requirements</div>
        <select style={{ ...S.input, marginBottom: 10 }} onChange={e => { handleRequirementAdd(e.target.value); e.target.value = ""; }} value="">
          <option value="">Add a requirement...</option>
          {commonRequirements.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {formData.applicationRequirements.map((req, i) => (
            <div key={i} style={S.reqTag}>
              <span>{req}</span>
              <button type="button" style={S.reqTagBtn} onClick={() => handleRequirementRemove(i)}><IconX size={11}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* English Tests */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>English Tests Accepted</div>
        <div style={S.checkGrid}>
          {["TOEFL iBT","IELTS Academic","PTE Academic","Duolingo English Test","Cambridge English","GRE","GMAT"].map(test => {
            const checked = formData.englishTests.includes(test);
            return (
              <label key={test} style={{ ...S.checkLabel, ...(checked ? S.checkLabelChecked : {}), cursor: "pointer" }}>
                <input type="checkbox" checked={checked} onChange={() => handleArrayInput('englishTests', test)} style={{ accentColor: "#0891b2", width: 14, height: 14, flexShrink: 0 }}/>
                <span style={{ fontSize: 12 }}>{test}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Media */}
      <div className="masters-form-card" style={S.formCard}>
        <div style={S.sectionTitle}>Media &amp; Status</div>
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>University Logo</label>
            <input style={{ ...S.input, padding: "7px", cursor: "pointer" }} type="file" name="universityLogo" onChange={handleChange} accept="image/*"/>
          </div>
          <div style={S.group}>
            <label style={S.label}>Cover Image</label>
            <input style={{ ...S.input, padding: "7px", cursor: "pointer" }} type="file" name="coverImage" onChange={handleChange} accept="image/*"/>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#334155", fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ accentColor: "#0891b2", width: 15, height: 15 }}/>
            Active
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#334155", fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} style={{ accentColor: "#0891b2", width: 15, height: 15 }}/>
            Featured
          </label>
        </div>
      </div>
    </>
  );

  const renderPreview = () => (
    <div style={S.overlay} onClick={() => setShowPreview(false)}>
      <div className="masters-preview-sheet" style={S.previewSheet} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="masters-preview-handle" style={S.previewHandle}>
          <div style={S.previewTitle}>Preview</div>
          <button type="button" style={S.previewCloseBtn} onClick={() => setShowPreview(false)}><IconX size={13}/></button>
        </div>

        <div className="masters-preview-body" style={S.previewBody}>
          {/* Title */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{formData.universityName || "University Name"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontFamily: "monospace", padding: "2px 8px", borderRadius: 5 }}>{formData.universityCode || "N/A"}</span>
              <span style={formData.isActive ? S.statusActive : S.statusInactive}>{formData.isActive ? "● Active" : "● Inactive"}</span>
              {formData.featured && <span style={S.featuredBadge}>Featured</span>}
            </div>
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>University Details</div>
            <div style={S.previewRow}>
              <div style={S.previewItem}>
                <div style={S.previewLabelSmall}>Type</div>
                <div style={S.previewVal}>{formData.universityType || "N/A"}</div>
              </div>
              <div style={S.previewItem}>
                <div style={S.previewLabelSmall}>Est. Year</div>
                <div style={S.previewVal}>{formData.establishedYear || "N/A"}</div>
              </div>
            </div>
            <div style={S.previewItem}>
              <div style={S.previewLabelSmall}>Location</div>
              <div style={S.previewVal}>{[formData.city, formData.state, formData.country].filter(Boolean).join(", ") || "N/A"}</div>
            </div>
            {formData.website && (
              <div style={{ ...S.previewItem, marginTop: 4 }}>
                <div style={S.previewLabelSmall}>Website</div>
                <a href={formData.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#0891b2", wordBreak: "break-all" }}>{formData.website}</a>
              </div>
            )}
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>Programs ({formData.programs.length})</div>
            {formData.programs.length > 0 ? (
              <div style={S.programTagsWrap}>
                {formData.programs.map((p, i) => <span key={i} style={S.programTagSmall}>{p}</span>)}
              </div>
            ) : <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No programs selected</div>}
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>Intakes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {formData.intakes.length > 0
                ? formData.intakes.map((it, i) => <span key={i} style={S.intakeTagSmall}>{it}</span>)
                : <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>None selected</div>}
            </div>
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>Tuition</div>
            <div style={S.previewRow}>
              <div style={S.previewItem}>
                <div style={S.previewLabelSmall}>In-State</div>
                <div style={S.previewVal}>${formData.tuitionFees.inState || "N/A"}</div>
              </div>
              <div style={S.previewItem}>
                <div style={S.previewLabelSmall}>International</div>
                <div style={S.previewVal}>${formData.tuitionFees.international || formData.tuitionFees.outOfState || "N/A"}</div>
              </div>
            </div>
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>Contact</div>
            <div style={S.previewRow}>
              <div style={S.previewItem}>
                <div style={S.previewLabelSmall}>Admin Email</div>
                <div style={{ ...S.previewVal, wordBreak: "break-all" }}>{formData.adminEmail || "N/A"}</div>
              </div>
              <div style={S.previewItem}>
                <div style={S.previewLabelSmall}>Admin Phone</div>
                <div style={S.previewVal}>{formData.adminPhone || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="masters-preview-footer" style={S.previewFooter}>
          <button type="button" style={{ ...S.btnPrev, flex: 1 }} onClick={() => { setShowPreview(false); setCurrentStep(1); }}>
            <IconEdit size={13}/> Edit
          </button>
          <button
            type="button"
            style={{ ...S.btnSubmit, flex: 2, opacity: loading ? 0.65 : 1 }}
            onClick={() => { handleSubmit({ preventDefault: () => {} }); setShowPreview(false); }}
            disabled={loading}
          >
            {loading ? <><span style={S.spinnerSmall}></span> Creating...</> : <><IconCheckCircle size={13}/> Confirm &amp; Create</>}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Progress bar ── */
  const steps = ["Basic", "Location", "Contact", "Academics", "Requirements"];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'Inter', system-ui, sans-serif; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #0891b2 !important; box-shadow: 0 0 0 3px rgba(8,145,178,0.1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      <div className="masters-admin-compact" style={S.container}>
        {loading && (
          <div style={S.loadingOverlay}>
            <div style={S.loadingBox}><span style={S.spinnerSmall}></span> Saving...</div>
          </div>
        )}

        {/* Header */}
        <div className="masters-admin-header" style={S.header}>
          <div style={S.headerTitle}>
            <IconBuilding size={20} color="#0891b2"/>
            University Management
          </div>
          <div style={S.headerSub}>Create and manage university profiles for student applications</div>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div style={S.errBanner}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconWarning size={14}/>{apiError}</span>
            <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", display: "flex" }} onClick={() => setApiError(null)}><IconX size={13}/></button>
          </div>
        )}

        <div className="masters-create-card">
          <h2>{editingUniversity ? "Edit University" : "Create New University"}</h2>

          {/* Progress */}
          <div className="masters-progress-wrap" style={S.progressWrap}>
            <div style={S.progressTrack}>
              {steps.map((label, i) => {
                const stepNum = i + 1;
                const active = currentStep === stepNum;
                const completed = stepNum < currentStep;
                return (
                  <React.Fragment key={label}>
                    <div style={S.progressStep(active, completed)} onClick={() => setCurrentStep(stepNum)}>
                      <div style={S.progressDot(active, completed)}>
                        {completed ? <IconCheck size={11} color="#fff"/> : stepNum}
                      </div>
                      <div style={S.progressLabel(active)}>{label}</div>
                    </div>
                    {i < steps.length - 1 && <div style={S.progressLine(completed)}/>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Form Steps */}
          <form onSubmit={handleSubmit} onKeyDown={e => { if (e.key === "Enter" && currentStep !== 5) e.preventDefault(); }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            <div className="masters-form-navigation">
              {currentStep > 1 && (
                <button type="button" style={S.btnPrev} onClick={() => setCurrentStep(s => s - 1)}>
                  <IconArrowLeft size={13}/> Back
                </button>
              )}

              {currentStep < 5 && (
                <button type="button" style={S.btnNext} onClick={() => setCurrentStep(s => s + 1)}>
                  Next <IconArrowRight size={13}/>
                </button>
              )}

              {currentStep === 5 && (
                <button type="submit" style={{ ...S.btnSubmit, opacity: loading ? 0.65 : 1 }} disabled={loading}>
                  {loading ? <><span style={S.spinnerSmall}></span> Saving...</> : <><IconCheckCircle size={13}/> {editingUniversity ? "Update" : "Create"}</>}
                </button>
              )}

              <button type="button" style={S.btnPreview} onClick={() => setShowPreview(true)}>
                <IconEye size={13}/> Preview
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPreview && renderPreview()}
    </>
  );
};

export default MastersAdminTemplate;
