// src/components/education-sections/FuturePlansSection.js
import React from 'react';
import './FuturePlans.css';

const FuturePlansSection = ({ educationData, handleInputChange }) => {
  const { futurePlans } = educationData;

  // ✅ FIXED: Handle checkbox changes for additionalInterests array
  const handleInterestChange = (interest, isChecked) => {
    const currentInterests = futurePlans.additionalInterests || [];
    const updatedInterests = isChecked
      ? [...currentInterests, interest]
      : currentInterests.filter((item) => item !== interest);
    
    handleInputChange('futurePlans', 'additionalInterests', updatedInterests);
  };

  return (
    <div className="future-plans-section">
      {/* Header */}
      <div className="future-plans-header">
        <h2 className="future-plans-title">Future Plans</h2>
        <div className="future-plans-status">In progress</div>
      </div>

      <div className="future-plans-grid">
        {/* Student Type */}
        <div className="future-plans-form-group future-plans-full-width">
          <label className="future-plans-label future-plans-required">
            Which best describes you? I am:
          </label>
          <div className="future-plans-radio-group">
            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="first-year-2025-2026"
                checked={futurePlans.studentType === 'first-year-2025-2026'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Applying as a first-year student and plan to start college in 2025 or 2026
              </span>
            </label>

            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="start-2027"
                checked={futurePlans.studentType === 'start-2027'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Planning to start college in 2027
              </span>
            </label>

            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="start-2028-beyond"
                checked={futurePlans.studentType === 'start-2028-beyond'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Planning to start college in 2028 or beyond
              </span>
            </label>

            <label className="future-plans-radio-option">
              <input
                type="radio"
                name="studentType"
                value="already-college-student"
                checked={futurePlans.studentType === 'already-college-student'}
                onChange={(e) =>
                  handleInputChange('futurePlans', 'studentType', e.target.value)
                }
                className="future-plans-radio-input"
              />
              <span className="future-plans-radio-label">
                Already a college student
              </span>
            </label>
          </div>
        </div>

        {/* Highest Degree */}
        <div className="future-plans-form-group">
          <label className="future-plans-label future-plans-required">
            Highest degree you intend to earn
          </label>
          <select
            className="future-plans-select"
            value={futurePlans.highestDegree || ''}
            onChange={(e) =>
              handleInputChange('futurePlans', 'highestDegree', e.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="associate">Associate's Degree</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="doctorate">Doctorate/PhD</option>
            <option value="professional">Professional Degree (MD, JD, etc.)</option>
            <option value="undecided">Undecided</option>
          </select>
        </div>

        {/* Career Interest */}
        <div className="future-plans-form-group">
          <label className="future-plans-label future-plans-required">
            Career interest
          </label>
          <select
            className="future-plans-select"
            value={futurePlans.careerInterest || ''}
            onChange={(e) =>
              handleInputChange('futurePlans', 'careerInterest', e.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="business">Business</option>
            <option value="engineering">Engineering</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="technology">Technology</option>
            <option value="arts">Arts & Humanities</option>
            <option value="sciences">Sciences</option>
            <option value="social-sciences">Social Sciences</option>
            <option value="undecided">Undecided</option>
          </select>
        </div>

        {/* Additional Interests */}
        <div className="future-plans-form-group future-plans-full-width">
          <label className="future-plans-label">
            Additional Career Interests
          </label>
          <div className="future-plans-checkbox-group">
            {[
              'Entrepreneurship',
              'Research',
              'Public Service',
              'Creative Arts',
              'Sports & Athletics',
              'Environmental Science',
              'International Relations'
            ].map((interest) => (
              <label key={interest} className="future-plans-checkbox-option">
                <input
                  type="checkbox"
                  checked={
                    futurePlans.additionalInterests?.includes(interest) || false
                  }
                  onChange={(e) => handleInterestChange(interest, e.target.checked)}
                  className="future-plans-checkbox-input"
                />
                <span className="future-plans-checkbox-label">{interest}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturePlansSection;
