import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./score.css";
import API_BASE_URL from "./../../../../config/api"; // adjust path as needed
import {
  deleteGradeDocument,
  extractGradeDocument,
  getApplicationDocuments,
  getGradeDocumentViewUrl,
  replaceGradeDocument,
} from "./../../../../api/scoresApi";

const SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Economics",
  "Computer Science", 
  "Physical Education",
  "Arts",
  "Commerce",
  "Accountancy",
  "Business Studies",
  "Political Science",
  "Sociology",
  "Psychology",
];
const VALID_ACADEMIC_SUBJECTS = [
  ...SUBJECTS,
  "Sanskrit",
  "Telugu",
  "Mathematics A",
  "Mathematics B",
  "Botany",
  "Zoology",
  "Informatics Practices",
  "Environmental Science",
  "Social Science",
  "Hindi Course-B",
  "Second Language",
];
const INVALID_SUBJECT_PATTERN =
  /(GRADE\s*>=|RESULT|DATE|NOTE|CONTROLLER|EXAMINATIONS|SCHOOL|COLLEGE|HYDERABAD|VIDYA\s+BHAVAN|NAMAPALLY|NAMPALLY|REGD\s+NUMBER|FATHER|MOTHER|MARKS\s+RANGE|GRAND\s+TOTAL|DOWNLOADED|INSTRUCTIONS|ELIGIBILITY)/i;

const GRADES = ["grade9", "grade10", "grade11", "grade12"];
const GRADE_LEVELS = {
  grade9: "9",
  grade10: "10",
  grade11: "11",
  grade12: "12",
};
const MARK_SCALE_OPTIONS = [
  { value: "100", label: "/100" },
  { value: "10", label: "/10" },
  { value: "5", label: "/5" },
  { value: "4", label: "/4" },
  { value: "60", label: "/60" },
  { value: "150", label: "/150" },
  { value: "letter", label: "Letter Grade" },
  { value: "custom", label: "Custom Scale" },
];
const VALID_LETTER_GRADES = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "A+", "A", "B+", "B", "C", "D", "E", "F"];
const LANGUAGE_SUBJECT_PATTERN = /(english|hindi|telugu|language|sanskrit|french|spanish|urdu|tamil|kannada|malayalam|marathi|bengali)/i;
const PERCENTAGE_SUBJECT_PATTERN = /(percentage|percent|overall|aggregate|gpa|cgpa)/i;
const SCALE_7_SUBJECT_PATTERN = /(personal\s*project|interdisciplinary|ib\s*myp|myp)/i;

const getDefaultMaxMarks = (subject = "") => {
  if (SCALE_7_SUBJECT_PATTERN.test(subject)) {
    return 7;
  }
  if (/math|mathematics/i.test(subject) || LANGUAGE_SUBJECT_PATTERN.test(subject)) {
    return 150;
  }
  if (PERCENTAGE_SUBJECT_PATTERN.test(subject)) {
    return 100;
  }
  return 60;
};

const emptyGradeSubjects = () => ({
  grade9: [],
  grade10: [],
  grade11: [],
  grade12: [],
});

const emptySubjectMarks = () => ({
  grade9: {},
  grade10: {},
  grade11: {},
  grade12: {},
});

const normalizeSubjectName = (value = "") =>
  value.trim().replace(/\s+/g, " ");

