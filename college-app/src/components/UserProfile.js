// src/components/UserProfile.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Common courses shown in autocomplete
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

const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('studentType') || 'firstyear';

  // Profile image state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Error state
  const [error, setError] = useState('');

  // ── Toast notification state ───────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  }, []);

  // Step 1: Basic Student Information
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: userEmail,
    mobile: "",
    dob: "",
    gender: "",
    nationality: "",
    residence: "",
  });

  // Step 2: Education Background
  const [education, setEducation] = useState({
    qualification: "",
    institution: "",
    field: "",
    year: "",
    cgpa: "",
  });

  // Step 3: Program Eligibility
  const [eligibleProgram, setEligibleProgram] = useState("");

  // Step 3: Selected Universities with Courses
  const [selectedUniversities, setSelectedUniversities] = useState([]);

  // All universities from MongoDB
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Course selection states
  const [universityCourses, setUniversityCourses] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Modal states for course selection
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [currentUniversity, setCurrentUniversity] = useState(null);
  const [currentUniversityCourses, setCurrentUniversityCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [tempSelectedCourses, setTempSelectedCourses] = useState([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState({ level: "", studyMode: "", majorArea: "" });

  // Request University States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ universityName: "", country: "" });
  const [requestFormErrors, setRequestFormErrors] = useState({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Course tag states for Request University modal
  const [reqCourseInput, setReqCourseInput] = useState("");
  const [reqCourses, setReqCourses] = useState([]);
  const [reqSuggestions, setReqSuggestions] = useState([]);
  const [showReqSuggestions, setShowReqSuggestions] = useState(false);
  const reqCourseInputRef = useRef(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Success animation state
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch existing profile on component mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!token) { setFetchingProfile(false); return; }
      try {
        setFetchingProfile(true);
        const response = await axios.get(`${API_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          setBasicInfo(profile.basicInfo || { fullName: "", email: userEmail, mobile: "", dob: "", gender: "", nationality: "", residence: "" });
          setEducation(profile.education || { qualification: "", institution: "", field: "", year: "", cgpa: "" });
          setEligibleProgram(profile.eligibleProgram || "");
          if (profile.selectedUniversities && profile.selectedUniversities.length > 0) {
            setSelectedUniversities(profile.selectedUniversities);
          } else {
            setSelectedUniversities([]);
          }
          if (profile.profileImage) setImagePreview(profile.profileImage);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setError('');
        } else if (error.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(`Server error: ${error.response?.status}`);
        }
      } finally {
        setFetchingProfile(false);
      }
    };
    checkExistingProfile();
  }, [token, userEmail]);

  useEffect(() => {
    const profileCompleted = localStorage.getItem('profileCompleted') === 'true';
    if (profileCompleted && !fetchingProfile && selectedUniversities.length > 0) {
      navigateToDashboard();
    }
  }, [fetchingProfile, selectedUniversities]);

  useEffect(() => {
    fetchUniversitiesFromMongoDB();
  }, []);

  useEffect(() => {
    if (universities.length > 0) filterUniversities();
  }, [eligibleProgram, searchTerm, universities]);

  useEffect(() => {
    if (currentUniversityCourses.length > 0) filterCourses();
  }, [courseSearchTerm, courseFilter, currentUniversityCourses]);

  useEffect(() => {
    const term = reqCourseInput.trim().toLowerCase();
    if (!term) { setReqSuggestions([]); setShowReqSuggestions(false); return; }
    const filtered = COURSE_SUGGESTIONS_LIST
      .filter(c => c.toLowerCase().includes(term) && !reqCourses.includes(c))
      .slice(0, 6);
    setReqSuggestions(filtered);
    setShowReqSuggestions(filtered.length > 0);
  }, [reqCourseInput, reqCourses]);

  const fetchUniversitiesFromMongoDB = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/api/admin/universities`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        setUniversities(response.data.data || []);
        for (const uni of response.data.data) {
          await fetchUniversityCourses(uni);
        }
      } else {
        setError(response.data.message || "Failed to load universities");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.code === 'ERR_NETWORK') {
        setError("Cannot connect to server. Please make sure the server is running.");
      } else {
        setError(error.response?.data?.message || "Failed to load universities. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversityCourses = async (university) => {
    try {
      const uniId = university.UNITID || university._id;
      if (university.INSTNM?.toLowerCase().includes('kansas')) return;
      let courses = [];
      if (university.programs && Array.isArray(university.programs)) {
        courses = university.programs.map(prog => ({
          id: prog.id || prog.programId || `prog-${Date.now()}-${Math.random()}`,
          title: prog.title || prog.program_name || 'Program',
          program_name: prog.program_name || prog.title,
          level: prog.level || 'Undergraduate',
          studyMode: prog.studyMode || 'On Campus',
          locations: prog.locations || [`${university.CITY || ''}, ${university.STABBR || ''}`],
          duration: prog.duration || '3-4 years',
          description: prog.description || `${prog.title} program at ${university.INSTNM}`,
          majorArea: prog.majorArea || 'General'
        }));
      } else if (university.GUS_DATA?.programs_data) {
        courses = university.GUS_DATA.programs_data.map(prog => ({
          id: prog.id || `prog-${Date.now()}-${Math.random()}`,
          title: prog.title || prog.program_name || 'Program',
          program_name: prog.program_name || prog.title,
          level: prog.level || university.GUS_DATA?.level || 'Undergraduate',
          studyMode: prog.studyMode || 'On Campus',
          locations: prog.locations || [`${university.CITY || ''}, ${university.STABBR || ''}`],
          duration: prog.duration || '3-4 years',
          description: prog.description || `${prog.title} program at ${university.INSTNM}`,
          majorArea: prog.majorArea || 'General'
        }));
      } else if (university.GUS_DATA?.major_areas) {
        university.GUS_DATA.major_areas.forEach(area => {
          if (area.specific_programs) {
            area.specific_programs.forEach(prog => {
              courses.push({
                id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
                title: prog.program_name,
                program_name: prog.program_name,
                level: university.GUS_DATA?.level || 'Undergraduate',
                studyMode: 'On Campus',
                locations: [`${university.CITY || ''}, ${university.STABBR || ''}`],
                majorArea: area.major_area,
                duration: '3-4 years',
                description: `${prog.program_name} program in ${area.major_area} at ${university.INSTNM}`
              });
            });
          }
        });
      } else if (university.metadata?.programs) {
        courses = university.metadata.programs.map(prog => ({
          id: prog.id || `prog-${Date.now()}-${Math.random()}`,
          title: prog.title || prog.program_name || 'Program',
          program_name: prog.program_name || prog.title,
          level: prog.level || 'Undergraduate',
          studyMode: prog.studyMode || 'On Campus',
          locations: prog.locations || [`${university.CITY || ''}, ${university.STABBR || ''}`],
          duration: prog.duration || '3-4 years',
          description: prog.description || `${prog.title} program at ${university.INSTNM}`,
          majorArea: prog.majorArea || 'General'
        }));
      }
      setUniversityCourses(prev => ({ ...prev, [uniId]: courses }));
    } catch (error) {
      console.error(`Error fetching courses for ${university.INSTNM}:`, error);
    }
  };

  const filterCourses = () => {
    let filtered = [...currentUniversityCourses];
    if (courseSearchTerm.trim()) {
      const term = courseSearchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        (course.title || course.program_name || '').toLowerCase().includes(term) ||
        (course.majorArea || '').toLowerCase().includes(term) ||
        (course.level || '').toLowerCase().includes(term) ||
        (course.description || '').toLowerCase().includes(term)
      );
    }
    if (courseFilter.level) filtered = filtered.filter(course => (course.level || '').toLowerCase() === courseFilter.level.toLowerCase());
    if (courseFilter.studyMode) filtered = filtered.filter(course => (course.studyMode || '').toLowerCase().includes(courseFilter.studyMode.toLowerCase()));
    if (courseFilter.majorArea) filtered = filtered.filter(course => (course.majorArea || '').toLowerCase().includes(courseFilter.majorArea.toLowerCase()));
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

  const filterUniversities = () => {
    let filtered = [...universities];
    if (eligibleProgram) {
      if (eligibleProgram === "Master") {
        filtered = filtered.filter(u =>
          u.metadata?.programs?.length > 0 ||
          u.metadata?.majorAreas?.length > 0 ||
          u.GUS_DATA?.programs_data?.length > 0 ||
          u.GUS_DATA?.major_areas?.length > 0
        );
      } else if (eligibleProgram === "PhD") {
        filtered = filtered.filter(u =>
          u.INSTNM?.toLowerCase().includes('university') &&
          (u.metadata?.iclevel === 1 || u.metadata?.programs?.length > 10)
        );
      }
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => {
        const instnm = (u.INSTNM || '').toLowerCase();
        const city = (u.location?.city || u.CITY || '').toLowerCase();
        const state = (u.location?.state || u.STABBR || '').toLowerCase();
        const alias = (u.IALIAS || '').toLowerCase();
        return instnm.includes(term) || city.includes(term) || state.includes(term) || alias.includes(term);
      });
    }
    setFilteredUniversities(filtered);
  };

  const openCourseModal = (university) => {
    const uniId = university.UNITID || university._id;
    const isKansas = university.INSTNM?.toLowerCase().includes('kansas');
    if (isKansas) {
      setError("Kansas universities don't have course selection. They will be added directly.");
      setTimeout(() => setError(''), 3000);
      toggleUniversity(university);
      return;
    }
    setCurrentUniversity(university);
    const courses = universityCourses[uniId] || [];
    setCurrentUniversityCourses(courses);
    setFilteredCourses(courses);
    setCourseSearchTerm("");
    setCourseFilter({ level: "", studyMode: "", majorArea: "" });
    const existingUni = selectedUniversities.find(u => u.UNITID === university.UNITID || u._id === university._id);
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
    const isUniSelected = selectedUniversities.some(u => {
      if (u.UNITID && currentUniversity.UNITID && u.UNITID === currentUniversity.UNITID) return true;
      if (u._id && currentUniversity._id && u._id.toString() === currentUniversity._id.toString()) return true;
      return false;
    });
    const universityWithCourses = {
      UNITID: currentUniversity.UNITID, _id: currentUniversity._id,
      INSTNM: currentUniversity.INSTNM, CITY: currentUniversity.CITY,
      STABBR: currentUniversity.STABBR, COUNTRY: currentUniversity.COUNTRY || 'USA',
      location: currentUniversity.location || {},
      selectedCourses: tempSelectedCourses.map(course => ({
        id: course.id, title: course.title, program_name: course.program_name,
        level: course.level, studyMode: course.studyMode, duration: course.duration,
        locations: course.locations, majorArea: course.majorArea, description: course.description
      }))
    };
    if (isUniSelected) {
      setSelectedUniversities(selectedUniversities.map(u => {
        if (u.UNITID === currentUniversity.UNITID || u._id === currentUniversity._id) return universityWithCourses;
        return u;
      }));
    } else if (selectedUniversities.length < 5) {
      setSelectedUniversities([...selectedUniversities, universityWithCourses]);
    }
    setShowCourseModal(false);
    setCurrentUniversity(null);
    setTempSelectedCourses([]);
    document.body.style.overflow = 'auto';
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const closeCourseModal = () => {
    setShowCourseModal(false);
    setCurrentUniversity(null);
    setTempSelectedCourses([]);
    setCourseSearchTerm("");
    setCourseFilter({ level: "", studyMode: "", majorArea: "" });
    document.body.style.overflow = 'auto';
  };

  const toggleUniversity = (university) => {
    if (!university) return;
    const isKansas = university.INSTNM?.toLowerCase().includes('kansas');
    const isSelected = selectedUniversities.some(u => {
      if (u.UNITID && university.UNITID && u.UNITID === university.UNITID) return true;
      if (u._id && university._id && u._id.toString() === university._id.toString()) return true;
      return false;
    });
    if (isSelected) {
      setSelectedUniversities(selectedUniversities.filter(u => {
        if (u.UNITID && university.UNITID && u.UNITID === university.UNITID) return false;
        if (u._id && university._id && u._id.toString() === university._id.toString()) return false;
        return true;
      }));
    } else if (selectedUniversities.length < 5) {
      if (isKansas) {
        const kansasUniversity = {
          UNITID: university.UNITID, _id: university._id, INSTNM: university.INSTNM,
          CITY: university.CITY, STABBR: university.STABBR, COUNTRY: university.COUNTRY || 'USA',
          location: university.location || {}, selectedCourses: [], isKansas: true
        };
        setSelectedUniversities([...selectedUniversities, kansasUniversity]);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } else {
        openCourseModal(university);
      }
    } else {
      setError("You can select maximum 5 universities");
      setTimeout(() => setError(''), 2000);
    }
  };

  const removeUniversity = (university) => {
    setSelectedUniversities(selectedUniversities.filter(u => {
      if (u.UNITID && university.UNITID && u.UNITID === university.UNITID) return false;
      if (u._id && university._id && u._id.toString() === university._id.toString()) return false;
      return true;
    }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1000);
  };

  // ─── Request University Handlers ──────────────────────────────────────────

  const openRequestModal = () => {
    setRequestForm({ universityName: searchTerm || "", country: "" });
    setRequestFormErrors({});
    setRequestSuccess(false);
    setReqCourses([]);
    setReqCourseInput("");
    setReqSuggestions([]);
    setShowReqSuggestions(false);
    setShowRequestModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setRequestForm({ universityName: "", country: "" });
    setRequestFormErrors({});
    setRequestSuccess(false);
    setReqCourses([]);
    setReqCourseInput("");
    setReqSuggestions([]);
    setShowReqSuggestions(false);
    document.body.style.overflow = 'auto';
  };

  const addReqCourse = (courseName) => {
    const trimmed = courseName.trim().replace(/,+$/, '');
    if (!trimmed) return;
    if (reqCourses.includes(trimmed)) { setReqCourseInput(""); return; }
    if (reqCourses.length >= 5) {
      setRequestFormErrors(prev => ({ ...prev, courses: "You can add up to 5 courses" }));
      return;
    }
    setReqCourses(prev => [...prev, trimmed]);
    setReqCourseInput("");
    setReqSuggestions([]);
    setShowReqSuggestions(false);
    setRequestFormErrors(prev => ({ ...prev, courses: null }));
    setTimeout(() => reqCourseInputRef.current?.focus(), 0);
  };

  const removeReqCourse = (courseName) => setReqCourses(prev => prev.filter(c => c !== courseName));

  const handleReqCourseKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (reqCourseInput.trim()) addReqCourse(reqCourseInput);
    } else if (e.key === 'Backspace' && reqCourseInput === '' && reqCourses.length > 0) {
      setReqCourses(prev => prev.slice(0, -1));
    }
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
      const response = await axios.post(
        // ✅ FIXED: was /api/university/request — now correctly under /api/user/
        `${API_URL}/api/user/university/request`,
        {
          universityName: requestForm.universityName.trim(),
          country: requestForm.country.trim(),
          interestedCourses: reqCourses,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data.success) {
        setRequestSuccess(true);
        setTimeout(() => closeRequestModal(), 3500);
      } else {
        setRequestFormErrors({ submit: response.data.message || "Failed to submit request. Please try again." });
      }
    } catch (err) {
      console.error("Error submitting university request:", err);
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' ? "Cannot connect to server." : "Failed to submit request.");
      setRequestFormErrors({ submit: msg });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const errors = {};
    if (!basicInfo.fullName) errors.fullName = "Full name is required";
    if (!basicInfo.mobile) errors.mobile = "Mobile number is required";
    if (!basicInfo.dob) errors.dob = "Date of birth is required";
    if (!basicInfo.gender) errors.gender = "Gender is required";
    if (!basicInfo.nationality) errors.nationality = "Nationality is required";
    if (!basicInfo.residence) errors.residence = "Country of residence is required";
    if (basicInfo.mobile && !/^[0-9+\-\s()]{10,15}$/.test(basicInfo.mobile)) {
      errors.mobile = "Please enter a valid mobile number";
    }
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
    if (selectedUniversities.length < 3) {
      setError('Please select at least 3 universities');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    for (const uni of selectedUniversities) {
      const isKansas = uni.INSTNM?.toLowerCase().includes('kansas') || uni.isKansas;
      if (!isKansas && (uni.selectedCourses || []).length === 0) {
        setError(`Please select at least one course for ${uni.INSTNM}`);
        setTimeout(() => setError(''), 3000);
        return false;
      }
    }
    return true;
  };

  const isStep1Valid = () =>
    basicInfo.fullName && basicInfo.mobile && basicInfo.dob &&
    basicInfo.gender && basicInfo.nationality && basicInfo.residence;

  const isStep2Valid = () =>
    education.qualification && education.institution &&
    education.field && education.year && education.cgpa;

  const isStep3Valid = () => {
    if (selectedUniversities.length < 3) return false;
    for (const uni of selectedUniversities) {
      const isKansas = uni.INSTNM?.toLowerCase().includes('kansas') || uni.isKansas;
      if (!isKansas && (uni.selectedCourses || []).length === 0) return false;
    }
    return true;
  };

  const navigateToDashboard = () => {
    if (userType === 'transfer') {
      navigate('/transfer/dashboard');
    } else {
      navigate('/firstyear/dashboard');
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !token) return null;
    try {
      const response = await axios.patch(
        `${API_URL}/api/user/profile/image`,
        { profileImage: imagePreview },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (response.data.success) return response.data.data;
    } catch (error) {
      console.error("Error uploading profile image:", error);
    }
    return null;
  };

  const handleSubmitProfile = async () => {
    if (!token) { setError("You must be logged in to submit your profile"); return; }
    if (!validateStep3()) return;

    setSaving(true);
    setError('');
    let formattedUniversities = [];

    try {
      if (profileImage) await uploadProfileImage();

      formattedUniversities = selectedUniversities.map(u => {
        const isKansas = u.INSTNM?.toLowerCase().includes('kansas') || u.isKansas;
        const city = u.CITY || u.location?.city || '';
        const state = u.STABBR || u.location?.state || '';
        const locationStr = city + (city && state ? ', ' : '') + state;
        const courses = u.selectedCourses || [];
        return {
          id: u.UNITID?.toString() || u._id?.toString() || '',
          unitid: u.UNITID || null,
          name: u.INSTNM || 'Unknown University',
          location: locationStr || 'Location not specified',
          city, state,
          country: u.COUNTRY || u.location?.country || 'USA',
          isKansas: !!isKansas,
          selectedCourses: courses.map(c => ({
            id: c.id || `course-${Math.random()}`,
            title: c.title || c.program_name || 'Program',
            program_name: c.program_name || c.title || '',
            level: c.level || '',
            studyMode: c.studyMode || '',
            duration: c.duration || '',
            locations: Array.isArray(c.locations) ? c.locations : [],
            majorArea: c.majorArea || '',
            description: c.description || ''
          }))
        };
      });

      const profileData = {
        profileImage: imagePreview, basicInfo, education, eligibleProgram,
        selectedUniversities: formattedUniversities, profileCompleted: true,
        completedAt: new Date().toISOString()
      };

      const payloadSize = JSON.stringify(profileData).length;
      console.log("📦 Payload size (bytes):", payloadSize);
      if (payloadSize > 500000) {
        setError("Profile data is too large. Please reduce course selections.");
        setSaving(false);
        return;
      }

      const response = await axios.post(`${API_URL}/api/user/profile`, profileData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        localStorage.setItem('profileCompleted', 'true');
        setShowSuccess(true);
        // ✅ FIXED: replaced alert() with toast
        showToast("Profile submitted successfully! Redirecting to dashboard...", "success");
        setTimeout(() => navigateToDashboard(), 1500);
      } else {
        setError(response.data.message || "Failed to save profile");
      }
    } catch (error) {
      let errorMessage = "Failed to save profile. Please try again.";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.errors?.join(', ') || error.response.data.message || "Invalid profile data";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Saving locally only.";
      }
      setError(errorMessage);

      const profileData = {
        profileImage: imagePreview, basicInfo, education, eligibleProgram,
        selectedUniversities: formattedUniversities,
        completedAt: new Date().toISOString(), profileCompleted: true
      };
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      localStorage.setItem('profileCompleted', 'true');
      setShowSuccess(true);
      // ✅ FIXED: replaced alert() with toast
      showToast("Profile saved locally! Redirecting to dashboard...", "warning");
      setTimeout(() => navigateToDashboard(), 1500);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProgress = (nextStep) => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && nextStep === 4 && !validateStep3()) return;
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      navigateToDashboard();
    }
  };

  const getInitials = (name) => {
    if (!name) return "UNI";
    return name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase();
  };

  const getProgramCount = (university) => {
    if (university.programs && Array.isArray(university.programs)) return university.programs.length;
    if (university.GUS_DATA?.programs_data) return university.GUS_DATA.programs_data.length;
    if (university.metadata?.programs) return university.metadata.programs.length;
    return 0;
  };

  const getUserInitials = () => {
    if (basicInfo.fullName) {
      return basicInfo.fullName.split(' ').map(name => name[0]).slice(0, 2).join('').toUpperCase();
    }
    return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  };

  const handleRetry = () => fetchUniversitiesFromMongoDB();

  const getLevelColor = (level) => {
    const l = level?.toLowerCase() || '';
    if (l.includes('bachelor') || l.includes('undergraduate')) return '#4CAF50';
    if (l.includes('master') || l.includes('graduate')) return '#FF9800';
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

  const getUniqueLevels = () => [...new Set(currentUniversityCourses.map(c => c.level).filter(Boolean))];
  const getUniqueStudyModes = () => [...new Set(currentUniversityCourses.map(c => c.studyMode).filter(Boolean))];
  const getUniqueMajorAreas = () => [...new Set(currentUniversityCourses.map(c => c.majorArea).filter(Boolean))];

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
      {/* ── Toast Notification ─────────────────────────────────────────────── */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="checkmark"></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                />
                <span className="upload-icon">+</span>
              </label>
            </div>
          </div>

          <div className="header-title-section">
            <h1 className="header-title">Complete Your Profile</h1>
            <p className="header-email">{basicInfo.email}</p>
          </div>

          <button className="header-cancel-btn ripple-effect" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      <div className="userprofile-profile-content">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            {error.includes("Cannot connect") && (
              <button className="retry-btn ripple-effect" onClick={handleRetry}>Retry</button>
            )}
          </div>
        )}

        {/* Progress Steps */}
        <div className="userprofile-progress-container">
          <div className="progress-steps-horizontal">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Education" },
              { num: 3, label: "Universities & Courses" },
              { num: 4, label: "Review" },
            ].map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Personal Information</h2>
              <p>Tell us about yourself</p>
            </div>
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

        {/* Step 2: Education Background */}
        {step === 2 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Education Background</h2>
              <p>Tell us about your academic journey</p>
            </div>
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

        {/* Step 3: Select Universities and Courses */}
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
                <input type="text" className="search-input"
                  placeholder="Search universities by name, city, country..."
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
                      const uniId = uni.UNITID || uni._id;
                      const isKansas = uni.INSTNM?.toLowerCase().includes('kansas');
                      const isSelected = selectedUniversities.some(u => {
                        if (u.UNITID && uni.UNITID && u.UNITID === uni.UNITID) return true;
                        if (u._id && uni._id && u._id.toString() === uni._id.toString()) return true;
                        return false;
                      });
                      const programCount = getProgramCount(uni);
                      const location = uni.CITY || uni.location?.city || '';
                      const state = uni.STABBR || uni.location?.state || '';
                      const selectedUni = selectedUniversities.find(u => u.UNITID === uni.UNITID || u._id === uni._id);
                      const selectedCoursesForUni = selectedUni?.selectedCourses || [];

                      return (
                        <div key={uniId?.toString() || Math.random()} className="university-card-wrapper">
                          <div
                            className={`university-card ${isSelected ? 'selected' : ''} ${isKansas ? 'kansas' : ''}`}
                            onClick={() => toggleUniversity(uni)}
                          >
                            <div className="university-logo">{getInitials(uni.INSTNM)}</div>
                            <div className="university-details">
                              <h4>{uni.INSTNM || 'Unknown University'}</h4>
                              <p>{location}{location && state ? ', ' : ''}{state}</p>
                              {programCount > 0 && !isKansas && (
                                <span className="program-badge">{programCount} courses available</span>
                              )}
                              {isKansas && <span className="kansas-badge">Direct Apply Only</span>}
                            </div>
                            {isSelected && <span className="check-mark">✓</span>}
                          </div>

                          {isSelected && !isKansas && selectedCoursesForUni.length > 0 && (
                            <div className="selected-courses-preview">
                              <span className="preview-label">Selected courses:</span>
                              <div className="preview-courses">
                                {selectedCoursesForUni.map((course, idx) => (
                                  <span key={idx} className="preview-course-tag">
                                    {course.title || course.program_name}
                                  </span>
                                ))}
                              </div>
                              <button className="edit-courses-btn ripple-effect" onClick={(e) => { e.stopPropagation(); openCourseModal(uni); }}>
                                Edit Courses
                              </button>
                            </div>
                          )}

                          {isSelected && !isKansas && selectedCoursesForUni.length === 0 && (
                            <div className="selected-courses-preview warning">
                              <span className="preview-label">⚠️ No courses selected</span>
                              <button className="edit-courses-btn ripple-effect" onClick={(e) => { e.stopPropagation(); openCourseModal(uni); }}>
                                Select Courses
                              </button>
                            </div>
                          )}

                          {isSelected && isKansas && (
                            <div className="kansas-note"><span>Kansas University - Direct Apply</span></div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-results">
                      <p>No universities found matching your search.</p>
                      {universities.length === 0 && (
                        <button className="retry-btn ripple-effect" onClick={handleRetry}>Refresh Universities</button>
                      )}
                    </div>
                  )}
                </div>

                {/* Request University Banner */}
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

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Review Your Profile</h2>
              <p>Please verify your information before submitting</p>
            </div>
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
                {selectedUniversities.length > 0 ? (
                  selectedUniversities.map((uni, index) => {
                    const isKansas = uni.INSTNM?.toLowerCase().includes('kansas') || uni.isKansas;
                    const courses = uni.selectedCourses || [];
                    return (
                      <div key={uni.UNITID || uni._id} className="review-university-item">
                        <p className="review-university-name">
                          <strong>{index + 1}. {uni.INSTNM || 'Unknown University'}</strong>
                          {isKansas && <span className="kansas-tag"> (Direct Apply)</span>}
                        </p>
                        {!isKansas && courses.length > 0 && (
                          <div className="review-courses-list">
                            <p className="courses-label">Selected Courses ({courses.length}):</p>
                            <ul>
                              {courses.map((course, idx) => (
                                <li key={idx}>
                                  {course.title || course.program_name}
                                  {course.level && <span className="course-level"> - {course.level}</span>}
                                  {course.studyMode && <span className="course-mode"> ({course.studyMode})</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!isKansas && courses.length === 0 && (
                          <p className="warning-text">⚠️ No courses selected for this university</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>No universities selected</p>
                )}
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

        {/* Bottom Progress Steps */}
        <div className="bottom-progress">
          <div className="progress-steps-horizontal">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Education" },
              { num: 3, label: "Universities & Courses" },
              { num: 4, label: "Review" },
            ].map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Selection Modal */}
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
                  {courseSearchTerm && (
                    <button className="clear-search-btn" onClick={() => setCourseSearchTerm("")}>×</button>
                  )}
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
                    <button className="clear-all-filters" onClick={() => { setCourseSearchTerm(""); setCourseFilter({ level: "", studyMode: "", majorArea: "" }); }}>
                      Clear All
                    </button>
                  </div>
                )}
              </div>
              {loadingCourses ? (
                <div className="courses-loading">
                  <div className="spinner-small"></div>
                  <p>Loading courses...</p>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="courses-grid">
                  {filteredCourses.map((course, idx) => {
                    const isSelected = tempSelectedCourses.some(c => c.id === course.id);
                    return (
                      <div key={course.id || idx} className={`course-card ${isSelected ? 'selected' : ''}`} onClick={() => toggleTempCourse(course)}>
                        <h4 className="course-title">{course.title || course.program_name}</h4>
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
                  <p>No courses match your search criteria.</p>
                  <button className="clear-filters-btn" onClick={() => { setCourseSearchTerm(""); setCourseFilter({ level: "", studyMode: "", majorArea: "" }); }}>
                    Clear Filters
                  </button>
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

      {/* Request University Modal */}
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
                <p>
                  Your request for <strong>"{requestForm.universityName}"</strong> has been sent to our admin team.
                  They'll review it along with your course interests and notify you once it's added.
                </p>
                {reqCourses.length > 0 && (
                  <div className="request-success-courses">
                    <p className="success-courses-label">Courses you requested:</p>
                    <div className="success-course-tags">
                      {reqCourses.map((c, i) => (
                        <span key={i} className="success-course-tag">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="request-success-note">This window will close automatically…</p>
              </div>
            ) : (
              <div className="modal-body">
                <p className="request-modal-desc">
                  Can't find your university? Fill in the details below and our team will review and add it.
                </p>

                {requestFormErrors.submit && (
                  <div className="request-submit-error">
                    <span>⚠️ {requestFormErrors.submit}</span>
                  </div>
                )}

                <div className="form-fields">
                  <div className="form-row">
                    <label>University Name <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., Harvard University"
                      value={requestForm.universityName}
                      onChange={(e) => { setRequestForm({ ...requestForm, universityName: e.target.value }); if (requestFormErrors.universityName) setRequestFormErrors({ ...requestFormErrors, universityName: null }); }}
                      className={requestFormErrors.universityName ? 'error' : ''} />
                    {requestFormErrors.universityName && <span className="field-error">{requestFormErrors.universityName}</span>}
                  </div>

                  <div className="form-row">
                    <label>Country <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., United States"
                      value={requestForm.country}
                      onChange={(e) => { setRequestForm({ ...requestForm, country: e.target.value }); if (requestFormErrors.country) setRequestFormErrors({ ...requestFormErrors, country: null }); }}
                      className={requestFormErrors.country ? 'error' : ''} />
                    {requestFormErrors.country && <span className="field-error">{requestFormErrors.country}</span>}
                  </div>

                  <div className="form-row" style={{ position: 'relative' }}>
                    <label>
                      Courses of Interest <span className="required-star">*</span>
                      <span className="optional-label"> — up to 5</span>
                    </label>
                    <div className={`course-tag-input-wrapper${requestFormErrors.courses ? ' error-border' : ''}`}>
                      {reqCourses.map((course, i) => (
                        <span key={i} className="course-tag">
                          {course}
                          <button type="button" className="course-tag-remove"
                            onClick={() => removeReqCourse(course)} aria-label={`Remove ${course}`}>×</button>
                        </span>
                      ))}
                      {reqCourses.length < 5 && (
                        <input ref={reqCourseInputRef} type="text" className="course-tag-input"
                          placeholder={reqCourses.length === 0 ? "Type a course and press Enter…" : "Add another…"}
                          value={reqCourseInput}
                          onChange={(e) => setReqCourseInput(e.target.value)}
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
                          <button key={i} type="button" className="course-suggestion-item"
                            onMouseDown={() => addReqCourse(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                    {requestFormErrors.courses && <span className="field-error">{requestFormErrors.courses}</span>}
                  </div>
                </div>

                <div className="request-info-note">
                  <span>ℹ️</span>
                  <p>Once submitted, our admin team will review your request along with your course interests and notify you when the university is added or if it's rejected.</p>
                </div>
              </div>
            )}

            {!requestSuccess && (
              <div className="modal-footer">
                <button className="cancel-btn ripple-effect" onClick={closeRequestModal} disabled={submittingRequest}>
                  Cancel
                </button>
                <button className="save-btn ripple-effect" onClick={handleSubmitUniversityRequest} disabled={submittingRequest}>
                  {submittingRequest ? (
                    <span className="btn-loading">
                      <span className="btn-spinner"></span> Submitting...
                    </span>
                  ) : 'Submit Request'}
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