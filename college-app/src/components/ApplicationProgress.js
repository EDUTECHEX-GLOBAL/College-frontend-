// src/components/ApplicationProgress.js
// Drop this component into Dashboard.js and replace the applicationSections grid with it.

import React, { useState } from 'react';
import './ApplicationProgress.css';

/* ── reuse the same SVG icons from Dashboard.js ── */
const LockIcon = ({ size = 16, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowRightIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ChevronDownIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── helpers ── */
const getPctClass = (progress) => {
  if (progress >= 100) return 'pct--success';
  if (progress >= 50)  return 'pct--progress';
  if (progress > 0)    return 'pct--warning';
  return 'pct--zero';
};

const getActionLabel = (section) => {
  if (section.locked)          return 'Unlock';
  if (section.progress >= 100) return 'Review & Edit';
  if (section.progress > 0)    return 'Continue';
  return 'Get Started';
};

const getActionColor = (section) => {
  if (section.locked)          return '#94a3b8';
  if (section.progress >= 100) return '#10b981';
  if (section.progress > 0)    return '#0891b2';
  return '#9ca3af';
};

/* ════════════════════════════════════════════════════════════
   ApplicationProgress
   Props:
     applicationSections  – same array you build in Dashboard.js
     completedSections    – number
     totalSections        – number
     onSectionClick       – (section) => void
     onLockedCardClick    – (appType) => void
   ════════════════════════════════════════════════════════════ */
const ApplicationProgress = ({
  applicationSections,
  completedSections,
  totalSections,
  onSectionClick,
  onLockedCardClick,
}) => {
  // Split sections into top-level (locked apps) and grouped (common app)
  const lockedSections  = applicationSections.filter(s => s.lockedFor);  // University + Master
  const commonSections  = applicationSections.filter(s => !s.lockedFor); // Profile, Family, Education …

  // Which grouped sub-sections are expanded
  const [groupOpen, setGroupOpen] = useState(false);

  // Average progress for the group card
  const groupProgress = commonSections.length
    ? Math.round(commonSections.reduce((sum, s) => sum + s.progress, 0) / commonSections.length)
    : 0;

  const groupCompleted = commonSections.filter(s => s.progress >= 100).length;

  const handleSectionClick = (section) => {
    if (section.locked) { onLockedCardClick(section.lockedFor); return; }
    onSectionClick(section);
  };

  return (
    <div className="ap-wrapper">

      {/* ── Header row ── */}
      <div className="ap-card-header">
        <div className="ap-card-title-row">
          <h2 className="ap-card-title">My Common Application</h2>
          <span className="ap-badge">{completedSections}/{totalSections} sections complete</span>
        </div>
      </div>

      {/* ── Top row: locked cards (University + Master) ── */}
      <div className="ap-top-row">
        {lockedSections.map((section, i) => (
          <div
            key={i}
            className={`ap-locked-card${section.locked ? ' ap-locked-card--locked' : ''}`}
            onClick={() => handleSectionClick(section)}
          >
            {section.locked && (
              <div className="ap-lock-badge">
                <LockIcon size={12} color="#64748b" strokeWidth={2.5} />
              </div>
            )}
            <div className="ap-locked-card__header">
              <div>
                <h4 className={`ap-locked-card__name${section.locked ? ' locked-text' : ''}`}>
                  {section.name}
                </h4>
                <p className="ap-locked-card__desc">
                  {section.locked
                    ? `Select a ${section.lockedFor === 'university' ? "bachelor's" : "master's"} university in College Search to unlock`
                    : section.desc}
                </p>
              </div>
              <span className={`ap-pct-badge ${section.locked ? 'pct--locked' : getPctClass(section.progress)}`}>
                {section.locked
                  ? <LockIcon size={11} color="#94a3b8" strokeWidth={2.5} />
                  : `${section.progress}%`}
              </span>
            </div>

            {!section.locked && section.progress > 0 && section.progress < 100 && (
              <div className="ap-progress-bar">
                <div className="ap-progress-bar__fill bar--blue" style={{ width: `${section.progress}%` }} />
              </div>
            )}

            <button
              className={`ap-action-btn${section.locked ? ' ap-action-btn--locked' : section.progress >= 100 ? ' ap-action-btn--done' : ''}`}
              style={{ color: getActionColor(section) }}
              onClick={e => { e.stopPropagation(); handleSectionClick(section); }}
            >
              <span className="ap-action-row">
                {section.locked
                  ? <><LockIcon size={12} color="#94a3b8" strokeWidth={2.5} /><span>Unlock</span><ArrowRightIcon size={12} color="#94a3b8" /></>
                  : <><span>{getActionLabel(section)}</span><ArrowRightIcon size={12} color={getActionColor(section)} /></>
                }
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* ── Grouped common-app card ── */}
      <div className={`ap-group-card${groupOpen ? ' ap-group-card--open' : ''}`}>

        {/* Summary row — always visible, click to toggle */}
        <div className="ap-group-card__summary" onClick={() => setGroupOpen(o => !o)}>

          <div className="ap-group-card__left">
            {/* Mini progress ring */}
            <div className="ap-mini-ring">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="21" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="21"
                  fill="none"
                  stroke={groupProgress >= 100 ? '#10b981' : '#0891b2'}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 21}`}
                  strokeDashoffset={`${2 * Math.PI * 21 * (1 - groupProgress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                />
                <text x="26" y="30" textAnchor="middle" fontSize="10" fontWeight="600"
                  fill={groupProgress >= 100 ? '#10b981' : '#0891b2'}>
                  {groupProgress}%
                </text>
              </svg>
            </div>

            <div className="ap-group-card__info">
              <h3 className="ap-group-card__title">Common Application Sections</h3>
              <p className="ap-group-card__sub">
                {groupCompleted} of {commonSections.length} sections complete
                &nbsp;·&nbsp;
                {commonSections.filter(s => s.progress > 0 && s.progress < 100).length} in progress
              </p>
              {/* Mini pills */}
              <div className="ap-section-pills">
                {commonSections.map((s, i) => (
                  <span
                    key={i}
                    className={`ap-pill ${s.progress >= 100 ? 'ap-pill--done' : s.progress > 0 ? 'ap-pill--progress' : 'ap-pill--zero'}`}
                  >
                    {s.progress >= 100 && <CheckIcon size={10} color="#10b981" />}
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="ap-group-card__right">
            <span className={`ap-pct-badge ${getPctClass(groupProgress)}`}>{groupProgress}%</span>
            <span className={`ap-chevron${groupOpen ? ' ap-chevron--open' : ''}`}>
              <ChevronDownIcon size={18} color="#64748b" />
            </span>
          </div>
        </div>

        {/* Expandable sub-cards */}
        <div className={`ap-group-card__body${groupOpen ? ' ap-group-card__body--open' : ''}`}>
          <div className="ap-sub-grid">
            {commonSections.map((section, i) => (
              <div
                key={i}
                className="ap-sub-card"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => handleSectionClick(section)}
              >
                <div className="ap-sub-card__header">
                  <div>
                    <h4 className="ap-sub-card__name">{section.name}</h4>
                    <p className="ap-sub-card__desc">{section.desc}</p>
                  </div>
                  <span className={`ap-pct-badge ap-pct-badge--sm ${getPctClass(section.progress)}`}>
                    {section.progress}%
                  </span>
                </div>

                {section.progress > 0 && section.progress < 100 && (
                  <div className="ap-progress-bar ap-progress-bar--sm">
                    <div
                      className="ap-progress-bar__fill bar--blue"
                      style={{ width: `${section.progress}%` }}
                    />
                  </div>
                )}

                {section.progress >= 100 && (
                  <div className="ap-sub-card__complete-bar">
                    <CheckIcon size={12} color="#10b981" />
                    <span>Complete</span>
                  </div>
                )}

                <button
                  className={`ap-action-btn ${section.progress >= 100 ? 'ap-action-btn--done' : ''}`}
                  style={{ color: getActionColor(section) }}
                  onClick={e => { e.stopPropagation(); handleSectionClick(section); }}
                >
                  <span className="ap-action-row">
                    <span>{getActionLabel(section)}</span>
                    <ArrowRightIcon size={12} color={getActionColor(section)} />
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ApplicationProgress;