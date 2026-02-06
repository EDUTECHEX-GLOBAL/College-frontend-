import React, { useState } from 'react';
import './Application.css';
import ApplicationPersonal from './ApplicationPersonal';
import ApplicationAddress from './ApplicationAddress';
import ApplicationEducation from './ApplicationEducation';
import ApplicationLanguage from './ApplicationLanguage';
import ApplicationWork from './ApplicationWork';
import ApplicationCourse from './ApplicationCourse';
import ApplicationDocuments from './ApplicationDocuments';
import ApplicationFinancial from './ApplicationFinancial';
import ApplicationPayment from './ApplicationPayment';
import ApplicationPreview from './ApplicationPreview';

const Application = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Personal Information
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        nationality: '',
        countryOfResidence: '',
        email: '',
        mobile: '',
        alternateContact: '',
        passport: null,
        photograph: null,
        
        // Address & Identification
        currentAddress: '',
        permanentAddress: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        nationalId: null,
        
        // Educational Background
        qualificationLevel: '',
        institutionName: '',
        boardUniversity: '',
        countryOfStudy: '',
        startYear: '',
        endYear: '',
        resultStatus: '',
        gradingSystem: '',
        transcripts: null,
        degreeCertificate: null,
        
        // English Language Proficiency
        englishTestType: '',
        testScore: '',
        testDate: '',
        testScorecard: null,
        moiLetter: null,
        
        // Work Experience
        isEmployed: '',
        organizationName: '',
        jobTitle: '',
        workDuration: '',
        responsibilities: '',
        resume: null,
        experienceLetters: null,
        
        // Course Selection
        selectedCountry: '',
        selectedUniversity: '',
        campus: '',
        programLevel: '',
        courseName: '',
        intakeMonth: '',
        intakeYear: '',
        studyMode: '',
        secondPreference: '',
        thirdPreference: '',
        
        // Supporting Documents
        sop: null,
        lor1: null,
        lor2: null,
        portfolio: null,
        researchProposal: null,
        
        // Financial Information
        fundingSource: '',
        estimatedBudget: '',
        bankStatement: null,
        sponsorLetter: null,
        
        // Payment Details
        applicationFeeRequired: '',
        paymentMode: '',
        transactionId: '',
        paymentReceipt: null,
        
        // Declaration
        agreedToTerms: false
    });

    const steps = [
        { id: 1, title: 'Personal Information', component: ApplicationPersonal },
        { id: 2, title: 'Address & ID', component: ApplicationAddress },
        { id: 3, title: 'Education', component: ApplicationEducation },
        { id: 4, title: 'Language', component: ApplicationLanguage },
        { id: 5, title: 'Work Experience', component: ApplicationWork },
        { id: 6, title: 'Course Selection', component: ApplicationCourse },
        { id: 7, title: 'Documents', component: ApplicationDocuments },
        { id: 8, title: 'Financial Info', component: ApplicationFinancial },
        { id: 9, title: 'Payment', component: ApplicationPayment },
        { id: 10, title: 'Preview', component: ApplicationPreview }
    ];

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileUpload = (field, file) => {
        setFormData(prev => ({
            ...prev,
            [field]: file
        }));
    };

    const handleSubmit = () => {
        console.log('Form submitted:', formData);
        alert('Application submitted successfully!');
        // Here you would typically send data to backend
    };

    const CurrentComponent = steps[currentStep - 1].component;

    return (
        <div className="application-container">
            <div className="application-header">
                <h1>GUS University Application Portal</h1>
                <p>Complete your application in {steps.length} steps</p>
            </div>

            <div className="progress-bar">
                {steps.map((step, index) => (
                    <div key={step.id} className="progress-step">
                        <div className={`step-circle ${currentStep >= step.id ? 'active' : ''}`}>
                            {step.id}
                        </div>
                        <div className="step-title">{step.title}</div>
                        {index < steps.length - 1 && <div className="step-connector"></div>}
                    </div>
                ))}
            </div>

            <div className="form-content">
                <CurrentComponent 
                    formData={formData}
                    onInputChange={handleInputChange}
                    onFileUpload={handleFileUpload}
                />
            </div>

            <div className="form-navigation">
                {currentStep > 1 && (
                    <button className="nav-btn prev-btn" onClick={handlePrev}>
                        <i className="fas fa-arrow-left"></i> Previous
                    </button>
                )}
                
                {currentStep < steps.length ? (
                    <button className="nav-btn next-btn" onClick={handleNext}>
                        Next <i className="fas fa-arrow-right"></i>
                    </button>
                ) : (
                    <button className="nav-btn submit-btn" onClick={handleSubmit}>
                        <i className="fas fa-paper-plane"></i> Submit Application
                    </button>
                )}
                
                <div className="step-indicator">
                    Step {currentStep} of {steps.length}
                </div>
            </div>
        </div>
    );
};

export default Application;