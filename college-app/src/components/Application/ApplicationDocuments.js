import React from 'react';
import './ApplicationDocuments.css';

const ApplicationDocuments = ({ formData, onFileUpload }) => {
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            onFileUpload(field, file);
        }
    };

    const documentTypes = [
        {
            field: 'sop',
            label: 'Statement of Purpose (SOP)',
            description: 'A 500-1000 word essay explaining your motivation for pursuing this program',
            required: true
        },
        {
            field: 'lor1',
            label: 'Letter of Recommendation 1',
            description: 'From a professor or academic supervisor',
            required: true
        },
        {
            field: 'lor2',
            label: 'Letter of Recommendation 2',
            description: 'From a professor or employer',
            required: true
        },
        {
            field: 'portfolio',
            label: 'Portfolio (if applicable)',
            description: 'For creative programs (Art, Design, Architecture, etc.)',
            required: false
        },
        {
            field: 'researchProposal',
            label: 'Research Proposal (for PhD)',
            description: 'Required for PhD and research-based programs',
            required: false
        }
    ];

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">7</div>
                <div>
                    <h2 className="section-title">Supporting Documents</h2>
                    <p className="section-subtitle">Upload all required supporting documents</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">
                    All documents must be in PDF format. Maximum file size: 5MB per document.
                    Ensure documents are clearly scanned and readable.
                </p>
            </div>

            <div className="documents-grid">
                {documentTypes.map((doc, index) => (
                    <div key={doc.field} className="document-card">
                        <div className="document-header">
                            <h3 className="document-title">
                                {doc.label}
                                {doc.required && <span className="required-badge">Required</span>}
                            </h3>
                            <p className="document-description">{doc.description}</p>
                        </div>
                        
                        <div className="document-upload-area">
                            <div className="upload-prompt">
                                <i className="fas fa-file-upload"></i>
                                <p>Upload {doc.label.toLowerCase()}</p>
                            </div>
                            <input
                                type="file"
                                id={`${doc.field}Upload`}
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, doc.field)}
                                className="file-input"
                                style={{ display: 'none' }}
                            />
                            
                            {!formData[doc.field] ? (
                                <button 
                                    className="upload-btn"
                                    onClick={() => document.getElementById(`${doc.field}Upload`).click()}
                                >
                                    <i className="fas fa-cloud-upload-alt"></i> Upload Document
                                </button>
                            ) : (
                                <div className="file-preview">
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf file-icon"></i>
                                        <div className="file-details">
                                            <span className="file-name">{formData[doc.field].name}</span>
                                            <span className="file-size">
                                                {(formData[doc.field].size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="file-actions">
                                        <button 
                                            className="view-btn"
                                            onClick={() => window.open(URL.createObjectURL(formData[doc.field]))}
                                        >
                                            <i className="fas fa-eye"></i> View
                                        </button>
                                        <button 
                                            className="remove-btn"
                                            onClick={() => onFileUpload(doc.field, null)}
                                        >
                                            <i className="fas fa-times"></i> Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="document-tips">
                            <h4 className="tips-title">
                                <i className="fas fa-lightbulb"></i> Tips:
                            </h4>
                            <ul className="tips-list">
                                {doc.field === 'sop' && (
                                    <>
                                        <li>Clearly state your academic and career goals</li>
                                        <li>Explain why you chose this specific program</li>
                                        <li>Highlight relevant experiences and skills</li>
                                        <li>Proofread for grammar and spelling</li>
                                    </>
                                )}
                                {doc.field.startsWith('lor') && (
                                    <>
                                        <li>Should be on official letterhead</li>
                                        <li>Include recommender's contact information</li>
                                        <li>Should be signed by the recommender</li>
                                        <li>Focus on your academic abilities and character</li>
                                    </>
                                )}
                                {doc.field === 'portfolio' && (
                                    <>
                                        <li>Include your best work samples</li>
                                        <li>Provide descriptions for each piece</li>
                                        <li>Showcase range of skills and creativity</li>
                                        <li>Keep it well-organized</li>
                                    </>
                                )}
                                {doc.field === 'researchProposal' && (
                                    <>
                                        <li>Clearly state research question</li>
                                        <li>Include literature review</li>
                                        <li>Describe methodology</li>
                                        <li>Explain expected outcomes</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            <div className="documents-checklist">
                <h3 className="subsection-title">Documents Checklist</h3>
                <div className="checklist-card">
                    {documentTypes.map((doc) => (
                        <div key={doc.field} className="checklist-item">
                            <div className="checklist-status">
                                {formData[doc.field] ? (
                                    <i className="fas fa-check-circle status-complete"></i>
                                ) : (
                                    <i className="fas fa-times-circle status-pending"></i>
                                )}
                            </div>
                            <div className="checklist-content">
                                <span className="checklist-text">{doc.label}</span>
                                <span className={`checklist-state ${formData[doc.field] ? 'complete' : 'pending'}`}>
                                    {formData[doc.field] ? 'Uploaded' : 'Pending'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ApplicationDocuments;