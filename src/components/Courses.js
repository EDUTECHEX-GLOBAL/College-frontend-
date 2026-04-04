// src/components/Courses.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Courses.css";

const API_URL = process.env.REACT_APP_API_BASE_URL;

const Courses = ({ onCourseSelect }) => {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [university, setUniversity] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMajorArea, setSelectedMajorArea] = useState("All");
  const [selectedStudyMode, setSelectedStudyMode] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [majorAreas, setMajorAreas] = useState([]);
  const [studyModes, setStudyModes] = useState([]);
  const [programLevels, setProgramLevels] = useState([]);
  const [activeTab, setActiveTab] = useState("programs");
  const [savingToBackend, setSavingToBackend] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("title");
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadUniversityData();
    loadFavorites();
  }, [universityId]);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favoritePrograms');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const toggleFavorite = (program) => {
    const programId = program.id;
    let updatedFavorites;
    
    if (favorites.includes(programId)) {
      updatedFavorites = favorites.filter(id => id !== programId);
    } else {
      updatedFavorites = [...favorites, programId];
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('favoritePrograms', JSON.stringify(updatedFavorites));
  };

  const loadUniversityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Loading university data for ID:', universityId);
      
      let universityData = null;
      let selectedCoursesData = [];
      
      if (location.state?.university) {
        universityData = location.state.university;
        console.log('✅ Found university in navigation state:', universityData.INSTNM);
      }
      
      if (location.state?.selectedCourses) {
        selectedCoursesData = location.state.selectedCourses;
        console.log('✅ Found selected courses in navigation state:', selectedCoursesData.length);
      }
      
      if (!universityData) {
        const stored = localStorage.getItem(`university_${universityId}`);
        if (stored) {
          try {
            universityData = JSON.parse(stored);
            console.log(`✅ Found university in localStorage:`, universityData.INSTNM);
          } catch (e) {
            console.error('❌ Error parsing localStorage data:', e);
          }
        }
      }
      
      if (selectedCoursesData.length === 0) {
        const storedCourses = localStorage.getItem(`university_courses_${universityId}`);
        if (storedCourses) {
          try {
            selectedCoursesData = JSON.parse(storedCourses);
            console.log(`✅ Found selected courses in localStorage:`, selectedCoursesData.length);
          } catch (e) {
            console.error('❌ Error parsing stored courses:', e);
          }
        }
      }
      
      if (!universityData) {
        const current = localStorage.getItem('currentUniversity');
        if (current) {
          try {
            const parsed = JSON.parse(current);
            if (parsed.UNITID?.toString() === universityId?.toString()) {
              universityData = parsed;
              console.log('✅ Found university in currentUniversity:', universityData.INSTNM);
            }
          } catch (e) {
            console.error('❌ Error parsing currentUniversity:', e);
          }
        }
      }
      
      setSelectedCourses(selectedCoursesData);
      
      if (universityData) {
        setUniversity(universityData);
        extractProgramsFromUniversity(universityData, selectedCoursesData);
      } else {
        console.log('❌ No university data found, fetching from API...');
        await fetchUniversityFromAPI();
      }
      
    } catch (err) {
      console.error('❌ Error loading university data:', err);
      setError('Failed to load university data. Please go back and try again.');
      setLoading(false);
    }
  };

  const fetchUniversityFromAPI = async () => {
    try {
      console.log('🔍 Fetching university from API with ID:', universityId);
      
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/api/college-search/university/${universityId}`, { headers });
      
      if (response.data.success) {
        const uniData = response.data.data;
        console.log('✅ Found university in college-search API:', uniData.INSTNM);
        setUniversity(uniData);
        extractProgramsFromUniversity(uniData, []);
      } else {
        setError('University not found. Please go back and select a valid university.');
        setLoading(false);
      }
    } catch (apiError) {
      console.error('❌ API Error:', apiError);
      setError('Unable to load university details. Please try again later.');
      setLoading(false);
    }
  };

  const extractProgramsFromUniversity = (uniData, selectedCoursesData = []) => {
    console.log('🔍 Extracting programs from university data:', uniData.INSTNM);
    
    let extractedPrograms = [];
    const debug = {
      hasPrograms: !!uniData.programs,
      programsLength: uniData.programs?.length || 0,
      hasProgramsArray: uniData.programs && Array.isArray(uniData.programs),
      hasMetadata: !!uniData.metadata,
      hasGUS_DATA: !!uniData.GUS_DATA,
      selectedCoursesCount: selectedCoursesData.length
    };
    
    console.log('📊 Debug info:', debug);
    
    if (selectedCoursesData && selectedCoursesData.length > 0) {
      console.log(`📚 Using ${selectedCoursesData.length} selected courses from profile`);
      extractedPrograms = selectedCoursesData;
    } else {
      if (uniData.programs && Array.isArray(uniData.programs) && uniData.programs.length > 0) {
        console.log(`📚 Found ${uniData.programs.length} programs in uniData.programs`);
        extractedPrograms = uniData.programs;
      } else if (uniData.metadata?.programs && Array.isArray(uniData.metadata.programs) && uniData.metadata.programs.length > 0) {
        console.log(`📚 Found ${uniData.metadata.programs.length} programs in metadata.programs`);
        extractedPrograms = uniData.metadata.programs;
      } else if (uniData.GUS_DATA?.programs_data && Array.isArray(uniData.GUS_DATA.programs_data) && uniData.GUS_DATA.programs_data.length > 0) {
        console.log(`📚 Found ${uniData.GUS_DATA.programs_data.length} programs in GUS_DATA.programs_data`);
        extractedPrograms = uniData.GUS_DATA.programs_data;
      } else if (uniData.data?.programs && Array.isArray(uniData.data.programs) && uniData.data.programs.length > 0) {
        console.log(`📚 Found ${uniData.data.programs.length} programs in data.programs`);
        extractedPrograms = uniData.data.programs;
      }
    }
    
    if (extractedPrograms.length > 0) {
      processPrograms(extractedPrograms, uniData);
    } else {
      console.log('⚠️ No programs found in any data source');
      setDebugInfo(debug);
      setPrograms([]);
      setFilteredPrograms([]);
      setLoading(false);
    }
  };

  const processPrograms = (programsData, uniData) => {
    const extractedPrograms = [];
    const areas = new Set();
    const modes = new Set();
    const levels = new Set();

    console.log('🔄 Processing programs data:', programsData.length);

    programsData.forEach((prog, index) => {
      const title = prog.title || prog.program_name || prog.name || 'Program';
      
      let level = prog.level || prog.degree_level || prog.program_level || 'Undergraduate';
      if (typeof level === 'string') {
        level = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
      }
      levels.add(level);
      
      let studyMode = prog.studyMode || prog.delivery_mode || prog.mode || 'On Campus';
      if (prog.studyModes && Array.isArray(prog.studyModes)) {
        studyMode = prog.studyModes.join(' & ');
      }
      modes.add(studyMode);
      
      let locations = [];
      if (prog.locations && Array.isArray(prog.locations)) {
        locations = prog.locations;
      } else if (prog.location) {
        locations = [prog.location];
      } else if (uniData.CITY && uniData.STABBR) {
        locations = [`${uniData.CITY}, ${uniData.STABBR}`];
      } else {
        locations = ['Main Campus'];
      }
      
      const majorArea = prog.majorArea || prog.discipline || prog.field_of_study || 'General';
      if (majorArea !== 'General') areas.add(majorArea);
      
      const duration = prog.duration || getDurationForLevel(level);
      
      const description = prog.description || prog.overview || `${title} program at ${uniData.INSTNM}`;
      
      const tuition = prog.tuition || prog.fees || {};
      const tuitionAmount = tuition.in_state || tuition.out_of_state || tuition.international || tuition.amount || 'Contact for details';

      const program = {
        id: prog.id || prog.programId || prog._id || `prog-${index}-${Date.now()}`,
        title: title,
        level: level,
        studyMode: studyMode,
        locations: locations,
        description: description,
        duration: duration,
        tuition: tuitionAmount,
        majorArea: majorArea,
        campus: prog.campus || 'Main Campus',
        requirements: prog.requirements || prog.admission_requirements || [],
        careerPaths: prog.careerPaths || prog.career_opportunities || [],
        accreditation: prog.accreditation || 'Accredited',
        startDates: prog.startDates || ['Fall', 'Spring'],
        applicationDeadline: prog.applicationDeadline || 'Rolling admission'
      };

      extractedPrograms.push(program);
    });

    console.log(`✅ Processed ${extractedPrograms.length} programs`);
    
    extractedPrograms.sort((a, b) => a.title.localeCompare(b.title));
    
    const areasArray = Array.from(areas).sort();
    const modesArray = Array.from(modes).sort();
    const levelsArray = Array.from(levels).sort();

    setPrograms(extractedPrograms);
    setFilteredPrograms(extractedPrograms);
    setMajorAreas(areasArray);
    setStudyModes(modesArray);
    setProgramLevels(levelsArray);
    setLoading(false);
  };

  const getDurationForLevel = (level) => {
    if (!level) return '3-4 years';
    const levelStr = level.toLowerCase();
    if (levelStr.includes('master') || levelStr.includes('mba')) return '1-2 years';
    if (levelStr.includes('phd') || levelStr.includes('doctorate')) return '3-5 years';
    if (levelStr.includes('bachelor') || levelStr.includes('undergraduate')) return '3-4 years';
    if (levelStr.includes('diploma')) return '1-2 years';
    if (levelStr.includes('certificate')) return '6-12 months';
    return '3-4 years';
  };

  useEffect(() => {
    let filtered = programs;
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(prog => favorites.includes(prog.id));
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prog =>
        prog.title.toLowerCase().includes(term) ||
        (prog.description && prog.description.toLowerCase().includes(term)) ||
        (prog.majorArea && prog.majorArea.toLowerCase().includes(term))
      );
    }
    
    if (selectedMajorArea !== "All") {
      filtered = filtered.filter(prog => prog.majorArea === selectedMajorArea);
    }
    
    if (selectedStudyMode !== "All") {
      filtered = filtered.filter(prog => prog.studyMode === selectedStudyMode);
    }
    
    if (selectedLevel !== "All") {
      filtered = filtered.filter(prog => prog.level === selectedLevel);
    }
    
    if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "duration") {
      filtered.sort((a, b) => (a.duration || "").localeCompare(b.duration || ""));
    } else if (sortBy === "level") {
      filtered.sort((a, b) => (a.level || "").localeCompare(b.level || ""));
    }
    
    setFilteredPrograms(filtered);
  }, [searchTerm, selectedMajorArea, selectedStudyMode, selectedLevel, programs, sortBy, showFavoritesOnly, favorites]);

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setActiveTab('selected');
  };

  const handleApplyNow = (program) => {
    setSelectedProgram(program);
    navigateToApplicationOverview();
  };

  const navigateToApplicationOverview = () => {
    if (!university || !selectedProgram) {
      alert("Please select a program first");
      return;
    }
    
    setSavingToBackend(true);
    
    try {
      const courseData = {
        universityId: university.UNITID || university._id,
        universityName: university.INSTNM,
        programId: selectedProgram.id,
        programName: selectedProgram.title,
        programDetails: {
          studyMode: selectedProgram.studyMode,
          level: selectedProgram.level,
          duration: selectedProgram.duration,
          tuition: selectedProgram.tuition,
          locations: selectedProgram.locations,
          description: selectedProgram.description,
          majorArea: selectedProgram.majorArea,
          requirements: selectedProgram.requirements,
          startDates: selectedProgram.startDates
        },
        selectedAt: new Date().toISOString()
      };
      
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      
      const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';
      
      navigate(`/${studentType}/dashboard/application/overview`, {
        state: {
          fromCoursesPage: true,
          courseData: courseData
        }
      });
      
      if (onCourseSelect) {
        onCourseSelect(courseData);
      }
    } catch (error) {
      console.error("❌ Error saving course:", error);
      alert("An error occurred while saving your course selection.");
    } finally {
      setSavingToBackend(false);
    }
  };

  const handleBackToSearch = () => {
    const isFirstYear = location.pathname.includes('/firstyear/');
    navigate(isFirstYear ? '/firstyear/dashboard/college-search' : '/transfer/dashboard/college-search');
  };

  const getInitials = (name) => {
    if (!name) return "UN";
    return name.split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleRetry = () => {
    setLoading(true);
    setDebugInfo(null);
    if (university) {
      const selectedCoursesData = location.state?.selectedCourses || [];
      extractProgramsFromUniversity(university, selectedCoursesData);
    } else {
      loadUniversityData();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 'Contact for details') return amount;
    if (typeof amount === 'string') return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="courses-loading">
        <div className="loading-spinner"></div>
        <p>Loading university details and programs...</p>
        <p className="loading-subtitle">This may take a few moments</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-error">
        <div className="error-icon">⚠️</div>
        <h3>{error}</h3>
        <p>Please try again or contact support if the problem persists.</p>
        <button onClick={handleBackToSearch} className="back-button">
          ← Back to Search
        </button>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="courses-error">
        <div className="error-icon">❌</div>
        <h3>University not found</h3>
        <p>The university you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleBackToSearch} className="back-button">
          ← Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {/* Header */}
      <div className="courses-header">
        <div className="header-top">
          <button onClick={handleBackToSearch} className="header-back-button">
            <span className="back-arrow">←</span> Back to Search
          </button>
          <div className="header-actions">
            {selectedCourses.length > 0 && (
              <div className="selected-courses-badge">
                <span className="badge-icon">📚</span>
                {selectedCourses.length} Selected {selectedCourses.length === 1 ? 'Course' : 'Courses'}
              </div>
            )}
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="filter-icon">🔍</span>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        <div className="university-header-card">
          <div className="university-header-content">
            <div className="university-logo-wrapper">
              <div className="university-logo-placeholder">
                <div className="university-logo-initials">
                  {getInitials(university.INSTNM)}
                </div>
              </div>
              {university.INSTNM.includes('University') && (
                <div className="university-badge">🏛️ University</div>
              )}
            </div>
            <div className="university-header-info">
              <h1 className="university-title">{university.INSTNM}</h1>
              <div className="university-meta">
                <span className="university-location">
                  <span className="meta-icon">📍</span>
                  {university.CITY || university.location?.city || 'City'}, {university.STABBR || university.location?.state || 'State'}
                </span>
                <span className="meta-separator">•</span>
                <span className="university-country">
                  <span className="meta-icon">🌎</span>
                  {university.COUNTRY || university.location?.country || 'USA'}
                </span>
                {university.website && (
                  <>
                    <span className="meta-separator">•</span>
                    <a href={university.website} target="_blank" rel="noopener noreferrer" className="university-website">
                      <span className="meta-icon">🔗</span>
                      Visit Website
                    </a>
                  </>
                )}
              </div>
              
              <div className="university-stats">
                <div className="stat-item">
                  <span className="stat-value">{programs.length}</span>
                  <span className="stat-label">Programmes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{majorAreas.length}</span>
                  <span className="stat-label">Fields of Study</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{studyModes.length}</span>
                  <span className="stat-label">Study Modes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{programLevels.length}</span>
                  <span className="stat-label">Degree Levels</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info - Only show if no programs */}
      {programs.length === 0 && debugInfo && (
        <div className="debug-info">
          <div className="debug-header">
            <span className="debug-icon">🔧</span>
            <h4>Debug Information - No Programs Found</h4>
          </div>
          <div className="debug-content">
            <p><strong>University:</strong> {university.INSTNM}</p>
            <p><strong>Debug Info:</strong></p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            <p className="debug-note">
              <strong>Note:</strong> This university has no programs in the database. 
              Showing selected courses from your profile instead.
            </p>
            <button onClick={handleRetry} className="debug-retry-btn">
              🔄 Retry Loading Programs
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="courses-content">
        {/* Sidebar with Search and Filters */}
        {programs.length > 0 && showFilters && (
          <div className="courses-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <h3 className="sidebar-title">
                  <span className="sidebar-icon">🔍</span>
                  Search & Filter
                </h3>
                <div className="results-count">
                  {filteredPrograms.length} of {programs.length} programs
                </div>
              </div>
              
              <div className="sidebar-search">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by program name, field, or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="filters-section">
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-icon">📚</span>
                    FIELD OF STUDY
                  </label>
                  <select 
                    value={selectedMajorArea}
                    onChange={(e) => setSelectedMajorArea(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Fields</option>
                    {majorAreas.map((area, index) => (
                      <option key={index} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-icon">🎓</span>
                    DEGREE LEVEL
                  </label>
                  <select 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Levels</option>
                    {programLevels.map((level, index) => (
                      <option key={index} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-icon">💻</span>
                    STUDY MODE
                  </label>
                  <select 
                    value={selectedStudyMode}
                    onChange={(e) => setSelectedStudyMode(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">All Modes</option>
                    {studyModes.map((mode, index) => (
                      <option key={index} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">
                    <span className="filter-icon">📊</span>
                    SORT BY
                  </label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-select"
                  >
                    <option value="title">Program Name</option>
                    <option value="level">Degree Level</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label checkbox-label">
                    <input
                      type="checkbox"
                      checked={showFavoritesOnly}
                      onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    />
                    <span className="checkbox-text">Show favorites only</span>
                  </label>
                </div>
                
                {(searchTerm || selectedMajorArea !== "All" || selectedStudyMode !== "All" || selectedLevel !== "All" || showFavoritesOnly) && (
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedMajorArea("All");
                      setSelectedStudyMode("All");
                      setSelectedLevel("All");
                      setShowFavoritesOnly(false);
                      setSortBy("title");
                    }}
                  >
                    <span className="reset-icon">↺</span>
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Programs Grid */}
        <div className={`programs-content ${!showFilters ? 'full-width' : ''}`}>
          {programs.length === 0 ? (
            <div className="no-programs-found">
              <div className="no-programs-icon">📚</div>
              <h3>No Programs Available in Database</h3>
              <p>This university doesn't have programs in the database yet.</p>
              <p className="no-programs-subtitle">
                You can still view your selected courses from your profile.
              </p>
              {selectedCourses.length > 0 && (
                <div className="selected-courses-section">
                  <h4>Your Selected Courses ({selectedCourses.length})</h4>
                  <div className="selected-courses-grid">
                    {selectedCourses.map((course, idx) => (
                      <div key={idx} className="selected-course-card">
                        <div className="course-card-header">
                          <h5>{course.title || course.program_name}</h5>
                          <button 
                            className={`favorite-btn ${favorites.includes(course.id) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(course)}
                            aria-label={favorites.includes(course.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            {favorites.includes(course.id) ? '🔵' : '⚪'}
                          </button>
                        </div>
                        <div className="course-details">
                          {course.level && (
                            <div className="course-detail">
                              <span className="detail-label">Level:</span>
                              <span className="detail-value">{course.level}</span>
                            </div>
                          )}
                          {course.studyMode && (
                            <div className="course-detail">
                              <span className="detail-label">Mode:</span>
                              <span className="detail-value">{course.studyMode}</span>
                            </div>
                          )}
                          {course.duration && (
                            <div className="course-detail">
                              <span className="detail-label">Duration:</span>
                              <span className="detail-value">{course.duration}</span>
                            </div>
                          )}
                        </div>
                        <button 
                          className="select-program-btn"
                          onClick={() => handleProgramSelect(course)}
                        >
                          Select Program
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={handleBackToSearch} className="back-button">
                ← Back to Search
              </button>
            </div>
          ) : filteredPrograms.length > 0 ? (
            <>
              <div className="programs-header">
                <h2 className="programs-title">
                  Available Programs
                  <span className="programs-count">({filteredPrograms.length})</span>
                </h2>
                {!showFilters && (
                  <button 
                    className="show-filters-btn"
                    onClick={() => setShowFilters(true)}
                  >
                    <span className="filter-icon">🔍</span>
                    Show Filters
                  </button>
                )}
              </div>
              <div className="programs-grid">
                {filteredPrograms.map((program) => (
                  <div
                    key={program.id}
                    className={`program-card ${selectedProgram?.id === program.id ? 'selected' : ''}`}
                    onClick={() => handleProgramSelect(program)}
                  >
                    <div className="program-card-header">
                      <h3 className="program-card-title">{program.title}</h3>
                      <button 
                        className={`favorite-btn ${favorites.includes(program.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(program);
                        }}
                        aria-label={favorites.includes(program.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {favorites.includes(program.id) ? '🔵' : '⚪'}
                      </button>
                    </div>
                    
                    <div className="program-card-body">
                      <div className="program-meta-tags">
                        <span className="study-mode-badge">
                          <span className="badge-icon">💻</span>
                          {program.studyMode}
                        </span>
                        <span className="program-level-badge">
                          <span className="badge-icon">🎓</span>
                          {program.level}
                        </span>
                      </div>
                      
                      <div className="program-locations">
                        <span className="location-icon">📍</span>
                        <span className="locations-text">
                          {program.locations.join(' • ')}
                        </span>
                      </div>
                      
                      <div className="program-details-grid">
                        {program.duration && (
                          <div className="program-detail-item">
                            <span className="detail-icon">⏱️</span>
                            <div className="detail-content">
                              <span className="detail-label">Duration</span>
                              <span className="detail-value">{program.duration}</span>
                            </div>
                          </div>
                        )}
                        
                        {program.tuition && (
                          <div className="program-detail-item">
                            <span className="detail-icon">💰</span>
                            <div className="detail-content">
                              <span className="detail-label">Tuition</span>
                              <span className="detail-value">{formatCurrency(program.tuition)}</span>
                            </div>
                          </div>
                        )}
                        
                        {program.startDates && program.startDates.length > 0 && (
                          <div className="program-detail-item">
                            <span className="detail-icon">📅</span>
                            <div className="detail-content">
                              <span className="detail-label">Start Dates</span>
                              <span className="detail-value">{program.startDates.join(', ')}</span>
                            </div>
                          </div>
                        )}
                        
                        {program.applicationDeadline && (
                          <div className="program-detail-item">
                            <span className="detail-icon">⏰</span>
                            <div className="detail-content">
                              <span className="detail-label">Deadline</span>
                              <span className="detail-value">{program.applicationDeadline}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {program.majorArea && program.majorArea !== 'General' && (
                        <div className="program-major-area">
                          <span className="major-area-tag">
                            <span className="tag-icon">📚</span>
                            {program.majorArea}
                          </span>
                        </div>
                      )}
                      
                      {program.description && (
                        <p className="program-description">
                          {program.description.length > 120 
                            ? `${program.description.substring(0, 120)}...` 
                            : program.description}
                        </p>
                      )}
                      
                      {program.requirements && program.requirements.length > 0 && (
                        <div className="program-requirements">
                          <span className="requirements-label">Requirements:</span>
                          <span className="requirements-text">
                            {program.requirements.slice(0, 2).join(' • ')}
                            {program.requirements.length > 2 && ' ...'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="program-card-footer">
                      <button 
                        className="select-program-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgramSelect(program);
                        }}
                      >
                        {selectedProgram?.id === program.id ? (
                          <>
                            <span className="btn-icon">✓</span>
                            Selected
                          </>
                        ) : (
                          'Select Program'
                        )}
                      </button>
                      <button 
                        className="apply-now-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyNow(program);
                        }}
                      >
                        <span className="btn-icon">→</span>
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-programs-found">
              <div className="no-programs-icon">🔍</div>
              <h3>No Programs Match Your Filters</h3>
              <p>Try adjusting your search criteria or filters to find more programs.</p>
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedMajorArea("All");
                  setSelectedStudyMode("All");
                  setSelectedLevel("All");
                  setShowFavoritesOnly(false);
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Program Details Panel */}
      {selectedProgram && activeTab === 'selected' && (
        <div className="selected-program-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-icon">📋</span>
              <h3>Selected Program</h3>
            </div>
            <button className="close-panel-btn" onClick={() => setActiveTab('programs')}>
              ×
            </button>
          </div>
          
          <div className="panel-content">
            <div className="selected-program-header">
              <h4>{selectedProgram.title}</h4>
              <button 
                className={`favorite-btn ${favorites.includes(selectedProgram.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(selectedProgram)}
                aria-label={favorites.includes(selectedProgram.id) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(selectedProgram.id) ? '🔵' : '⚪'}
              </button>
            </div>
            
            <div className="panel-details">
              <div className="detail-row">
                <span className="detail-row-label">Level:</span>
                <span className="detail-row-value">
                  <span className="badge">{selectedProgram.level}</span>
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-row-label">Study Mode:</span>
                <span className="detail-row-value">{selectedProgram.studyMode}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-row-label">Duration:</span>
                <span className="detail-row-value">{selectedProgram.duration}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-row-label">Location:</span>
                <span className="detail-row-value">{selectedProgram.locations.join(', ')}</span>
              </div>
              
              {selectedProgram.tuition && (
                <div className="detail-row">
                  <span className="detail-row-label">Tuition:</span>
                  <span className="detail-row-value tuition-value">
                    {formatCurrency(selectedProgram.tuition)}
                  </span>
                </div>
              )}
              
              {selectedProgram.majorArea && selectedProgram.majorArea !== 'General' && (
                <div className="detail-row">
                  <span className="detail-row-label">Field of Study:</span>
                  <span className="detail-row-value">
                    <span className="major-tag">{selectedProgram.majorArea}</span>
                  </span>
                </div>
              )}
              
              {selectedProgram.startDates && selectedProgram.startDates.length > 0 && (
                <div className="detail-row">
                  <span className="detail-row-label">Start Dates:</span>
                  <span className="detail-row-value">{selectedProgram.startDates.join(', ')}</span>
                </div>
              )}
              
              {selectedProgram.applicationDeadline && (
                <div className="detail-row">
                  <span className="detail-row-label">Deadline:</span>
                  <span className="detail-row-value deadline-value">
                    {selectedProgram.applicationDeadline}
                  </span>
                </div>
              )}
              
              {selectedProgram.requirements && selectedProgram.requirements.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-label">Requirements:</span>
                  <ul className="requirements-list">
                    {selectedProgram.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedProgram.careerPaths && selectedProgram.careerPaths.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-label">Career Opportunities:</span>
                  <ul className="career-list">
                    {selectedProgram.careerPaths.map((career, idx) => (
                      <li key={idx}>{career}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="panel-actions">
              <button 
                className="apply-button"
                onClick={navigateToApplicationOverview}
                disabled={savingToBackend}
              >
                {savingToBackend ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📝</span>
                    Start Application
                  </>
                )}
              </button>
              
              <button 
                className="back-to-programs-btn"
                onClick={() => setActiveTab('programs')}
              >
                ← Browse More Programs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;