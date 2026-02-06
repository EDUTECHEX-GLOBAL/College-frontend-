import React, { useState } from 'react';
import './ApplicationLanguage.css';

const ApplicationLanguage = ({ formData, onInputChange, onFileUpload }) => {
    const [showMOI, setShowMOI] = useState(false);

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    const handleTestTypeChange = (e) => {
        const value = e.target.value;
        onInputChange('englishTestType', value);
        setShowMOI(value === 'moi');
    };

    const testTypes = [
        { value: 'ielts', label: 'IELTS', maxScore: 9 },
        { value: 'toefl', label: 'TOEFL iBT', maxScore: 120 },
        { value: 'pte', label: 'PTE Academic', maxScore: 90 },
        { value: 'duolingo', label: 'Duolingo English Test', maxScore: 160 },
        { value: 'moi', label: 'Medium of Instruction (MOI)' }
    ];

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">4</div>
                <div>
                    <h2 className="section-title">English Language Proficiency</h2>
                    <p className="section-subtitle">Provide your English test scores or MOI details</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">If your previous education was in English, you can provide MOI instead of test scores.</p>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label className="form-label required" htmlFor="englishTestType">English Test Type</label>
                    <select
                        id="englishTestType"
                        className="form-select"
                        value={formData.englishTestType}
                        onChange={handleTestTypeChange}
                        required
                    >
                        <option value="">Select Test Type</option>
                        {testTypes.map(test => (
                            <option key={test.value} value={test.value}>{test.label}</option>
                        ))}
                    </select>
                </div>

                {!showMOI && formData.englishTestType && formData.englishTestType !== 'moi' && (
                    <>
                        <div className="form-group">
                            <label className="form-label required" htmlFor="testScore">Test Score</label>
                            <div className="score-input-container">
                                <input
                                    type="number"
                                    id="testScore"
                                    className="form-input"
                                    value={formData.testScore}
                                    onChange={(e) => onInputChange('testScore', e.target.value)}
                                    placeholder="Enter score"
                                    min="0"
                                    step="0.1"
                                    required
                                />
                                <div className="score-max">
                                    / {testTypes.find(t => t.value === formData.englishTestType)?.maxScore}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label required" htmlFor="testDate">Test Date</label>
                            <input
                                type="date"
                                id="testDate"
                                className="form-input"
                                value={formData.testDate}
                                onChange={(e) => onInputChange('testDate', e.target.value)}
                                required
                            />
                        </div>
                    </>
                )}
            </div>

            {showMOI && (
                <div className="moi-section">
                    <h3 className="subsection-title">Medium of Instruction Details</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Institution Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Name of institution with English MOI"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Program Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Program studied in English"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Duration (Years)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Years of English medium study"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="form-group">
                <label className="form-label required">
                    {showMOI ? 'MOI Letter' : 'Test Scorecard'}
                </label>
                <div className="upload-area">
                    <div className="upload-prompt">
                        <i className="fas fa-file-certificate"></i>
                        <p>
                            {showMOI 
                                ? 'Upload Medium of Instruction letter from your institution'
                                : 'Upload your official English test scorecard'
                            }
                        </p>
                        <p className="text-muted">PDF format (Max: 2MB)</p>
                    </div>
                    <input
                        type="file"
                        id="scorecardUpload"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, showMOI ? 'moiLetter' : 'testScorecard')}
                        className="file-input"
                        style={{ display: 'none' }}
                    />
                    <button 
                        className="upload-btn"
                        onClick={() => document.getElementById('scorecardUpload').click()}
                    >
                        <i className="fas fa-cloud-upload-alt"></i> 
                        {showMOI ? 'Upload MOI Letter' : 'Upload Scorecard'}
                    </button>
                    {showMOI ? (
                        formData.moiLetter && (
                            <div className="file-list">
                                <div className="file-item">
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.moiLetter.name}</span>
                                            <span className="file-size">{(formData.moiLetter.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-file"
                                        onClick={() => onFileUpload('moiLetter', null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        formData.testScorecard && (
                            <div className="file-list">
                                <div className="file-item">
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData.testScorecard.name}</span>
                                            <span className="file-size">{(formData.testScorecard.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="remove-file"
                                        onClick={() => onFileUpload('testScorecard', null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            {!showMOI && formData.englishTestType && (
                <div className="test-info">
                    <h3 className="subsection-title">Test Information</h3>
                    <div className="test-details">
                        <div className="test-detail">
                            <span className="detail-label">Test Validity:</span>
                            <span className="detail-value">2 years from test date</span>
                        </div>
                        <div className="test-detail">
                            <span className="detail-label">Minimum Required:</span>
                            <span className="detail-value">
                                {formData.englishTestType === 'ielts' && '6.5 overall'}
                                {formData.englishTestType === 'toefl' && '90 iBT'}
                                {formData.englishTestType === 'pte' && '65 overall'}
                                {formData.englishTestType === 'duolingo' && '115'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationLanguage;