import React, { useState, useEffect } from "react";
import "./score.css";
import API_BASE_URL from "../../../src/config/api"; // adjust path as needed

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

const GRADES = ["grade9", "grade10", "grade11", "grade12"];
const MARK_SCALE_OPTIONS = [150, 100, 60, 10, 7, 5];
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

const normalizeMarkEntry = (entry, subject = "") => {
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    return {
      marks: entry.marks ?? entry.value ?? "",
      maxMarks: Number(entry.maxMarks || entry.max || entry.outOf) || getDefaultMaxMarks(subject),
    };
  }

  return {
    marks: entry ?? "",
    maxMarks: getDefaultMaxMarks(subject),
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

const Score = () => {
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

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/application/score`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data) {
        setScores(data);
        if (data.gradeSubjects) setGradeSubjects({ ...emptyGradeSubjects(), ...data.gradeSubjects });
        if (data.subjectMarks) setSubjectMarks(normalizeAllSubjectMarks(data.subjectMarks));
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
        [cleanSubject]: { marks: "", maxMarks: getDefaultMaxMarks(cleanSubject) },
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
    setSubjectMarks((prev) => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [subject]: {
          ...normalizeMarkEntry(prev[grade]?.[subject], subject),
          marks: value,
        },
      },
    }));
  };

  const handleSubjectScaleChange = (grade, subject, maxMarks) => {
    const parsedMax = Number(maxMarks) || getDefaultMaxMarks(subject);
    setSubjectMarks((prev) => ({
      ...prev,
      [grade]: {
        ...prev[grade],
        [subject]: {
          ...normalizeMarkEntry(prev[grade]?.[subject], subject),
          maxMarks: parsedMax,
        },
      },
    }));
  };

  const calculateAverage = (grade) => {
    const percentages = Object.entries(subjectMarks[grade] || {})
      .map(([subject, entry]) => normalizeMarkEntry(entry, subject))
      .filter((entry) => entry.marks !== "" && !isNaN(entry.marks))
      .map((entry) => {
        const maxMarks = Number(entry.maxMarks) || 60;
        return (parseFloat(entry.marks) / maxMarks) * 100;
      })
      .filter((value) => Number.isFinite(value));

    if (!percentages.length) return null;
    return (
      percentages.reduce((a, b) => a + b, 0) / percentages.length
    ).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
      if (data.success) alert("Scores saved successfully");
      else alert(data.message || "Error saving scores");
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
        setScores({});
        setGradeSubjects(emptyGradeSubjects());
        setSubjectMarks(emptySubjectMarks());
        setSelectedTests({
          sat: false, psat: false, act: false, toefl: false,
          ielts: false, ap: false, pte: false, duolingo: false,
        });
        alert("Scores deleted successfully");
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const gradeLabel = (g) => `${g.replace("grade", "")}th Grade`;

  return (
    <div className="score-container">
      <div className="score-card">
        <h2 className="score-title">Test Scores and Academic Grades</h2>

        <form onSubmit={handleSubmit}>

          {/* Academic Grades Section */}
          <div className="score-section">
            <h3 className="score-section-title">Academic Scores</h3>
            <p className="score-section-hint">
              Expand each grade, add your subjects, and enter marks with the right scale, such as /100 or /10.
            </p>

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

              return (
                <div key={grade} className="score-grade-accordion">

                  {/* Header row */}
                  <div
                    className="score-grade-header"
                    onClick={() => toggleGradeExpand(grade)}
                  >
                    <span className="score-grade-title-label">
                      {gradeLabel(grade)}
                      {gradeSubjects[grade].length > 0 && (
                        <span className="score-grade-subject-count">
                          {gradeSubjects[grade].length} subject
                          {gradeSubjects[grade].length > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                    <span className="score-grade-right">
                      {avg !== null && (
                        <span className="score-grade-avg-badge">Avg: {avg}%</span>
                      )}
                      <span className="score-accordion-arrow">
                        {expandedGrades[grade] ? "▲" : "▼"}
                      </span>
                    </span>
                  </div>

                  {/* Expanded body */}
                  {expandedGrades[grade] && (
                    <div className="score-grade-body">

                      {/* Subject search + add */}
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
                            const pct = val !== "" && !isNaN(num) ? (num / maxMarks) * 100 : null;
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
                                <input
                                  type="number"
                                  min="0"
                                  max={maxMarks}
                                  step={maxMarks <= 10 ? "0.1" : "1"}
                                  placeholder={`Marks /${maxMarks}`}
                                  value={val}
                                  onChange={(e) =>
                                    handleSubjectMarkChange(grade, subject, e.target.value)
                                  }
                                  className="score-subject-mark-input"
                                />
                                <div className="score-mark-scale-row">
                                  <span className="score-mark-scale-prefix">out of</span>
                                  <select
                                    value={maxMarks}
                                    onChange={(e) =>
                                      handleSubjectScaleChange(grade, subject, e.target.value)
                                    }
                                    className="score-mark-scale-select"
                                  >
                                    {MARK_SCALE_OPTIONS.map((scale) => (
                                      <option key={scale} value={scale}>/{scale}</option>
                                    ))}
                                  </select>
                                </div>
                                {pct !== null && (
                                  <span className="score-mark-percent-label">
                                    {num}/{maxMarks} ({pct.toFixed(1)}%)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
            <button type="button" className="score-delete-btn" onClick={handleDelete}>
              Delete Scores
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Score;
