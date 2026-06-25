import React, { useEffect, useRef, useState } from "react";
import "./CurrentSchoolSection.css";
import API_BASE_URL from "./../../../../config/api";
import { COUNTRIES } from "./../../../../constants/countries";

const SCHOOL_COUNTRY_OPTIONS = COUNTRIES.filter(country => country.value);

const CurrentSchoolSelect = ({
  value,
  options,
  placeholder,
  onChange,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const selectedOption = options.find(option => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter(option => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateMenuDirection = () => {
      const rect = selectRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      setOpensUpward(spaceBelow < 240 && spaceAbove > spaceBelow);
    };

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    updateMenuDirection();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuDirection);
    window.addEventListener("scroll", updateMenuDirection, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuDirection);
      window.removeEventListener("scroll", updateMenuDirection, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`current-school-custom-select${isOpen ? " is-open" : ""}${opensUpward ? " is-upward" : ""}`}
    >
      <button
        type="button"
        className={`current-school-select current-school-select-trigger${!selectedOption ? " is-placeholder" : ""}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="current-school-country-listbox"
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="current-school-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="current-school-select-menu" id="current-school-country-listbox" role="listbox">
          {searchable && (
            <input
              type="text"
              className="current-school-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}

          <div className="current-school-select-options">
            <button
              type="button"
              className={`current-school-select-option${value === "" ? " is-selected" : ""}`}
              role="option"
              aria-selected={value === ""}
              onClick={() => handleSelect("")}
            >
              {placeholder}
            </button>

            {filteredOptions.map(option => (
              <button
                type="button"
                key={option.value}
                className={`current-school-select-option${value === option.value ? " is-selected" : ""}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="current-school-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const CurrentSchoolSection = ({
  educationData,
  handleInputChange,
  handleNestedChange,
  onCVFilled,     // (parsedData: object) => void  — provided by EducationPage
  onSave,         // () => void  — optional, called when user clicks Save
}) => {
  const { currentSchool } = educationData;

  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // ── CV Upload ─────────────────────────────────────────────────────────────
const handleCVUpload = async (file) => {
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "doc", "docx"].includes(ext)) {
    setUploadError("Only PDF, DOC, or DOCX files are supported.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setUploadError("File must be under 10 MB.");
    return;
  }

  try {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated. Please log in again.");

    const formData = new FormData();
    formData.append("cv", file);

const response = await fetch(`${API_BASE_URL}/api/education/upload-cv`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "Upload failed");

    let parsed = json.parsedData;
    if (!parsed) throw new Error("No data returned from server.");

    // ✅ 🔥 IMPORTANT: fallback if courses empty
    if (!parsed.currentCourses?.courses?.length) {
      parsed.currentCourses = {
        numberOfCourses: 1,
        courses: [
          {
            courseName: "",
            courseLevel: "",
            credits: "",
            grade: "",
            term: "",
          },
        ],
      };
    }

    // ✅ Send parsed data to parent
    if (typeof onCVFilled === "function") {
      onCVFilled(parsed);
    }

    setUploadSuccess(
      "✅ CV parsed successfully! All fields have been auto-filled. Please review and save."
    );
  } catch (err) {
    console.error("CV upload error:", err);
    setUploadError(err.message || "Failed to upload and parse CV.");
  } finally {
    setUploading(false);
  }
};

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="current-school-section">

      {/* CV Upload Banner */}
      <div
        className="cv-upload-section"
        style={{
          background: "#f0f7ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "28px",
        }}
      >
        <h3 style={{ margin: "0 0 4px", color: "#1e40af", fontSize: "16px" }}>
          🚀 Auto-fill with CV Upload{" "}
          <span style={{ fontWeight: 400, fontSize: "13px", color: "#6b7280" }}>
            (Optional)
          </span>
        </h3>
        <p style={{ margin: "0 0 14px", color: "#374151", fontSize: "14px" }}>
          Upload your CV/Resume to automatically fill school, college, grades,
          courses, honors, and more.
        </p>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: uploading ? "not-allowed" : "pointer",
            background: uploading ? "#93c5fd" : "#2563eb",
            color: "#fff",
            padding: "9px 18px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            transition: "background 0.2s",
          }}
        >
          {uploading ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  border: "2px solid #fff",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Extracting…
            </>
          ) : (
            "📄 Upload CV"
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={uploading}
            style={{ display: "none" }}
            onChange={(e) => handleCVUpload(e.target.files[0])}
          />
        </label>

        <span style={{ marginLeft: "12px", fontSize: "12px", color: "#9ca3af" }}>
          PDF, DOC, DOCX · max 10 MB
        </span>

        {uploadError && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              fontSize: "14px",
            }}
          >
            ❌ {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#f0fdf4",
              color: "#15803d",
              border: "1px solid #86efac",
              fontSize: "14px",
            }}
          >
            {uploadSuccess}
          </div>
        )}
      </div>

      {/* Section Header */}
      <div className="current-school-header">
        <h2 className="current-school-title">
          Current or Most Recent Secondary / High School
        </h2>
        <div className="current-school-status">In progress</div>
      </div>

      <div className="current-school-description">
        Please provide information about your current or most recent
        secondary/high school.
      </div>

      {/* Form Fields */}
      <div className="current-school-grid">

        <div className="current-school-form-group current-school-full-width">
          <label className="current-school-label current-school-required">
            Current or most recent secondary / high school
          </label>
          <input
            type="text"
            className="current-school-input"
            placeholder="Find school"
            value={currentSchool.schoolName || ""}
            onChange={(e) =>
              handleInputChange("currentSchool", "schoolName", e.target.value)
            }
          />
          <div className="current-school-hint">Search for your school by name</div>
        </div>

        <div className="current-school-form-group">
          <label className="current-school-label current-school-required">
            Date of entry
          </label>
          <input
            type="month"
            className="current-school-input"
            value={currentSchool.dateOfEntry || ""}
            onChange={(e) =>
              handleInputChange("currentSchool", "dateOfEntry", e.target.value)
            }
          />
          <div className="current-school-hint">Month and year format</div>
        </div>

        <div className="current-school-form-group current-school-full-width">
          <label className="current-school-label current-school-required">
            Is this a boarding school?
          </label>
          <div className="current-school-radio-group">
            {["yes", "no"].map((v) => (
              <label key={v} className="current-school-radio-option">
                <input
                  type="radio"
                  value={v}
                  checked={currentSchool.isBoardingSchool === v}
                  onChange={(e) =>
                    handleInputChange(
                      "currentSchool",
                      "isBoardingSchool",
                      e.target.value
                    )
                  }
                />
                <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        {currentSchool.isBoardingSchool === "yes" && (
          <div className="current-school-form-group current-school-full-width">
            <label className="current-school-label current-school-required">
              Do you live on campus?
            </label>
            <div className="current-school-radio-group">
              {["yes", "no"].map((v) => (
                <label key={v} className="current-school-radio-option">
                  <input
                    type="radio"
                    value={v}
                    checked={currentSchool.liveOnCampus === v}
                    onChange={(e) =>
                      handleInputChange(
                        "currentSchool",
                        "liveOnCampus",
                        e.target.value
                      )
                    }
                  />
                  <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="current-school-form-group current-school-full-width">
          <label className="current-school-label current-school-required">
            Did or will you graduate from this school?
          </label>
          <div className="current-school-radio-group">
            {["yes", "no"].map((v) => (
              <label key={v} className="current-school-radio-option">
                <input
                  type="radio"
                  value={v}
                  checked={currentSchool.willGraduate === v}
                  onChange={(e) =>
                    handleInputChange(
                      "currentSchool",
                      "willGraduate",
                      e.target.value
                    )
                  }
                />
                <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        {currentSchool.willGraduate === "yes" && (
          <div className="current-school-form-group">
            <label className="current-school-label current-school-required">
              Graduation date
            </label>
            <input
              type="month"
              className="current-school-input"
              value={currentSchool.graduationDate || ""}
              onChange={(e) =>
                handleInputChange(
                  "currentSchool",
                  "graduationDate",
                  e.target.value
                )
              }
            />
          </div>
        )}
      </div>

      {/* School Address */}
      <div className="current-school-address-section">
        <h3 className="current-school-address-title">School Address</h3>
        <div className="current-school-grid">
          {[
            { placeholder: "Street",   field: "street"  },
            { placeholder: "City",     field: "city"    },
            { placeholder: "State",    field: "state"   },
            { placeholder: "Zip Code", field: "zipCode" },
          ].map(({ placeholder, field }) => (
            <input
              key={field}
              type="text"
              placeholder={placeholder}
              value={currentSchool.schoolAddress?.[field] || ""}
              onChange={(e) =>
                handleNestedChange(
                  "currentSchool",
                  "schoolAddress",
                  field,
                  e.target.value
                )
              }
            />
          ))}

          <CurrentSchoolSelect
            value={currentSchool.schoolAddress?.country || ""}
            options={SCHOOL_COUNTRY_OPTIONS}
            placeholder="Country"
            onChange={(nextValue) =>
              handleNestedChange(
                "currentSchool",
                "schoolAddress",
                "country",
                nextValue
              )
            }
            searchable
          />
        </div>
      </div>

      {/* Save button (optional — parent also auto-saves on CV fill) */}
      {typeof onSave === "function" && (
        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button
            onClick={onSave}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Save School Info
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CurrentSchoolSection;
