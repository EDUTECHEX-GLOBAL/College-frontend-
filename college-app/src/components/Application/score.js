import React, { useState, useEffect } from "react";
import "./score.css";

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

  // gradeSubjects: { grade9: ["Mathematics", "Science"], grade10: [...], ... }
  const [gradeSubjects, setGradeSubjects] = useState({
    grade9: [],
    grade10: [],
    grade11: [],
    grade12: [],
  });

  // subjectMarks: { grade9: { Mathematics: "98", Science: "89" }, ... }
  const [subjectMarks, setSubjectMarks] = useState({
    grade9: {},
    grade10: {},
    grade11: {},
    grade12: {},
  });

  // Which grade panels are expanded
  const [expandedGrades, setExpandedGrades] = useState({
    grade9: false,
    grade10: false,
    grade11: false,
    grade12: false,
  });

  // Subject search per grade
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
      const response = await fetch("http://localhost:5000/api/application/score", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data) {
        setScores(data);
        if (data.gradeSubjects) setGradeSubjects(data.gradeSubjects);
        if (data.subjectMarks) setSubjectMarks(data.subjectMarks);
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

  /* ── Grade helpers ── */
  const toggleGradeExpand = (grade) => {
    setExpandedGrades((prev) => ({ ...prev, [grade]: !prev[grade] }));
  };

  const addSubjectToGrade = (grade, subject) => {
    if (!subject || gradeSubjects[grade].includes(subject)) return;
    setGradeSubjects((prev) => ({
      ...prev,
      [grade]: [...prev[grade], subject],
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
      [grade]: { ...prev[grade], [subject]: value },
    }));
  };

  const calculateAverage = (grade) => {
    const marks = Object.values(subjectMarks[grade] || {}).filter(
      (v) => v !== "" && !isNaN(v)
    );
    if (!marks.length) return null;
    return (marks.reduce((a, b) => a + parseFloat(b), 0) / marks.length).toFixed(1);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...scores, gradeSubjects, subjectMarks };
      const response = await fetch("http://localhost:5000/api/application/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) alert("Scores saved successfully ✅");
      else alert(data.message || "Error saving scores");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Server error while saving scores");
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/application/score", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setScores({});
        setGradeSubjects({ grade9: [], grade10: [], grade11: [], grade12: [] });
        setSubjectMarks({ grade9: {}, grade10: {}, grade11: {}, grade12: {} });
        setSelectedTests({
          sat: false, psat: false, act: false, toefl: false,
          ielts: false, ap: false, pte: false, duolingo: false,
        });
        alert("Scores deleted successfully ✅");
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const gradeLabel = (g) => `${g.replace("grade", "")}th Grade`;

  return (
    <div className="score-container">
      <div className="score-card">
        <h2 className="score-title">🎓 Test Scores & Academic Grades</h2>

        <form onSubmit={handleSubmit}>

          {/* ══════════════ ACADEMIC GRADES ══════════════ */}
          <div className="section">
            <h3>Academic Scores</h3>
            <p className="section-hint">
              Expand each grade, add your subjects, and enter marks out of 100.
            </p>

            {GRADES.map((grade) => {
              const avg = calculateAverage(grade);
              const filteredSubjects = SUBJECTS.filter(
                (s) =>
                  s.toLowerCase().includes(subjectSearch[grade].toLowerCase()) &&
                  !gradeSubjects[grade].includes(s)
              );

              return (
                <div key={grade} className="grade-accordion">

                  {/* Header row */}
                  <div
                    className="grade-header"
                    onClick={() => toggleGradeExpand(grade)}
                  >
                    <span className="grade-title-label">
                      {gradeLabel(grade)}
                      {gradeSubjects[grade].length > 0 && (
                        <span className="grade-subject-count">
                          {gradeSubjects[grade].length} subject
                          {gradeSubjects[grade].length > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                    <span className="grade-right">
                      {avg !== null && (
                        <span className="grade-avg-badge">Avg: {avg}%</span>
                      )}
                      <span className="accordion-arrow">
                        {expandedGrades[grade] ? "▲" : "▼"}
                      </span>
                    </span>
                  </div>

                  {/* Expanded body */}
                  {expandedGrades[grade] && (
                    <div className="grade-body">

                      {/* Subject search + add */}
                      <div className="subject-add-row">
                        <div className="subject-search-wrap">
                          <input
                            type="text"
                            placeholder="Search & add a subject..."
                            value={subjectSearch[grade]}
                            onChange={(e) =>
                              setSubjectSearch((prev) => ({
                                ...prev,
                                [grade]: e.target.value,
                              }))
                            }
                            className="subject-search-input"
                          />
                          {subjectSearch[grade] && filteredSubjects.length > 0 && (
                            <div className="subject-dropdown">
                              {filteredSubjects.map((s) => (
                                <div
                                  key={s}
                                  className="subject-dropdown-item"
                                  onClick={() => addSubjectToGrade(grade, s)}
                                >
                                  {s}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Quick-add chips for common subjects */}
                        <div className="quick-add-chips">
                          {["Mathematics", "Science", "English", "Physics", "Chemistry"].map(
                            (s) =>
                              !gradeSubjects[grade].includes(s) && (
                                <button
                                  key={s}
                                  type="button"
                                  className="chip-btn"
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
                        <p className="no-subjects-hint">
                          No subjects added yet. Search above or use quick-add.
                        </p>
                      ) : (
                        <div className="subject-marks-grid">
                          {gradeSubjects[grade].map((subject) => {
                            const val = subjectMarks[grade][subject] || "";
                            const num = parseFloat(val);
                            const colorClass =
                              val === ""
                                ? ""
                                : num >= 90
                                ? "mark-excellent"
                                : num >= 75
                                ? "mark-good"
                                : num >= 50
                                ? "mark-average"
                                : "mark-low";

                            return (
                              <div key={subject} className={`subject-mark-card ${colorClass}`}>
                                <div className="subject-mark-top">
                                  <span className="subject-name">{subject}</span>
                                  <button
                                    type="button"
                                    className="remove-subject-btn"
                                    onClick={() => removeSubjectFromGrade(grade, subject)}
                                    title="Remove subject"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Marks /100"
                                  value={val}
                                  onChange={(e) =>
                                    handleSubjectMarkChange(grade, subject, e.target.value)
                                  }
                                  className="subject-mark-input"
                                />
                                {val !== "" && !isNaN(num) && (
                                  <span className="mark-percent-label">{num}%</span>
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

          {/* ══════════════ TEST SELECTION ══════════════ */}
          <div className="section">
            <h3>Select Tests</h3>
            <div className="checkbox-grid">
              {Object.keys(selectedTests).map((test) => (
                <label key={test} className="checkbox-card">
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

          {/* ══════════════ TEST SCORES ══════════════ */}
          <div className="section">
            <h3>Test Scores</h3>
            <div className="input-grid">

              {selectedTests.sat && (
                <>
                  <input type="number" name="satTotal" placeholder="SAT Total (1600)"
                    value={scores.satTotal || ""} onChange={handleScoreChange} />
                  <input type="number" name="satMath" placeholder="SAT Math"
                    value={scores.satMath || ""} onChange={handleScoreChange} />
                  <input type="number" name="satReading" placeholder="SAT Reading & Writing"
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
                  <input type="number" name="psatReading" placeholder="PSAT Reading & Writing"
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

          <button type="submit" className="save-btn">Save Scores</button>
          <button type="button" className="delete-btn" onClick={handleDelete}>
            Delete Scores
          </button>

        </form>
      </div>
    </div>
  );
};

export default Score;