const normalizeAcademicSubjectName = (value = "") => {
  const raw = normalizeSubjectName(value).replace(/[-:]+$/g, "");
  if (!raw || INVALID_SUBJECT_PATTERN.test(raw)) return "";
  if (/ENGLISH\s+LNG\s*&\s*LIT\.?/i.test(raw)) return "English";
  if (/MATHEMATICS\s+STANDARD/i.test(raw)) return "Mathematics";
  if (/HINDI\s+COURSE[-\s]*B/i.test(raw)) return "Hindi";
  if (/ENGLISH\s+COMM\.?/i.test(raw)) return "English";
  if (/TELUGU\s+TELANGANA/i.test(raw)) return "Telugu";
  const match = VALID_ACADEMIC_SUBJECTS
    .sort((a, b) => b.length - a.length)
    .find((subject) => new RegExp(`\\b${subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(raw));
  if (match) return match;
  if (
    /[A-Za-z]/.test(raw) &&
    raw.length >= 3 &&
    raw.length <= 70 &&
    raw.split(/\s+/).length <= 6 &&
    !/(total|result|percentage|semester|maximum|minimum|obtained|secured|credits?|grade\s*points?|roll|name|date)/i.test(raw)
  ) {
    return raw
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
};

const getValidPreviewSubjects = (preview) =>
  (preview?.subjects || []).filter((subject) =>
    Boolean(normalizeAcademicSubjectName(subject.subjectName || ""))
  );

const formatDecimalValue = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(String(value).replace("%", ""));
  if (!Number.isFinite(numeric)) return String(value);
  return Number(numeric.toFixed(2)).toString();
};

const normalizeMarkEntry = (entry, subject = "") => {
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const gradeType = entry.gradeType || (entry.scale === "letter" ? "letter" : "marks");
    const maxMarks = Number(entry.maxMarks || entry.max || entry.outOf) || getDefaultMaxMarks(subject);
    return {
      marks: entry.marks ?? entry.value ?? "",
      maxMarks,
      gradeType,
      scale: entry.scale || (gradeType === "letter" ? "letter" : `/${maxMarks}`),
      percentage: entry.percentage ?? null,
      confidence: entry.confidence ?? 1,
      needsReview: entry.needsReview || false,
      reviewReason: entry.reviewReason || "",
      sourceDocument: entry.sourceDocument || "",
    };
  }

  return {
    marks: formatDecimalValue(entry ?? ""),
    maxMarks: getDefaultMaxMarks(subject),
    gradeType: "marks",
    scale: `/${getDefaultMaxMarks(subject)}`,
    percentage: null,
    confidence: 1,
    needsReview: false,
    reviewReason: "",
    sourceDocument: "",
  };
};

const normalizeAllSubjectMarks = (marks = {}) => {
  const normalized = emptySubjectMarks();
  GRADES.forEach((grade) => {
    Object.entries(marks[grade] || {}).forEach(([subject, entry]) => {
      normalized[grade][subject] = normalizeMarkEntry(entry, subject);
    });
  });
  return normalized;
};

const emptyGradeMode = () => ({
  grade9: null,
  grade10: null,
  grade11: null,
  grade12: null,
});

const emptyGradeExtraction = () => ({
  grade9: { loading: false, preview: null, error: "" },
  grade10: { loading: false, preview: null, error: "" },
  grade11: { loading: false, preview: null, error: "" },
  grade12: { loading: false, preview: null, error: "" },
});

const emptyGradeDocuments = () => ({
  grade9: null,
  grade10: null,
  grade11: null,
  grade12: null,
});

const hasAcademicScoreData = (gradeSubjects = {}, subjectMarks = {}) =>
  GRADES.some((grade) =>
    (gradeSubjects[grade] || []).length > 0 ||
    Object.keys(subjectMarks[grade] || {}).length > 0
  );

const Score = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [scores, setScores] = useState({});
  const [selectedTests, setSelectedTests] = useState({
    sat: false,
    psat: false,
    act: false,
    toefl: false,
    ielts: false,
    ap: false,
    pte: false,
    duolingo: false,
  });

  const [gradeSubjects, setGradeSubjects] = useState(emptyGradeSubjects);

  const [subjectMarks, setSubjectMarks] = useState(emptySubjectMarks);

  const [expandedGrades, setExpandedGrades] = useState({
    grade9: false,
    grade10: false,
    grade11: false,
    grade12: false,
  });

  const [subjectSearch, setSubjectSearch] = useState({
    grade9: "",
    grade10: "",
    grade11: "",
    grade12: "",
  });
  const [gradeEntryMode, setGradeEntryMode] = useState(emptyGradeMode);
  const [gradeExtraction, setGradeExtraction] = useState(emptyGradeExtraction);
  const [gradeDocuments, setGradeDocuments] = useState(emptyGradeDocuments);
  const [documentActions, setDocumentActions] = useState(emptyGradeMode);
  const [savedAcademicScores, setSavedAcademicScores] = useState(null);
  const [savedAcademicChoice, setSavedAcademicChoice] = useState(null);
  const [currentSessionUploads, setCurrentSessionUploads] = useState(emptyGradeMode);
  const [showSkipModal, setShowSkipModal] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchScores();
  }, []);

  useEffect(() => {
    setShowSkipModal(true);
  }, []);

  const applyAcademicScoreData = (data = {}) => {
    const mergedSubjects = { ...emptyGradeSubjects(), ...(data.gradeSubjects || {}) };
    setGradeSubjects(mergedSubjects);
    setSubjectMarks(normalizeAllSubjectMarks(data.subjectMarks || {}));
    setGradeEntryMode((prev) => {
      const next = { ...prev };
      GRADES.forEach((grade) => {
        if ((mergedSubjects[grade] || []).length > 0) next[grade] = "manual";
      });
      return next;
    });
  };

  const clearAcademicScoreState = () => {
    setGradeSubjects(emptyGradeSubjects());
    setSubjectMarks(emptySubjectMarks());
    setGradeEntryMode(emptyGradeMode());
    setGradeExtraction(emptyGradeExtraction());
    setGradeDocuments(emptyGradeDocuments());
    setCurrentSessionUploads(emptyGradeMode());
  };

  const applySelectedTestsFromScores = (data = {}) => {
    setSelectedTests({
      sat: !!data.satTotal,
      psat: !!data.psatTotal,
      act: !!data.act,
      toefl: !!data.toefl,
      ielts: !!data.ielts,
      ap: !!data.ap,
      pte: !!data.pte,
      duolingo: !!data.duolingo,
    });
  };

  const fetchScores = async ({ activateAcademic = false } = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/application/score`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data) {
        setScores(data);
        const academicPayload = {
          gradeSubjects: { ...emptyGradeSubjects(), ...(data.gradeSubjects || {}) },
          subjectMarks: normalizeAllSubjectMarks(data.subjectMarks || {}),
        };
        if (hasAcademicScoreData(academicPayload.gradeSubjects, academicPayload.subjectMarks)) {
          setSavedAcademicScores(academicPayload);
          if (activateAcademic) applyAcademicScoreData(academicPayload);
        } else {
          setSavedAcademicScores(null);
        }
        applySelectedTestsFromScores(data);
      }
    } catch (error) {
      console.error("Fetch Score Error:", error);
    }
  };

  const handleScoreChange = (e) => {
    setScores((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setSelectedTests((prev) => ({ ...prev, [name]: checked }));
    if (!checked) {
      setScores((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (key.startsWith(name)) delete updated[key];
        });
        return updated;
      });
    }
  };

  const toggleGradeExpand = (grade) => {
    setExpandedGrades((prev) => ({ ...prev, [grade]: !prev[grade] }));
  };

  const addSubjectToGrade = (grade, subject) => {
    const cleanSubject = normalizeSubjectName(subject);
    if (!cleanSubject) return;

    const alreadyExists = gradeSubjects[grade].some(
      (s) => s.toLowerCase() === cleanSubject.toLowerCase()
    );
    if (alreadyExists) {
      setSubjectSearch((prev) => ({ ...prev, [grade]: "" }));
      return;
    }

    setGradeSubjects((prev) => ({
      ...prev,
      [grade]: [...prev[grade], cleanSubject],
    }));
    setSubjectMarks((prev) => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [cleanSubject]: normalizeMarkEntry("", cleanSubject),
      },
    }));
    setSubjectSearch((prev) => ({ ...prev, [grade]: "" }));
  };

  const removeSubjectFromGrade = (grade, subject) => {
    setGradeSubjects((prev) => ({
      ...prev,
      [grade]: prev[grade].filter((s) => s !== subject),
    }));
    setSubjectMarks((prev) => {
      const updated = { ...prev[grade] };
      delete updated[subject];
      return { ...prev, [grade]: updated };
    });
  };

  const handleSubjectMarkChange = (grade, subject, value) => {
    const current = normalizeMarkEntry(subjectMarks[grade]?.[subject], subject);
    const nextValue = current.gradeType === "letter" ? value.toUpperCase() : value;
    setSubjectMarks((prev) => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [subject]: {
          ...current,
          marks: nextValue,
          needsReview: false,
          reviewReason: "",
        },
      },
    }));
  };

  const handleSubjectScaleChange = (grade, subject, scaleValue) => {
    const current = normalizeMarkEntry(subjectMarks[grade]?.[subject], subject);
    if (scaleValue === "custom") {
      const customScale = window.prompt("Enter custom max scale", current.maxMarks || "");
      if (!customScale) return;
      const parsedCustom = Number(customScale);
      if (!Number.isFinite(parsedCustom) || parsedCustom <= 0) {
        alert("Custom scale must be a positive number.");
        return;
      }
      scaleValue = String(parsedCustom);
    }

    const isLetter = scaleValue === "letter";
    const parsedMax = isLetter ? 100 : Number(scaleValue) || getDefaultMaxMarks(subject);
    setSubjectMarks((prev) => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [subject]: {
          ...current,
          maxMarks: parsedMax,
          gradeType: isLetter ? "letter" : parsedMax <= 10 ? "cgpa" : "marks",
          scale: isLetter ? "letter" : `/${parsedMax}`,
          needsReview: isLetter,
          reviewReason: isLetter ? "Review letter grade conversion scale before final submission." : "",
        },
      },
    }));
  };

  const calculateAverage = (grade) => {
    const entries = Object.entries(subjectMarks[grade] || {})
      .map(([subject, entry]) => normalizeMarkEntry(entry, subject))
      .filter((entry) => String(entry.marks || "").trim() !== "");

    if (!entries.length) return null;
    if (entries.some((entry) => entry.gradeType === "letter")) {
      return {
        label: "Grade-based",
        type: "letter",
      };
    }

    const numericEntries = entries
      .map((entry) => ({
        value: Number(String(entry.marks || "").replace("%", "")),
        maxMarks: Number(entry.maxMarks),
      }))
      .filter((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.maxMarks) && entry.maxMarks > 0);

    if (!numericEntries.length) return null;
    const uniqueScales = [...new Set(numericEntries.map((entry) => entry.maxMarks))];
    const isGpaScale = numericEntries.every((entry) => entry.maxMarks <= 10);
    if (isGpaScale) {
      if (uniqueScales.length > 1) return { label: "Review Required", type: "review" };
      const avg = numericEntries.reduce((sum, entry) => sum + entry.value, 0) / numericEntries.length;
      const scale = numericEntries[0].maxMarks;
      return { label: `${avg.toFixed(2)}/${scale}`, type: "gpa" };
    }

    if (uniqueScales.length > 1) {
      const hasInvalid = numericEntries.some((entry) => entry.value > entry.maxMarks);
      if (hasInvalid) return { label: "Review Required", type: "review" };
      const totalMarks = numericEntries.reduce((sum, entry) => sum + entry.value, 0);
      const totalMax = numericEntries.reduce((sum, entry) => sum + entry.maxMarks, 0);
      return { label: `${((totalMarks / totalMax) * 100).toFixed(1)}%`, type: "percentage" };
    }
    if (uniqueScales[0] === 100) {
      const avg = numericEntries.reduce((sum, entry) => sum + Math.min(entry.value, 100), 0) / numericEntries.length;
      return { label: `${avg.toFixed(1)}%`, type: "percentage" };
    }

    const percentages = numericEntries.map((entry) => Math.min((entry.value / entry.maxMarks) * 100, 100));
    const avg = percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
    return { label: `${avg.toFixed(1)}%`, type: "percentage" };
  };

  const getEntryValidation = (entry) => {
    const normalized = normalizeMarkEntry(entry);
    const value = String(normalized.marks || "").trim().toUpperCase();

    if (!value) return "";
    if (normalized.gradeType === "letter") {
      return VALID_LETTER_GRADES.includes(value) ? "" : "Letter grades must be A1, A2, B1, B2, C1, C2, D1, D2, A+, A, B+, B, C, D, E, or F.";
    }

    const numericValue = Number(value.replace("%", ""));
    const numericMax = Number(normalized.maxMarks);
    if (!Number.isFinite(numericValue)) return "Enter a number for this scale.";
    if (Number.isFinite(numericMax) && numericValue > numericMax) {
      return "Marks cannot be greater than max marks.";
    }
    return "";
  };

  const setGradeMode = (grade, mode) => {
    setGradeEntryMode((prev) => ({ ...prev, [grade]: mode }));
  };

  const handleGradeDocumentUpload = async (grade, file) => {
    if (!file) return;

    setGradeExtraction((prev) => ({
      ...prev,
      [grade]: { loading: true, preview: null, error: "" },
    }));

    try {
      const data = await extractGradeDocument({
        gradeLevel: GRADE_LEVELS[grade],
        file,
      });
      console.log("Frontend preview subjects:", data.subjects);

      setGradeExtraction((prev) => ({
        ...prev,
        [grade]: { loading: false, preview: data, error: "" },
      }));
      setCurrentSessionUploads((prev) => ({ ...prev, [grade]: true }));
      setSavedAcademicChoice("upload");
      await refreshSavedGradeData({ activateAcademic: true, includeDocuments: true });
    } catch (error) {
      const message =
        error.normalizedMessage ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.notes?.[0] ||
        "Unable to process document";

      setGradeExtraction((prev) => ({
        ...prev,
        [grade]: {
          loading: false,
          preview: null,
          error: message,
        },
      }));
    }
  };

  const handleDeleteGradeDocument = async (grade, documentId) => {
    if (!documentId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this document? Extracted marks for this grade will also be removed."
    );
    if (!confirmed) return;

    setDocumentActions((prev) => ({ ...prev, [grade]: "deleting" }));
    try {
      await deleteGradeDocument(documentId);
      setGradeSubjects((prev) => ({ ...prev, [grade]: [] }));
      setSubjectMarks((prev) => ({ ...prev, [grade]: {} }));
      setGradeDocuments((prev) => ({ ...prev, [grade]: null }));
      setGradeMode(grade, null);
      await refreshSavedGradeData();
      alert("Document deleted. You can upload the correct document now.");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete document.");
    } finally {
      setDocumentActions((prev) => ({ ...prev, [grade]: null }));
    }
  };

  const handleReplaceGradeDocument = async (grade, file) => {
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      alert("Only PDF, JPG, JPEG, or PNG files are allowed.");
      return;
    }

    setDocumentActions((prev) => ({ ...prev, [grade]: "replacing" }));
    setGradeExtraction((prev) => ({
      ...prev,
      [grade]: { loading: true, preview: null, error: "" },
    }));

    try {
      const data = await replaceGradeDocument({
        grade,
        gradeLevel: GRADE_LEVELS[grade],
        file,
      });
      setGradeExtraction((prev) => ({
        ...prev,
        [grade]: { loading: false, preview: data, error: "" },
      }));
      setCurrentSessionUploads((prev) => ({ ...prev, [grade]: true }));
      setSavedAcademicChoice("upload");
      await refreshSavedGradeData({ activateAcademic: true, includeDocuments: true });
      alert("Document replaced and marks updated successfully.");
    } catch (error) {
      setGradeExtraction((prev) => ({
        ...prev,
        [grade]: {
          loading: false,
          preview: null,
          error: error.response?.data?.message || "Unable to replace document",
        },
      }));
    } finally {
      setDocumentActions((prev) => ({ ...prev, [grade]: null }));
    }
  };

  const handleConfirmReupload = (grade) => {
    const confirmed = window.confirm("Re-uploading will replace the existing document and extracted marks.");
    if (!confirmed) return;
    document.getElementById(`${grade}DocumentReupload`)?.click();
  };

  const handleViewGradeDocument = async (documentId) => {
    if (!documentId) return;
    try {
      const data = await getGradeDocumentViewUrl(documentId);
      if (data.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to open document.");
    }
  };

  const fetchGradeDocuments = async () => {
    try {
      const data = await getApplicationDocuments();
      const next = emptyGradeDocuments();
      (data.documents?.documents || [])
        .filter((doc) => doc.documentType === "marksheet" && next[doc.grade] !== undefined)
        .forEach((doc) => {
          next[doc.grade] = doc;
        });
      setGradeDocuments(next);
    } catch (error) {
      console.error("Fetch grade documents error:", error.response?.data || error.message);
    }
  };

  const refreshSavedGradeData = async ({ activateAcademic = false, includeDocuments = false } = {}) => {
    await Promise.all([
      fetchScores({ activateAcademic }),
      includeDocuments ? fetchGradeDocuments() : Promise.resolve(),
    ]);
  };

  const openSkipModal = () => setShowSkipModal(true);
  const closeSkipModal = () => setShowSkipModal(false);

  const handleContinueWithSavedScores = () => {
    openSkipModal();
  };

  const handleUploadNewMarksheets = () => {
    clearAcademicScoreState();
    setSavedAcademicChoice("upload");
    setExpandedGrades({
      grade9: true,
      grade10: true,
      grade11: true,
      grade12: true,
    });
  };

  const goToDocuments = () => {
    const targetPath = location.pathname.includes("/scores")
      ? location.pathname.replace("/scores", "/documents")
      : "/firstyear/dashboard/application/documents";
    navigate(targetPath);
  };

  const mapExtractedSubjectToEntry = (subject, grade) => {
    const gradeType = subject.gradeType || (subject.letterGrade ? "letter" : subject.gradePoint ? "cgpa" : "marks");
    const maxMarks = gradeType === "letter" ? 100 : Number(subject.maxMarks) || getDefaultMaxMarks(subject.subjectName);

    return {
      marks: gradeType === "letter"
        ? subject.letterGrade
        : formatDecimalValue(subject.obtainedMarks || subject.gradePoint || ""),
      maxMarks,
      gradeType,
      scale: gradeType === "letter" ? "letter" : `/${maxMarks}`,
      percentage: subject.percentage ?? null,
      confidence: subject.confidence ?? 0,
      needsReview: subject.reviewRequired || false,
      reviewReason: subject.reviewRequired ? "Review Required" : "",
      sourceDocument: `grade${GRADE_LEVELS[grade]}Upload`,
    };
  };

  const handleApplyGradeExtraction = (grade) => {
    const preview = gradeExtraction[grade]?.preview;
    const validPreviewSubjects = getValidPreviewSubjects(preview);
    if (!validPreviewSubjects.length) return;

    const extractedSubjects = validPreviewSubjects
      .map((subject) => normalizeAcademicSubjectName(subject.subjectName || ""))
      .filter(Boolean);

    setGradeSubjects((prev) => {
      const existing = new Set((prev[grade] || []).map((subject) => subject.toLowerCase()));
      return {
        ...prev,
        [grade]: [
          ...(prev[grade] || []),
          ...extractedSubjects.filter((subject) => !existing.has(subject.toLowerCase())),
        ],
      };
    });

    setSubjectMarks((prev) => {
      const nextGradeMarks = { ...(prev[grade] || {}) };
      validPreviewSubjects.forEach((subject) => {
        const subjectName = normalizeAcademicSubjectName(subject.subjectName || "");
        if (!subjectName || nextGradeMarks[subjectName]) return;
        nextGradeMarks[subjectName] = mapExtractedSubjectToEntry(subject, grade);
      });

      return { ...prev, [grade]: nextGradeMarks };
    });

    setGradeMode(grade, "manual");
    setGradeExtraction((prev) => ({
      ...prev,
      [grade]: { loading: false, preview: null, error: "" },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validationErrors = [];
      GRADES.forEach((grade) => {
        Object.entries(subjectMarks[grade] || {}).forEach(([subject, entry]) => {
          const error = getEntryValidation(entry);
          if (error) validationErrors.push(`${gradeLabel(grade)} - ${subject}: ${error}`);
        });
      });

      if (validationErrors.length > 0) {
        alert(`Please fix these grade entries before saving:\n\n${validationErrors.join("\n")}`);
        return;
      }

      const payload = { ...scores, gradeSubjects, subjectMarks };
      const response = await fetch(`${API_BASE_URL}/api/application/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        alert("Scores saved successfully");
        const targetPath = location.pathname.includes("/scores")
          ? location.pathname.replace("/scores", "/documents")
          : "/firstyear/dashboard/application/documents";
        navigate(targetPath);
      } else {
        alert(data.message || "Error saving scores");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Server error while saving scores");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/application/score`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setScores(data.data || {});
        clearAcademicScoreState();
        setSavedAcademicScores(null);
        setSavedAcademicChoice("clear");
        applySelectedTestsFromScores(data.data || {});
        alert("Saved academic scores cleared successfully");
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const gradeLabel = (g) => `${g.replace("grade", "")}th Grade`;
  const formatUploadedDate = (value) => {
    if (!value) return "Uploaded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Uploaded" : date.toLocaleDateString();
  };
  const showSavedAcademicBanner = Boolean(savedAcademicScores) && savedAcademicChoice === null;

  return (
    <div className="score-container">
      {showSkipModal && (
        <div className="score-modal-backdrop" role="presentation">
          <div className="score-skip-modal" role="dialog" aria-modal="true" aria-labelledby="scoreSkipTitle">
            <h3 id="scoreSkipTitle">Academic Scores Optional</h3>
            <p>
              If you already have a CV/Resume, you can skip this section and upload all required documents in the Documents section.
            </p>
            <p>
              If you do not have a CV/Resume, upload your 9th, 10th, 11th, and 12th marksheets here to auto-fill academic scores.
            </p>
            <p>You can also generate a CV later in the Documents section.</p>
            <div className="score-modal-actions">
              <button type="button" className="score-save-btn" onClick={goToDocuments}>
                Go to Documents
              </button>
              <button type="button" className="score-delete-btn" onClick={closeSkipModal}>
                Upload Marksheets Here
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="score-card">
        <h2 className="score-title">Test Scores and Academic Grades</h2>

        <form onSubmit={handleSubmit}>

          {/* Academic Grades Section */}
          <div className="score-section">
            <h3 className="score-section-title">Academic Scores</h3>
            <p className="score-section-hint">
              Academic scores are optional. Upload marksheets to auto-fill or continue to Documents.
            </p>

            {showSavedAcademicBanner && (
              <div className="score-saved-banner">
                <div>
                  <strong>Previously saved academic scores were found.</strong>
                  <span>You can continue with them, clear them, or upload new marksheets.</span>
                </div>
                <div className="score-saved-banner-actions">
                  <button type="button" onClick={handleContinueWithSavedScores}>
                    Continue with saved scores
                  </button>
                  <button type="button" onClick={handleDelete}>
                    Clear saved scores
                  </button>
                  <button type="button" onClick={handleUploadNewMarksheets}>
                    Upload new marksheets
                  </button>
                  <button type="button" onClick={openSkipModal}>
                    Skip this section
                  </button>
                </div>
              </div>
            )}

            {GRADES.map((grade) => {
              const avg = calculateAverage(grade);
              const filteredSubjects = SUBJECTS.filter(
                (s) =>
                  s.toLowerCase().includes(subjectSearch[grade].toLowerCase()) &&
                  !gradeSubjects[grade].some(
                    (selected) => selected.toLowerCase() === s.toLowerCase()
                  )
              );
              const cleanSearch = normalizeSubjectName(subjectSearch[grade]);
              const canCreateSubject =
                cleanSearch &&
                !SUBJECTS.some((s) => s.toLowerCase() === cleanSearch.toLowerCase()) &&
                !gradeSubjects[grade].some((s) => s.toLowerCase() === cleanSearch.toLowerCase());
              const mode = gradeEntryMode[grade] || (gradeSubjects[grade].length > 0 ? "manual" : null);
              const extraction = gradeExtraction[grade] || { loading: false, preview: null, error: "" };
              const validPreviewSubjects = getValidPreviewSubjects(extraction.preview);
              const uploadedDocument = gradeDocuments[grade];
              const documentAction = documentActions[grade];

              return (
                <div key={grade} className="score-grade-accordion">

                  {/* Header row */}
                  <div
                    className="score-grade-header"
                    onClick={() => toggleGradeExpand(grade)}
                  >
                    <span className="score-grade-title-label">
                      <span className="score-grade-title-text">{gradeLabel(grade)}</span>
                      {gradeSubjects[grade].length > 0 && (
                        <span className="score-grade-subject-count">
                          {gradeSubjects[grade].length} subject
                          {gradeSubjects[grade].length > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                    <span className="score-grade-right">
                      {avg !== null && (
                        <span className={`score-grade-avg-badge score-grade-avg-badge--${avg.type}`}>
                          {avg.type === "gpa" ? "GPA" : "Avg"}: {avg.label}
                        </span>
                      )}
                      <span className="score-accordion-arrow">
                        {expandedGrades[grade] ? "▲" : "▼"}
                      </span>
                    </span>
                  </div>

                  {/* Expanded body */}
                  {expandedGrades[grade] && (
                    <div className="score-grade-body">
                      {uploadedDocument && (
                        <div className="score-uploaded-document-card">
                          <input
                            type="file"
                            id={`${grade}DocumentReupload`}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="score-grade-file-input"
                            onChange={(e) => {
                              handleReplaceGradeDocument(grade, e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                          <div>
                            <span className="score-uploaded-document-title">
                              {currentSessionUploads[grade] ? "Document uploaded successfully" : "Previously saved marksheet"}
                            </span>
                            <span className="score-uploaded-document-name">
                              {uploadedDocument.originalName || uploadedDocument.fileName || "Uploaded marksheet"}
                            </span>
                            <span className="score-uploaded-document-meta">
                              {formatUploadedDate(uploadedDocument.uploadedAt)}
                              {uploadedDocument.status || uploadedDocument.documentStatus
                                ? ` - ${uploadedDocument.status || uploadedDocument.documentStatus}`
                                : ""}
                            </span>
                          </div>
                          <div className="score-uploaded-document-actions">
                            {uploadedDocument._id && (
                              <button
                                type="button"
                                className="score-doc-action-btn"
                                onClick={() => handleViewGradeDocument(uploadedDocument._id)}
                              >
                                View
                              </button>
                            )}
                            <button
                              type="button"
                              className="score-doc-action-btn danger"
                              onClick={() => handleDeleteGradeDocument(grade, uploadedDocument._id)}
                              disabled={documentAction === "deleting"}
                            >
                              {documentAction === "deleting" ? "Deleting..." : "Delete"}
                            </button>
                            <button
                              type="button"
                              className="score-doc-action-btn"
                              onClick={() => handleConfirmReupload(grade)}
                              disabled={documentAction === "replacing"}
                            >
                              {documentAction === "replacing" ? "Replacing..." : "Re-upload"}
                            </button>
                          </div>
                        </div>
                      )}

                      {!uploadedDocument && !mode && (
                        <div className="score-grade-choice-grid">
                          <div className="score-grade-upload-card">
                            <div className="score-grade-upload-text">
                              <span className="score-grade-upload-title">
                                Upload {gradeLabel(grade)} marksheet to auto-fill
                              </span>
                              <span className="score-grade-upload-sub">
                                We&apos;ll extract subjects, marks, max marks, grades, GPA/percentage automatically.
                              </span>
                            </div>
                            <input
                              type="file"
                              id={`${grade}DocumentUpload`}
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="score-grade-file-input"
                              onChange={(e) => {
                                setGradeMode(grade, "upload");
                                handleGradeDocumentUpload(grade, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              className="score-grade-upload-btn"
                              onClick={() => document.getElementById(`${grade}DocumentUpload`)?.click()}
                            >
                              Upload
                            </button>
                          </div>
                          <button
                            type="button"
                            className="score-grade-manual-link"
                            onClick={() => setGradeMode(grade, "manual")}
                          >
                            I&apos;ll enter details manually
                          </button>
                        </div>
                      )}

                      {!uploadedDocument && mode === "upload" && (
                        <div className="score-grade-upload-flow">
                          <div className="score-grade-upload-card">
                            <div className="score-grade-upload-text">
                              <span className="score-grade-upload-title">
                                Upload {gradeLabel(grade)} marksheet to auto-fill
                              </span>
                              <span className="score-grade-upload-sub">
                                PDF, JPG, or PNG. You can edit every extracted field before saving.
                              </span>
                            </div>
                            <input
                              type="file"
                              id={`${grade}DocumentUploadActive`}
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="score-grade-file-input"
                              onChange={(e) => {
                                handleGradeDocumentUpload(grade, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              className="score-grade-upload-btn"
                              onClick={() => document.getElementById(`${grade}DocumentUploadActive`)?.click()}
                              disabled={extraction.loading}
                            >
                              {extraction.loading ? "Extracting..." : "Upload"}
                            </button>
                          </div>

                          {extraction.error && <p className="score-extraction-error">{extraction.error}</p>}

                          {!extraction.preview && (
                            <button
                              type="button"
                              className="score-grade-manual-link inline"
                              onClick={() => setGradeMode(grade, "manual")}
                            >
                              Enter manually
                            </button>
                          )}

                          {extraction.preview && (
                            <div className="score-extraction-preview">
                              <div className="score-extraction-preview-header">
                                <strong>Extraction Preview</strong>
                                <span>
                                  {extraction.preview.extractionStatus === "review_required"
                                    ? "Review Required"
                                    : extraction.preview.extractionStatus?.replace("_", " ")}
                                </span>
                              </div>
                              {extraction.preview.message && (
                                <p className="score-review-note">{extraction.preview.message}</p>
                              )}
                              <p className="score-review-note">Please review extracted marks before applying.</p>
                              <div className="score-grade-meta-row">
                                {extraction.preview.boardName && <span>Board: {extraction.preview.boardName}</span>}
                                {extraction.preview.passingYear && <span>Passing year: {extraction.preview.passingYear}</span>}
                                {extraction.preview.gradingScale && <span>Scale: {extraction.preview.gradingScale}</span>}
                                {extraction.preview.calculatedAverage && <span>Average: {extraction.preview.calculatedAverage}</span>}
                              </div>
                              {extraction.preview.notes?.length > 0 && (
                                <p className="score-review-note">{extraction.preview.notes.join(" ")}</p>
                              )}
                              {validPreviewSubjects.length === 0 && (
                                <p className="score-review-note">
                                  No valid academic subjects detected. Please upload clearer document or enter manually.
                                </p>
                              )}
                              <div className="score-preview-subjects">
                                {validPreviewSubjects.map((subject) => (
                                  <span
                                    key={`${subject.subjectName}-${subject.obtainedMarks || subject.letterGrade || subject.gradePoint}`}
                                    className={`score-preview-chip ${subject.reviewRequired ? "needs-review" : ""}`}
                                  >
                                    {subject.subjectName}: {subject.obtainedMarks || subject.gradePoint || subject.letterGrade}
                                    {subject.maxMarks ? `/${subject.maxMarks}` : ""}
                                    {subject.letterGrade && subject.obtainedMarks ? ` ${subject.letterGrade}` : ""}
                                  </span>
                                ))}
                              </div>
                              <div className="score-preview-actions">
                                <button
                                  type="button"
                                  className="score-apply-extraction-btn"
                                  onClick={() => handleApplyGradeExtraction(grade)}
                                  disabled={validPreviewSubjects.length === 0}
                                >
                                  Apply to form
                                </button>
                                <button
                                  type="button"
                                  className="score-discard-extraction-btn"
                                  onClick={() => setGradeExtraction((prev) => ({
                                    ...prev,
                                    [grade]: { loading: false, preview: null, error: "" },
                                  }))}
                                >
                                  Discard
                                </button>
                                <button
                                  type="button"
                                  className="score-grade-manual-link inline"
                                  onClick={() => setGradeMode(grade, "manual")}
                                >
                                  Enter manually
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Subject search + add */}
                      {mode === "manual" && (
                        <>
                      <div className="score-subject-add-row">
                        <div className="score-subject-search-wrap">
                          <input
                            type="text"
                            placeholder="Search and add a subject..."
                            value={subjectSearch[grade]}
                            onChange={(e) =>
                              setSubjectSearch((prev) => ({
                                ...prev,
                                [grade]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSubjectToGrade(grade, subjectSearch[grade]);
                              }
                            }}
                            className="score-subject-search-input"
                          />
                          {subjectSearch[grade] && (filteredSubjects.length > 0 || canCreateSubject) && (
                            <div className="score-subject-dropdown">
                              {filteredSubjects.map((s) => (
                                <div
                                  key={s}
                                  className="score-subject-dropdown-item"
                                  onClick={() => addSubjectToGrade(grade, s)}
                                >
                                  {s}
                                </div>
                              ))}
                              {canCreateSubject && (
                                <div
                                  className="score-subject-dropdown-item score-subject-create-item"
                                  onClick={() => addSubjectToGrade(grade, cleanSearch)}
                                >
                                  + Add "{cleanSearch}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Quick-add chips for common subjects */}
                        <div className="score-quick-add-chips">
                          {["Mathematics", "Science", "English", "Physics", "Chemistry"].map(
                            (s) =>
                              !gradeSubjects[grade].includes(s) && (
                                <button
                                  key={s}
                                  type="button"
                                  className="score-chip-btn"
                                  onClick={() => addSubjectToGrade(grade, s)}
                                >
                                  + {s}
                                </button>
                              )
                          )}
                        </div>
                      </div>

                      {/* Subject marks list */}
                      {gradeSubjects[grade].length === 0 ? (
                        <p className="score-no-subjects-hint">
                          No subjects added yet. Search above or use quick-add.
                        </p>
                      ) : (
                        <div className="score-subject-marks-grid">
                          {gradeSubjects[grade].map((subject) => {
                            const markEntry = normalizeMarkEntry(subjectMarks[grade][subject], subject);
                            const val = markEntry.marks || "";
                            const maxMarks = Number(markEntry.maxMarks) || getDefaultMaxMarks(subject);
                            const num = parseFloat(val);
                            const pct = markEntry.percentage !== null && markEntry.percentage !== undefined
                              ? Number(markEntry.percentage)
                              : val !== "" && !isNaN(num) && markEntry.gradeType !== "letter"
                              ? Math.min((num / maxMarks) * 100, 100)
                              : null;
                            const validationMessage = getEntryValidation(markEntry);
                            const colorClass =
                              pct === null
                                ? ""
                                : pct >= 90
                                ? "mark-excellent"
                                : pct >= 75
                                ? "mark-good"
                                : pct >= 50
                                ? "mark-average"
                                : "mark-low";

                            return (
                              <div key={subject} className={`score-subject-mark-card ${colorClass}`}>
                                <div className="score-subject-mark-top">
                                  <span className="score-subject-name">{subject}</span>
                                  <button
                                    type="button"
                                    className="score-remove-subject-btn"
                                    onClick={() => removeSubjectFromGrade(grade, subject)}
                                    title="Remove subject"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div className="score-mark-input-row">
                                  <input
                                    type={markEntry.gradeType === "letter" ? "text" : "number"}
                                    min="0"
                                    max={maxMarks}
                                    step="0.01"
                                    inputMode="decimal"
                                    placeholder={markEntry.gradeType === "letter" ? "A+" : `Marks /${maxMarks}`}
                                    value={val}
                                    onChange={(e) =>
                                      handleSubjectMarkChange(grade, subject, e.target.value)
                                    }
                                    className="score-subject-mark-input"
                                  />
                                  <div className="score-mark-scale-row">
                                    <span className="score-mark-scale-prefix">out of</span>
                                    <select
                                      value={markEntry.gradeType === "letter" ? "letter" : String(maxMarks)}
                                      onChange={(e) =>
                                        handleSubjectScaleChange(grade, subject, e.target.value)
                                      }
                                      className="score-mark-scale-select"
                                    >
                                      {MARK_SCALE_OPTIONS.map((scale) => (
                                        <option key={scale.value} value={scale.value}>{scale.label}</option>
                                      ))}
                                      {!MARK_SCALE_OPTIONS.some((scale) => scale.value === String(maxMarks)) && markEntry.gradeType !== "letter" && (
                                        <option value={String(maxMarks)}>/{maxMarks}</option>
                                      )}
                                    </select>
                                  </div>
                                </div>
                                {(markEntry.needsReview || validationMessage) && (
                                  <span className="score-review-required">
                                    {validationMessage || markEntry.reviewReason || "Needs Review"}
                                  </span>
                                )}
                                {pct !== null && (
                                  <span className="score-mark-percent-label">
                                    {markEntry.gradeType === "letter"
                                      ? `Converted: ${pct.toFixed(1)}%`
                                      : `${formatDecimalValue(num)}/${formatDecimalValue(maxMarks)} (${pct.toFixed(1)}%)`}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test Selection Section */}
          <div className="score-section">
            <h3 className="score-section-title">Select Tests</h3>
            <div className="score-checkbox-grid">
              {Object.keys(selectedTests).map((test) => (
                <label key={test} className="score-checkbox-card">
                  <input
                    type="checkbox"
                    name={test}
                    checked={selectedTests[test]}
                    onChange={handleToggle}
                  />
                  {test.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Test Scores Section */}
          <div className="score-section">
            <h3 className="score-section-title">Test Scores</h3>
            <div className="score-input-grid">

              {selectedTests.sat && (
                <>
                  <input type="number" name="satTotal" placeholder="SAT Total (1600)"
                    value={scores.satTotal || ""} onChange={handleScoreChange} />
                  <input type="number" name="satMath" placeholder="SAT Math"
                    value={scores.satMath || ""} onChange={handleScoreChange} />
                  <input type="number" name="satReading" placeholder="SAT Reading and Writing"
                    value={scores.satReading || ""} onChange={handleScoreChange} />
                  <input type="date" name="satDate"
                    value={scores.satDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.psat && (
                <>
                  <input type="number" name="psatTotal" placeholder="PSAT Total (1520)"
                    value={scores.psatTotal || ""} onChange={handleScoreChange} />
                  <input type="number" name="psatMath" placeholder="PSAT Math"
                    value={scores.psatMath || ""} onChange={handleScoreChange} />
                  <input type="number" name="psatReading" placeholder="PSAT Reading and Writing"
                    value={scores.psatReading || ""} onChange={handleScoreChange} />
                  <input type="date" name="psatDate"
                    value={scores.psatDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.act && (
                <>
                  <input type="number" name="act" placeholder="ACT (36)"
                    value={scores.act || ""} onChange={handleScoreChange} />
                  <input type="date" name="actDate"
                    value={scores.actDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.toefl && (
                <>
                  <input type="number" name="toefl" placeholder="TOEFL (120)"
                    value={scores.toefl || ""} onChange={handleScoreChange} />
                  <input type="date" name="toeflDate"
                    value={scores.toeflDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.ielts && (
                <>
                  <input type="number" step="0.1" name="ielts" placeholder="IELTS (9.0)"
                    value={scores.ielts || ""} onChange={handleScoreChange} />
                  <input type="date" name="ieltsDate"
                    value={scores.ieltsDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.ap && (
                <>
                  <input type="number" name="ap" placeholder="AP Score (5)"
                    value={scores.ap || ""} onChange={handleScoreChange} />
                  <input type="date" name="apDate"
                    value={scores.apDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.pte && (
                <>
                  <input type="number" name="pte" placeholder="PTE (90)"
                    value={scores.pte || ""} onChange={handleScoreChange} />
                  <input type="date" name="pteDate"
                    value={scores.pteDate || ""} onChange={handleScoreChange} />
                </>
              )}

              {selectedTests.duolingo && (
                <>
                  <input type="number" name="duolingo" placeholder="Duolingo (160)"
                    value={scores.duolingo || ""} onChange={handleScoreChange} />
                  <input type="date" name="duolingoDate"
                    value={scores.duolingoDate || ""} onChange={handleScoreChange} />
                </>
              )}

            </div>
          </div>

          <div className="score-button-group">
            <button type="submit" className="score-save-btn">Save Scores</button>
            <button type="button" className="score-continue-btn" onClick={openSkipModal}>
              Continue to Documents
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Score;
