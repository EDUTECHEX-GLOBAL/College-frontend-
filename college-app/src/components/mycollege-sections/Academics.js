import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Academics.css';
import { 
  SCHOOL_OPTIONS, 
  MAJOR_OPTIONS, 
  PRE_PROFESSIONAL_OPTIONS,
  getMajorsBySchool,
  getSubplansByMajor,
  hasEngineeringPrograms,
  hasMathQuestions,
  hasVisualArtQuestion,
  hasPortfolioInfo,
  hasSubplanSelection
} from '../../data/collegeData';

const API_URL = process.env.REACT_APP_API_URL;

const Academics = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    schoolDepartment: '',
    major: '',
    subplan: '',
    preProfessional: '',
    honorsProgram: '',
    algebraGrade: '',
    calculusGrade: '',
    visualArtGrade: '',
    selfFellowship: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch academics data from backend
  const fetchAcademicsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/academics/${collegeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { academics } = response.data;
        setFormData({
          schoolDepartment: academics.schoolDepartment || '',
          major: academics.major || '',
          subplan: academics.subplan || '',
          preProfessional: academics.preProfessional || '',
          honorsProgram: academics.honorsProgram || '',
          algebraGrade: academics.algebraGrade || '',
          calculusGrade: academics.calculusGrade || '',
          visualArtGrade: academics.visualArtGrade || '',
          selfFellowship: academics.selfFellowship || ''
        });
        setProgress(academics.progress || 0);
      }
    } catch (error) {
      console.error('Error fetching academics data:', error);
      // Fallback to localStorage if backend fails
      const savedData = localStorage.getItem(`college_${collegeId}_academics`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save academics data to backend
  const saveAcademicsData = async (data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/academics/${collegeId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { academics } = response.data;
        setProgress(academics.progress);
        return academics;
      }
    } catch (error) {
      console.error('Error saving academics data:', error);
      // Fallback to localStorage if backend fails
      localStorage.setItem(`college_${collegeId}_academics`, JSON.stringify(data));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Clear specific field
  const clearField = async (field) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/academics/${collegeId}/clear/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { academics } = response.data;
        setFormData({
          ...formData,
          [field]: ''
        });
        setProgress(academics.progress);
      }
    } catch (error) {
      console.error('Error clearing field:', error);
      // Fallback to localStorage if backend fails
      const updatedData = {
        ...formData,
        [field]: ''
      };
      setFormData(updatedData);
      localStorage.setItem(`college_${collegeId}_academics`, JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    fetchAcademicsData();
  }, [collegeId]);

  const handleInputChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // If school department changes, clear major and subplan selections
    if (field === 'schoolDepartment' && value !== formData.schoolDepartment) {
      updatedData.major = '';
      updatedData.subplan = '';
    }
    
    // If major changes, clear subplan selection
    if (field === 'major' && value !== formData.major) {
      updatedData.subplan = '';
    }
    
    setFormData(updatedData);

    // Auto-save to backend
    try {
      await saveAcademicsData(updatedData);
    } catch (error) {
      // If backend save fails, fallback to localStorage
      localStorage.setItem(`college_${collegeId}_academics`, JSON.stringify(updatedData));
    }
  };

  const handleClearAnswer = async (field) => {
    await clearField(field);
  };

  const handleSave = async () => {
    try {
      await saveAcademicsData(formData);
      alert('Academics data saved successfully!');
    } catch (error) {
      alert('Failed to save academics data. Please try again.');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveAcademicsData(formData);
      navigate(`/dashboard/colleges/${collegeId}/high-school`);
    } catch (error) {
      alert('Failed to save academics data. Please try again.');
    }
  };

  // Conditional content checks
  const showEngineeringQuestions = hasMathQuestions(formData.schoolDepartment, formData.major);
  const showSELFFellowship = hasEngineeringPrograms(formData.schoolDepartment);
  const showVisualArtQuestion = hasVisualArtQuestion(formData.schoolDepartment, formData.major);
  const showPortfolioInfo = hasPortfolioInfo(formData.schoolDepartment, formData.major);
  const showSubplanSelection = hasSubplanSelection(formData.schoolDepartment, formData.major);
  const subplanOptions = getSubplansByMajor(formData.major);

  if (loading) {
    return (
      <div className="academics-container">
        <div className="academics-loading">
          <div className="academics-loading-spinner"></div>
          <p>Loading academics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="academics-container">
      {/* Header Section */}
      <div className="academics-header">
        <div className="academics-header-nav">
          <button className="academics-back-button" onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}>
            ← Back to College Details
          </button>
        </div>
        
        <div className="academics-header-info">
          <h1 className="academics-title">Apply to University of Kansas</h1>
          <div className="academics-status">
            {/* <span className="status-indicator">● In progress</span> */}
          </div>
          <p className="academics-description">
            The questions on this page are being asked by University of Kansas.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="academics-content">
        <div className="academics-progress">
          <span className="academics-progress-text">Section Progress: {progress}%</span>
          <div className="academics-progress-bar">
            <div className="academics-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Main Form Content */}
        <section className="academics-form-section">
          <h2 className="academics-section-title">Academics</h2>
          
          {/* School/Department Question */}
          <div className="academics-question-card">
            <div className="academics-question-header">
              <h3 className="academics-question-title">To what school or department are you applying?*</h3>
              <span className="academics-question-required">Required</span>
            </div>
            <select 
              className="academics-form-select"
              value={formData.schoolDepartment}
              onChange={(e) => handleInputChange('schoolDepartment', e.target.value)}
              disabled={saving}
            >
              <option value="">Choose an option</option>
              {SCHOOL_OPTIONS.map((school, index) => (
                <option key={index} value={school}>
                  {school}
                </option>
              ))}
            </select>
            {formData.schoolDepartment && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('schoolDepartment')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Major Selection Question */}
          <div className="academics-question-card">
            <div className="academics-question-header">
              <h3 className="academics-question-title">Major*</h3>
              <span className="academics-question-required">Required</span>
            </div>
            <p className="academics-question-description">
              Please select one academic major. If you are undecided on an academic major, select "Deciding" in the College of Liberal Arts & Sciences and then one of the six subplan deciding options which best fits your general area of academic interest. You will be able to change your major later as you determine your specific interest.
            </p>
            <select 
              className="academics-form-select"
              value={formData.major}
              onChange={(e) => handleInputChange('major', e.target.value)}
              disabled={saving || !formData.schoolDepartment}
            >
              <option value="">Choose an option</option>
              {formData.schoolDepartment && getMajorsBySchool(formData.schoolDepartment).map((major, index) => (
                <option key={index} value={major}>
                  {major}
                </option>
              ))}
            </select>
            {!formData.schoolDepartment && (
              <p className="academics-field-note">Please select a school/department first</p>
            )}
            {formData.major && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('major')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Subplan Selection (Conditional) */}
          {showSubplanSelection && (
            <div className="academics-question-card">
              <div className="academics-question-header">
                <h3 className="academics-question-title">Subplan*</h3>
                <span className="academics-question-required">Required</span>
              </div>
              <select 
                className="academics-form-select"
                value={formData.subplan}
                onChange={(e) => handleInputChange('subplan', e.target.value)}
                disabled={saving}
              >
                <option value="">Choose an option</option>
                {subplanOptions.map((subplan, index) => (
                  <option key={index} value={subplan}>
                    {subplan}
                  </option>
                ))}
              </select>
              {formData.subplan && (
                <button 
                  className="clear-answer-button"
                  onClick={() => handleClearAnswer('subplan')}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear answer'}
                </button>
              )}
            </div>
          )}

          {/* Pre-professional Question */}
          <div className="academics-question-card">
            <div className="academics-question-header">
              <h3 className="academics-question-title">Pre-professional</h3>
            </div>
            <p className="academics-question-description">
              KU has pre-professional areas of interest that supplement majors but do not replace them. If you intend to pursue preparation in one of the following areas, please select one.
            </p>
            <select 
              className="academics-form-select"
              value={formData.preProfessional}
              onChange={(e) => handleInputChange('preProfessional', e.target.value)}
              disabled={saving}
            >
              <option value="">Choose an option</option>
              {PRE_PROFESSIONAL_OPTIONS.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {formData.preProfessional && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('preProfessional')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* Visual Art Question (Architecture & Design) */}
          {showVisualArtQuestion && (
            <div className="academics-question-card">
              <div className="academics-question-header">
                <h3 className="academics-question-title">Have you earned a B or higher in a high school visual art or creative class, such as studio art or graphic design?*</h3>
                <span className="academics-question-required">Required</span>
              </div>
              <select 
                className="academics-form-select"
                value={formData.visualArtGrade}
                onChange={(e) => handleInputChange('visualArtGrade', e.target.value)}
                disabled={saving}
              >
                <option value="">Choose an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {formData.visualArtGrade && (
                <button 
                  className="clear-answer-button"
                  onClick={() => handleClearAnswer('visualArtGrade')}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear answer'}
                </button>
              )}
            </div>
          )}

          {/* Engineering Math Questions */}
          {showEngineeringQuestions && (
            <>
              <div className="academics-question-card">
                <div className="academics-question-header">
                  <h3 className="academics-question-title">Have you earned a B or higher in college algebra, trigonometry or pre-calculus?*</h3>
                  <span className="academics-question-required">Required</span>
                </div>
                <select 
                  className="academics-form-select"
                  value={formData.algebraGrade}
                  onChange={(e) => handleInputChange('algebraGrade', e.target.value)}
                  disabled={saving}
                >
                  <option value="">Choose an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {formData.algebraGrade && (
                  <button 
                    className="clear-answer-button"
                    onClick={() => handleClearAnswer('algebraGrade')}
                    disabled={saving}
                  >
                    {saving ? 'Clearing...' : 'Clear answer'}
                  </button>
                )}
              </div>

              <div className="academics-question-card">
                <div className="academics-question-header">
                  <h3 className="academics-question-title">Have you earned a C or higher in calculus?*</h3>
                  <span className="academics-question-required">Required</span>
                </div>
                <select 
                  className="academics-form-select"
                  value={formData.calculusGrade}
                  onChange={(e) => handleInputChange('calculusGrade', e.target.value)}
                  disabled={saving}
                >
                  <option value="">Choose an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {formData.calculusGrade && (
                  <button 
                    className="clear-answer-button"
                    onClick={() => handleClearAnswer('calculusGrade')}
                    disabled={saving}
                  >
                    {saving ? 'Clearing...' : 'Clear answer'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Portfolio Information (Design) */}
          {showPortfolioInfo && (
            <div className="academics-info-card">
              <h3 className="academics-info-title">Additional Information</h3>
              <p className="academics-info-content">
                The School of Architecture & Design requires a portfolio with brief essay response to review your application for admission. Please submit your portfolio and essay response in SlideRoom after your application is submitted. Instructions on how to submit your portfolio and essay response as well as important deadlines can be found <a href="#" target="_blank" rel="noopener noreferrer">here</a>.
              </p>
            </div>
          )}

          {/* Double Majors and Minors Information */}
          <div className="academics-info-card">
            <h3 className="academics-info-title">Double Majors and Minors</h3>
            <p className="academics-info-content">
              Only one major can be selected on the application. Please select your primary program choice. If you have a second major that you would like to be considered for admission in and it is in a different school, please contact the Office of Admissions. If you would like a second major that is in the same school of the major selected above, please talk with an advisor at Orientation. Minors can be requested at the time of your Orientation.
            </p>
          </div>

          {/* University Honors Program */}
          <div className="academics-question-card">
            <div className="academics-question-header">
              <h3 className="academics-question-title">University Honors Program</h3>
            </div>
            <p className="academics-question-description">
              The University Honors Program encourages all highly academically motivated students to apply. The review committee is looking for students with a strong academic record as well as evidence of curiosity, breadth and depth of involvement, and leadership potential as evidenced by application materials. For more information about the program and its admission process, please visit{' '}
              <a href="https://honors.ku.edu/" target="_blank" rel="noopener noreferrer">https://honors.ku.edu/</a>.
            </p>
            <p className="academics-question-description">
              For strongest consideration, apply to the University Honors Program by the standard deadline of Dec. 1, 2025. The final consideration deadline to apply to the University Honors Program for Fall 2026 is February 1 for domestic students (March 1 for international students).
            </p>
            <p className="academics-question-description">
              Are you interested in applying to the University Honors Program? If so, selecting this option will allow you to access the application in your KU Applicant Status Portal (accessible 2-5 business days after submitting the Common Application).
            </p>
            <div className="academics-radio-group">
              <label className="academics-radio-option">
                <input
                  type="radio"
                  name="honorsProgram"
                  value="yes"
                  checked={formData.honorsProgram === 'yes'}
                  onChange={(e) => handleInputChange('honorsProgram', e.target.value)}
                  className="academics-radio-input"
                  disabled={saving}
                />
                <span className="academics-radio-label">Yes</span>
              </label>
              <label className="academics-radio-option">
                <input
                  type="radio"
                  name="honorsProgram"
                  value="no"
                  checked={formData.honorsProgram === 'no'}
                  onChange={(e) => handleInputChange('honorsProgram', e.target.value)}
                  className="academics-radio-input"
                  disabled={saving}
                />
                <span className="academics-radio-label">No</span>
              </label>
            </div>
            {(formData.honorsProgram === 'yes' || formData.honorsProgram === 'no') && (
              <button 
                className="clear-answer-button"
                onClick={() => handleClearAnswer('honorsProgram')}
                disabled={saving}
              >
                {saving ? 'Clearing...' : 'Clear answer'}
              </button>
            )}
          </div>

          {/* SELF Fellowship Program (Engineering only) */}
          {showSELFFellowship && (
            <div className="academics-question-card">
              <div className="academics-question-header">
                <h3 className="academics-question-title">SELF Fellowship Program</h3>
              </div>
              <p className="academics-question-description">
                The SELF Program is a 4-year Fellowship with co-curricular programming aimed at developing passionate, goal-oriented engineering and computer science graduates to become engineering leaders and entrepreneurs. As part of the SELF Program, admitted Fellows are eligible for tuition assistance and opportunity grants, which are stackable upon all other School and University awards.
              </p>
              <p className="academics-question-description">
                The final deadline for submission of all application materials will be December 1, 2025.
              </p>
              <p className="academics-question-description">
                Please visit our website (<a href="https://engr.ku.edu/self-engineering-leadership-fellows-program" target="_blank" rel="noopener noreferrer">https://engr.ku.edu/self-engineering-leadership-fellows-program</a>) to learn more.
              </p>
              <p className="academics-question-description">
                Are you interested in learning more about the SELF Fellowship Program?
              </p>
              <div className="academics-radio-group">
                <label className="academics-radio-option">
                  <input
                    type="radio"
                    name="selfFellowship"
                    value="yes"
                    checked={formData.selfFellowship === 'yes'}
                    onChange={(e) => handleInputChange('selfFellowship', e.target.value)}
                    className="academics-radio-input"
                    disabled={saving}
                  />
                  <span className="academics-radio-label">Yes</span>
                </label>
                <label className="academics-radio-option">
                  <input
                    type="radio"
                    name="selfFellowship"
                    value="no"
                    checked={formData.selfFellowship === 'no'}
                    onChange={(e) => handleInputChange('selfFellowship', e.target.value)}
                    className="academics-radio-input"
                    disabled={saving}
                  />
                  <span className="academics-radio-label">No</span>
                </label>
              </div>
              {(formData.selfFellowship === 'yes' || formData.selfFellowship === 'no') && (
                <button 
                  className="clear-answer-button"
                  onClick={() => handleClearAnswer('selfFellowship')}
                  disabled={saving}
                >
                  {saving ? 'Clearing...' : 'Clear answer'}
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="academics-actions">
            <button 
              className="academics-secondary-button" 
              onClick={() => navigate(`/dashboard/colleges/${collegeId}`)}
              disabled={saving}
            >
              Save and Close
            </button>
            <button 
              className="academics-primary-button" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="academics-primary-button" 
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Academics;