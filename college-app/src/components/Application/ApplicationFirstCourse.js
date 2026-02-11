import React, { useState, useEffect } from 'react';
import './ApplicationFirstCourse.css';

const ApplicationFirstCourse = ({ formData, onInputChange, onNext, onPrev }) => {
    const [selectedCourseData, setSelectedCourseData] = useState(null);

    useEffect(() => {
        // Check if course data was passed from Courses page
        const savedCourseData = localStorage.getItem('selectedCourseForApplication');
        if (savedCourseData) {
            const courseData = JSON.parse(savedCourseData);
            setSelectedCourseData(courseData);
            
            // Pre-fill form with the selected course data
            if (!formData.selectedUniversity) {
                onInputChange('selectedUniversity', courseData.universityName);
            }
            if (!formData.courseName) {
                onInputChange('courseName', courseData.programName);
            }
            if (!formData.programLevel) {
                onInputChange('programLevel', courseData.programDetails.level.toLowerCase());
            }
            if (!formData.studyMode) {
                onInputChange('studyMode', courseData.programDetails.studyMode.toLowerCase());
            }
        }
    }, []);

    const universities = {
        'usa': ['Harvard University', 'MIT', 'Stanford University', 'University of California'],
        'uk': ['University of Oxford', 'University of Cambridge', 'Imperial College London'],
        'canada': ['University of Toronto', 'University of British Columbia', 'McGill University'],
        'australia': ['University of Melbourne', 'Australian National University', 'University of Sydney'],
        'germany': ['Technical University of Munich', 'Heidelberg University', 'Ludwig Maximilian University']
    };

    const courses = {
        'Harvard University': ['Computer Science', 'Business Administration', 'Engineering'],
        'MIT': ['Computer Science', 'Mechanical Engineering', 'Physics'],
        'University of Oxford': ['Law', 'Medicine', 'Philosophy']
    };

    const handleCountryChange = (e) => {
        const country = e.target.value;
        onInputChange('selectedCountry', country);
        onInputChange('selectedUniversity', '');
        onInputChange('courseName', '');
    };

    const handleUniversityChange = (e) => {
        const university = e.target.value;
        onInputChange('selectedUniversity', university);
        onInputChange('courseName', '');
    };

    const intakes = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let year = currentYear; year <= currentYear + 2; year++) {
        yearOptions.push(year);
    }

    const handleNext = () => {
        // Validate required fields
        if (!formData.selectedCountry || !formData.selectedUniversity || !formData.courseName || 
            !formData.programLevel || !formData.intakeMonth || !formData.intakeYear || !formData.studyMode) {
            alert('Please fill all required fields marked with *');
            return;
        }
        
        // Save course selection to application data
        const applicationData = {
            ...formData,
            selectedCourseData: selectedCourseData
        };
        
        localStorage.setItem('applicationCourseData', JSON.stringify(applicationData));
        
        onNext();
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">6</div>
                <div>
                    <h2 className="section-title">Course Selection</h2>
                    <p className="section-subtitle">Choose your preferred program and university</p>
                </div>
            </div>

            {selectedCourseData && (
                <div className="course-selection-banner">
                    <div className="banner-header">
                        <i className="fas fa-check-circle"></i>
                        <span>Course pre-selected from search</span>
                    </div>
                    <div className="banner-content">
                        <div className="banner-item">
                            <strong>University:</strong> {selectedCourseData.universityName}
                        </div>
                        <div className="banner-item">
                            <strong>Program:</strong> {selectedCourseData.programName}
                        </div>
                        <div className="banner-item">
                            <strong>Study Mode:</strong> {selectedCourseData.programDetails.studyMode}
                        </div>
                        <div className="banner-item">
                            <strong>Level:</strong> {selectedCourseData.programDetails.level}
                        </div>
                    </div>
                    <button 
                        className="change-course-btn"
                        onClick={() => {
                            setSelectedCourseData(null);
                            localStorage.removeItem('selectedCourseForApplication');
                        }}
                    >
                        Change Course
                    </button>
                </div>
            )}

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">Select up to 3 course preferences. Your first preference will be given priority.</p>
            </div>

            <h3 className="subsection-title">Primary Preference</h3>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required" htmlFor="selectedCountry">Study Destination</label>
                    <select
                        id="selectedCountry"
                        className="form-select"
                        value={formData.selectedCountry}
                        onChange={handleCountryChange}
                        required
                    >
                        <option value="">Select Country</option>
                        <option value="usa">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="canada">Canada</option>
                        <option value="australia">Australia</option>
                        <option value="germany">Germany</option>
                        <option value="france">France</option>
                        <option value="netherlands">Netherlands</option>
                        <option value="singapore">Singapore</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="selectedUniversity">University</label>
                    <select
                        id="selectedUniversity"
                        className="form-select"
                        value={formData.selectedUniversity}
                        onChange={handleUniversityChange}
                        disabled={!formData.selectedCountry}
                        required
                    >
                        <option value="">Select University</option>
                        {formData.selectedCountry && universities[formData.selectedCountry]?.map((uni, index) => (
                            <option key={index} value={uni}>{uni}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="campus">Campus</label>
                    <select
                        id="campus"
                        className="form-select"
                        value={formData.campus}
                        onChange={(e) => onInputChange('campus', e.target.value)}
                    >
                        <option value="">Select Campus</option>
                        <option value="main">Main Campus</option>
                        <option value="downtown">Downtown Campus</option>
                        <option value="north">North Campus</option>
                        <option value="south">South Campus</option>
                        <option value="online">Online</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="programLevel">Program Level</label>
                    <select
                        id="programLevel"
                        className="form-select"
                        value={formData.programLevel}
                        onChange={(e) => onInputChange('programLevel', e.target.value)}
                        required
                    >
                        <option value="">Select Level</option>
                        <option value="foundation">Foundation</option>
                        <option value="undergraduate">Undergraduate</option>
                        <option value="postgraduate">Postgraduate</option>
                        <option value="masters">Master's</option>
                        <option value="phd">PhD</option>
                        <option value="diploma">Diploma</option>
                        <option value="certificate">Certificate</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="courseName">Course Name</label>
                    <select
                        id="courseName"
                        className="form-select"
                        value={formData.courseName}
                        onChange={(e) => onInputChange('courseName', e.target.value)}
                        disabled={!formData.selectedUniversity}
                        required
                    >
                        <option value="">Select Course</option>
                        {formData.selectedUniversity && courses[formData.selectedUniversity]?.map((course, index) => (
                            <option key={index} value={course}>{course}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="intakeMonth">Intake Month</label>
                    <select
                        id="intakeMonth"
                        className="form-select"
                        value={formData.intakeMonth}
                        onChange={(e) => onInputChange('intakeMonth', e.target.value)}
                        required
                    >
                        <option value="">Select Month</option>
                        {intakes.map((month, index) => (
                            <option key={index} value={month}>{month}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="intakeYear">Intake Year</label>
                    <select
                        id="intakeYear"
                        className="form-select"
                        value={formData.intakeYear}
                        onChange={(e) => onInputChange('intakeYear', e.target.value)}
                        required
                    >
                        <option value="">Select Year</option>
                        {yearOptions.map((year, index) => (
                            <option key={index} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label required" htmlFor="studyMode">Study Mode</label>
                    <div className="radio-group">
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="full-time"
                                name="studyMode"
                                value="full-time"
                                checked={formData.studyMode === 'full-time'}
                                onChange={(e) => onInputChange('studyMode', e.target.value)}
                                required
                            />
                            <label htmlFor="full-time">Full Time</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="part-time"
                                name="studyMode"
                                value="part-time"
                                checked={formData.studyMode === 'part-time'}
                                onChange={(e) => onInputChange('studyMode', e.target.value)}
                            />
                            <label htmlFor="part-time">Part Time</label>
                        </div>
                        <div className="radio-option">
                            <input
                                type="radio"
                                id="online"
                                name="studyMode"
                                value="online"
                                checked={formData.studyMode === 'online'}
                                onChange={(e) => onInputChange('studyMode', e.target.value)}
                            />
                            <label htmlFor="online">Online</label>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="subsection-title">Alternative Preferences</h3>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label" htmlFor="secondPreference">Second Preference</label>
                    <input
                        type="text"
                        id="secondPreference"
                        className="form-input"
                        value={formData.secondPreference}
                        onChange={(e) => onInputChange('secondPreference', e.target.value)}
                        placeholder="Alternative course/university"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="thirdPreference">Third Preference</label>
                    <input
                        type="text"
                        id="thirdPreference"
                        className="form-input"
                        value={formData.thirdPreference}
                        onChange={(e) => onInputChange('thirdPreference', e.target.value)}
                        placeholder="Backup course/university"
                    />
                </div>
            </div>

            <div className="course-summary">
                <h3 className="subsection-title">Selection Summary</h3>
                <div className="summary-card">
                    <div className="summary-item">
                        <span className="summary-label">Country:</span>
                        <span className="summary-value">{formData.selectedCountry || 'Not selected'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">University:</span>
                        <span className="summary-value">{formData.selectedUniversity || 'Not selected'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Course:</span>
                        <span className="summary-value">{formData.courseName || 'Not selected'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Intake:</span>
                        <span className="summary-value">
                            {formData.intakeMonth && formData.intakeYear 
                                ? `${formData.intakeMonth} ${formData.intakeYear}`
                                : 'Not selected'
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="form-navigation">
                <button type="button" className="btn-secondary" onClick={onPrev}>
                    <i className="fas fa-arrow-left"></i> Previous
                </button>
                <button type="button" className="btn-primary" onClick={handleNext}>
                    Next <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
};

export default ApplicationFirstCourse;