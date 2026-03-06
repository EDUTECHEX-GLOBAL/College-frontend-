// src/components/education-sections/CurrentCoursesSection.js
import React from 'react';
import './CurrentCourses.css';

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

    const currentCoursesList = currentCourses.courses || [];
    const newCourses = [];

    for (let i = 0; i < numCourses; i++) {
      newCourses.push(
        currentCoursesList[i] || {
          courseName: '',
          courseLevel: '',
          credits: '',
          grade: '',
          term: ''
        }
      );
    }

    handleInputChange('currentCourses', 'courses', newCourses);
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
        <select
          className="current-courses-select"
          value={currentCourses.numberOfCourses || ''}
          onChange={(e) => handleNumberOfCoursesChange(e.target.value)}
        >
          <option value="">Choose an option</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
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
                    onClick={() => {
                      const updatedCourses = currentCourses.courses.filter(
                        (_, i) => i !== index
                      );
                      handleInputChange(
                        'currentCourses',
                        'courses',
                        updatedCourses
                      );
                      handleInputChange(
                        'currentCourses',
                        'numberOfCourses',
                        updatedCourses.length
                      );
                    }}
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
                  <select
                    className="current-courses-select"
                    value={course.courseLevel}
                    onChange={(e) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'courseLevel',
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select level</option>
                    <option value="regular">Regular</option>
                    <option value="honors">Honors</option>
                    <option value="ap">AP</option>
                    <option value="ib">IB</option>
                    <option value="college-level">College Level</option>
                  </select>
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
                  <select
                    className="current-courses-select"
                    value={course.grade}
                    onChange={(e) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'grade',
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select grade</option>
                    {[
                      'A',
                      'A-',
                      'B+',
                      'B',
                      'B-',
                      'C+',
                      'C',
                      'C-',
                      'D+',
                      'D',
                      'F',
                      'IP'
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Term */}
                <div className="current-courses-form-group">
                  <label className="current-courses-label">Term</label>
                  <select
                    className="current-courses-select"
                    value={course.term}
                    onChange={(e) =>
                      handleArrayChange(
                        'currentCourses',
                        'courses',
                        index,
                        'term',
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select term</option>
                    <option value="fall">Fall</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="full-year">Full Year</option>
                  </select>
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
              if (currentCourses.courses.length < 10) {
                addArrayItem('currentCourses', 'courses', defaultCourse);
                handleInputChange(
                  'currentCourses',
                  'numberOfCourses',
                  currentCourses.courses.length + 1
                );
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
