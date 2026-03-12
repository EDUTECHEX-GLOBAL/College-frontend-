// src/components/UserProfile.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const COURSE_SUGGESTIONS_LIST = [
  "Computer Science", "Business Administration", "Data Science",
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
  "Psychology", "Economics", "Finance", "Marketing", "Nursing", "Medicine",
  "Law", "Architecture", "Information Technology", "Artificial Intelligence",
  "Biotechnology", "Environmental Science", "Political Science",
  "International Relations", "Graphic Design", "Media Studies", "Education",
  "Social Work", "Public Health", "Accounting", "Supply Chain Management",
  "Physics", "Mathematics", "Chemistry", "Biology", "Philosophy", "History",
  "Literature", "Linguistics", "Human Resources", "Cybersecurity",
  "Cloud Computing", "Software Engineering", "Robotics", "Aerospace Engineering",
];

// ─── Normalize any university into a common shape ────────────────────────────
// ✅ FIX: programs are fully normalized here so every item has name+title set
const normalizeUniversity = (uni, source = 'admin') => {
  const name = uni.INSTNM || uni.universityName || 'Unknown University';
  const city = uni.CITY || uni.city || uni.location?.city || '';
  const state = uni.STABBR || uni.state || uni.location?.state || '';
  const country = uni.country || uni.location?.country || uni.COUNTRY || 'USA';

  let programs = [];

  if (Array.isArray(uni.programs) && uni.programs.length > 0) {
    programs = uni.programs.map((p, i) => {
      if (typeof p === 'string') {
        // Plain string (old data) → convert to object
        return { id: `prog-str-${i}`, name: p, title: p, program_name: p,
          level: 'Undergraduate', studyMode: 'On Campus', duration: '3-4 years' };
      }
      // Object → ensure name AND title are always set
      const resolved = p.name || p.title || p.program_name || `Program ${i + 1}`;
      return { ...p, name: resolved, title: resolved,
        program_name: p.program_name || resolved };
    });
  } else if (uni.GUS_DATA?.programs_data?.length) {
    programs = uni.GUS_DATA.programs_data.map((p, i) => {
      const resolved = p.title || p.program_name || `Program ${i + 1}`;
      return { ...p, name: resolved, title: resolved, program_name: p.program_name || resolved };
    });
  } else if (uni.GUS_DATA?.major_areas?.length) {
    uni.GUS_DATA.major_areas.forEach(area =>
      (area.specific_programs || []).forEach(p => {
        const pName = p.program_name || 'Unknown Program';
        programs.push({ name: pName, title: pName, program_name: pName,
          level: uni.GUS_DATA?.level || 'Undergraduate',
          studyMode: 'On Campus', duration: '3-4 years', majorArea: area.major_area });
      })
    );
  } else if (uni.metadata?.programs?.length) {
    programs = uni.metadata.programs.map((p, i) => {
      const resolved = p.title || p.program_name || p.name || `Program ${i + 1}`;
      return { ...p, name: resolved, title: resolved, program_name: p.program_name || resolved };
    });
  }

  return {
    ...uni,
    _normalizedId: uni.UNITID?.toString() || uni.universityCode || uni._id?.toString() || '',
    INSTNM: name,
    CITY: city,
    STABBR: state,
    location: { city, state, country, ...(typeof uni.location === 'object' ? uni.location : {}) },
    programs,
    _source: source,
  };
};

