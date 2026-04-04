// src/components/admin/StudentAnalytics.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './StudentAnalytics.css';

const API_URL = process.env.REACT_APP_API_BASE_URL ;

const getAdminToken = () =>
  localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';

const avatarColor = (name = '') => {
  const colors = ['av-blue', 'av-teal', 'av-purple', 'av-coral', 'av-amber', 'av-green'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

const programTag = (p = '') =>
  ({ Bachelor: 'tag-teal', Master: 'tag-purple', PhD: 'tag-amber' }[p] || 'tag-gray');

const formatDate = (d) =>
  !d ? '—' : new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Icons ────────────────────────────────────────────────────────────────────
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div className={`sa-stat-card ${accent || ''}`}>
    <div className="sa-stat-label">{label}</div>
    <div className="sa-stat-value">{value ?? '—'}</div>
    {sub && <div className="sa-stat-sub">{sub}</div>}
  </div>
);

// ── Mobile Student Card ───────────────────────────────────────────────────────
const MobileStudentCard = ({ p, idx, expandedRow, setExpandedRow }) => {
  const name     = p.basicInfo?.fullName || 'Unknown';
  const email    = p.basicInfo?.email    || '';
  const unis     = p.selectedUniversities || [];
  const field    = p.education?.field    || '—';
  const segment  = p.selectedSegment?.name || '—';
  const program  = p.eligibleProgram     || '—';
  const isExpand = expandedRow === idx;

  const allCourses = unis.flatMap(u =>
    (u.selectedCourses || []).map(c => ({
      course: c.title || c.name || 'Course',
      uni: u.name,
    }))
  );

  return (
    <div className={`sa-mobile-card ${isExpand ? 'sa-mobile-card-expanded' : ''}`}>
      <div className="sa-mobile-card-top" onClick={() => setExpandedRow(isExpand ? null : idx)}>
        <div className="sa-student-cell">
          <span className={`sa-avatar ${avatarColor(name)}`}>{getInitials(name)}</span>
          <div>
            <div className="sa-student-name">{name}</div>
            <div className="sa-student-email">{email}</div>
          </div>
        </div>
        <div className="sa-mobile-card-right">
          <span className={`sa-status ${p.profileCompleted ? 'sa-status-complete' : 'sa-status-pending'}`}>
            <span className="sa-status-dot" />
            {p.profileCompleted ? 'Complete' : 'Pending'}
          </span>
          <span className="sa-mobile-expand-icon">{isExpand ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className="sa-mobile-card-summary">
        {unis.length > 0 && (
          <div className="sa-mobile-meta-item">
            <span className="sa-mobile-meta-label">University</span>
            <span className="sa-mobile-meta-value sa-uni-primary">{unis[0]?.name}</span>
            {unis.length > 1 && <span className="sa-uni-more">+{unis.length - 1}</span>}
          </div>
        )}
        <div className="sa-mobile-meta-item">
          <span className="sa-mobile-meta-label">Program</span>
          <span className={`sa-tag ${programTag(program)}`}>{program}</span>
        </div>
        {segment !== '—' && (
          <div className="sa-mobile-meta-item">
            <span className="sa-mobile-meta-label">Segment</span>
            <span className="sa-tag sa-tag-teal">{segment}</span>
          </div>
        )}
      </div>

      {isExpand && (
        <div className="sa-mobile-card-body">
          {allCourses.length > 0 && (
            <div className="sa-mobile-detail-section">
              <div className="sa-detail-heading">Courses selected</div>
              <div className="sa-courses-cell">
                {allCourses.slice(0, 4).map((c, i) => (
                  <span key={i} className="sa-tag sa-tag-blue">{c.course}</span>
                ))}
                {allCourses.length > 4 && (
                  <span className="sa-tag sa-tag-gray">+{allCourses.length - 4}</span>
                )}
              </div>
            </div>
          )}

          <div className="sa-mobile-detail-section">
            <div className="sa-detail-heading">Education</div>
            <div className="sa-mobile-detail-grid">
              <div><span className="sa-dl">Field</span><span>{field}</span></div>
              <div><span className="sa-dl">Qualification</span><span>{p.education?.qualification || '—'}</span></div>
              <div><span className="sa-dl">Institution</span><span>{p.education?.institution || '—'}</span></div>
              <div><span className="sa-dl">CGPA</span><span>{p.education?.cgpa || '—'}</span></div>
            </div>
          </div>

          <div className="sa-mobile-detail-section">
            <div className="sa-detail-heading">Personal info</div>
            <div className="sa-mobile-detail-grid">
              <div><span className="sa-dl">Mobile</span><span>{p.basicInfo?.mobile || '—'}</span></div>
              <div><span className="sa-dl">Gender</span><span>{p.basicInfo?.gender || '—'}</span></div>
              <div><span className="sa-dl">Nationality</span><span>{p.basicInfo?.nationality || '—'}</span></div>
              <div><span className="sa-dl">Completed</span><span>{formatDate(p.completedAt)}</span></div>
            </div>
          </div>

          {unis.length > 0 && (
            <div className="sa-mobile-detail-section">
              <div className="sa-detail-heading">Universities &amp; courses</div>
              {unis.map((u, ui) => (
                <div className="sa-uni-detail" key={ui}>
                  <div className="sa-uni-detail-name">
                    {u.name}
                    {u.isDirectApply && (
                      <span className="sa-tag sa-tag-amber" style={{ marginLeft: 6 }}>Direct apply</span>
                    )}
                  </div>
                  <div className="sa-uni-detail-loc">
                    {[u.city, u.state, u.country].filter(Boolean).join(', ') || '—'}
                  </div>
                  <div className="sa-courses-cell" style={{ marginTop: 5 }}>
                    {(u.selectedCourses || []).length === 0 ? (
                      <span className="sa-muted" style={{ fontSize: 11 }}>
                        {u.isDirectApply ? 'Direct apply — no courses required' : 'No courses selected'}
                      </span>
                    ) : (
                      (u.selectedCourses || []).map((c, ci) => (
                        <span key={ci} className="sa-tag sa-tag-blue">
                          {c.title || c.name || 'Course'}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentAnalytics = () => {
  const [profiles,     setProfiles]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error,        setError]        = useState('');

  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 10;

  const [search,       setSearch]       = useState('');
  const [filterProg,   setFilterProg]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedRow,  setExpandedRow]  = useState(null);
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  const fetchStats = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/analytics/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setStats(res.data.data);
    } catch (e) {
      console.error('Stats fetch failed:', e.response?.data || e.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchProfiles = useCallback(async (pg = 1) => {
    const token = getAdminToken();
    if (!token) {
      setError('No admin token found. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = { page: pg, limit: LIMIT };
      if (filterProg)    params.program = filterProg;
      if (filterStatus)  params.status  = filterStatus;
      if (search.trim()) params.search  = search.trim();

      const res = await axios.get(`${API_URL}/api/analytics/profiles`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.success) {
        setProfiles(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalCount(res.data.pagination?.total || 0);
        setPage(pg);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to load student profiles.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filterProg, filterStatus, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    fetchProfiles(1);
    setExpandedRow(null);
  }, [filterProg, filterStatus]); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => { fetchProfiles(1); setExpandedRow(null); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const changePage = (pg) => { fetchProfiles(pg); setExpandedRow(null); };

  const resetFilters = () => {
    setSearch(''); setFilterProg(''); setFilterStatus('');
    setPage(1); setExpandedRow(null); setFiltersOpen(false);
  };

  const totalStudents   = stats?.total              ?? '—';
  const uniqueUnis      = stats?.uniqueUniversities ?? '—';
  const totalCourses    = stats?.totalCourses       ?? '—';
  const avgCourses      = stats?.avgCourses         ?? '—';
  const completedPct    = stats?.completedPct       ?? '—';
  const completedNum    = stats?.completedCount     ?? '—';
  const recentWeekCount = stats?.recentWeekCount    ?? null;

  const hasFilters = !!(filterProg || filterStatus || search);

  return (
    <div className="sa-page-root">

      {/* ── Top Bar ── */}
      

      {/* ── Inner Content ── */}
      <div className="sa-wrapper">

        {/* ── Page header ── */}
        <div className="sa-page-header">
          <div>
            <h1 className="sa-page-title">Student Analytics</h1>
            <p className="sa-page-sub">University selections, course choices &amp; profile completion</p>
          </div>
          <button
            className="sa-refresh-btn"
            onClick={() => { fetchStats(); fetchProfiles(1); setExpandedRow(null); }}
          >
            <RefreshIcon />
            Refresh
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="sa-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="sa-stats-grid">
          <StatCard
            label="Total students"
            value={statsLoading ? '…' : (typeof totalStudents === 'number' ? totalStudents.toLocaleString() : totalStudents)}
            sub={!statsLoading && recentWeekCount !== null ? `+${recentWeekCount} this week` : null}
            accent="accent-blue"
          />
          <StatCard
            label="Universities selected"
            value={statsLoading ? '…' : (typeof uniqueUnis === 'number' ? uniqueUnis.toLocaleString() : uniqueUnis)}
            sub="unique universities"
            accent="accent-green"
          />
          <StatCard
            label="Courses chosen"
            value={statsLoading ? '…' : (typeof totalCourses === 'number' ? totalCourses.toLocaleString() : totalCourses)}
            sub={!statsLoading ? `avg ${avgCourses} per student` : null}
            accent="accent-purple"
          />
          <StatCard
            label="Profiles completed"
            value={statsLoading ? '…' : `${completedPct}%`}
            sub={!statsLoading ? `${typeof completedNum === 'number' ? completedNum.toLocaleString() : completedNum} of ${typeof totalStudents === 'number' ? totalStudents.toLocaleString() : totalStudents}` : null}
            accent="accent-amber"
          />
        </div>

        {/* ── Table card ── */}
        <div className="sa-table-card">

          {/* Table header / controls */}
          <div className="sa-table-header">
            <div className="sa-table-title-row">
              <div className="sa-table-title">
                Recent student selections
                <span className="sa-count-badge">{totalCount}</span>
              </div>

              <button
                className={`sa-filter-toggle-btn ${filtersOpen ? 'active' : ''} ${hasFilters ? 'has-filters' : ''}`}
                onClick={() => setFiltersOpen(f => !f)}
              >
                <FilterIcon />
                Filters
                {hasFilters && <span className="sa-filter-dot" />}
              </button>
            </div>

            <div className={`sa-controls ${filtersOpen ? 'sa-controls-open' : ''}`}>
              <div className="sa-search-wrap">
                <span className="sa-search-icon"><SearchIcon /></span>
                <input
                  className="sa-search"
                  placeholder="Search name, email, university…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <button className="sa-clear-search" onClick={() => setSearch('')}>✕</button>}
              </div>

              <select
                className="sa-filter-select"
                value={filterProg}
                onChange={e => { setFilterProg(e.target.value); setPage(1); setExpandedRow(null); }}
              >
                <option value="">All programs</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>

              <select
                className="sa-filter-select"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); setExpandedRow(null); }}
              >
                <option value="">All status</option>
                <option value="complete">Complete</option>
                <option value="pending">Pending</option>
              </select>

              {hasFilters && (
                <button className="sa-clear-btn" onClick={resetFilters}>Clear all</button>
              )}
            </div>
          </div>

          {/* ── Loading / Empty ── */}
          {loading ? (
            <div className="sa-loading">
              <div className="sa-spinner" />
              <span>Loading student data…</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="sa-empty">
              <div className="sa-empty-icon">
                <SearchIcon />
              </div>
              <p>No students found{search ? ` matching "${search}"` : ''}</p>
              <button className="sa-clear-btn" onClick={resetFilters}>Clear filters</button>
            </div>
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div className="sa-table-wrap sa-desktop-table">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>University</th>
                      <th>Courses selected</th>
                      <th>Program</th>
                      <th>Field of study</th>
                      <th>Segment</th>
                      <th>Completed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p, idx) => {
                      const name     = p.basicInfo?.fullName || 'Unknown';
                      const email    = p.basicInfo?.email    || '';
                      const unis     = p.selectedUniversities || [];
                      const field    = p.education?.field    || '—';
                      const segment  = p.selectedSegment?.name || '—';
                      const program  = p.eligibleProgram     || '—';
                      const isExpand = expandedRow === idx;

                      const allCourses = unis.flatMap(u =>
                        (u.selectedCourses || []).map(c => ({
                          course: c.title || c.name || 'Course',
                          uni: u.name,
                        }))
                      );

                      return (
                        <React.Fragment key={p._id || idx}>
                          <tr
                            className={`sa-tr ${isExpand ? 'sa-tr-expanded' : ''}`}
                            onClick={() => setExpandedRow(isExpand ? null : idx)}
                          >
                            <td>
                              <div className="sa-student-cell">
                                <span className={`sa-avatar ${avatarColor(name)}`}>{getInitials(name)}</span>
                                <div>
                                  <div className="sa-student-name">{name}</div>
                                  <div className="sa-student-email">{email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {unis.length === 0 ? <span className="sa-muted">—</span> : (
                                <div className="sa-uni-list">
                                  <span className="sa-uni-primary">{unis[0]?.name}</span>
                                  {unis.length > 1 && <span className="sa-uni-more">+{unis.length - 1} more</span>}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="sa-courses-cell">
                                {allCourses.length === 0 ? (
                                  <span className="sa-muted">—</span>
                                ) : (
                                  <>
                                    {allCourses.slice(0, 2).map((c, i) => (
                                      <span key={i} className="sa-tag sa-tag-blue">{c.course}</span>
                                    ))}
                                    {allCourses.length > 2 && (
                                      <span className="sa-tag sa-tag-gray">+{allCourses.length - 2}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td><span className={`sa-tag ${programTag(program)}`}>{program}</span></td>
                            <td className="sa-muted sa-field-cell">{field}</td>
                            <td>
                              {segment !== '—'
                                ? <span className="sa-tag sa-tag-teal">{segment}</span>
                                : <span className="sa-muted">—</span>}
                            </td>
                            <td className="sa-muted">{formatDate(p.completedAt)}</td>
                            <td>
                              <span className={`sa-status ${p.profileCompleted ? 'sa-status-complete' : 'sa-status-pending'}`}>
                                <span className="sa-status-dot" />
                                {p.profileCompleted ? 'Complete' : 'Pending'}
                              </span>
                            </td>
                          </tr>

                          {isExpand && (
                            <tr className="sa-detail-row">
                              <td colSpan={8}>
                                <div className="sa-detail-wrap">
                                  <div className="sa-detail-section">
                                    <div className="sa-detail-heading">Personal info</div>
                                    <div className="sa-detail-grid">
                                      <div><span className="sa-dl">Mobile</span><span>{p.basicInfo?.mobile || '—'}</span></div>
                                      <div><span className="sa-dl">DOB</span><span>{p.basicInfo?.dob || '—'}</span></div>
                                      <div><span className="sa-dl">Gender</span><span>{p.basicInfo?.gender || '—'}</span></div>
                                      <div><span className="sa-dl">Nationality</span><span>{p.basicInfo?.nationality || '—'}</span></div>
                                      <div><span className="sa-dl">Residence</span><span>{p.basicInfo?.residence || '—'}</span></div>
                                    </div>
                                  </div>
                                  <div className="sa-detail-section">
                                    <div className="sa-detail-heading">Education</div>
                                    <div className="sa-detail-grid">
                                      <div><span className="sa-dl">Qualification</span><span>{p.education?.qualification || '—'}</span></div>
                                      <div><span className="sa-dl">Institution</span><span>{p.education?.institution || '—'}</span></div>
                                      <div><span className="sa-dl">Field</span><span>{p.education?.field || '—'}</span></div>
                                      <div><span className="sa-dl">Year</span><span>{p.education?.year || '—'}</span></div>
                                      <div><span className="sa-dl">CGPA</span><span>{p.education?.cgpa || '—'}</span></div>
                                    </div>
                                  </div>
                                  <div className="sa-detail-section">
                                    <div className="sa-detail-heading">Universities &amp; courses</div>
                                    {unis.length === 0 ? (
                                      <span className="sa-muted">No universities selected</span>
                                    ) : unis.map((u, ui) => (
                                      <div className="sa-uni-detail" key={ui}>
                                        <div className="sa-uni-detail-name">
                                          {u.name}
                                          {u.isDirectApply && (
                                            <span className="sa-tag sa-tag-amber" style={{ marginLeft: 8 }}>Direct apply</span>
                                          )}
                                        </div>
                                        <div className="sa-uni-detail-loc">
                                          {[u.city, u.state, u.country].filter(Boolean).join(', ') || '—'}
                                        </div>
                                        <div className="sa-courses-cell" style={{ marginTop: 5 }}>
                                          {(u.selectedCourses || []).length === 0 ? (
                                            <span className="sa-muted" style={{ fontSize: 11 }}>
                                              {u.isDirectApply ? 'Direct apply — no courses required' : 'No courses selected'}
                                            </span>
                                          ) : (
                                            (u.selectedCourses || []).map((c, ci) => (
                                              <span key={ci} className="sa-tag sa-tag-blue">
                                                {c.title || c.name || 'Course'}
                                              </span>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Card List ── */}
              <div className="sa-mobile-list">
                {profiles.map((p, idx) => (
                  <MobileStudentCard
                    key={p._id || idx}
                    p={p}
                    idx={idx}
                    expandedRow={expandedRow}
                    setExpandedRow={setExpandedRow}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="sa-pagination">
              <span className="sa-page-info">
                Page {page} of {totalPages} · {totalCount} students
              </span>
              <div className="sa-page-btns">
                <button className="sa-page-btn" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                  .map(pg => (
                    <button
                      key={pg}
                      className={`sa-page-btn ${pg === page ? 'sa-page-btn-active' : ''}`}
                      onClick={() => changePage(pg)}
                    >{pg}</button>
                  ))}
                <button className="sa-page-btn" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="sa-footer">© 2026 Admin Dashboard. All rights reserved.</div>
    </div>
  );
};

export default StudentAnalytics;