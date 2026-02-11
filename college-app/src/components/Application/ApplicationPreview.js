import React from 'react';
import './ApplicationPreview.css';

const ApplicationPreview = ({ formData }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not provided';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFileInfo = (file) => {
        if (!file) return 'Not uploaded';
        return `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    };

    const sections = [
        {
            title: 'Personal Information',
            data: [
                { label: 'Full Name', value: `${formData.firstName} ${formData.lastName}` },
                { label: 'Date of Birth', value: formatDate(formData.dob) },
                { label: 'Gender', value: formData.gender },
                { label: 'Nationality', value: formData.nationality },
                { label: 'Country of Residence', value: formData.countryOfResidence },
                { label: 'Email', value: formData.email },
                { label: 'Mobile', value: formData.mobile },
                { label: 'Passport', value: getFileInfo(formData.passport) },
                { label: 'Photograph', value: getFileInfo(formData.photograph) }
            ]
        },
        {
            title: 'Address & ID',
            data: [
                { label: 'Current Address', value: formData.currentAddress },
                { label: 'Permanent Address', value: formData.permanentAddress },
                { label: 'City', value: formData.city },
                { label: 'State', value: formData.state },
                { label: 'Country', value: formData.country },
                { label: 'Postal Code', value: formData.postalCode },
                { label: 'National ID', value: getFileInfo(formData.nationalId) }
            ]
        },
        {
            title: 'Educational Background',
            data: [
                { label: 'Highest Qualification', value: formData.qualificationLevel },
                { label: 'Institution', value: formData.institutionName },
                { label: 'Board/University', value: formData.boardUniversity },
                { label: 'Country of Study', value: formData.countryOfStudy },
                { label: 'Study Period', value: `${formData.startYear} - ${formData.endYear}` },
                { label: 'Result Status', value: formData.resultStatus },
                { label: 'Grading System', value: formData.gradingSystem },
                { label: 'Transcripts', value: getFileInfo(formData.transcripts) },
                { label: 'Degree Certificate', value: getFileInfo(formData.degreeCertificate) }
            ]
        },
        {
            title: 'English Language Proficiency',
            data: [
                { label: 'Test Type', value: formData.englishTestType },
                { label: 'Test Score', value: formData.testScore },
                { label: 'Test Date', value: formatDate(formData.testDate) },
                { label: 'Scorecard/MOI', value: getFileInfo(formData.testScorecard || formData.moiLetter) }
            ]
        },
        {
            title: 'Work Experience',
            data: [
                { label: 'Currently Employed', value: formData.isEmployed === 'yes' ? 'Yes' : 'No' },
                { label: 'Organization', value: formData.organizationName },
                { label: 'Job Title', value: formData.jobTitle },
                { label: 'Work Duration', value: formData.workDuration ? `${formData.workDuration} years` : 'N/A' },
                { label: 'Key Responsibilities', value: formData.responsibilities },
                { label: 'Resume', value: getFileInfo(formData.resume) },
                { label: 'Experience Letters', value: getFileInfo(formData.experienceLetters) }
            ]
        },
        {
            title: 'Course Selection',
            data: [
                { label: 'Study Destination', value: formData.selectedCountry },
                { label: 'University', value: formData.selectedUniversity },
                { label: 'Campus', value: formData.campus },
                { label: 'Program Level', value: formData.programLevel },
                { label: 'Course Name', value: formData.courseName },
                { label: 'Intake', value: `${formData.intakeMonth} ${formData.intakeYear}` },
                { label: 'Study Mode', value: formData.studyMode },
                { label: 'Second Preference', value: formData.secondPreference },
                { label: 'Third Preference', value: formData.thirdPreference }
            ]
        },
        {
            title: 'Supporting Documents',
            data: [
                { label: 'Statement of Purpose', value: getFileInfo(formData.sop) },
                { label: 'Letter of Recommendation 1', value: getFileInfo(formData.lor1) },
                { label: 'Letter of Recommendation 2', value: getFileInfo(formData.lor2) },
                { label: 'Portfolio', value: getFileInfo(formData.portfolio) },
                { label: 'Research Proposal', value: getFileInfo(formData.researchProposal) }
            ]
        },
        
        
    ];

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        alert('In a real application, this would generate and download a PDF summary');
        // PDF generation logic would go here
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-number">10</div>
                <div>
                    <h2 className="section-title">Application Preview</h2>
                    <p className="section-subtitle">Review all information before submission</p>
                </div>
            </div>

            <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p className="info-text">
                    Please review all information carefully. Once submitted, you cannot edit your application.
                    You can print or download this summary for your records.
                </p>
            </div>

            <div className="preview-actions">
                <button className="action-btn print-btn" onClick={handlePrint}>
                    <i className="fas fa-print"></i> Print Summary
                </button>
                <button className="action-btn pdf-btn" onClick={handleDownloadPDF}>
                    <i className="fas fa-file-pdf"></i> Download PDF
                </button>
            </div>

            <div className="application-summary">
                <div className="summary-header">
                    <div className="applicant-id">
                        <span className="id-label">Application ID:</span>
                        <span className="id-value">GUS-{Date.now().toString().slice(-8)}</span>
                    </div>
                    <div className="submission-date">
                        <span className="date-label">Preview Date:</span>
                        <span className="date-value">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="preview-section">
                        <h3 className="preview-section-title">
                            <span className="section-number">{sectionIndex + 1}</span>
                            {section.title}
                        </h3>
                        <div className="preview-grid">
                            {section.data.map((item, itemIndex) => (
                                <div key={itemIndex} className="preview-item">
                                    <div className="preview-label">{item.label}:</div>
                                    <div className="preview-value">
                                        {item.value || <span className="empty-value">Not provided</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="declaration-section">
                    <h3 className="preview-section-title">Declaration</h3>
                    <div className="declaration-card">
                        <div className="declaration-text">
                            <p>
                                I hereby declare that all information provided in this application is true, complete, 
                                and accurate to the best of my knowledge. I understand that any false statement or 
                                omission may lead to the rejection of my application or termination of my admission.
                            </p>
                            <p>
                                I agree to abide by the rules and regulations of the university and understand that 
                                all decisions made by the admissions committee are final.
                            </p>
                        </div>
                        <div className="declaration-agreement">
                            <div className="checkbox-option large">
                                <input
                                    type="checkbox"
                                    id="agreedToTerms"
                                    checked={formData.agreedToTerms}
                                    onChange={() => {}}
                                    disabled
                                />
                                <label htmlFor="agreedToTerms">
                                    I have read and agree to the terms and conditions
                                </label>
                            </div>
                        </div>
                        <div className="applicant-signature">
                            <div className="signature-line"></div>
                            <div className="signature-label">Applicant's Signature</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="final-submission">
                <div className="submission-checklist">
                    <h3 className="subsection-title">Final Checklist</h3>
                    <div className="checklist">
                        <div className="checklist-item">
                            <i className="fas fa-check-circle"></i>
                            <span>All required fields are completed</span>
                        </div>
                        <div className="checklist-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Documents are uploaded and readable</span>
                        </div>
                        <div className="checklist-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Payment receipt is uploaded</span>
                        </div>
                        <div className="checklist-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Information is accurate and truthful</span>
                        </div>
                    </div>
                </div>

                <div className="submission-note">
                    <div className="note-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="note-content">
                        <h4>Important Notice</h4>
                        <p>
                            After submission, you will receive a confirmation email with your application ID.
                            Keep this ID for all future communications. Application processing may take 4-6 weeks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationPreview;