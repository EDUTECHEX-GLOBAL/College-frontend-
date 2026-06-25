// src/components/Courses.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // ✅ replaced axios
import "./Courses.css";

// ✅ Removed API_URL - axiosInstance already has baseURL

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

const UNDERGRAD_TITLE_REGEX = /\b(ba|b\.a\.|bsc|b\.sc\.|bs|b\.s\.|beng|b\.eng\.|btech|b\.tech\.|bfa|b\.f\.a\.|bmus|b\.mus\.|bba|b\.b\.a\.|bcom|b\.com\.|bachelor)\b/i;
const MASTER_TITLE_REGEX = /\b(mba|m\.b\.a\.|ma|m\.a\.|ms|m\.s\.|msc|m\.sc\.|mtech|m\.tech\.|master|m\.eng\.|meng|llm|mfa|mph)\b/i;

const formatProgramLevel = (value = '') => {
  const level = value.toString().trim();
  if (!level) return '';
  const normalized = level.toLowerCase();
  if (['master', 'masters', 'graduate'].includes(normalized)) return normalized === 'graduate' ? 'Graduate' : 'Master';
  if (['bachelor', 'bachelors', 'undergraduate'].includes(normalized)) return 'Undergraduate';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
};

const isMasterLevel = (program = {}) => {
  const explicitLevel = (
    program.level ||
    program.degree_level ||
    program.program_level ||
    ''
  ).toString().trim().toLowerCase();
  const title = program.title || program.program_name || program.name || '';

  if (UNDERGRAD_TITLE_REGEX.test(title)) return false;
  if (['bachelor', 'bachelors', 'undergraduate'].includes(explicitLevel)) return false;
  if (['master', 'masters', 'graduate'].includes(explicitLevel)) return true;
  if (MASTER_TITLE_REGEX.test(title)) return true;
  return false;
};

const isUndergraduateLevel = (program = {}) => {
  const explicitLevel = (
    program.level ||
    program.degree_level ||
    program.program_level ||
    ''
  ).toString().trim().toLowerCase();
  const title = program.title || program.program_name || program.name || '';

  if (UNDERGRAD_TITLE_REGEX.test(title)) return true;
  if (['bachelor', 'bachelors', 'undergraduate'].includes(explicitLevel)) return true;
  if (['master', 'masters', 'graduate'].includes(explicitLevel)) return false;
  if (MASTER_TITLE_REGEX.test(title)) return false;
  return false;
};

const getCourseLevelFlags = (course = {}) => {
  const levelText = [
    course.level,
    course.degree,
    course.educationLevel,
    course.programType,
    course.title,
  ].filter(Boolean).join(" ").toLowerCase();

  const masterLevelRegex =
    /\b(master|masters|postgraduate|post-graduate|pg|msc|m\.sc\.|ms|m\.s\.|ma|m\.a\.|mba|m\.b\.a\.|meng|m\.eng\.|mtech|m\.tech\.|llm|mfa|mph)\b/i;
  const bachelorLevelRegex =
    /\b(bachelor|bachelors|undergraduate|ug|ba|b\.a\.|bs|b\.s\.|bsc|b\.sc\.|beng|b\.eng\.|bba|b\.b\.a\.|bcom|b\.com\.|btech|b\.tech\.|llb)\b/i;

  const isMasterCourse =
    masterLevelRegex.test(levelText);

  const isBachelorCourse =
    bachelorLevelRegex.test(levelText);

  return { isMasterCourse, isBachelorCourse };
};

const getSelectedStudentLevel = (profile = {}) => {
  const selectedProgramType = profile?.programType;
  const selectedEligibleProgram = profile?.eligibleProgram;

  if (selectedProgramType === 'PG' || selectedEligibleProgram === 'Master') return 'PG';
  if (selectedProgramType === 'UG' || selectedEligibleProgram === 'Bachelor') return 'UG';
  return '';
};

const slug = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'program';

const Courses = ({ onCourseSelect }) => {
  const { universityId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const studentType = location.pathname.includes('/transfer/') ? 'transfer' : 'firstyear';

  const resolveIsMasterUniversity = () => {
    if (location.state?.isMasterUniversity === true) return true;
    const stateUni = location.state?.university;
    if (stateUni) {
      if (stateUni.universityType === 'master')         return true;
      if (stateUni.type           === 'master')         return true;
      if (stateUni.isMaster       === true)             return true;
      if (containsMasterKeyword(stateUni.INSTNM || '')) return true;
      if (stateUni.programs?.some(p =>
        containsMasterKeyword(p.title || '') ||
        containsMasterKeyword(p.level || '')
      )) return true;
    }
    try {
      const keys = [`university_${universityId}`, 'currentUniversity'];
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

  const uniIsMasterHint = resolveIsMasterUniversity();

  const [university,        setUniversity]        = useState(null);
  const [programs,          setPrograms]          = useState([]);
  const [filteredPrograms,  setFilteredPrograms]  = useState([]);
  const [selectedProgram,   setSelectedProgram]   = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [selectedMajorArea, setSelectedMajorArea] = useState("All");
  const [selectedStudyMode, setSelectedStudyMode] = useState("All");
  const [selectedLevel,     setSelectedLevel]     = useState("All");
  const [majorAreas,        setMajorAreas]        = useState([]);
  const [studyModes,        setStudyModes]        = useState([]);
  const [programLevels,     setProgramLevels]     = useState([]);
  const [activeTab,         setActiveTab]         = useState("programs");
  const [savingToBackend,   setSavingToBackend]   = useState(false);
  const [debugInfo,         setDebugInfo]         = useState(null);
  const [selectedCourses,   setSelectedCourses]   = useState([]);
  const [showFilters,       setShowFilters]       = useState(false);
  const [sortBy,            setSortBy]            = useState("title");
  const [favorites,         setFavorites]         = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [studentProfile,    setStudentProfile]    = useState(null);
  const [openFilterPicker,  setOpenFilterPicker]  = useState(null);

  const selectedProgramType = studentProfile?.programType;
  const selectedEligibleProgram = studentProfile?.eligibleProgram;
  const pageMode =
    selectedEligibleProgram === 'Master' || selectedProgramType === 'PG'
      ? 'PG'
      : 'UG';
  const pageIsMaster = pageMode === 'PG';
  const getProgramIsMasterForStudent = (program, profile = studentProfile) => {
    const selectedLevel = getSelectedStudentLevel(profile);
    if (selectedLevel === 'PG') return true;
    if (selectedLevel === 'UG') return false;
    if (profile === studentProfile && studentProfile) return pageIsMaster;
    return isMasterLevel(program) || uniIsMasterHint;
  };

  const sortOptions = [
    { value: "title", label: "Program Name" },
    { value: "level", label: "Degree Level" },
    { value: "duration", label: "Duration" },
  ];

  const renderFilterPicker = ({ id, value, options, placeholder, onChange }) => {
    const isOpen = openFilterPicker === id;
    const selectedLabel = options.find(option => option.value === value)?.label || placeholder;

    return (
      <div
        className="course-compact-select"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setOpenFilterPicker(null);
          }
        }}
      >
        <button
          type="button"
          id={id}
          className="course-compact-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setOpenFilterPicker(isOpen ? null : id)}
        >
          <span>{selectedLabel}</span>
          <span className="course-compact-select-arrow">▾</span>
        </button>

        {isOpen && (
          <div className="course-compact-select-list" role="listbox" aria-labelledby={id}>
            {options.map(option => (
              <button
                type="button"
                key={option.value}
                className={`course-compact-select-option ${value === option.value ? "selected" : ""}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpenFilterPicker(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

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

  const fetchStudentProfile = async () => {
    try {
      const response = await axiosInstance.get('/api/user/profile');
      if (response.data?.success && response.data?.data) {
        setStudentProfile(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching profile:', error);
      }
    }
    return null;
  };

  const loadUniversityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await fetchStudentProfile();

      let universityData      = null;
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
        extractProgramsFromUniversity(universityData, selectedCoursesData, profile);
      } else {
        await fetchUniversityFromAPI(profile);
      }
    } catch (err) {
      setError('Failed to load university data. Please go back and try again.');
      setLoading(false);
    }
  };

  // ✅ Fixed - using axiosInstance, no manual token/headers needed
  const fetchUniversityFromAPI = async (profile = studentProfile) => {
    try {
      const response = await axiosInstance.get(
        `/api/college-search/university/${universityId}`
      );
      if (response.data.success) {
        const uniData = response.data.data;
        setUniversity(uniData);
        extractProgramsFromUniversity(uniData, [], profile);
      } else {
        setError('University not found.');
        setLoading(false);
      }
    } catch {
      setError('Unable to load university details. Please try again later.');
      setLoading(false);
    }
  };

  const extractProgramsFromUniversity = (uniData, selectedCoursesData = [], profile = studentProfile) => {
    let extractedPrograms = [];

    if (selectedCoursesData?.length > 0)                  extractedPrograms = selectedCoursesData;
    else if (uniData.programs?.length > 0)                extractedPrograms = uniData.programs;
    else if (uniData.metadata?.programs?.length > 0)      extractedPrograms = uniData.metadata.programs;
    else if (uniData.GUS_DATA?.programs_data?.length > 0) extractedPrograms = uniData.GUS_DATA.programs_data;
    else if (uniData.data?.programs?.length > 0)          extractedPrograms = uniData.data.programs;

    if (extractedPrograms.length > 0) {
      processPrograms(extractedPrograms, uniData, profile);
    } else {
      setDebugInfo({
        hasPrograms:    !!uniData.programs,
        programsLength: uniData.programs?.length || 0,
        isMasterHint:   uniIsMasterHint
      });
      setPrograms([]);
      setFilteredPrograms([]);
      setLoading(false);
    }
  };

  const processPrograms = (programsData, uniData, profile = studentProfile) => {
    const extractedPrograms = [];
    const areas  = new Set();
    const modes  = new Set();
    const levels = new Set();
    const selectedLevel = getSelectedStudentLevel(profile);
    const isProfileUG = selectedLevel === 'UG';
    const isProfilePG = selectedLevel === 'PG';

    programsData.forEach((prog, index) => {
      const title = prog.title || prog.program_name || prog.name || 'Program';
      const programForLevel = { ...prog, title };

      if (isProfileUG && !isUndergraduateLevel(programForLevel)) return;
      if (isProfilePG && !isMasterLevel(programForLevel)) return;

      let level = formatProgramLevel(prog.level || prog.degree_level || prog.program_level) || 'Undergraduate';
      if (isProfileUG) {
        level = 'Undergraduate';
      } else if (isProfilePG) {
        level = 'Master';
      } else if (isMasterLevel({ ...prog, title, level })) {
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
        programId:           prog.programId || prog.id || prog._id || '',
        title,
        level,
        degree:              prog.degree || prog.degree_level || prog.program_level || level,
        educationLevel:      prog.educationLevel || prog.level || level,
        programType:         prog.programType || (level.toLowerCase().includes('master') ? 'PG' : 'UG'),
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
        p.title.toLowerCase().includes(term)        ||
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

  const buildCourseData = (program) => {
    const universityId = university?.UNITID || university?._id || university?.id || '';
    const universityName =
      university?.INSTNM ||
      university?.universityName ||
      university?.name ||
      'Unknown University';
    const courseId = program.courseId || program.programId || program.id || '';
    const courseTitle = program.title || program.name || program.program_name || 'Program';
    const level = program.level || program.educationLevel || '';
    const degree = program.degree || program.degree_level || program.program_level || level;
    const majorArea = program.majorArea || program.major_area || program.discipline || program.field_of_study || 'General';
    const selectedCourse = {
      ...program,
      id: courseId,
      courseId,
      title: courseTitle,
      name: program.name || courseTitle,
      program_name: program.program_name || courseTitle,
      level,
      degree,
      majorArea,
    };

    return {
      universityId,
      universityName,
      courseId,
      courseTitle,
      programId: courseId,
      programName: courseTitle,
      selectedCourse,
      programDetails: {
        ...program,
        studyMode:    program.studyMode,
        level,
        degree,
        duration:     program.duration,
        tuition:      program.tuition,
        locations:    program.locations,
        description:  program.description,
        majorArea,
        requirements: program.requirements,
        startDates:   program.startDates,
      },
      level,
      degree,
      majorArea,
      selectedAt: new Date().toISOString(),
    };
  };

  const buildMasterOverviewCourse = (selectedCourse = {}, selectedUniversity = {}) => ({
    preferredCourse:
      selectedCourse.title ||
      selectedCourse.name ||
      selectedCourse.program_name ||
      selectedCourse.programName ||
      '',
    universityName:
      selectedCourse.universityName ||
      selectedUniversity.universityName ||
      selectedUniversity.university ||
      selectedUniversity.name ||
      selectedUniversity.INSTNM ||
      '',
    level:
      selectedCourse.level ||
      selectedCourse.educationLevel ||
      'Postgraduate',
    modeOfStudy:
      selectedCourse.studyMode ||
      selectedCourse.modeOfStudy ||
      selectedCourse.study_mode ||
      'On Campus',
    duration: selectedCourse.duration || '',
    majorArea:
      selectedCourse.majorArea ||
      selectedCourse.major_area ||
      selectedCourse.category ||
      '',
    intake: selectedCourse.intake || '',
  });

  const buildSelectedCoursePayload = (program, uniId, isMaster) => {
    const title = program.title || program.name || program.program_name || 'Program';
    const universityName =
      university?.INSTNM ||
      university?.universityName ||
      university?.name ||
      'Unknown University';
    const fallbackLocation = [
      university?.CITY || university?.location?.city,
      university?.STABBR || university?.location?.state,
      university?.COUNTRY || university?.location?.country || 'USA'
    ].filter(Boolean).join(', ');

    return {
      title,
      programId:
        program.programId ||
        program.id ||
        `${uniId}-${slug(title)}`,
      universityId: String(uniId),
      universityName,
      universityUnitId: String(uniId),
      description:
        program.description ||
        `${title} program at ${universityName}`,
      level: isMaster ? 'Postgraduate' : 'Undergraduate',
      studyMode: program.studyMode || 'On Campus',
      duration: program.duration || (isMaster ? '1-2 years' : '3-4 years'),
      locations:
        Array.isArray(program.locations) && program.locations.length
          ? program.locations
          : [fallbackLocation || 'Main Campus'],
      campus: program.campus || 'Main Campus',
      fees: {
        amount: 0,
        currency: 'USD',
        period: 'per year',
        displayText: 'Contact university for fee details',
        additionalFees: [],
        scholarshipAvailable: false,
        financialAidAvailable: false
      },
      requirements: {
        description: isMaster
          ? 'Bachelor degree or equivalent'
          : 'High school diploma or equivalent',
        academic: [],
        language: [],
        documents: [],
        entranceExam: {
          required: false,
          exams: []
        },
        workExperience: {
          required: false
        }
      },
      majorArea: program.majorArea || program.major_area || 'General',
      isActive: true,
      isAvailableForInternational: true
    };
  };

const handleApplyNow = async (program) => {
  if (!university || !program) { alert("Please select a program first"); return; }

  setSavingToBackend(true);
  try {
    const courseData = buildCourseData(program);
    const { isMasterCourse, isBachelorCourse } = getCourseLevelFlags(program);
    const profileLevel = getSelectedStudentLevel(studentProfile);
    const isMaster =
      profileLevel === 'UG'
        ? false
        : profileLevel === 'PG'
          ? true
          : isMasterCourse ? true : isBachelorCourse ? false : getProgramIsMasterForStudent(program);

    // ✅ NEW: Save selected course to backend
    const uniId = university?.UNITID || university?._id || university?.id;
    if (uniId) {
      try {
        await axiosInstance.put(`/api/colleges/${uniId}/courses`, {
          selectedCourses: [{
            id:           program.id,
            title:        program.title,
            name:         program.title,
            program_name: program.title,
            level:        program.level,
            studyMode:    program.studyMode,
            duration:     program.duration,
            locations:    program.locations,
            majorArea:    program.majorArea,
            description:  program.description,
          }],
          collegeData: {
            UNITID:  String(uniId),
            INSTNM:  university.INSTNM  || '',
            CITY:    university.CITY    || university.location?.city    || '',
            STABBR:  university.STABBR  || university.location?.state   || '',
            COUNTRY: university.COUNTRY || university.location?.country || 'USA',
          }
        });
        console.log('✅ Course saved to backend');
      } catch (saveErr) {
        console.error('⚠️ Course save failed (non-fatal):', saveErr.message);
        // Non-fatal — continues to navigate even if save fails
      }
    }

    // ✅ Existing code below — unchanged
    if (uniId) {
      try {
        const coursePayload = buildSelectedCoursePayload(program, uniId, isMaster);
        await axiosInstance.post('/api/courses/ensure-selected', coursePayload);
        console.log('Selected course ensured in Course catalog');

        if (isMaster) {
          const overviewCourse = buildMasterOverviewCourse(program, university);
          const overviewPayload = { course: overviewCourse };
          localStorage.setItem('masterSelectedCourse', JSON.stringify(overviewCourse));
          await axiosInstance.post('/api/master-overview/save', overviewPayload);
          console.log('Master overview course saved');
        }
      } catch (ensureErr) {
        console.error('Course catalog ensure failed (non-fatal):', ensureErr.message);
      }
    }

    const applicationPath = isMaster
      ? '/firstyear/dashboard/master-application/overview'
      : '/firstyear/dashboard/application/overview';

    console.log('Courses handleApplyNow studentProfile:', studentProfile);
    console.log('Courses handleApplyNow program.title:', program.title);
    console.log('Courses handleApplyNow profileLevel:', profileLevel);
    console.log('Courses handleApplyNow isMasterCourse:', isMasterCourse);
    console.log('Courses handleApplyNow isBachelorCourse:', isBachelorCourse);
    console.log('Courses handleApplyNow final isMaster:', isMaster);
    console.log('Courses handleApplyNow applicationPath:', applicationPath);

    if (isMaster) {
      const overviewCourse = buildMasterOverviewCourse(program, university);
      localStorage.setItem('masterSelectedCourse', JSON.stringify(overviewCourse));
      localStorage.setItem('selectedMasterCourseForApplication', JSON.stringify(courseData));
      localStorage.setItem('unlockedApplicationType', 'master');
      localStorage.removeItem('masterCourseConfirmed');
      localStorage.removeItem('selectedCourseForApplication');
      localStorage.removeItem('currentSelectedCourse');
    } else {
      localStorage.setItem('selectedCourseForApplication', JSON.stringify(courseData));
      localStorage.setItem('currentSelectedCourse', JSON.stringify(courseData));
      localStorage.setItem('unlockedApplicationType', 'bachelor');
      localStorage.removeItem('selectedMasterCourseForApplication');
      localStorage.removeItem('masterCourseConfirmed');
      localStorage.removeItem('masterSelectedCourse');
    }

    window.dispatchEvent(new Event("applicationUpdated"));
    window.dispatchEvent(new Event("masterApplicationUpdated"));
    window.dispatchEvent(new Event("storage"));

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
    if (university) extractProgramsFromUniversity(university, location.state?.selectedCourses || [], studentProfile);
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

      <div className="course-header">
        <div className="course-header-top">
          <button onClick={handleBackToSearch} className="course-header-back-button">Back to Search</button>
          <div className="course-header-actions">
            {selectedCourses.length > 0 && (
              <div className="course-selected-badge">
                {selectedCourses.length} Selected {selectedCourses.length === 1 ? 'Course' : 'Courses'}
              </div>
            )}
            <span className={`course-uni-type-badge ${pageIsMaster ? 'course-uni-type-badge--master' : 'course-uni-type-badge--bachelor'}`}>
              {pageIsMaster ? 'Master University' : 'Bachelor University'}
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
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="course-search-input"
                  />
                  {searchTerm && (
                    <button className="course-clear-search-btn" onClick={() => setSearchTerm("")} aria-label="Clear search">×</button>
                  )}
                </div>
              </div>
              <div className="course-filters-section">
                <div className="course-filter-group">
                  <label className="course-filter-label">FIELD OF STUDY</label>
                  {renderFilterPicker({
                    id: "course-major-filter",
                    value: selectedMajorArea,
                    placeholder: "All Fields",
                    options: [
                      { value: "All", label: "All Fields" },
                      ...majorAreas.map(area => ({ value: area, label: area })),
                    ],
                    onChange: setSelectedMajorArea,
                  })}
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label">DEGREE LEVEL</label>
                  {renderFilterPicker({
                    id: "course-level-filter",
                    value: selectedLevel,
                    placeholder: "All Levels",
                    options: [
                      { value: "All", label: "All Levels" },
                      ...programLevels.map(level => ({ value: level, label: level })),
                    ],
                    onChange: setSelectedLevel,
                  })}
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label">STUDY MODE</label>
                  {renderFilterPicker({
                    id: "course-study-mode-filter",
                    value: selectedStudyMode,
                    placeholder: "All Modes",
                    options: [
                      { value: "All", label: "All Modes" },
                      ...studyModes.map(mode => ({ value: mode, label: mode })),
                    ],
                    onChange: setSelectedStudyMode,
                  })}
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label">SORT BY</label>
                  {renderFilterPicker({
                    id: "course-sort-filter",
                    value: sortBy,
                    placeholder: "Program Name",
                    options: sortOptions,
                    onChange: setSortBy,
                  })}
                </div>
                <div className="course-filter-group">
                  <label className="course-filter-label checkbox-label">
                    <input
                      type="checkbox"
                      checked={showFavoritesOnly}
                      onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    />
                    <span className="course-checkbox-text">Show favorites only</span>
                  </label>
                </div>
                {(searchTerm || selectedMajorArea !== "All" || selectedStudyMode !== "All" || selectedLevel !== "All" || showFavoritesOnly) && (
                  <button
                    className="course-reset-filters-btn"
                    onClick={() => {
                      setSearchTerm(""); setSelectedMajorArea("All");
                      setSelectedStudyMode("All"); setSelectedLevel("All");
                      setShowFavoritesOnly(false); setSortBy("title");
                    }}
                  >
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
              <div className={`course-programs-grid ${filteredPrograms.length === 1 ? 'single-program' : ''}`}>
                {filteredPrograms.map((program) => {
                  const isMaster = getProgramIsMasterForStudent(program);
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
                          {program.duration && (
                            <div className="course-program-detail-item">
                              <div className="course-detail-content">
                                <span className="course-detail-label">Duration</span>
                                <span className="course-detail-value">{program.duration}</span>
                              </div>
                            </div>
                          )}
                          {program.tuition && (
                            <div className="course-program-detail-item">
                              <div className="course-detail-content">
                                <span className="course-detail-label">Tuition</span>
                                <span className="course-detail-value">{formatCurrency(program.tuition)}</span>
                              </div>
                            </div>
                          )}
                          {program.startDates?.length > 0 && (
                            <div className="course-program-detail-item">
                              <div className="course-detail-content">
                                <span className="course-detail-label">Start Dates</span>
                                <span className="course-detail-value">{program.startDates.join(', ')}</span>
                              </div>
                            </div>
                          )}
                          {program.applicationDeadline && (
                            <div className="course-program-detail-item">
                              <div className="course-detail-content">
                                <span className="course-detail-label">Deadline</span>
                                <span className="course-detail-value">{program.applicationDeadline}</span>
                              </div>
                            </div>
                          )}
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
              <button
                className="course-reset-filters-btn"
                onClick={() => {
                  setSearchTerm(""); setSelectedMajorArea("All");
                  setSelectedStudyMode("All"); setSelectedLevel("All");
                  setShowFavoritesOnly(false);
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedProgram && activeTab === 'selected' && (() => {
        const panelIsMaster = getProgramIsMasterForStudent(selectedProgram);
        return (
          <div className="course-selected-panel">
            <div className="course-panel-header">
              <div className="course-panel-title">
                <h3>Selected Program</h3>
                <span className={`course-panel-app-type ${panelIsMaster ? 'course-panel-app-type--master' : 'course-panel-app-type--bachelor'}`}>
                  → {panelIsMaster ? 'Master Application' : 'Bachelor Application'}
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
                <div className="course-detail-row">
                  <span className="course-detail-row-label">Level:</span>
                  <span className="course-detail-row-value"><span className="course-badge">{selectedProgram.level}</span></span>
                </div>
                <div className="course-detail-row">
                  <span className="course-detail-row-label">Study Mode:</span>
                  <span className="course-detail-row-value">{selectedProgram.studyMode}</span>
                </div>
                <div className="course-detail-row">
                  <span className="course-detail-row-label">Duration:</span>
                  <span className="course-detail-row-value">{selectedProgram.duration}</span>
                </div>
                <div className="course-detail-row">
                  <span className="course-detail-row-label">Location:</span>
                  <span className="course-detail-row-value">{selectedProgram.locations.join(', ')}</span>
                </div>
                {selectedProgram.tuition && (
                  <div className="course-detail-row">
                    <span className="course-detail-row-label">Tuition:</span>
                    <span className="course-detail-row-value course-tuition-value">{formatCurrency(selectedProgram.tuition)}</span>
                  </div>
                )}
                {selectedProgram.majorArea && selectedProgram.majorArea !== 'General' && (
                  <div className="course-detail-row">
                    <span className="course-detail-row-label">Field of Study:</span>
                    <span className="course-detail-row-value"><span className="course-major-tag">{selectedProgram.majorArea}</span></span>
                  </div>
                )}
                {selectedProgram.startDates?.length > 0 && (
                  <div className="course-detail-row">
                    <span className="course-detail-row-label">Start Dates:</span>
                    <span className="course-detail-row-value">{selectedProgram.startDates.join(', ')}</span>
                  </div>
                )}
                {selectedProgram.applicationDeadline && (
                  <div className="course-detail-row">
                    <span className="course-detail-row-label">Deadline:</span>
                    <span className="course-detail-row-value course-deadline-value">{selectedProgram.applicationDeadline}</span>
                  </div>
                )}
                {selectedProgram.requirements?.length > 0 && (
                  <div className="course-detail-section">
                    <span className="course-detail-section-label">Requirements:</span>
                    <ul className="course-requirements-list">
                      {selectedProgram.requirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {selectedProgram.careerPaths?.length > 0 && (
                  <div className="course-detail-section">
                    <span className="course-detail-section-label">Career Opportunities:</span>
                    <ul className="course-career-list">
                      {selectedProgram.careerPaths.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="course-panel-actions">
                <button
                  className="course-apply-button"
                  onClick={navigateToApplicationOverview}
                  disabled={savingToBackend}
                >
                  {savingToBackend
                    ? <><span className="course-spinner"></span>Saving...</>
                    : panelIsMaster
                      ? 'Start Master Application →'
                      : 'Start Application →'}
                </button>
                
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Courses;
