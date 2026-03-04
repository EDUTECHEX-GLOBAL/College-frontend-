import React, { useState } from "react";
import "./Bachelors.css";

const BachelorsTemplate = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: "+1",
    phone: "",
    dateOfBirth: "",
    currentLevel: "",
    collegeName: "",
    customCollege: "",
    country: "",
    customCountry: "",
    state: "",
    customState: "",
    city: "",
    zipCode: "",
    address: "",
    programInterest: "",
    startTerm: "",
  });

  const [errors, setErrors] = useState({});
  const [showCustomCollege, setShowCustomCollege] = useState(false);

  // 50+ Countries
  const countries = [
    "United States", "Canada", "United Kingdom", "Australia", "India", 
    "Germany", "France", "Japan", "China", "Brazil", "Mexico", "Italy",
    "Spain", "Netherlands", "Switzerland", "Sweden", "Norway", "Denmark",
    "South Africa", "United Arab Emirates", "Singapore", "Malaysia",
    "South Korea", "New Zealand", "Ireland", "Belgium", "Austria",
    "Poland", "Portugal", "Greece", "Turkey", "Russia", "Argentina",
    "Chile", "Colombia", "Peru", "Egypt", "Saudi Arabia", "Israel",
    "Thailand", "Vietnam", "Philippines", "Indonesia", "Pakistan",
    "Bangladesh", "Sri Lanka", "Nepal", "Other"
  ];

  // ALL 50 US States + Other
  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming", "Other"
  ];

  const canadaProvinces = [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
    "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan",
    "Yukon", "Other"
  ];

  // 70+ Universities + Other
  const universities = [
    "Harvard University", "Stanford University", "MIT", "University of California, Berkeley",
    "Yale University", "Princeton University", "University of Pennsylvania",
    "California Institute of Technology", "Duke University", "Johns Hopkins University",
    "Northwestern University", "University of Michigan", "Columbia University",
    "University of Chicago", "University of California, Los Angeles",
    "Cornell University", "University of California, San Diego",
    "University of Washington", "University of Texas at Austin",
    "University of Wisconsin-Madison", "Brown University", 
    "University of North Carolina at Chapel Hill", "University of Southern California",
    "Boston University", "New York University", "University of Illinois at Urbana-Champaign",
    "University of Minnesota", "Purdue University", "University of Florida",
    "University of Maryland", "Pennsylvania State University", "University of Georgia",
    "Ohio State University", "University of California, Davis",
    "University of California, Santa Barbara", "University of Virginia",
    "University of Colorado Boulder", "University of Massachusetts Amherst",
    "Carnegie Mellon University", "University of California, Irvine",
    "Georgia Institute of Technology", "University of California, Santa Cruz",
    "Tufts University", "Northeastern University", "University of Rochester",
    "Brandeis University", "Case Western Reserve University", "Rensselaer Polytechnic Institute",
    "University of Miami", "Pepperdine University", "Other"
  ];

  // Phone Country Codes
  const countryCodes = [
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+81", country: "Japan" },
    { code: "+86", country: "China" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
    { code: "+39", country: "Italy" },
    { code: "+34", country: "Spain" },
    { code: "+31", country: "Netherlands" },
    { code: "+971", country: "UAE" },
    { code: "+82", country: "South Korea" },
    { code: "+65", country: "Singapore" }
  ];

  // 25+ Programs
  const programs = [
    "Computer Science", "Business Administration", "Engineering", "Psychology",
    "Economics", "Biology", "Political Science", "English Literature",
    "Mathematics", "Physics", "Chemistry", "Art History", "Architecture",
    "Accounting", "Marketing", "Finance", "Nursing", "Education",
    "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
    "Biomedical Engineering", "Data Science", "Artificial Intelligence",
    "Cybersecurity", "Graphic Design"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Allow only numbers for phone input
    const filteredValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, phone: filteredValue }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  const handleCollegeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, collegeName: value }));
    setShowCustomCollege(value === "Other");
    if (errors.collegeName) setErrors(prev => ({ ...prev, collegeName: "" }));
  };

  const handleStateChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, state: value }));
    if (errors.state) setErrors(prev => ({ ...prev, state: "" }));
  };

  const handleRadioChange = (value) => {
    setFormData(prev => ({ ...prev, currentLevel: value }));
  };

  const handleEducationLevelClick = (level) => {
    handleRadioChange(level);
    setTimeout(() => {
      switch(level) {
        case 'highschool': window.location.href = '/highschool'; break;
        case 'undergraduate': window.location.href = '/undergraduate'; break;
        case 'graduate': window.location.href = '/graduate'; break;
        default: break;
      }
    }, 100);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.currentLevel) newErrors.currentLevel = "Please select your education level";
    
    // College validation
    if (!formData.collegeName) {
      newErrors.collegeName = "College name is required";
    } else if (formData.collegeName === "Other" && !formData.customCollege?.trim()) {
      newErrors.collegeName = "Please enter your college name";
    }
    
    if (!formData.country) newErrors.country = "Country is required";
    
    // State validation for ALL countries
    if (!formData.state) {
      newErrors.state = "State/Province is required";
    } else if (formData.state === "Other" && !formData.customState?.trim()) {
      newErrors.state = "Please enter your state/province";
    }
    
    if (!formData.city?.trim()) newErrors.city = "City is required";
    if (!formData.zipCode?.trim()) newErrors.zipCode = "ZIP/Postal code is required";
    if (!formData.address?.trim()) newErrors.address = "Address is required";
    if (!formData.programInterest) newErrors.programInterest = "Please select a program";
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted:", formData);
      alert(`✅ Application submitted successfully!\nPhone: ${formData.phoneCountryCode} ${formData.phone}`);
    } else {
      setErrors(newErrors);
    }
  };

  const getStatesForCountry = () => {
    if (formData.country === "United States") return usStates;
    if (formData.country === "Canada") return canadaProvinces;
    // For ALL other countries, show US states + Other option
    return [...usStates, "Other"];
  };

  return (
    <div className="bachelors-template-container">
      <div className="template-header">
        <h2>Bachelor's Degree Application</h2>
        <p>Please fill in your information to apply for undergraduate programs</p>
        <div className="progress-bar">
          <div className="progress-step completed"><span className="step-number">1</span><span className="step-label">Personal</span></div>
          <div className="progress-step active"><span className="step-number">2</span><span className="step-label">Education</span></div>
          <div className="progress-step"><span className="step-number">3</span><span className="step-label">Location</span></div>
          <div className="progress-step"><span className="step-number">4</span><span className="step-label">Review</span></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="application-form">
        {/* PERSONAL INFORMATION */}
        <div className="form-section">
          <h3 className="section-title">PERSONAL INFORMATION</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input 
                type="text" 
                id="firstName" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="Enter your first name" 
                className={errors.firstName ? "error" : ""} 
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                placeholder="Enter your last name" 
                className={errors.lastName ? "error" : ""} 
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="your.email@example.com" 
                className={errors.email ? "error" : ""} 
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            {/* FIXED PHONE FIELD - Country code dropdown + number input */}
            <div className="form-group phone-group">
              <label>Phone Number *</label>
              <div className={`phone-input-wrapper ${errors.phone ? "error" : ""}`}>
                <select 
                  name="phoneCountryCode" 
                  value={formData.phoneCountryCode} 
                  onChange={handleChange} 
                  className="phone-code-select"
                >
                  {countryCodes.map(({ code, country }) => (
                    <option key={code} value={code}>{code} ({country})</option>
                  ))}
                </select>
                <span className="phone-separator">-</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter phone number"
                  className="phone-number-input"
                  maxLength="15"
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input 
              type="date" 
              id="dateOfBirth" 
              name="dateOfBirth" 
              value={formData.dateOfBirth} 
              onChange={handleChange} 
              className={errors.dateOfBirth ? "error" : ""} 
            />
            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
          </div>
        </div>

        {/* EDUCATION */}
        <div className="form-section">
          <h3 className="section-title">EDUCATION</h3>
          <div className="form-group radio-group inline-radio">
            <label>Current level of education *</label>
            <div className="radio-options inline">
              <label className={`radio-label inline-label ${formData.currentLevel === 'highschool' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="currentLevel" 
                  value="highschool" 
                  checked={formData.currentLevel === 'highschool'} 
                  onChange={() => handleEducationLevelClick('highschool')} 
                />
                <span>Highschool</span>
              </label>
              <label className={`radio-label inline-label ${formData.currentLevel === 'undergraduate' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="currentLevel" 
                  value="undergraduate" 
                  checked={formData.currentLevel === 'undergraduate'} 
                  onChange={() => handleEducationLevelClick('undergraduate')} 
                />
                <span>Undergraduate</span>
              </label>
              <label className={`radio-label inline-label ${formData.currentLevel === 'graduate' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="currentLevel" 
                  value="graduate" 
                  checked={formData.currentLevel === 'graduate'} 
                  onChange={() => handleEducationLevelClick('graduate')} 
                />
                <span>Graduate</span>
              </label>
            </div>
            {errors.currentLevel && <span className="error-message">{errors.currentLevel}</span>}
          </div>

          <div className="form-group">
            <label>College / University Name *</label>
            <div className="search-input-wrapper">
              <select 
                name="collegeName" 
                value={formData.collegeName} 
                onChange={handleCollegeChange} 
                className={errors.collegeName ? "error" : ""}
              >
                <option value="">Select college/university</option>
                {universities.map(univ => <option key={univ} value={univ}>{univ}</option>)}
              </select>
              <span className="search-icon">🔍</span>
            </div>
            {showCustomCollege && (
              <div className="form-group custom-input">
                <input 
                  type="text" 
                  name="customCollege" 
                  value={formData.customCollege} 
                  onChange={handleChange} 
                  placeholder="Please enter college name manually" 
                />
              </div>
            )}
            {errors.collegeName && <span className="error-message">{errors.collegeName}</span>}
          </div>
        </div>

        {/* LOCATION */}
        <div className="form-section">
          <h3 className="section-title">LOCATION</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <div className="select-wrapper">
                <select 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleChange} 
                  className={errors.country ? "error" : ""}
                >
                  <option value="">Select country</option>
                  {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
                <span className="select-arrow">▼</span>
              </div>
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="state">State / Province *</label>
              <div className="select-wrapper">
                <select 
                  id="state" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleStateChange} 
                  className={errors.state ? "error" : ""}
                  disabled={!formData.country}
                >
                  <option value="">Select state/province</option>
                  {formData.country && getStatesForCountry().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <span className="select-arrow">▼</span>
              </div>
              
              {/* Show manual input field when "Other" is selected */}
              {formData.state === "Other" && (
                <div className="form-group custom-input">
                  <input 
                    type="text" 
                    name="customState" 
                    value={formData.customState} 
                    onChange={handleChange} 
                    placeholder="Please enter state/province manually" 
                  />
                </div>
              )}
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input 
                type="text" 
                id="city" 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                placeholder="Enter your city" 
                className={errors.city ? "error" : ""} 
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="zipCode">ZIP / Postal Code *</label>
              <input 
                type="text" 
                id="zipCode" 
                name="zipCode" 
                value={formData.zipCode} 
                onChange={handleChange} 
                placeholder="e.g., 94105" 
                className={errors.zipCode ? "error" : ""} 
              />
              {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea 
              id="address" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              rows="3" 
              placeholder="Street address, Apt/Suite, City, State/Province" 
              className={errors.address ? "error" : ""} 
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>
        </div>

        {/* PROGRAM INTEREST */}
        <div className="form-section">
          <h3 className="section-title">PROGRAM INTEREST</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="programInterest">Intended Program *</label>
              <div className="select-wrapper">
                <select 
                  id="programInterest" 
                  name="programInterest" 
                  value={formData.programInterest} 
                  onChange={handleChange} 
                  className={errors.programInterest ? "error" : ""}
                >
                  <option value="">Select a program</option>
                  {programs.map(program => <option key={program} value={program}>{program}</option>)}
                </select>
                <span className="select-arrow">▼</span>
              </div>
              {errors.programInterest && <span className="error-message">{errors.programInterest}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="startTerm">Preferred Start Term</label>
              <div className="select-wrapper">
                <select 
                  id="startTerm" 
                  name="startTerm" 
                  value={formData.startTerm} 
                  onChange={handleChange}
                >
                  <option value="">Select term</option>
                  <option value="fall-2026">Fall 2026</option>
                  <option value="spring-2027">Spring 2027</option>
                  <option value="fall-2027">Fall 2027</option>
                </select>
                <span className="select-arrow">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary">Save as Draft</button>
          <button type="submit" className="btn-primary">Submit Application</button>
        </div>

        <p className="form-footer">
          * Required fields. By submitting this application, you agree to our 
          <a href="/terms"> Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
};

export default BachelorsTemplate;