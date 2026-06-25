// src/components/education-sections/CurrentCoursesSection.js
import React, { useEffect, useRef, useState } from 'react';
import './CurrentCoursesSection.css';

const NUMBER_OF_COURSES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
  value: String(num),
  label: String(num),
}));

const COURSE_LEVEL_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'honors', label: 'Honors' },
  { value: 'ap', label: 'AP' },
  { value: 'ib', label: 'IB' },
  { value: 'college-level', label: 'College Level' },
];

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'IP'].map(grade => ({
  value: grade,
  label: grade,
}));

const TERM_OPTIONS = [
  { value: 'fall', label: 'Fall' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'full-year', label: 'Full Year' },
];

const CurrentCoursesSelect = ({ value, options, placeholder, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const selectRef = useRef(null);
  const listboxIdRef = useRef(`current-courses-${Math.random().toString(36).slice(2)}-listbox`);
  const selectedOption = options.find(option => String(option.value) === String(value || ''));

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateMenuDirection = () => {
      const rect = selectRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      setOpensUpward(spaceBelow < 220 && spaceAbove > spaceBelow);
    };

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    updateMenuDirection();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updateMenuDirection);
    window.addEventListener('scroll', updateMenuDirection, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updateMenuDirection);
      window.removeEventListener('scroll', updateMenuDirection, true);
    };
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`current-courses-custom-select${isOpen ? ' is-open' : ''}${opensUpward ? ' is-upward' : ''}`}
    >
      <button
        type="button"
        className={`current-courses-select current-courses-select-trigger${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxIdRef.current}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="current-courses-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="current-courses-select-menu" id={listboxIdRef.current} role="listbox">
          <button
            type="button"
            className={`current-courses-select-option${String(value || '') === '' ? ' is-selected' : ''}`}
            role="option"
            aria-selected={String(value || '') === ''}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </button>

          {options.map(option => (
            <button
              type="button"
              key={option.value}
              className={`current-courses-select-option${String(value || '') === String(option.value) ? ' is-selected' : ''}`}
              role="option"
              aria-selected={String(value || '') === String(option.value)}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CurrentCoursesSection = ({
  educationData,
  handleInputChange,
  handleArrayChange,
  addArrayItem,
  removeArrayItem
}) => {
  const { currentCourses } = educationData;

  const handleNumberOfCoursesChange = (value) => {
    const numCourses = parseInt(value);
    handleInputChange('currentCourses', 'numberOfCourses', numCourses);
  };

  const defaultCourse = {
    courseName: '',
    courseLevel: '',
    credits: '',
    grade: '',
    term: ''
  };

  return (
    <div className="current-courses-section">
      {/* Header */}
      <div className="current-courses-header">
        <h2 className="current-courses-title">
          Current or Most Recent Year Courses
        </h2>
        <div className="current-courses-status">In progress</div>
      </div>

      <div className="current-courses-description">
        Please list all courses you are taking this academic year. If you are not
        currently enrolled, please list courses from your most recent academic year.
      </div>

      {/* Number of Courses */}
      <div className="current-courses-form-group">
        <label className="current-courses-label current-courses-required">
          How many courses would you like to report?
        </label>
        <CurrentCoursesSelect
          value={currentCourses.numberOfCourses || ''}
          options={NUMBER_OF_COURSES_OPTIONS}
          placeholder="Choose an option"
          onChange={handleNumberOfCoursesChange}
        />
      </div>

      {/* Scheduling System */}
      <div className="current-courses-form-group">
        <label className="current-courses-label current-courses-required">
          Course scheduling system your institution is using
        </label>
        <div className="current-courses-radio-group">
          {['semester', 'trimester', 'quarter', 'yearly'].map((system) => (
            <label
              key={system}
              className="current-courses-radio-option"
            >
              <input
                type="radio"
                name="schedulingSystem"
                value={system}
                checked={currentCourses.schedulingSystem === system}
                onChange={(e) =>
                  handleInputChange('currentCourses', 'schedulingSystem', e.target.value)
                }
                className="current-courses-radio-input"
              />
              <span className="current-courses-radio-label">
                {system.charAt(0).toUpperCase() + system.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Course Details */}
      {currentCourses.courses &&
        currentCourses.courses.map((course, index) => (
          <div key={index} className="current-courses-array-section">
            <div className="current-courses-item">
              <div className="current-courses-item-header">
                <h4 className="current-courses-item-title">
                  Course {index + 1}
                </h4>
                {currentCourses.numberOfCourses > 0 && (
                  <button
                    type="button"
                    className="current-courses-remove-btn"
                    onClick={() => removeArrayItem('currentCourses', 'courses', index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="current-courses-grid">
                {/* Course Name */}
                <div className="current-courses-form-group current-courses-full-width">
                  <label className="current-courses-label current-courses-required">
                    Course Name
                  </label>
                  <input
                    type="text"
                    className="current-courses-input"
                    placeholder="Enter course name"
                    value={course.courseName}
                    onChange={(e) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'courseName',
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Course Level */}
                <div className="current-courses-form-group">
                  <label className="current-courses-label current-courses-required">
                    Course Level
                  </label>
                  <CurrentCoursesSelect
                    value={course.courseLevel}
                    options={COURSE_LEVEL_OPTIONS}
                    placeholder="Select level"
                    onChange={(nextValue) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'courseLevel',
                        nextValue
                      )
                    }
                  />
                </div>

                {/* Credits */}
                <div className="current-courses-form-group">
                  <label className="current-courses-label">Credits</label>
                  <input
                    type="number"
                    step="0.5"
                    className="current-courses-input"
                    placeholder="Enter credits"
                    value={course.credits}
                    onChange={(e) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'credits',
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Grade */}
                <div className="current-courses-form-group">
                  <label className="current-courses-label">Grade</label>
                  <CurrentCoursesSelect
                    value={course.grade}
                    options={GRADE_OPTIONS}
                    placeholder="Select grade"
                    onChange={(nextValue) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'grade',
                        nextValue
                      )
                    }
                  />
                </div>

                {/* Term */}
                <div className="current-courses-form-group">
                  <label className="current-courses-label">Term</label>
                  <CurrentCoursesSelect
                    value={course.term}
                    options={TERM_OPTIONS}
                    placeholder="Select term"
                    onChange={(nextValue) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'term',
                        nextValue
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* Add Course Button */}
      {currentCourses.numberOfCourses < 10 &&
        currentCourses.numberOfCourses > 0 && (
          <button
            type="button"
            className="current-courses-add-btn"
            onClick={() => {
              if ((currentCourses.courses || []).length < 10) {
                addArrayItem('currentCourses', 'courses', defaultCourse);
              }
            }}
          >
            + Add Another Course
          </button>
        )}
    </div>
  );
};

export default CurrentCoursesSection;