const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('studentType') || 'firstyear';

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  }, []);

  const [basicInfo, setBasicInfo] = useState({
    fullName: "", email: userEmail, mobile: "", dob: "", gender: "", nationality: "", residence: "",
  });
  const [education, setEducation] = useState({
    qualification: "", institution: "", field: "", year: "", cgpa: "",
  });
  const [eligibleProgram, setEligibleProgram] = useState("");
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [universityCourses, setUniversityCourses] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [currentUniversity, setCurrentUniversity] = useState(null);
  const [currentUniversityCourses, setCurrentUniversityCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [tempSelectedCourses, setTempSelectedCourses] = useState([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState({ level: "", studyMode: "", majorArea: "" });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ universityName: "", country: "" });
  const [requestFormErrors, setRequestFormErrors] = useState({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [reqCourseInput, setReqCourseInput] = useState("");
  const [reqCourses, setReqCourses] = useState([]);
  const [reqSuggestions, setReqSuggestions] = useState([]);
  const [showReqSuggestions, setShowReqSuggestions] = useState(false);
  const reqCourseInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image size should be less than 5MB"); return; }
    if (!file.type.startsWith('image/')) { setError("Please upload an image file"); return; }
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000); };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!token) { setFetchingProfile(false); return; }
      try {
        setFetchingProfile(true);
        const response = await axios.get(`${API_URL}/api/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          setBasicInfo(profile.basicInfo || { fullName: "", email: userEmail, mobile: "", dob: "", gender: "", nationality: "", residence: "" });
          setEducation(profile.education || { qualification: "", institution: "", field: "", year: "", cgpa: "" });
          setEligibleProgram(profile.eligibleProgram || "");
          setSelectedUniversities(profile.selectedUniversities?.length > 0 ? profile.selectedUniversities : []);
          if (profile.profileImage) setImagePreview(profile.profileImage);
        }
      } catch (error) {
        if (error.response?.status === 404) { setError(''); }
        else if (error.response?.status === 401) { setError('Authentication failed. Please log in again.'); }
        else { setError(`Server error: ${error.response?.status}`); }
      } finally { setFetchingProfile(false); }
    };
    checkExistingProfile();
  }, [token, userEmail]);

  useEffect(() => {
    const profileCompleted = localStorage.getItem('profileCompleted') === 'true';
    if (profileCompleted && !fetchingProfile && selectedUniversities.length > 0) navigateToDashboard();
  }, [fetchingProfile, selectedUniversities]);

  useEffect(() => { fetchUniversitiesFromMongoDB(); }, []);

  useEffect(() => {
    let filtered = [...universities];
    if (eligibleProgram) {
      if (eligibleProgram === "Bachelor") filtered = filtered.filter(u => u._source === 'bachelors' || u._source === 'admin');
      else if (eligibleProgram === "Master") filtered = filtered.filter(u => u._source === 'masters' || u._source === 'admin');
      else if (eligibleProgram === "PhD") filtered = filtered.filter(u => u._source === 'admin' && u.INSTNM?.toLowerCase().includes('university') && (u.metadata?.iclevel === 1 || u.programs?.length > 10));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => {
        const name = (u.INSTNM || '').toLowerCase();
        const city = (u.CITY || u.location?.city || '').toLowerCase();
        const state = (u.STABBR || u.location?.state || '').toLowerCase();
        const alias = (u.IALIAS || '').toLowerCase();
        const code = (u.universityCode || '').toLowerCase();
        return name.includes(term) || city.includes(term) || state.includes(term) || alias.includes(term) || code.includes(term);
      });
    }
    setFilteredUniversities(filtered);
  }, [eligibleProgram, searchTerm, universities]);

  useEffect(() => { if (currentUniversityCourses.length > 0) filterCourses(); }, [courseSearchTerm, courseFilter, currentUniversityCourses]);

  useEffect(() => {
    const term = reqCourseInput.trim().toLowerCase();
    if (!term) { setReqSuggestions([]); setShowReqSuggestions(false); return; }
    const filtered = COURSE_SUGGESTIONS_LIST.filter(c => c.toLowerCase().includes(term) && !reqCourses.includes(c)).slice(0, 6);
    setReqSuggestions(filtered);
    setShowReqSuggestions(filtered.length > 0);
  }, [reqCourseInput, reqCourses]);

  const fetchUniversitiesFromMongoDB = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const fetchAllAdminUniversities = async () => {
        let allAdmin = []; let page = 1; const limit = 100;
        while (true) {
          try {
            const res = await axios.get(`${API_URL}/api/admin/universities`, { params: { page, limit }, headers: { 'Authorization': `Bearer ${token}` } });
            const data = res.data?.data || [];
            if (!Array.isArray(data) || data.length === 0) break;
            allAdmin = [...allAdmin, ...data];
            if (data.length < limit) break;
            page++;
          } catch (err) { console.warn('Admin fetch failed page', page, err.message); break; }
        }
        return allAdmin;
      };

      const [adminData, bachelorsRes, mastersRes] = await Promise.all([
        fetchAllAdminUniversities(),
        axios.get(`${API_URL}/api/bachelors/universities`, { params: { limit: 500 }, headers: { 'Authorization': `Bearer ${token}` } })
          .catch(err => { console.warn('Bachelors fetch failed:', err.message); return { data: { success: false, data: [] } }; }),
        axios.get(`${API_URL}/api/masters/universities`, { params: { limit: 500 }, headers: { 'Authorization': `Bearer ${token}` } })
          .catch(err => { console.warn('Masters fetch failed:', err.message); return { data: { success: false, data: [] } }; }),
      ]);

      let allUniversities = [];
      if (Array.isArray(adminData) && adminData.length > 0)
        allUniversities = [...allUniversities, ...adminData.map(u => normalizeUniversity(u, 'admin'))];
      if (bachelorsRes.data?.success && Array.isArray(bachelorsRes.data.data))
        allUniversities = [...allUniversities, ...bachelorsRes.data.data.map(u => normalizeUniversity(u, 'bachelors'))];
      if (mastersRes.data?.success && Array.isArray(mastersRes.data.data))
        allUniversities = [...allUniversities, ...mastersRes.data.data.map(u => normalizeUniversity(u, 'masters'))];

      // Build course cache — programs are normalized objects at this point
      const courseCache = {};
      for (const uni of allUniversities) {
        const id = uni._normalizedId;
        if (id && uni.programs?.length > 0) courseCache[id] = buildCoursesFromPrograms(uni);
      }

      setUniversityCourses(courseCache);
      setUniversities(allUniversities);
      if (allUniversities.length === 0) setError("No universities found. Please make sure universities have been imported or created.");
    } catch (error) {
      console.error("Error fetching universities:", error);
      if (error.response?.status === 401) { setError("Your session has expired. Please login again."); setTimeout(() => navigate('/login'), 2000); }
      else if (error.code === 'ERR_NETWORK') { setError("Cannot connect to server. Please make sure the server is running."); }
      else { setError(error.response?.data?.message || "Failed to load universities. Please try again."); }
    } finally { setLoading(false); }
  };

  // ✅ FIX: Programs are already normalized objects from normalizeUniversity.
  // resolvedName always picks a real name, never falls back to "Program N" unless truly empty.
  const buildCoursesFromPrograms = (university) => {
    const uniName = university.INSTNM;
    const uniCity = university.CITY || '';
    const uniState = university.STABBR || '';

    return (university.programs || []).map((prog, index) => {
      if (typeof prog === 'string') {
        return {
          id: `prog-${university._normalizedId}-${index}`,
          title: prog, name: prog, program_name: prog,
          level: 'Undergraduate', studyMode: 'On Campus', duration: '3-4 years',
          locations: [`${uniCity}, ${uniState}`], majorArea: 'General',
          description: `${prog} at ${uniName}`,
        };
      }
      // ✅ name and title are guaranteed set by normalizeUniversity, but keep fallback
      const resolvedName = prog.name || prog.title || prog.program_name || `Program ${index + 1}`;
      return {
        id: prog.id || prog._id || `prog-${university._normalizedId}-${index}`,
        title: resolvedName,
        name: resolvedName,
        program_name: prog.program_name || resolvedName,
        level: prog.level || 'Undergraduate',
        studyMode: prog.studyMode || 'On Campus',
        duration: prog.duration || '3-4 years',
        locations: prog.locations || [`${uniCity}, ${uniState}`],
        majorArea: prog.majorArea || '',
        description: prog.description || `${resolvedName} at ${uniName}`,
      };
    });
  };

  const filterCourses = () => {
    let filtered = [...currentUniversityCourses];
    if (courseSearchTerm.trim()) {
      const term = courseSearchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        (c.title || c.program_name || '').toLowerCase().includes(term) ||
        (c.majorArea || '').toLowerCase().includes(term) ||
        (c.level || '').toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term)
      );
    }
    if (courseFilter.level) filtered = filtered.filter(c => (c.level || '').toLowerCase() === courseFilter.level.toLowerCase());
    if (courseFilter.studyMode) filtered = filtered.filter(c => (c.studyMode || '').toLowerCase().includes(courseFilter.studyMode.toLowerCase()));
    if (courseFilter.majorArea) filtered = filtered.filter(c => (c.majorArea || '').toLowerCase().includes(courseFilter.majorArea.toLowerCase()));
    setFilteredCourses(filtered);
  };

  const detectProgram = (qualification) => {
    if (qualification === "12th" || qualification === "High School") return "Bachelor";
    if (qualification === "Bachelor" || qualification === "Bachelor's Degree") return "Master";
    if (qualification === "Master" || qualification === "Master's Degree") return "PhD";
    return "";
  };

  const handleEducationChange = (e) => {
    const value = e.target.value;
    setEducation({ ...education, qualification: value });
    const program = detectProgram(value);
    setEligibleProgram(program);
    if (program) { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500); }
  };

  const getUniKey = (uni) => uni._normalizedId || uni.UNITID?.toString() || uni._id?.toString() || '';

  // ✅ FIX: Always fetch the fresh normalized version from the universities list
  // when opening the course modal, so programs are always fully populated
  const openCourseModal = (university) => {
    const uniKey = getUniKey(university);
    const freshUni = (uniKey && universities.find(u => getUniKey(u) === uniKey)) || university;
    const availableCourses = universityCourses[uniKey] || buildCoursesFromPrograms(freshUni);

    if (availableCourses.length === 0) { toggleUniversity(university); return; }

    setCurrentUniversity(freshUni);
    setCurrentUniversityCourses(availableCourses);
    setFilteredCourses(availableCourses);
    setCourseSearchTerm("");
    setCourseFilter({ level: "", studyMode: "", majorArea: "" });
    const existingUni = selectedUniversities.find(u => getUniKey(u) === uniKey);
    setTempSelectedCourses([...(existingUni?.selectedCourses || [])]);
    setShowCourseModal(true);
    document.body.style.overflow = 'hidden';
  };

  const toggleTempCourse = (course) => {
    setTempSelectedCourses(prev => {
      const isSelected = prev.some(c => c.id === course.id);
      if (isSelected) return prev.filter(c => c.id !== course.id);
      if (prev.length < 2) return [...prev, course];
      setError('You can select maximum 2 courses per university');
      setTimeout(() => setError(''), 2000);
      return prev;
    });
  };

  const saveCourseSelection = () => {
    if (!currentUniversity) return;
    const uniKey = getUniKey(currentUniversity);
    const universityWithCourses = {
      ...currentUniversity,
      selectedCourses: tempSelectedCourses.map(course => ({
        id: course.id,
        // ✅ always store real name in title
        title: course.title || course.name || course.program_name || 'Course',
        name: course.name || course.title || course.program_name || 'Course',
        program_name: course.program_name || course.title || course.name || '',
        level: course.level, studyMode: course.studyMode, duration: course.duration,
        locations: course.locations, majorArea: course.majorArea, description: course.description,
      }))
    };
    const isUniSelected = selectedUniversities.some(u => getUniKey(u) === uniKey);
    if (isUniSelected) {
      setSelectedUniversities(prev => prev.map(u => getUniKey(u) === uniKey ? universityWithCourses : u));
    } else if (selectedUniversities.length < 5) {
      setSelectedUniversities(prev => [...prev, universityWithCourses]);
    }
    setShowCourseModal(false); setCurrentUniversity(null); setTempSelectedCourses([]);
    document.body.style.overflow = 'auto';
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500);
  };

  const closeCourseModal = () => {
    setShowCourseModal(false); setCurrentUniversity(null); setTempSelectedCourses([]);
    setCourseSearchTerm(""); setCourseFilter({ level: "", studyMode: "", majorArea: "" });
    document.body.style.overflow = 'auto';
  };

  const toggleUniversity = (university) => {
    if (!university) return;
    const uniKey = getUniKey(university);
    const isSelected = selectedUniversities.some(u => getUniKey(u) === uniKey);
    if (isSelected) {
      setSelectedUniversities(prev => prev.filter(u => getUniKey(u) !== uniKey));
    } else if (selectedUniversities.length < 5) {
      const freshUni = universities.find(u => getUniKey(u) === uniKey) || university;
      const availableCourses = universityCourses[uniKey] || buildCoursesFromPrograms(freshUni);
      if (availableCourses.length === 0) {
        setSelectedUniversities(prev => [...prev, { ...freshUni, selectedCourses: [], isDirectApply: true }]);
        setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500);
      } else {
        openCourseModal(freshUni);
      }
    } else {
      setError("You can select maximum 5 universities");
      setTimeout(() => setError(''), 2000);
    }
  };

  const removeUniversity = (university) => {
    const uniKey = getUniKey(university);
    setSelectedUniversities(prev => prev.filter(u => getUniKey(u) !== uniKey));
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1000);
  };

  const openRequestModal = () => {
    setRequestForm({ universityName: searchTerm || "", country: "" });
    setRequestFormErrors({}); setRequestSuccess(false);
    setReqCourses([]); setReqCourseInput(""); setReqSuggestions([]); setShowReqSuggestions(false);
    setShowRequestModal(true); document.body.style.overflow = 'hidden';
  };

  const closeRequestModal = () => {
    setShowRequestModal(false); setRequestForm({ universityName: "", country: "" });
    setRequestFormErrors({}); setRequestSuccess(false);
    setReqCourses([]); setReqCourseInput(""); setReqSuggestions([]); setShowReqSuggestions(false);
    document.body.style.overflow = 'auto';
  };

  const addReqCourse = (courseName) => {
    const trimmed = courseName.trim().replace(/,+$/, '');
    if (!trimmed) return;
    if (reqCourses.includes(trimmed)) { setReqCourseInput(""); return; }
    if (reqCourses.length >= 5) { setRequestFormErrors(prev => ({ ...prev, courses: "You can add up to 5 courses" })); return; }
    setReqCourses(prev => [...prev, trimmed]); setReqCourseInput("");
    setReqSuggestions([]); setShowReqSuggestions(false);
    setRequestFormErrors(prev => ({ ...prev, courses: null }));
    setTimeout(() => reqCourseInputRef.current?.focus(), 0);
  };

  const removeReqCourse = (courseName) => setReqCourses(prev => prev.filter(c => c !== courseName));

  const handleReqCourseKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (reqCourseInput.trim()) addReqCourse(reqCourseInput); }
    else if (e.key === 'Backspace' && reqCourseInput === '' && reqCourses.length > 0) setReqCourses(prev => prev.slice(0, -1));
  };

  const validateRequestForm = () => {
    const errors = {};
    if (!requestForm.universityName.trim()) errors.universityName = "University name is required";
    if (!requestForm.country.trim()) errors.country = "Country is required";
    if (reqCourses.length === 0) errors.courses = "Please add at least one course of interest";
    setRequestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitUniversityRequest = async () => {
    if (!validateRequestForm()) return;
    setSubmittingRequest(true);
    try {
      const response = await axios.post(`${API_URL}/api/user/university/request`,
        { universityName: requestForm.universityName.trim(), country: requestForm.country.trim(), interestedCourses: reqCourses },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.data.success) { setRequestSuccess(true); setTimeout(() => closeRequestModal(), 3500); }
      else { setRequestFormErrors({ submit: response.data.message || "Failed to submit request. Please try again." }); }
    } catch (err) {
      setRequestFormErrors({ submit: err.response?.data?.message || (err.code === 'ERR_NETWORK' ? "Cannot connect to server." : "Failed to submit request.") });
    } finally { setSubmittingRequest(false); }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!basicInfo.fullName) errors.fullName = "Full name is required";
    if (!basicInfo.mobile) errors.mobile = "Mobile number is required";
    if (!basicInfo.dob) errors.dob = "Date of birth is required";
    if (!basicInfo.gender) errors.gender = "Gender is required";
    if (!basicInfo.nationality) errors.nationality = "Nationality is required";
    if (!basicInfo.residence) errors.residence = "Country of residence is required";
    if (basicInfo.mobile && !/^[0-9+\-\s()]{10,15}$/.test(basicInfo.mobile)) errors.mobile = "Please enter a valid mobile number";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!education.qualification) errors.qualification = "Qualification is required";
    if (!education.institution) errors.institution = "Institution is required";
    if (!education.field) errors.field = "Field of study is required";
    if (!education.year) errors.year = "Year of passing is required";
    if (!education.cgpa) errors.cgpa = "CGPA/Percentage is required";
    if (education.year && !/^\d{4}$/.test(education.year)) errors.year = "Please enter a valid year (YYYY)";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    if (selectedUniversities.length < 3) { setError('Please select at least 3 universities'); setTimeout(() => setError(''), 3000); return false; }
    for (const uni of selectedUniversities) {
      if (!uni.isDirectApply && (uni.selectedCourses || []).length === 0) {
        setError(`Please select at least one course for ${uni.INSTNM}`);
        setTimeout(() => setError(''), 3000); return false;
      }
    }
    return true;
  };

  const isStep1Valid = () => basicInfo.fullName && basicInfo.mobile && basicInfo.dob && basicInfo.gender && basicInfo.nationality && basicInfo.residence;
  const isStep2Valid = () => education.qualification && education.institution && education.field && education.year && education.cgpa;
  const isStep3Valid = () => {
    if (selectedUniversities.length < 3) return false;
    for (const uni of selectedUniversities) {
      if (!uni.isDirectApply && (uni.selectedCourses || []).length === 0) return false;
    }
    return true;
  };

  const navigateToDashboard = () => {
    if (userType === 'transfer') navigate('/transfer/dashboard');
    else navigate('/firstyear/dashboard');
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !token) return null;
    try {
      const response = await axios.patch(`${API_URL}/api/user/profile/image`,
        { profileImage: imagePreview },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.data.success) return response.data.data;
    } catch (error) { console.error("Error uploading profile image:", error); }
    return null;
  };

  const handleSubmitProfile = async () => {
    if (!token) { setError("You must be logged in to submit your profile"); return; }
    if (!validateStep3()) return;
    setSaving(true); setError('');
    let formattedUniversities = [];
    try {
      if (profileImage) await uploadProfileImage();
      formattedUniversities = selectedUniversities.map(u => {
        const city = u.CITY || u.location?.city || '';
        const state = u.STABBR || u.location?.state || '';
        const locationStr = city + (city && state ? ', ' : '') + state;
        const courses = u.selectedCourses || [];
        return {
          id: u.UNITID?.toString() || u.universityCode || u._id?.toString() || u._normalizedId || '',
          unitid: u.UNITID || null,
          name: u.INSTNM || u.universityName || 'Unknown University',
          location: locationStr || 'Location not specified',
          city, state,
          country: u.location?.country || u.country || u.COUNTRY || 'USA',
          isDirectApply: !!u.isDirectApply,
          selectedCourses: courses.map(c => ({
            id: c.id || `course-${Math.random()}`,
            // ✅ always store real name
            title: c.title || c.name || c.program_name || 'Program',
            name: c.name || c.title || c.program_name || 'Program',
            program_name: c.program_name || c.title || c.name || '',
            level: c.level || '', studyMode: c.studyMode || '',
            duration: c.duration || '',
            locations: Array.isArray(c.locations) ? c.locations : [],
            majorArea: c.majorArea || '', description: c.description || '',
          }))
        };
      });

      const profileData = {
        profileImage: imagePreview, basicInfo, education, eligibleProgram,
        selectedUniversities: formattedUniversities,
        profileCompleted: true, completedAt: new Date().toISOString()
      };

      const payloadSize = JSON.stringify(profileData).length;
      if (payloadSize > 500000) { setError("Profile data is too large. Please reduce course selections."); setSaving(false); return; }

      const response = await axios.post(`${API_URL}/api/user/profile`, profileData,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });

      if (response.data.success) {
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        localStorage.setItem('profileCompleted', 'true');
        setShowSuccess(true);
        showToast("Profile submitted successfully! Redirecting to dashboard...", "success");
        setTimeout(() => navigateToDashboard(), 1500);
      } else { setError(response.data.message || "Failed to save profile"); }
    } catch (error) {
      let errorMessage = "Failed to save profile. Please try again.";
      if (error.response) {
        if (error.response.status === 401) { errorMessage = "Your session has expired. Please login again."; setTimeout(() => navigate('/login'), 2000); }
        else if (error.response.status === 400) { errorMessage = error.response.data.errors?.join(', ') || error.response.data.message || "Invalid profile data"; }
        else if (error.response.data?.message) { errorMessage = error.response.data.message; }
      } else if (error.code === 'ERR_NETWORK') { errorMessage = "Cannot connect to server. Saving locally only."; }
      setError(errorMessage);
      const profileData = { profileImage: imagePreview, basicInfo, education, eligibleProgram, selectedUniversities: formattedUniversities, completedAt: new Date().toISOString(), profileCompleted: true };
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      localStorage.setItem('profileCompleted', 'true');
      setShowSuccess(true);
      showToast("Profile saved locally! Redirecting to dashboard...", "warning");
      setTimeout(() => navigateToDashboard(), 1500);
    } finally { setSaving(false); }
  };

  const handleSaveProgress = (nextStep) => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && nextStep === 4 && !validateStep3()) return;
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Your progress will be lost.")) navigateToDashboard();
  };

  const getInitials = (name) => {
    if (!name) return "UNI";
    return name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
  };

  const getProgramCount = (university) => university.programs?.length || 0;

  const getUserInitials = () => {
    if (basicInfo.fullName) return basicInfo.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  };

  const handleRetry = () => fetchUniversitiesFromMongoDB();

  const getLevelColor = (level) => {
    const l = level?.toLowerCase() || '';
    if (l.includes('bachelor') || l.includes('undergraduate')) return '#4CAF50';
    if (l.includes('master') || l.includes('graduate') || l.includes('mba')) return '#FF9800';
    if (l.includes('phd') || l.includes('doctorate')) return '#F44336';
    if (l.includes('diploma')) return '#9C27B0';
    if (l.includes('certificate')) return '#00BCD4';
    return '#757575';
  };

  const getStudyModeColor = (mode) => {
    const m = mode?.toLowerCase() || '';
    if (m.includes('online')) return '#2196F3';
    if (m.includes('campus') || m.includes('on campus')) return '#FFC107';
    if (m.includes('hybrid') || m.includes('blended')) return '#9C27B0';
    if (m.includes('distance')) return '#00BCD4';
    return '#757575';
  };

  const getSourceLabel = (uni) => {
    if (uni._source === 'bachelors') return "🎓 Bachelor's";
    if (uni._source === 'masters') return "📘 Master's";
    return null;
  };

  if (fetchingProfile) {
    return (
      <div className="profile-wrapper">
        <div className="loading-screen">
          <div className="loading-spinner-large"></div>
          <p>Loading your profile...</p>
          <div className="confetti-piece" style={{ left: '10%', animationDelay: '0s' }}></div>
          <div className="confetti-piece" style={{ left: '30%', animationDelay: '0.3s' }}></div>
          <div className="confetti-piece" style={{ left: '50%', animationDelay: '0.6s' }}></div>
          <div className="confetti-piece" style={{ left: '70%', animationDelay: '0.9s' }}></div>
          <div className="confetti-piece" style={{ left: '90%', animationDelay: '1.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}
      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-animation">
            <div className="checkmark-circle"><div className="checkmark"></div></div>
          </div>
        </div>
      )}

      <div className="userprofile-profile-header">
        <div className="header-container">
          <div className="profile-image-wrapper">
            <div className="profile-image-container">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-image-placeholder">
                  <span className="placeholder-initials">{getUserInitials()}</span>
                </div>
              )}
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
          <button className="header-cancel-btn ripple-effect" onClick={handleCancel}>Cancel</button>
        </div>
      </div>

      <div className="userprofile-profile-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            {error.includes("Cannot connect") && <button className="retry-btn ripple-effect" onClick={handleRetry}>Retry</button>}
          </div>
        )}

        <div className="userprofile-progress-container">
          <div className="progress-steps-horizontal">
            {[{ num: 1, label: "Basic Info" }, { num: 2, label: "Education" }, { num: 3, label: "Universities & Courses" }, { num: 4, label: "Review" }].map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Personal Information</h2><p>Tell us about yourself</p></div>
            <div className="form-fields">
              <div className="form-row">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" value={basicInfo.fullName}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, fullName: e.target.value }); if (validationErrors.fullName) setValidationErrors({ ...validationErrors, fullName: null }); }}
                  className={validationErrors.fullName ? 'error' : ''} />
                {validationErrors.fullName && <span className="field-error">{validationErrors.fullName}</span>}
              </div>
              <div className="form-row">
                <label>Email ID</label>
                <div className="email-field">
                  <input type="email" value={basicInfo.email} disabled className="disabled-input" />
                  <span className="email-note">Auto-filled from your account</span>
                </div>
              </div>
              <div className="form-row">
                <label>Mobile Number</label>
                <input type="tel" placeholder="+1 9876543210" value={basicInfo.mobile}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, mobile: e.target.value }); if (validationErrors.mobile) setValidationErrors({ ...validationErrors, mobile: null }); }}
                  className={validationErrors.mobile ? 'error' : ''} />
                {validationErrors.mobile && <span className="field-error">{validationErrors.mobile}</span>}
              </div>
              <div className="form-row">
                <label>Date of Birth</label>
                <input type="date" value={basicInfo.dob}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, dob: e.target.value }); if (validationErrors.dob) setValidationErrors({ ...validationErrors, dob: null }); }}
                  className={validationErrors.dob ? 'error' : ''} />
                {validationErrors.dob && <span className="field-error">{validationErrors.dob}</span>}
              </div>
              <div className="form-row">
                <label>Gender</label>
                <select value={basicInfo.gender}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, gender: e.target.value }); if (validationErrors.gender) setValidationErrors({ ...validationErrors, gender: null }); }}
                  className={validationErrors.gender ? 'error' : ''}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {validationErrors.gender && <span className="field-error">{validationErrors.gender}</span>}
              </div>
              <div className="form-row">
                <label>Nationality</label>
                <input type="text" placeholder="e.g., Indian, American" value={basicInfo.nationality}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, nationality: e.target.value }); if (validationErrors.nationality) setValidationErrors({ ...validationErrors, nationality: null }); }}
                  className={validationErrors.nationality ? 'error' : ''} />
                {validationErrors.nationality && <span className="field-error">{validationErrors.nationality}</span>}
              </div>
              <div className="form-row">
                <label>Country of Residence</label>
                <input type="text" placeholder="e.g., India, USA, UK" value={basicInfo.residence}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, residence: e.target.value }); if (validationErrors.residence) setValidationErrors({ ...validationErrors, residence: null }); }}
                  className={validationErrors.residence ? 'error' : ''} />
                {validationErrors.residence && <span className="field-error">{validationErrors.residence}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="continue-btn ripple-effect" onClick={() => handleSaveProgress(2)} disabled={!isStep1Valid()}>
                Continue to Education →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Education Background</h2><p>Tell us about your academic journey</p></div>
            <div className="form-fields">
              <div className="form-row">
                <label>Highest Qualification Completed</label>
                <select value={education.qualification} onChange={handleEducationChange} className={validationErrors.qualification ? 'error' : ''}>
                  <option value="">Select Qualification</option>
                  <option value="12th">12th / High School</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                </select>
                {validationErrors.qualification && <span className="field-error">{validationErrors.qualification}</span>}
              </div>
              <div className="form-row">
                <label>University / School Name</label>
                <input type="text" placeholder="Enter institution name" value={education.institution}
                  onChange={(e) => { setEducation({ ...education, institution: e.target.value }); if (validationErrors.institution) setValidationErrors({ ...validationErrors, institution: null }); }}
                  className={validationErrors.institution ? 'error' : ''} />
                {validationErrors.institution && <span className="field-error">{validationErrors.institution}</span>}
              </div>
              <div className="form-row">
                <label>Field of Study</label>
                <input type="text" placeholder="e.g., Computer Science, Business" value={education.field}
                  onChange={(e) => { setEducation({ ...education, field: e.target.value }); if (validationErrors.field) setValidationErrors({ ...validationErrors, field: null }); }}
                  className={validationErrors.field ? 'error' : ''} />
                {validationErrors.field && <span className="field-error">{validationErrors.field}</span>}
              </div>
              <div className="form-row">
                <label>Year of Passing</label>
                <input type="text" placeholder="e.g., 2023" value={education.year}
                  onChange={(e) => { setEducation({ ...education, year: e.target.value }); if (validationErrors.year) setValidationErrors({ ...validationErrors, year: null }); }}
                  className={validationErrors.year ? 'error' : ''} />
                {validationErrors.year && <span className="field-error">{validationErrors.year}</span>}
              </div>
              <div className="form-row">
                <label>Percentage / CGPA</label>
                <input type="text" placeholder="e.g., 85% or 8.5" value={education.cgpa}
                  onChange={(e) => { setEducation({ ...education, cgpa: e.target.value }); if (validationErrors.cgpa) setValidationErrors({ ...validationErrors, cgpa: null }); }}
                  className={validationErrors.cgpa ? 'error' : ''} />
                {validationErrors.cgpa && <span className="field-error">{validationErrors.cgpa}</span>}
              </div>
            </div>
            {eligibleProgram && (
              <div className="eligibility-badge">
                <span className="badge-icon">🎓</span>
                <span>You are eligible for: <strong>{eligibleProgram} Programs</strong></span>
              </div>
            )}
            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={() => setStep(1)}>← Back</button>
              <button className="continue-btn ripple-effect" onClick={() => handleSaveProgress(3)} disabled={!isStep2Valid()}>
                Continue to Universities & Courses →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Select Universities & Courses</h2>
              <p>Choose at least 3 universities and select up to 2 courses for each</p>
            </div>
            {eligibleProgram && (
              <div className="program-indicator">
                <span>Showing universities for: <strong>{eligibleProgram} Program</strong></span>
              </div>
            )}
            <div className="university-controls">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input type="text" className="search-input" placeholder="Search universities by name, city, country..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="selection-counter">
                <span className="counter-number">{selectedUniversities.length}</span>
                <span>/5 selected</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading universities from database...</p>
                <button className="retry-small-btn ripple-effect" onClick={handleRetry}>Retry</button>
              </div>
            ) : (
              <>
                <div className="universities-grid">
                  {filteredUniversities.length > 0 ? (
                    filteredUniversities.map((uni) => {
                      const uniKey = getUniKey(uni);
                      const isSelected = selectedUniversities.some(u => getUniKey(u) === uniKey);
                      const programCount = getProgramCount(uni);
                      const isDirectApply = programCount === 0;
                      const location = uni.CITY || uni.location?.city || '';
                      const state = uni.STABBR || uni.location?.state || '';
                      const selectedUni = selectedUniversities.find(u => getUniKey(u) === uniKey);
                      const selectedCoursesForUni = selectedUni?.selectedCourses || [];
                      const sourceLabel = getSourceLabel(uni);

                      return (
                        <div key={uniKey || Math.random()} className="university-card-wrapper">
                          <div className={`university-card ${isSelected ? 'selected' : ''} ${isDirectApply ? 'direct-apply' : ''}`}
                            onClick={() => toggleUniversity(uni)}>
                            <div className="university-logo">{getInitials(uni.INSTNM)}</div>
                            <div className="university-details">
                              <h4>{uni.INSTNM || 'Unknown University'}</h4>
                              <p>{location}{location && state ? ', ' : ''}{state}</p>
                              {programCount > 0 && <span className="program-badge">{programCount} courses available</span>}
                              {isDirectApply && <span className="direct-apply-badge">Direct Apply</span>}
                              {sourceLabel && <span className="source-label-badge">{sourceLabel}</span>}
                            </div>
                            {isSelected && <span className="check-mark">✓</span>}
                          </div>

                          {isSelected && !isDirectApply && selectedCoursesForUni.length > 0 && (
                            <div className="selected-courses-preview">
                              <span className="preview-label">Selected courses:</span>
                              <div className="preview-courses">
                                {selectedCoursesForUni.map((course, idx) => (
                                  // ✅ real course name displayed
                                  <span key={idx} className="preview-course-tag">
                                    {course.title || course.name || course.program_name || 'Course'}
                                  </span>
                                ))}
                              </div>
                              <button className="edit-courses-btn ripple-effect"
                                onClick={(e) => { e.stopPropagation(); openCourseModal(uni); }}>Edit Courses</button>
                            </div>
                          )}

                          {isSelected && !isDirectApply && selectedCoursesForUni.length === 0 && (
                            <div className="selected-courses-preview warning">
                              <span className="preview-label">⚠️ No courses selected</span>
                              <button className="edit-courses-btn ripple-effect"
                                onClick={(e) => { e.stopPropagation(); openCourseModal(uni); }}>Select Courses</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-results">
                      <p>No universities found{searchTerm ? ` matching "${searchTerm}"` : ' for your program level'}.</p>
                      {universities.length === 0
                        ? <button className="retry-btn ripple-effect" onClick={handleRetry}>Refresh Universities</button>
                        : searchTerm && <button className="retry-btn ripple-effect" onClick={() => setSearchTerm('')}>Clear Search</button>}
                    </div>
                  )}
                </div>

                <div className="request-university-banner">
                  <div className="request-banner-content">
                    <div className="request-banner-icon">🏛️</div>
                    <div className="request-banner-text">
                      <strong>Can't find your university?</strong>
                      <p>Submit a request and our team will add it for you.</p>
                    </div>
                    <button className="request-university-btn ripple-effect" onClick={openRequestModal}>
                      + Request New University
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={() => setStep(2)}>← Back</button>
              <button className="continue-btn ripple-effect" onClick={() => handleSaveProgress(4)} disabled={!isStep3Valid()}>
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Review Your Profile</h2><p>Please verify your information before submitting</p></div>
            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                <p><strong>Full Name:</strong> {basicInfo.fullName || 'Not provided'}</p>
                <p><strong>Email:</strong> {basicInfo.email || 'Not provided'}</p>
                <p><strong>Mobile:</strong> {basicInfo.mobile || 'Not provided'}</p>
                <p><strong>Date of Birth:</strong> {basicInfo.dob || 'Not provided'}</p>
                <p><strong>Gender:</strong> {basicInfo.gender || 'Not provided'}</p>
                <p><strong>Nationality:</strong> {basicInfo.nationality || 'Not provided'}</p>
                <p><strong>Residence:</strong> {basicInfo.residence || 'Not provided'}</p>
              </div>
            </div>
            <div className="review-section">
              <h3>Education Background</h3>
              <div className="review-grid">
                <p><strong>Qualification:</strong> {education.qualification || 'Not provided'}</p>
                <p><strong>Institution:</strong> {education.institution || 'Not provided'}</p>
                <p><strong>Field:</strong> {education.field || 'Not provided'}</p>
                <p><strong>Year:</strong> {education.year || 'Not provided'}</p>
                <p><strong>CGPA:</strong> {education.cgpa || 'Not provided'}</p>
              </div>
            </div>
            <div className="review-section">
              <h3>Selected Universities & Courses ({selectedUniversities.length})</h3>
              <div className="universities-list">
                {selectedUniversities.length > 0 ? selectedUniversities.map((uni, index) => {
                  const courses = uni.selectedCourses || [];
                  const isDirectApply = uni.isDirectApply || (courses.length === 0 && getProgramCount(uni) === 0);
                  const city = uni.CITY || uni.city || uni.location?.city || '';
                  const state = uni.STABBR || uni.state || uni.location?.state || '';
                  const country = uni.location?.country || uni.country || uni.COUNTRY || 'USA';
                  const locationStr = [city, state, country].filter(Boolean).join(', ');
                  const website = uni.WEBADDR || uni.website || uni.contact?.website || '';
                  const uniType = uni.universityType || '';
                  const established = uni.establishedYear || '';
                  const phone = uni.GENTELE || uni.adminPhone || uni.contact?.phone || '';
                  const address = uni.ADDR || uni.address || uni.location?.address || '';

                  return (
                    <div key={getUniKey(uni) || index} className="review-university-item">
                      <p className="review-university-name">
                        <strong>{index + 1}. {uni.INSTNM || uni.universityName || 'Unknown University'}</strong>
                        {isDirectApply && <span className="direct-apply-tag"> (Direct Apply)</span>}
                        {uni._source === 'bachelors' && <span className="source-tag bachelors-tag"> 🎓 Bachelor's</span>}
                        {uni._source === 'masters' && <span className="source-tag masters-tag"> 📘 Master's</span>}
                      </p>
                      <div className="review-uni-details">
                        {locationStr && <p className="review-detail-item"><span className="review-detail-label">📍 Location:</span><span>{locationStr}</span></p>}
                        {address && <p className="review-detail-item"><span className="review-detail-label">🏠 Address:</span><span>{address}</span></p>}
                        {uniType && <p className="review-detail-item"><span className="review-detail-label">🏛️ Type:</span><span>{uniType}</span></p>}
                        {established && <p className="review-detail-item"><span className="review-detail-label">📅 Established:</span><span>{established}</span></p>}
                        {phone && <p className="review-detail-item"><span className="review-detail-label">📞 Phone:</span><span>{phone}</span></p>}
                        {website && <p className="review-detail-item"><span className="review-detail-label">🌐 Website:</span><a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">{website}</a></p>}
                      </div>
                      {isDirectApply && (
                        <div className="direct-apply-review-note">
                          <span>✅ This university accepts direct applications — no course pre-selection required.</span>
                        </div>
                      )}
                      {!isDirectApply && courses.length > 0 && (
                        <div className="review-courses-list">
                          <p className="courses-label">Selected Courses ({courses.length}):</p>
                          <ul>
                            {courses.map((course, idx) => (
                              <li key={idx}>
                                {/* ✅ real course name in review step */}
                                {course.title || course.name || course.program_name || 'Course'}
                                {course.level && <span className="course-level"> - {course.level}</span>}
                                {course.studyMode && <span className="course-mode"> ({course.studyMode})</span>}
                                {course.duration && <span className="course-duration"> · {course.duration}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!isDirectApply && courses.length === 0 && (
                        <p className="warning-text">⚠️ No courses selected for this university</p>
                      )}
                    </div>
                  );
                }) : <p>No universities selected</p>}
              </div>
            </div>
            <div className="form-actions">
              <button className="back-btn ripple-effect" onClick={() => setStep(3)}>← Back</button>
              <button className="submit-btn ripple-effect" onClick={handleSubmitProfile} disabled={saving || !isStep3Valid()}>
                {saving ? 'Submitting...' : 'Submit Profile'}
              </button>
            </div>
          </div>
        )}

        <div className="bottom-progress">
          <div className="progress-steps-horizontal">
            {[{ num: 1, label: "Basic Info" }, { num: 2, label: "Education" }, { num: 3, label: "Universities & Courses" }, { num: 4, label: "Review" }].map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course Selection Modal ── */}
      {showCourseModal && currentUniversity && (
        <div className="modal-overlay" onClick={closeCourseModal}>
          <div className="modal-content course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Courses for {currentUniversity.INSTNM}</h3>
              <button className="modal-close-btn ripple-effect" onClick={closeCourseModal}>×</button>
            </div>
            <div className="modal-body">
              <p className="course-selection-info">Select up to 2 courses that interest you</p>
              <div className="selected-count">Selected: {tempSelectedCourses.length}/2</div>
              <div className="course-search-section">
                <div className="course-search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input type="text" className="course-search-input"
                    placeholder="Search courses by name, major, level..."
                    value={courseSearchTerm} onChange={(e) => setCourseSearchTerm(e.target.value)} />
                  {courseSearchTerm && <button className="clear-search-btn" onClick={() => setCourseSearchTerm("")}>×</button>}
                </div>
                {(courseSearchTerm || courseFilter.level || courseFilter.studyMode || courseFilter.majorArea) && (
                  <div className="active-filters">
                    <span className="filter-label">Active filters:</span>
                    {courseSearchTerm && (
                      <span className="filter-tag">
                        Search: "{courseSearchTerm}"
                        <button onClick={() => setCourseSearchTerm("")}>×</button>
                      </span>
                    )}
                    <button className="clear-all-filters" onClick={() => { setCourseSearchTerm(""); setCourseFilter({ level: "", studyMode: "", majorArea: "" }); }}>Clear All</button>
                  </div>
                )}
              </div>

              {loadingCourses ? (
                <div className="courses-loading"><div className="spinner-small"></div><p>Loading courses...</p></div>
              ) : filteredCourses.length > 0 ? (
                <div className="courses-grid">
                  {filteredCourses.map((course, idx) => {
                    const isSelected = tempSelectedCourses.some(c => c.id === course.id);
                    // ✅ always show real course name in modal cards
                    const displayName = course.title || course.name || course.program_name || 'Course';
                    return (
                      <div key={course.id || idx} className={`course-card ${isSelected ? 'selected' : ''}`} onClick={() => toggleTempCourse(course)}>
                        <h4 className="course-title">{displayName}</h4>
                        <div className="course-badges">
                          {course.level && <span className="course-level-badge" style={{ backgroundColor: getLevelColor(course.level) }}>{course.level}</span>}
                          {course.studyMode && <span className="course-mode-badge" style={{ backgroundColor: getStudyModeColor(course.studyMode) }}>{course.studyMode}</span>}
                        </div>
                        {course.duration && <span className="course-duration">{course.duration}</span>}
                        {course.majorArea && <span className="course-major">{course.majorArea}</span>}
                        {isSelected && <span className="course-selected-check">✓ Selected</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-courses">
                  <p>No courses available for this university.</p>
                  {(courseSearchTerm || courseFilter.level || courseFilter.studyMode) && (
                    <button className="clear-filters-btn" onClick={() => { setCourseSearchTerm(""); setCourseFilter({ level: "", studyMode: "", majorArea: "" }); }}>Clear Filters</button>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn ripple-effect" onClick={closeCourseModal}>Cancel</button>
              <button className="save-btn ripple-effect" onClick={saveCourseSelection} disabled={tempSelectedCourses.length === 0}>
                Save Selection ({tempSelectedCourses.length}/2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request University Modal ── */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content request-university-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏛️ Request a New University</h3>
              <button className="modal-close-btn ripple-effect" onClick={closeRequestModal}>×</button>
            </div>
            {requestSuccess ? (
              <div className="request-success-state">
                <div className="request-success-icon">✅</div>
                <h4>Request Submitted!</h4>
                <p>Your request for <strong>"{requestForm.universityName}"</strong> has been sent to our admin team.</p>
                {reqCourses.length > 0 && (
                  <div className="request-success-courses">
                    <p className="success-courses-label">Courses you requested:</p>
                    <div className="success-course-tags">
                      {reqCourses.map((c, i) => <span key={i} className="success-course-tag">{c}</span>)}
                    </div>
                  </div>
                )}
                <p className="request-success-note">This window will close automatically…</p>
              </div>
            ) : (
              <div className="modal-body">
                <p className="request-modal-desc">Can't find your university? Fill in the details below and our team will review and add it.</p>
                {requestFormErrors.submit && <div className="request-submit-error"><span>⚠️ {requestFormErrors.submit}</span></div>}
                <div className="form-fields">
                  <div className="form-row">
                    <label>University Name <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., Harvard University" value={requestForm.universityName}
                      onChange={(e) => { setRequestForm({ ...requestForm, universityName: e.target.value }); if (requestFormErrors.universityName) setRequestFormErrors({ ...requestFormErrors, universityName: null }); }}
                      className={requestFormErrors.universityName ? 'error' : ''} />
                    {requestFormErrors.universityName && <span className="field-error">{requestFormErrors.universityName}</span>}
                  </div>
                  <div className="form-row">
                    <label>Country <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., United States" value={requestForm.country}
                      onChange={(e) => { setRequestForm({ ...requestForm, country: e.target.value }); if (requestFormErrors.country) setRequestFormErrors({ ...requestFormErrors, country: null }); }}
                      className={requestFormErrors.country ? 'error' : ''} />
                    {requestFormErrors.country && <span className="field-error">{requestFormErrors.country}</span>}
                  </div>
                  <div className="form-row" style={{ position: 'relative' }}>
                    <label>Courses of Interest <span className="required-star">*</span><span className="optional-label"> — up to 5</span></label>
                    <div className={`course-tag-input-wrapper${requestFormErrors.courses ? ' error-border' : ''}`}>
                      {reqCourses.map((course, i) => (
                        <span key={i} className="course-tag">
                          {course}
                          <button type="button" className="course-tag-remove" onClick={() => removeReqCourse(course)}>×</button>
                        </span>
                      ))}
                      {reqCourses.length < 5 && (
                        <input ref={reqCourseInputRef} type="text" className="course-tag-input"
                          placeholder={reqCourses.length === 0 ? "Type a course and press Enter…" : "Add another…"}
                          value={reqCourseInput} onChange={(e) => setReqCourseInput(e.target.value)}
                          onKeyDown={handleReqCourseKeyDown}
                          onFocus={() => { if (reqSuggestions.length > 0) setShowReqSuggestions(true); }}
                          onBlur={() => setTimeout(() => setShowReqSuggestions(false), 150)}
                          autoComplete="off" />
                      )}
                    </div>
                    <span className="course-tag-hint">Press Enter or , to add · Backspace to remove last</span>
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
                  <span>ℹ️</span>
                  <p>Once submitted, our admin team will review your request and notify you when the university is added.</p>
                </div>
              </div>
            )}
            {!requestSuccess && (
              <div className="modal-footer">
                <button className="cancel-btn ripple-effect" onClick={closeRequestModal} disabled={submittingRequest}>Cancel</button>
                <button className="save-btn ripple-effect" onClick={handleSubmitUniversityRequest} disabled={submittingRequest}>
                  {submittingRequest ? <span className="btn-loading"><span className="btn-spinner"></span> Submitting...</span> : 'Submit Request'}
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