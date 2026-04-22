// src/components/Courses.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Courses.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const MASTER_KEYWORDS = [
  'master', 'msc', 'm.sc', 'mba', 'mtech', 'm.tech', 'ms ',
  'postgraduate', 'post-graduate', 'pg diploma', 'pgdiploma',
  'graduate certificate', 'm.eng', 'meng', 'llm', 'mfa', 'mph',
  'executive master', 'executive mba'
];

const containsMasterKeyword = (str = '') => {
  const lower = str.toLowerCase();
  return MASTER_KEYWORDS.some(kw => lower.includes(kw));
};

const isMasterLevel = (program = {}, uniHint = false) => {
  if (uniHint) return true;
  if (containsMasterKeyword(program.level || ''))       return true;
  if (containsMasterKeyword(program.title || ''))       return true;
  if (containsMasterKeyword(program.description || '')) return true;
  return false;
};

const Courses = ({ onCourseSelect }) => {
  const { universityId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';

  // ─── Resolve isMasterUniversity from ALL available sources ───────────────
  // Called once synchronously so it is ready before any click handler runs.
  const resolveIsMasterUniversity = () => {
    // 1. Navigation state — most reliable when coming from CollegeSearch
    if (location.state?.isMasterUniversity === true) return true;

    // 2. Stored university data in localStorage
    try {
      const keys = [
        `university_${universityId}`,
        'currentUniversity'
      ];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const uni = JSON.parse(raw);
        if (uni.universityType === 'master')         return true;
        if (uni.type          === 'master')          return true;
        if (uni.isMaster      === true)              return true;
        if (containsMasterKeyword(uni.INSTNM || '')) return true;
        if (uni.programs?.some(p =>
          containsMasterKeyword(p.title || '') ||
          containsMasterKeyword(p.level || '')
        )) return true;
      }
    } catch (e) {}

    return false;
  };

  // Compute once — stable for the lifetime of this component render
  const uniIsMasterHint = resolveIsMasterUniversity();

  const [university,       setUniversity]       = useState(null);
  const [programs,         setPrograms]         = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [selectedProgram,  setSelectedProgram]  = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [searchTerm,       setSearchTerm]       = useState("");
  const [selectedMajorArea,setSelectedMajorArea]= useState("All");
  const [selectedStudyMode,setSelectedStudyMode]= useState("All");
  const [selectedLevel,    setSelectedLevel]    = useState("All");
  const [majorAreas,       setMajorAreas]       = useState([]);
  const [studyModes,       setStudyModes]       = useState([]);
  const [programLevels,    setProgramLevels]    = useState([]);
  const [activeTab,        setActiveTab]        = useState("programs");
  const [savingToBackend,  setSavingToBackend]  = useState(false);
  const [debugInfo,        setDebugInfo]        = useState(null);
  const [selectedCourses,  setSelectedCourses]  = useState([]);
  const [showFilters,      setShowFilters]      = useState(false);
  const [sortBy,           setSortBy]           = useState("title");
  const [favorites,        setFavorites]        = useState([]);
  const [showFavoritesOnly,setShowFavoritesOnly]= useState(false);

  useEffect(() => {
    loadUniversityData();
    loadFavorites();
  }, [universityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavorites = () => {
    const saved = localStorage.getItem('favoritePrograms');
    if (saved) setFavorites(JSON.parse(saved));
  };

  const toggleFavorite = (program) => {
    const id = program.id;
    const updated = favorites.includes(id)
      ? favorites.filter(x => x !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('favoritePrograms', JSON.stringify(updated));
  };

  const loadUniversityData = async () => {
    try {
      setLoading(true);
      setError(null);

      let universityData     = null;
      let selectedCoursesData = [];

      if (location.state?.university)      universityData      = location.state.university;
      if (location.state?.selectedCourses) selectedCoursesData = location.state.selectedCourses;

      if (!universityData) {
        const stored = localStorage.getItem(`university_${universityId}`);
        if (stored) { try { universityData = JSON.parse(stored); } catch (e) {} }
      }
      if (selectedCoursesData.length === 0) {
        const storedCourses = localStorage.getItem(`university_courses_${universityId}`);
        if (storedCourses) { try { selectedCoursesData = JSON.parse(storedCourses); } catch (e) {} }
      }
      if (!universityData) {
        const current = localStorage.getItem('currentUniversity');
        if (current) {
          try {
            const parsed = JSON.parse(current);
            if (parsed.UNITID?.toString() === universityId?.toString()) universityData = parsed;
          } catch (e) {}
        }
      }

      setSelectedCourses(selectedCoursesData);

      if (universityData) {
        setUniversity(universityData);
        extractProgramsFromUniversity(universityData, selectedCoursesData);
      } else {
        await fetchUniversityFromAPI();
      }
    } catch (err) {
      setError('Failed to load university data. Please go back and try again.');
      setLoading(false);
    }
  };

  const fetchUniversityFromAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(
        `${API_URL}/api/college-search/university/${universityId}`,
        { headers }
      );
      if (response.data.success) {
        const uniData = response.data.data;
        setUniversity(uniData);
        extractProgramsFromUniversity(uniData, []);
      } else {
        setError('University not found.');
        setLoading(false);
      }
    } catch {
      setError('Unable to load university details. Please try again later.');
      setLoading(false);
    }
  };

  const extractProgramsFromUniversity = (uniData, selectedCoursesData = []) => {
    let extractedPrograms = [];

    if (selectedCoursesData?.length > 0)                  extractedPrograms = selectedCoursesData;
    else if (uniData.programs?.length > 0)                extractedPrograms = uniData.programs;
    else if (uniData.metadata?.programs?.length > 0)      extractedPrograms = uniData.metadata.programs;
    else if (uniData.GUS_DATA?.programs_data?.length > 0) extractedPrograms = uniData.GUS_DATA.programs_data;
    else if (uniData.data?.programs?.length > 0)          extractedPrograms = uniData.data.programs;

    if (extractedPrograms.length > 0) {
      processPrograms(extractedPrograms, uniData);
    } else {
      setDebugInfo({ hasPrograms: !!uniData.programs, programsLength: uniData.programs?.length || 0, isMasterHint: uniIsMasterHint });
      setPrograms([]);
      setFilteredPrograms([]);
      setLoading(false);
    }
  };

  const processPrograms = (programsData, uniData) => {
    const extractedPrograms = [];
    const areas  = new Set();
    const modes  = new Set();
    const levels = new Set();

    programsData.forEach((prog, index) => {
      const title = prog.title || prog.program_name || prog.name || 'Program';

      let level = prog.level || prog.degree_level || prog.program_level || 'Undergraduate';
      if (typeof level === 'string') {
        level = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
      }

      // ── If the whole university is master, force every program to Master ──
      if (uniIsMasterHint) {
        level = 'Master';
      } else if (!containsMasterKeyword(level) && containsMasterKeyword(title)) {
        level = 'Master';
      }
      levels.add(level);

      let studyMode = prog.studyMode || prog.delivery_mode || prog.mode || 'On Campus';
      if (Array.isArray(prog.studyModes)) studyMode = prog.studyModes.join(' & ');
      modes.add(studyMode);

      let locations = [];
      if (Array.isArray(prog.locations))        locations = prog.locations;
      else if (prog.location)                   locations = [prog.location];
      else if (uniData.CITY && uniData.STABBR)  locations = [`${uniData.CITY}, ${uniData.STABBR}`];
      else                                      locations = ['Main Campus'];

      const majorArea  = prog.majorArea || prog.discipline || prog.field_of_study || 'General';
      if (majorArea !== 'General') areas.add(majorArea);

      const duration    = prog.duration || getDurationForLevel(level);
      const description = prog.description || prog.overview || `${title} program at ${uniData.INSTNM}`;
      const tuition     = prog.tuition || prog.fees || {};
      const tuitionAmt  = tuition.in_state || tuition.out_of_state || tuition.international
                        || tuition.amount  || 'Contact for details';

      extractedPrograms.push({
        id:                  prog.id || prog.programId || prog._id || `prog-${index}-${Date.now()}`,
        title,
        level,
        studyMode,
        locations,
        description,
        duration,
        tuition:             tuitionAmt,
        majorArea,
        campus:              prog.campus || 'Main Campus',
        requirements:        prog.requirements || prog.admission_requirements || [],
        careerPaths:         prog.careerPaths  || prog.career_opportunities   || [],
        accreditation:       prog.accreditation || 'Accredited',
        startDates:          prog.startDates   || ['Fall', 'Spring'],
        applicationDeadline: prog.applicationDeadline || 'Rolling admission'
      });
    });

    extractedPrograms.sort((a, b) => a.title.localeCompare(b.title));
    setPrograms(extractedPrograms);
    setFilteredPrograms(extractedPrograms);
    setMajorAreas(Array.from(areas).sort());
    setStudyModes(Array.from(modes).sort());
    setProgramLevels(Array.from(levels).sort());
    setLoading(false);
  };

  const getDurationForLevel = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('master') || l.includes('mba'))             return '1-2 years';
    if (l.includes('phd') || l.includes('doctorate'))          return '3-5 years';
    if (l.includes('bachelor') || l.includes('undergraduate')) return '3-4 years';
    if (l.includes('diploma'))                                 return '1-2 years';
    if (l.includes('certificate'))                             return '6-12 months';
    return '3-4 years';
  };

  useEffect(() => {
    let filtered = [...programs];
    if (showFavoritesOnly) filtered = filtered.filter(p => favorites.includes(p.id));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(term)       ||
        p.description?.toLowerCase().includes(term) ||
        p.majorArea?.toLowerCase().includes(term)
      );
    }
    if (selectedMajorArea !== "All") filtered = filtered.filter(p => p.majorArea === selectedMajorArea);
    if (selectedStudyMode !== "All") filtered = filtered.filter(p => p.studyMode === selectedStudyMode);
    if (selectedLevel     !== "All") filtered = filtered.filter(p => p.level     === selectedLevel);
    if (sortBy === "title")          filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "duration")  filtered.sort((a, b) => (a.duration || "").localeCompare(b.duration || ""));
    else if (sortBy === "level")     filtered.sort((a, b) => (a.level    || "").localeCompare(b.level    || ""));
    setFilteredPrograms(filtered);
  }, [searchTerm, selectedMajorArea, selectedStudyMode, selectedLevel, programs, sortBy, showFavoritesOnly, favorites]);

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setActiveTab('selected');
  };

  // ─── Build course data payload ─────────────────────────────────────────────
  const buildCourseData = (program) => ({
    universityId:   university?.UNITID || university?._id || university?.id || '',
    universityName: university?.INSTNM || '',
    programId:      program.id,
    programName:    program.title,
    programDetails: {
      studyMode:    program.studyMode,
      level:        program.level,
      duration:     program.duration,
      tuition:      program.tuition,
      locations:    program.locations,
      description:  program.description,
      majorArea:    program.majorArea,
      requirements: program.requirements,
      startDates:   program.startDates
    },
    selectedAt: new Date().toISOString()
  });

  // ─── APPLY NOW — guaranteed master routing ─────────────────────────────────
  const handleApplyNow = (program) => {
    if (!university || !program) { alert("Please select a program first"); return; }

    setSavingToBackend(true);
    try {
      const courseData = buildCourseData(program);

      // uniIsMasterHint is resolved from state + localStorage at component mount
      // so it can never be undefined/null here.
      const isMaster = isMasterLevel(program, uniIsMasterHint);

      // ── Route ────────────────────────────────────────────────────────────
      const applicationPath = isMaster
        ? `/${studentType}/dashboard/master-application/overview`
        : `/${studentType}/dashboard/application/overview`;

      // ── Persist ──────────────────────────────────────────────────────────
      if (isMaster) {
        localStorage.setItem('selectedMasterCourseForApplication', JSON.stringify(courseData));
        localStorage.removeItem('masterCourseConfirmed');
      } else {
        localStorage.removeItem('selectedMasterCourseForApplication');
        localStorage.removeItem('masterCourseConfirmed');
      }
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));

      setSelectedProgram(program);

      navigate(applicationPath, {
        state: {
          fromCoursesPage:     true,
          courseData,
          isMasterApplication: isMaster
        }
      });

      if (onCourseSelect) onCourseSelect(courseData);
    } catch (err) {
      console.error("Error saving course:", err);
      alert("An error occurred while saving your course selection.");
    } finally {
      setSavingToBackend(false);
    }
  };

  const navigateToApplicationOverview = () => {
    if (!university || !selectedProgram) { alert("Please select a program first"); return; }
    handleApplyNow(selectedProgram);
  };

  const handleBackToSearch = () => {
    navigate(
      studentType === 'firstyear'
        ? '/firstyear/dashboard/college-search'
        : '/transfer/dashboard/college-search'
    );
  };

  const getInitials = (name) => {
    if (!name) return "UN";
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleRetry = () => {
    setLoading(true);
    setDebugInfo(null);
    if (university) extractProgramsFromUniversity(university, location.state?.selectedCourses || []);
    else loadUniversityData();
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 'Contact for details') return amount;
    if (typeof amount === 'string') return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  };

  // ─── Loading / error / not-found guards ────────────────────────────────────
  if (loading) return (
    <div className="course-loading">
      <div className="course-loading-spinner"></div>
      <p>Loading university details and programs...</p>
      <p className="course-loading-subtitle">This may take a few moments</p>
    </div>
  );

  if (error) return (
    <div className="course-error">
      <div className="course-error-icon">!</div>
      <h3>{error}</h3>
      <p>Please try again or contact support if the problem persists.</p>
      <button onClick={handleBackToSearch} className="course-back-button">Back to Search</button>
    </div>
  );

  if (!university) return (
    <div className="course-error">
      <div className="course-error-icon">!</div>
      <h3>University not found</h3>
      <p>The university you're looking for doesn't exist or has been removed.</p>
      <button onClick={handleBackToSearch} className="course-back-button">Back to Search</button>
    </div>
  );

  return (
    <div className="course-container">

      {/* ── Header ── */}
      <div className="course-header">
        <div className="course-header-top">
          <button onClick={handleBackToSearch} className="course-header-back-button">Back to Search</button>
          <div className="course-header-actions">
            {selectedCourses.length > 0 && (
              <div className="course-selected-badge">
                {selectedCourses.length} Selected {selectedCourses.length === 1 ? 'Course' : 'Courses'}
              </div>
            )}
            <span className={`course-uni-type-badge ${uniIsMasterHint ? 'course-uni-type-badge--master' : 'course-uni-type-badge--bachelor'}`}>
              {uniIsMasterHint ? 'Master University' : 'Bachelor University'}
            </span>
            <button className="course-filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        <div className="course-university-header-card">
          <div className="course-university-header-content">
            <div className="course-university-logo-wrapper">
              <div className="course-university-logo-placeholder">
                <div className="course-university-logo-initials">{getInitials(university.INSTNM)}</div>
              </div>
              {university.INSTNM.includes('University') && (
                <div className="course-university-badge">University</div>
              )}
            </div>
            <div className="course-university-header-info">
              <h1 className="course-university-title">{university.INSTNM}</h1>
              <div className="course-university-meta">
                <span className="course-university-location">
                  {university.CITY || university.location?.city || 'City'},{' '}
                  {university.STABBR || university.location?.state || 'State'}
                </span>
                <span className="course-meta-separator">•</span>
                <span className="course-university-country">
                  {university.COUNTRY || university.location?.country || 'USA'}
                </span>
                {university.website && (
                  <>
                    <span className="course-meta-separator">•</span>
                    <a href={university.website} target="_blank" rel="noopener noreferrer" className="course-university-website">
                      Visit Website
                    </a>
                  </>
                )}
              </div>
              <div className="course-university-stats">
                <div className="course-stat-item"><span className="course-stat-value">{programs.length}</span><span className="course-stat-label">Programmes</span></div>
                <div className="course-stat-item"><span className="course-stat-value">{majorAreas.length}</span><span className="course-stat-label">Fields of Study</span></div>
                <div className="course-stat-item"><span className="course-stat-value">{studyModes.length}</span><span className="course-stat-label">Study Modes</span></div>
                <div className="course-stat-item"><span className="course-stat-value">{programLevels.length}</span><span className="course-stat-label">Degree Levels</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {programs.length === 0 && debugInfo && (
        <div className="course-debug-info">
          <div className="course-debug-header"><h4>Debug Information - No Programs Found</h4></div>
          <div className="course-debug-content">
            <p><strong>University:</strong> {university.INSTNM}</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            <button onClick={handleRetry} className="course-debug-retry-btn">Retry Loading Programs</button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="course-content">

        {programs.length > 0 && showFilters && (
          <div className="course-sidebar">
            <div className="course-sidebar-card">
              <div className="course-sidebar-header">
                <h3 className="course-sidebar-title">Search and Filter</h3>
                <div className="course-results-count">{filteredPrograms.length} of {programs.length} programs</div>
              </div>
              <div className="course-sidebar-search">
                <div className="course-search-wrapper">
                  <input type="text" placeholder="Search programs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="course-search-input" />
                  {searchTerm && <button className="course-clear-search-btn" onClick={() => setSearchTerm("")} aria-label="Clear search">×</button>}
                </div>
              </div>
              <div className="course-filters-section">
                <div className="course-filter-group">
                  <label className="course-filter-label">FIELD OF STUDY</label>
                  <select value={selectedMajorArea} onChange={(e) => setSelectedMajorArea(e.target.value)} className="course-filter-select">
                    <option value="All">All Fields</option>
                    {majorAreas.map((a, i) => <option key={i} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label">DEGREE LEVEL</label>
                  <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="course-filter-select">
                    <option value="All">All Levels</option>
                    {programLevels.map((l, i) => <option key={i} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label">STUDY MODE</label>
                  <select value={selectedStudyMode} onChange={(e) => setSelectedStudyMode(e.target.value)} className="course-filter-select">
                    <option value="All">All Modes</option>
                    {studyModes.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label">SORT BY</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="course-filter-select">
                    <option value="title">Program Name</option>
                    <option value="level">Degree Level</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label checkbox-label">
                    <input type="checkbox" checked={showFavoritesOnly} onChange={(e) => setShowFavoritesOnly(e.target.checked)} />
                    <span className="course-checkbox-text">Show favorites only</span>
                  </label>
                </div>
                {(searchTerm || selectedMajorArea !== "All" || selectedStudyMode !== "All" || selectedLevel !== "All" || showFavoritesOnly) && (
                  <button className="course-reset-filters-btn" onClick={() => { setSearchTerm(""); setSelectedMajorArea("All"); setSelectedStudyMode("All"); setSelectedLevel("All"); setShowFavoritesOnly(false); setSortBy("title"); }}>
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={`course-programs-content ${!showFilters ? 'full-width' : ''}`}>
          {programs.length === 0 ? (
            <div className="course-no-programs-found">
              <div className="course-no-programs-icon"></div>
              <h3>No Programs Available in Database</h3>
              <p>This university doesn't have programs in the database yet.</p>
              <button onClick={handleBackToSearch} className="course-back-button">Back to Search</button>
            </div>
          ) : filteredPrograms.length > 0 ? (
            <>
              <div className="course-programs-header">
                <h2 className="course-programs-title">
                  Available Programs <span className="course-programs-count">({filteredPrograms.length})</span>
                </h2>
                {!showFilters && (
                  <button className="course-show-filters-btn" onClick={() => setShowFilters(true)}>Show Filters</button>
                )}
              </div>
              <div className="course-programs-grid">
                {filteredPrograms.map((program) => {
                  const isMaster = isMasterLevel(program, uniIsMasterHint);
                  return (
                    <div
                      key={program.id}
                      className={`course-program-card ${selectedProgram?.id === program.id ? 'selected' : ''}`}
                      onClick={() => handleProgramSelect(program)}
                    >
                      <div className="course-program-card-header">
                        <h3 className="course-program-card-title">{program.title}</h3>
                        <button
                          className={`course-favorite-btn ${favorites.includes(program.id) ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(program); }}
                        >
                          {favorites.includes(program.id) ? '★' : '☆'}
                        </button>
                      </div>

                      <div className="course-program-card-body">
                        <div className="course-program-meta-tags">
                          <span className="course-study-mode-badge">{program.studyMode}</span>
                          <span className={`course-program-level-badge ${isMaster ? 'course-program-level-badge--master' : 'course-program-level-badge--bachelor'}`}>
                            {program.level}
                          </span>
                          <span className={`course-app-type-tag ${isMaster ? 'course-app-type-tag--master' : 'course-app-type-tag--bachelor'}`}>
                            {isMaster ? '→ Master Application' : '→ Bachelor Application'}
                          </span>
                        </div>

                        <div className="course-program-locations">
                          <span className="course-locations-text">{program.locations.join(' • ')}</span>
                        </div>

                        <div className="course-program-details-grid">
                          {program.duration         && <div className="course-program-detail-item"><div className="course-detail-content"><span className="course-detail-label">Duration</span><span className="course-detail-value">{program.duration}</span></div></div>}
                          {program.tuition          && <div className="course-program-detail-item"><div className="course-detail-content"><span className="course-detail-label">Tuition</span><span className="course-detail-value">{formatCurrency(program.tuition)}</span></div></div>}
                          {program.startDates?.length > 0 && <div className="course-program-detail-item"><div className="course-detail-content"><span className="course-detail-label">Start Dates</span><span className="course-detail-value">{program.startDates.join(', ')}</span></div></div>}
                          {program.applicationDeadline && <div className="course-program-detail-item"><div className="course-detail-content"><span className="course-detail-label">Deadline</span><span className="course-detail-value">{program.applicationDeadline}</span></div></div>}
                        </div>

                        {program.majorArea && program.majorArea !== 'General' && (
                          <div className="course-program-major-area">
                            <span className="course-major-area-tag">{program.majorArea}</span>
                          </div>
                        )}

                        {program.description && (
                          <p className="course-program-description">
                            {program.description.length > 120
                              ? `${program.description.substring(0, 120)}...`
                              : program.description}
                          </p>
                        )}

                        {program.requirements?.length > 0 && (
                          <div className="course-program-requirements">
                            <span className="course-requirements-label">Requirements:</span>
                            <span className="course-requirements-text">
                              {program.requirements.slice(0, 2).join(' • ')}
                              {program.requirements.length > 2 && ' ...'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="course-program-card-footer">
                        <button
                          className="course-select-program-btn"
                          onClick={(e) => { e.stopPropagation(); handleProgramSelect(program); }}
                        >
                          {selectedProgram?.id === program.id ? 'Selected ✓' : 'Select Program'}
                        </button>
                        <button
                          className={`course-apply-now-btn ${isMaster ? 'course-apply-now-btn--master' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleApplyNow(program); }}
                        >
                          {isMaster ? 'Apply (Master) →' : 'Apply Now →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="course-no-programs-found">
              <div className="course-no-programs-icon"></div>
              <h3>No Programs Match Your Filters</h3>
              <p>Try adjusting your search criteria or filters.</p>
              <button className="course-reset-filters-btn" onClick={() => { setSearchTerm(""); setSelectedMajorArea("All"); setSelectedStudyMode("All"); setSelectedLevel("All"); setShowFavoritesOnly(false); }}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Selected Program Side Panel ── */}
      {selectedProgram && activeTab === 'selected' && (
        <div className="course-selected-panel">
          <div className="course-panel-header">
            <div className="course-panel-title">
              <h3>Selected Program</h3>
              <span className={`course-panel-app-type ${isMasterLevel(selectedProgram, uniIsMasterHint) ? 'course-panel-app-type--master' : 'course-panel-app-type--bachelor'}`}>
                → {isMasterLevel(selectedProgram, uniIsMasterHint) ? 'Master Application' : 'Bachelor Application'}
              </span>
            </div>
            <button className="course-close-panel-btn" onClick={() => setActiveTab('programs')}>×</button>
          </div>

          <div className="course-panel-content">
            <div className="course-selected-program-header">
              <h4>{selectedProgram.title}</h4>
              <button
                className={`course-favorite-btn ${favorites.includes(selectedProgram.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(selectedProgram)}
              >
                {favorites.includes(selectedProgram.id) ? '★' : '☆'}
              </button>
            </div>

            <div className="course-panel-details">
              <div className="course-detail-row"><span className="course-detail-row-label">Level:</span><span className="course-detail-row-value"><span className="course-badge">{selectedProgram.level}</span></span></div>
              <div className="course-detail-row"><span className="course-detail-row-label">Study Mode:</span><span className="course-detail-row-value">{selectedProgram.studyMode}</span></div>
              <div className="course-detail-row"><span className="course-detail-row-label">Duration:</span><span className="course-detail-row-value">{selectedProgram.duration}</span></div>
              <div className="course-detail-row"><span className="course-detail-row-label">Location:</span><span className="course-detail-row-value">{selectedProgram.locations.join(', ')}</span></div>
              {selectedProgram.tuition && <div className="course-detail-row"><span className="course-detail-row-label">Tuition:</span><span className="course-detail-row-value course-tuition-value">{formatCurrency(selectedProgram.tuition)}</span></div>}
              {selectedProgram.majorArea && selectedProgram.majorArea !== 'General' && <div className="course-detail-row"><span className="course-detail-row-label">Field of Study:</span><span className="course-detail-row-value"><span className="course-major-tag">{selectedProgram.majorArea}</span></span></div>}
              {selectedProgram.startDates?.length > 0 && <div className="course-detail-row"><span className="course-detail-row-label">Start Dates:</span><span className="course-detail-row-value">{selectedProgram.startDates.join(', ')}</span></div>}
              {selectedProgram.applicationDeadline && <div className="course-detail-row"><span className="course-detail-row-label">Deadline:</span><span className="course-detail-row-value course-deadline-value">{selectedProgram.applicationDeadline}</span></div>}
              {selectedProgram.requirements?.length > 0 && (
                <div className="course-detail-section">
                  <span className="course-detail-section-label">Requirements:</span>
                  <ul className="course-requirements-list">{selectedProgram.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
              {selectedProgram.careerPaths?.length > 0 && (
                <div className="course-detail-section">
                  <span className="course-detail-section-label">Career Opportunities:</span>
                  <ul className="course-career-list">{selectedProgram.careerPaths.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>

            <div className="course-panel-actions">
              <button className="course-apply-button" onClick={navigateToApplicationOverview} disabled={savingToBackend}>
                {savingToBackend
                  ? <><span className="course-spinner"></span>Saving...</>
                  : isMasterLevel(selectedProgram, uniIsMasterHint)
                    ? 'Start Master Application →'
                    : 'Start Application →'}
              </button>
              <button className="course-back-to-programs-btn" onClick={() => setActiveTab('programs')}>
                Browse More Programs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;