// Masters.js - University Admin Template for Masters Programs
import React, { useState } from "react";
import "./Masters.css"; // You'll need to create this (or reuse Bachelors.css)

const MastersUniversityAdminTemplate = () => {
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Dynamic Available Intakes (Current Year + Next 3 Years)
  const getAvailableIntakes = () => {
    const currentYear = new Date().getFullYear();
    const intakes = [];
    const seasons = ["Fall", "Spring", "Summer"];
    const currentMonth = new Date().getMonth();
    
    for (let year = currentYear; year <= currentYear + 3; year++) {
      seasons.forEach(season => {
        if (year === currentYear) {
          if (season === "Spring" && currentMonth > 4) return;
          if (season === "Summer" && currentMonth > 7) return;
          if (season === "Fall" && currentMonth > 10) return;
        }
        intakes.push(`${season} ${year}`);
      });
    }
    
    return intakes.sort((a, b) => {
      const yearA = parseInt(a.split(' ')[1]);
      const yearB = parseInt(b.split(' ')[1]);
      if (yearA !== yearB) return yearA - yearB;
      
      const seasonOrder = { "Spring": 0, "Summer": 1, "Fall": 2 };
      const seasonA = seasonOrder[a.split(' ')[0]];
      const seasonB = seasonOrder[b.split(' ')[0]];
      return seasonA - seasonB;
    });
  };

  const availableIntakes = getAvailableIntakes();

  // ========== MASTERS PROGRAM CATEGORIES ==========
  const programCategories = [
    // ========== COMPUTER SCIENCE & IT (Masters) ==========
    { name: "Computer Science (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Information Technology (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Data Science (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Artificial Intelligence (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Machine Learning (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Cybersecurity (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Software Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Computer Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Information Systems (MS)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Cloud Computing (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Distributed Systems (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Human-Computer Interaction (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Bioinformatics (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Computational Biology (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Robotics (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    
    // ========== ENGINEERING (Masters) ==========
    { name: "Mechanical Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Electrical Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Civil Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Chemical Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Aerospace Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Biomedical Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Industrial Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Environmental Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Materials Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Petroleum Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Automotive Engineering (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Mechatronics (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Structural Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Geotechnical Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Transportation Engineering (MEng)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    
    // ========== BUSINESS & MANAGEMENT (Masters) ==========
    { name: "Master of Business Administration (MBA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Executive MBA (EMBA)", level: "Master", duration: "18-24 months", studyMode: "Part Time" },
    { name: "Finance (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Marketing (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Accounting (MAcc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "International Business (MIB)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Management (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Human Resources Management (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Supply Chain Management (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Business Analytics (MSBA)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Entrepreneurship (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Project Management (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Hospitality Management (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Sports Management (MS)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Real Estate (MS)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    
    // ========== ECONOMICS & FINANCE (Masters) ==========
    { name: "Economics (MA/MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Financial Economics (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Econometrics (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Development Economics (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Behavioral Economics (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Quantitative Finance (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Financial Engineering (MS)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Investment Management (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Risk Management (MSc)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    
    // ========== SOCIAL SCIENCES (Masters) ==========
    { name: "Psychology (MA/MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Clinical Psychology (MA)", level: "Master", duration: "2-3 years", studyMode: "On Campus" },
    { name: "Counseling Psychology (MA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Industrial-Organizational Psychology (MA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Sociology (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Anthropology (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Political Science (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "International Relations (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Public Policy (MPP)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Public Administration (MPA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Criminology (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Social Work (MSW)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Gender Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Urban Planning (MUP)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== NATURAL SCIENCES (Masters) ==========
    { name: "Physics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Chemistry (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Biology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Mathematics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Statistics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Environmental Science (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Geology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Astronomy (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Neuroscience (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Genetics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Biochemistry (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Marine Biology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Astrophysics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Applied Mathematics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== MEDICAL & HEALTH SCIENCES (Masters) ==========
    { name: "Public Health (MPH)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Epidemiology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Biostatistics (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Health Administration (MHA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Nursing (MSN)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Nurse Practitioner (MSN)", level: "Master", duration: "2-3 years", studyMode: "On Campus" },
    { name: "Physiotherapy (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Occupational Therapy (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Speech Therapy (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Nutrition (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Pharmacology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Pharmacy (MPharm)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Medical Imaging (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Clinical Research (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== LAW (Masters) ==========
    { name: "Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Corporate Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "International Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Human Rights Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Tax Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Intellectual Property Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Environmental Law (LLM)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Jurisprudence (MJur)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    
    // ========== EDUCATION (Masters) ==========
    { name: "Education (MEd)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Teaching (MAT)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Curriculum & Instruction (MEd)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Educational Leadership (MEd)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Higher Education (MEd)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Special Education (MEd)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "TESOL (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Educational Psychology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== ARTS & HUMANITIES (Masters) ==========
    { name: "English Literature (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Creative Writing (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Linguistics (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Philosophy (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "History (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Fine Arts (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Graphic Design (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Film Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Music (MMus)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Theatre Arts (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Art History (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Digital Humanities (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    
    // ========== ARCHITECTURE & DESIGN (Masters) ==========
    { name: "Architecture (MArch)", level: "Master", duration: "2-3 years", studyMode: "On Campus" },
    { name: "Landscape Architecture (MLA)", level: "Master", duration: "2-3 years", studyMode: "On Campus" },
    { name: "Urban Design (MUD)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Interior Design (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Fashion Design (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Industrial Design (MID)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Game Design (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== MEDIA & COMMUNICATIONS (Masters) ==========
    { name: "Journalism (MA)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Media Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Public Relations (MA)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Advertising (MA)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Digital Media (MA)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Film Production (MFA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Communication Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Strategic Communication (MA)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    
    // ========== ENVIRONMENT & SUSTAINABILITY (Masters) ==========
    { name: "Environmental Management (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Sustainability (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Climate Change (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Renewable Energy (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Conservation (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Environmental Policy (MPP)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== INTERNATIONAL RELATIONS (Masters) ==========
    { name: "International Affairs (MIA)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Diplomacy (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Conflict Resolution (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Security Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Global Governance (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "European Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Asian Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Middle Eastern Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    
    // ========== SPECIALIZED MASTERS ==========
    { name: "Museum Studies (MA)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Library Science (MLIS)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Information Science (MS)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Data Analytics (MS)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Forensic Science (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Sports Science (MSc)", level: "Master", duration: "1-2 years", studyMode: "On Campus" },
    { name: "Exercise Physiology (MSc)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    { name: "Kinesiology (MS)", level: "Master", duration: "2 years", studyMode: "On Campus" },
    
    // ========== RESEARCH DEGREES ==========
    { name: "Master of Philosophy (MPhil)", level: "Master", duration: "2 years", studyMode: "Research" },
    { name: "Master of Research (MRes)", level: "Master", duration: "1-2 years", studyMode: "Research" },
    { name: "Master of Studies (MSt)", level: "Master", duration: "1 year", studyMode: "On Campus" },
    { name: "Master of Letters (MLitt)", level: "Master", duration: "1-2 years", studyMode: "Research" },
    
    // ========== ONLINE MASTERS ==========
    { name: "Online MBA (MBA)", level: "Master", duration: "2 years", studyMode: "Online" },
    { name: "Online Computer Science (MSc)", level: "Master", duration: "2 years", studyMode: "Online" },
    { name: "Online Data Science (MSc)", level: "Master", duration: "2 years", studyMode: "Online" },
    { name: "Online Education (MEd)", level: "Master", duration: "2 years", studyMode: "Online" },
    { name: "Online Public Health (MPH)", level: "Master", duration: "2 years", studyMode: "Online" },
    { name: "Online Engineering Management (MSc)", level: "Master", duration: "2 years", studyMode: "Online" },
    
    // ========== EXECUTIVE MASTERS ==========
    { name: "Executive MBA (EMBA)", level: "Master", duration: "18-24 months", studyMode: "Executive" },
    { name: "Executive Master in Finance", level: "Master", duration: "18 months", studyMode: "Executive" },
    { name: "Executive Master in Public Administration", level: "Master", duration: "18 months", studyMode: "Executive" },
    { name: "Executive Master in Healthcare", level: "Master", duration: "18 months", studyMode: "Executive" }
  ];

  const [formData, setFormData] = useState({
    // Basic Information
    universityName: "",
    universityCode: "",
    establishedYear: "",
    universityType: "",
    accreditation: "",
    ranking: "",
    website: "",
    
    // Location (International)
    country: "",
    state: "",
    city: "",
    address: "",
    zipCode: "",
    
    // Contact
    adminEmail: "",
    adminPhone: "",
    admissionEmail: "",
    admissionPhone: "",
    
    // Academic Details
    programs: [],
    intakes: availableIntakes.slice(0, 3),
    applicationDeadlines: {
      earlyDecision: "",
      earlyAction: "",
      regularDecision: "",
      rolling: ""
    },
    tuitionFees: {
      inState: "",
      outOfState: "",
      international: "",
      roomAndBoard: ""
    },
    
    // Masters-specific Requirements
    minimumGPA: "",
    minimumUndergraduateGPA: "3.0",
    greRequirements: {
      quantitative: "",
      verbal: "",
      analytical: "",
      total: ""
    },
    gmatRequirements: {
      total: "",
      quantitative: "",
      verbal: ""
    },
    englishTests: ["TOEFL iBT", "IELTS Academic", "PTE Academic"],
    applicationRequirements: [],
    
    // Work Experience (Masters-specific)
    workExperienceRequired: false,
    minimumWorkExperience: "",
    preferredWorkExperience: "",
    
    // Research Requirements (Masters-specific)
    researchProposalRequired: false,
    writingSampleRequired: false,
    interviewRequired: false,
    
    // Media
    universityLogo: null,
    coverImage: null,
    
    // Status
    isActive: true,
    featured: false
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  // All Countries List (same as Bachelors)
  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "New Zealand",
    "Germany", "France", "Netherlands", "Sweden", "Switzerland", "Ireland",
    "Singapore", "Japan", "South Korea", "China", "India", "Italy", "Spain",
    "Denmark", "Finland", "Norway", "Belgium", "Austria", "Hong Kong",
    "Malaysia", "UAE", "Saudi Arabia", "Qatar", "South Africa", "Brazil",
    "Mexico", "Chile", "Argentina", "Colombia", "Thailand", "Vietnam",
    "Philippines", "Indonesia", "Pakistan", "Bangladesh", "Sri Lanka",
    "Nepal", "Kenya", "Nigeria", "Egypt", "Morocco", "Israel", "Turkey",
    "Russia", "Ukraine", "Poland", "Czech Republic", "Hungary", "Greece",
    "Portugal"
  ].sort();

  // All 50 US States
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
    "Wisconsin", "Wyoming", "District of Columbia"
  ];

  // COMPLETE statesByCountry - EVERY country gets states + "Other" (same as Bachelors.js)
  const statesByCountry = {
    "United States": [...usStates, "Other"],
    "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland", "Other"],
    "Canada": [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick", 
      "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", 
      "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Other"
    ],
    "Australia": [
      "New South Wales", "Victoria", "Queensland", "Western Australia",
      "South Australia", "Tasmania", "Australian Capital Territory",
      "Northern Territory", "Other"
    ],
    "New Zealand": ["Auckland", "Wellington", "Canterbury", "Otago", "Other"],
    "Germany": [
      "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Hamburg", 
      "Hessen", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", 
      "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen", "Other"
    ],
    "France": [
      "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", 
      "Occitanie", "Hauts-de-France", "Grand Est", "Pays de la Loire", 
      "Provence-Alpes-Côte d'Azur", "Bretagne", "Normandie", "Bourgogne-Franche-Comté", 
      "Centre-Val de Loire", "Corse", "Other"
    ],
    "Netherlands": [
      "North Holland", "South Holland", "North Brabant", "Gelderland", 
      "Utrecht", "Overijssel", "Limburg", "Friesland", "Groningen", 
      "Drenthe", "Flevoland", "Zeeland", "Other"
    ],
    "Sweden": [
      "Stockholm", "Västra Götaland", "Skåne", "Uppsala", "Östergötland", 
      "Jönköping", "Halland", "Örebro", "Gävleborg", "Västernorrland", 
      "Värmland", "Norrbotten", "Västmanland", "Dalarna", "Other"
    ],
    "Switzerland": [
      "Zurich", "Bern", "Geneva", "Vaud", "Aargau", "St. Gallen", 
      "Lucerne", "Ticino", "Basel-Stadt", "Basel-Landschaft", "Fribourg", 
      "Valais", "Neuchâtel", "Schwyz", "Zug", "Other"
    ],
    "Ireland": [
      "Leinster", "Munster", "Connacht", "Ulster", "Dublin", "Cork", 
      "Galway", "Limerick", "Waterford", "Other"
    ],
    "Singapore": [
      "Central", "North-East", "North", "East", "West", "Other"
    ],
    "Japan": [
      "Tokyo", "Osaka", "Kanagawa", "Aichi", "Hokkaido", "Fukuoka", 
      "Kyoto", "Hyogo", "Saitama", "Chiba", "Hiroshima", "Miyagi", 
      "Shizuoka", "Okayama", "Kumamoto", "Other"
    ],
    "South Korea": [
      "Seoul", "Gyeonggi", "Incheon", "Busan", "Daegu", "Daejeon", 
      "Gwangju", "Ulsan", "Sejong", "Gyeongsangbuk", "Gyeongsangnam", 
      "Jeollabuk", "Jeollanam", "Chungcheongbuk", "Chungcheongnam", 
      "Gangwon", "Jeju", "Other"
    ],
    "China": [
      "Beijing", "Shanghai", "Guangdong", "Zhejiang", "Jiangsu", 
      "Shandong", "Sichuan", "Hubei", "Fujian", "Henan", "Hunan", 
      "Anhui", "Hebei", "Shaanxi", "Chongqing", "Tianjin", "Other"
    ],
    "India": [
      "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra",
      "Delhi", "Uttar Pradesh", "Gujarat", "West Bengal", "Rajasthan",
      "Kerala", "Madhya Pradesh", "Haryana", "Punjab", "Bihar", 
      "Odisha", "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand",
      "Himachal Pradesh", "Goa", "Other"
    ],
    "Italy": [
      "Lombardy", "Lazio", "Campania", "Veneto", "Sicily", "Emilia-Romagna",
      "Piedmont", "Apulia", "Tuscany", "Calabria", "Sardinia", "Liguria",
      "Marche", "Abruzzo", "Friuli-Venezia Giulia", "Trentino-Alto Adige", "Other"
    ],
    "Spain": [
      "Catalonia", "Andalusia", "Madrid", "Valencia", "Galicia", 
      "Castile and León", "Basque Country", "Canary Islands", "Castilla-La Mancha",
      "Murcia", "Aragon", "Extremadura", "Balearic Islands", "Asturias", 
      "Navarre", "Cantabria", "La Rioja", "Other"
    ],
    "Denmark": [
      "Capital Region", "Central Denmark", "North Denmark", "Zealand", 
      "Southern Denmark", "Other"
    ],
    "Finland": [
      "Uusimaa", "Pirkanmaa", "Southwest Finland", "Northern Ostrobothnia", 
      "Central Finland", "Satakunta", "Päijät-Häme", "Ostrobothnia", 
      "South Karelia", "Lapland", "Other"
    ],
    "Norway": [
      "Oslo", "Viken", "Trøndelag", "Vestland", "Rogaland", "Innlandet", 
      "Agder", "Troms og Finnmark", "Møre og Romsdal", "Nordland", "Other"
    ],
    "Belgium": [
      "Flanders", "Wallonia", "Brussels", "Antwerp", "East Flanders", 
      "West Flanders", "Flemish Brabant", "Hainaut", "Liège", "Luxembourg", 
      "Namur", "Walloon Brabant", "Limburg", "Other"
    ],
    "Austria": [
      "Vienna", "Lower Austria", "Upper Austria", "Styria", "Tyrol", 
      "Carinthia", "Salzburg", "Vorarlberg", "Burgenland", "Other"
    ],
    "Hong Kong": [
      "Hong Kong Island", "Kowloon", "New Territories", "Lantau Island", 
      "Lamma Island", "Cheung Chau", "Other"
    ],
    "Malaysia": [
      "Selangor", "Johor", "Penang", "Kuala Lumpur", "Perak", "Sabah", 
      "Sarawak", "Pahang", "Negeri Sembilan", "Kedah", "Malacca", 
      "Terengganu", "Kelantan", "Perlis", "Labuan", "Putrajaya", "Other"
    ],
    "UAE": [
      "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", 
      "Fujairah", "Umm Al Quwain", "Other"
    ],
    "Saudi Arabia": [
      "Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", 
      "Tabuk", "Qassim", "Ha'il", "Jizan", "Najran", "Al Bahah", 
      "Al Jawf", "Northern Borders", "Other"
    ],
    "Qatar": [
      "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Al Shamal", 
      "Umm Salal", "Al Daayen", "Other"
    ],
    "South Africa": [
      "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", 
      "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Other"
    ],
    "Brazil": [
      "São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Rio Grande do Sul",
      "Paraná", "Pernambuco", "Ceará", "Pará", "Santa Catarina", "Goiás",
      "Maranhão", "Espírito Santo", "Amazonas", "Mato Grosso", "Mato Grosso do Sul", "Other"
    ],
    "Mexico": [
      "Mexico City", "Jalisco", "Nuevo León", "State of Mexico", "Puebla",
      "Guanajuato", "Veracruz", "Chihuahua", "Baja California", "Sonora",
      "Coahuila", "Sinaloa", "Michoacán", "Tamaulipas", "Other"
    ],
    "Thailand": [
      "Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Nonthaburi", 
      "Nakhon Ratchasima", "Khon Kaen", "Hat Yai", "Udon Thani", 
      "Chonburi", "Rayong", "Surat Thani", "Other"
    ],
    "Vietnam": [
      "Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong", "Can Tho", 
      "Binh Duong", "Dong Nai", "Khanh Hoa", "Ba Ria-Vung Tau", 
      "Thua Thien-Hue", "Quang Ninh", "Other"
    ],
    "Philippines": [
      "Metro Manila", "Cebu", "Davao", "Cavite", "Laguna", "Rizal", 
      "Bulacan", "Batangas", "Pampanga", "Iloilo", "Negros Occidental", 
      "Zamboanga del Sur", "Cagayan de Oro", "Other"
    ],
    "Indonesia": [
      "Jakarta", "West Java", "East Java", "Central Java", "North Sumatra",
      "Bali", "South Sulawesi", "Riau", "Banten", "South Sumatra", 
      "Lampung", "West Sumatra", "East Kalimantan", "Papua", "Other"
    ],
    "Pakistan": [
      "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad",
      "Gilgit-Baltistan", "Azad Kashmir", "Other"
    ],
    "Bangladesh": [
      "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", 
      "Sylhet", "Rangpur", "Mymensingh", "Other"
    ],
    "Sri Lanka": [
      "Western", "Central", "Southern", "Northern", "Eastern", 
      "North Western", "North Central", "Uva", "Sabaragamuwa", "Other"
    ],
    "Nepal": [
      "Bagmati", "Gandaki", "Lumbini", "Province No. 1", "Province No. 2", 
      "Karnali", "Sudurpashchim", "Other"
    ],
    "Kenya": [
      "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Machakos", 
      "Uasin Gishu", "Meru", "Kakamega", "Kilifi", "Other"
    ],
    "Nigeria": [
      "Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Ogun", "Delta", 
      "Edo", "Akwa Ibom", "Kaduna", "Enugu", "Anambra", "Cross River", 
      "Imo", "Abia", "Other"
    ],
    "Egypt": [
      "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", 
      "Suez", "Luxor", "Aswan", "Mansoura", "Tanta", "Asyut", 
      "Ismailia", "Faiyum", "Zagazig", "Other"
    ],
    "Morocco": [
      "Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", 
      "Fès-Meknès", "Tangier-Tetouan-Al Hoceima", "Souss-Massa", 
      "Oriental", "Béni Mellal-Khénifra", "Drâa-Tafilalet", 
      "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Dakhla-Oued Ed-Dahab", "Other"
    ],
    "Israel": [
      "Tel Aviv", "Jerusalem", "Haifa", "Central", "Southern", 
      "Northern", "Judea and Samaria", "Other"
    ],
    "Turkey": [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", 
      "Konya", "Gaziantep", "Mersin", "Kayseri", "Eskişehir", 
      "Diyarbakır", "Samsun", "Other"
    ],
    "Russia": [
      "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", 
      "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara", "Omsk", 
      "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Perm", "Voronezh", 
      "Volgograd", "Krasnodar", "Other"
    ],
    "Ukraine": [
      "Kyiv", "Kharkiv", "Odesa", "Dnipro", "Donetsk", "Zaporizhzhia", 
      "Lviv", "Kryvyi Rih", "Mykolaiv", "Mariupol", "Luhansk", 
      "Vinnytsia", "Kherson", "Chernihiv", "Poltava", "Other"
    ],
    "Poland": [
      "Masovian", "Lesser Poland", "Lower Silesian", "Greater Poland", 
      "Łódź", "Pomeranian", "West Pomeranian", "Kuyavian-Pomeranian", 
      "Lublin", "Subcarpathian", "Podlaskie", "Świętokrzyskie", 
      "Warmian-Masurian", "Lubusz", "Opole", "Silesian", "Other"
    ],
    "Czech Republic": [
      "Prague", "Central Bohemian", "South Moravian", "Moravian-Silesian", 
      "Plzeň", "Olomouc", "South Bohemian", "Ústí nad Labem", 
      "Zlín", "Vysočina", "Pardubice", "Liberec", "Hradec Králové", 
      "Karlovy Vary", "Other"
    ],
    "Hungary": [
      "Budapest", "Pest", "Hajdú-Bihar", "Csongrád-Csanád", "Borsod-Abaúj-Zemplén", 
      "Győr-Moson-Sopron", "Szabolcs-Szatmár-Bereg", "Baranya", "Veszprém", 
      "Fejér", "Bács-Kiskun", "Zala", "Somogy", "Other"
    ],
    "Greece": [
      "Attica", "Central Macedonia", "Crete", "Thessaly", "Western Greece", 
      "Epirus", "Peloponnese", "South Aegean", "North Aegean", 
      "Central Greece", "Ionian Islands", "Eastern Macedonia and Thrace", 
      "Western Macedonia", "Other"
    ],
    "Portugal": [
      "Lisbon", "Porto", "Braga", "Setúbal", "Aveiro", "Faro", 
      "Leiria", "Coimbra", "Viseu", "Santarém", "Funchal", "Ponta Delgada", 
      "Viana do Castelo", "Vila Real", "Castelo Branco", "Other"
    ],
    "default": ["Other"]
  };

  // Sort function to keep "Other" at bottom
  const sortStatesWithOtherLast = (states) => {
    return [...states].sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
  };

  // University Types (added Research-focused types for Masters)
  const universityTypes = [
    "Research University",
    "Public University",
    "Private University",
    "Ivy League",
    "Russell Group",
    "Go8 (Australia)",
    "Technical University",
    "Business School",
    "Medical School",
    "Law School",
    "Liberal Arts College (with Graduate Programs)"
  ];

  // Masters-specific Requirements
  const commonRequirements = [
    "Bachelor's Degree Transcripts",
    "Letters of Recommendation (Academic)",
    "Letters of Recommendation (Professional)",
    "Statement of Purpose",
    "Personal Statement",
    "Resume/CV",
    "GRE Scores",
    "GMAT Scores (for MBA)",
    "English Proficiency Test Scores",
    "Writing Sample",
    "Research Proposal",
    "Portfolio (for Creative Programs)",
    "Interview",
    "Work Experience Documentation",
    "Application Fee",
    "Passport Copy",
    "Financial Statement",
    "Bachelor's Degree Certificate",
    "Course-by-Course Evaluation",
    "WES Evaluation (for International)"
  ];

  // Function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === "file") {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (name === "state") {
      setIsOtherSelected(value === "Other");
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleNestedChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleArrayInput = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleRequirementAdd = (requirement) => {
    if (requirement && !formData.applicationRequirements.includes(requirement)) {
      setFormData(prev => ({
        ...prev,
        applicationRequirements: [...prev.applicationRequirements, requirement]
      }));
    }
  };

  const handleRequirementRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      applicationRequirements: prev.applicationRequirements.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.universityName.trim()) newErrors.universityName = "University name is required";
    if (!formData.universityCode.trim()) newErrors.universityCode = "University code is required";
    if (!formData.establishedYear) newErrors.establishedYear = "Established year is required";
    if (!formData.universityType) newErrors.universityType = "University type is required";
    if (!formData.website.trim()) newErrors.website = "Website is required";
    
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.state.trim()) newErrors.state = "State/Province is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "Postal/ZIP code is required";
    
    if (!formData.adminEmail.trim()) newErrors.adminEmail = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) newErrors.adminEmail = "Valid email is required";
    if (!formData.admissionEmail.trim()) newErrors.admissionEmail = "Admission email is required";
    if (!formData.adminPhone.trim()) newErrors.adminPhone = "Admin phone is required";
    
    if (formData.programs.length === 0) newErrors.programs = "At least one program is required";
    if (!formData.tuitionFees.inState) newErrors.tuitionInState = "In-state tuition is required";
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep !== 5) {
      console.log('Form cannot be submitted on step', currentStep);
      return;
    }
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      const token = getAuthToken();
      if (!token) {
        setApiError('Please login to perform this action');
        return;
      }

      setLoading(true);
      setApiError(null);
      
      try {
        const selectedPrograms = formData.programs.map(programName => {
          const programDetails = programCategories.find(p => p.name === programName) || {
            name: programName,
            level: "Master",
            duration: "1-2 years",
            studyMode: "On Campus"
          };
          
          return {
            name: programDetails.name,
            title: programDetails.name,
            program_name: programDetails.name,
            level: programDetails.level,
            duration: programDetails.duration,
            studyMode: programDetails.studyMode,
            description: `${programDetails.name} program at ${formData.universityName}`,
            requirements: formData.applicationRequirements.join(', ') || 'Standard admission requirements apply'
          };
        });

        const universityData = {
          ...formData,
          programs: selectedPrograms,
          intakes: formData.intakes.length > 0 ? formData.intakes : availableIntakes.slice(0, 3),
          source: 'masters',
          degreeLevel: 'Masters',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          programCount: selectedPrograms.length
        };

        delete universityData.universityLogo;
        delete universityData.coverImage;

        console.log("Submitting Masters university with programs:", selectedPrograms);

        const url = editingUniversity 
          ? `${API_BASE_URL}/masters/universities/${editingUniversity._id}`
          : `${API_BASE_URL}/masters/universities`;
        
        const method = editingUniversity ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(universityData)
        });

        if (response.status === 401) {
          setApiError('Session expired. Please login again.');
          return;
        }

        const data = await response.json();

        if (data.success) {
          alert(`✅ Masters University ${editingUniversity ? 'updated' : 'created'} successfully!`);
          resetForm();
          setEditingUniversity(null);
        } else {
          setApiError(data.message || 'Error saving university');
          if (data.errors) {
            console.error('Validation errors:', data.errors);
            const backendErrors = {};
            data.errors.forEach(err => {
              if (err.path) backendErrors[err.path] = err.msg;
            });
            setErrors(backendErrors);
          }
        }
      } catch (error) {
        console.error('Error saving university:', error);
        setApiError('Network error. Please check if backend is running.');
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const resetForm = () => {
    setFormData({
      universityName: "",
      universityCode: "",
      establishedYear: "",
      universityType: "",
      accreditation: "",
      ranking: "",
      website: "",
      country: "",
      state: "",
      city: "",
      address: "",
      zipCode: "",
      adminEmail: "",
      adminPhone: "",
      admissionEmail: "",
      admissionPhone: "",
      programs: [],
      intakes: availableIntakes.slice(0, 3),
      applicationDeadlines: {
        earlyDecision: "",
        earlyAction: "",
        regularDecision: "",
        rolling: ""
      },
      tuitionFees: {
        inState: "",
        outOfState: "",
        international: "",
        roomAndBoard: ""
      },
      minimumGPA: "",
      minimumUndergraduateGPA: "3.0",
      greRequirements: {
        quantitative: "",
        verbal: "",
        analytical: "",
        total: ""
      },
      gmatRequirements: {
        total: "",
        quantitative: "",
        verbal: ""
      },
      englishTests: ["TOEFL iBT", "IELTS Academic", "PTE Academic"],
      applicationRequirements: [],
      workExperienceRequired: false,
      minimumWorkExperience: "",
      preferredWorkExperience: "",
      researchProposalRequired: false,
      writingSampleRequired: false,
      interviewRequired: false,
      universityLogo: null,
      coverImage: null,
      isActive: true,
      featured: false
    });
    setIsOtherSelected(false);
    setCurrentStep(1);
    setErrors({});
  };

  // Group programs by category (similar to Bachelors but with Masters categories)
  const groupedPrograms = {
    "Computer Science & IT": programCategories.filter(p => 
      p.name.includes("Computer") || p.name.includes("Data") || p.name.includes("AI") || 
      p.name.includes("Machine Learning") || p.name.includes("Cyber") || p.name.includes("Software") || 
      p.name.includes("Robotics") || p.name.includes("Bioinformatics")
    ),
    "Engineering": programCategories.filter(p => 
      p.name.includes("Engineering") || p.name.includes("Mechatronics") || 
      p.name.includes("Aerospace") || p.name.includes("Biomedical")
    ),
    "Business & Management": programCategories.filter(p => 
      p.name.includes("MBA") || p.name.includes("Business") || p.name.includes("Finance") || 
      p.name.includes("Marketing") || p.name.includes("Management")
    ),
    "Economics & Finance": programCategories.filter(p => 
      p.name.includes("Economics") || p.name.includes("Finance") || p.name.includes("Financial") || 
      p.name.includes("Econometrics") || p.name.includes("Quantitative")
    ),
    "Social Sciences": programCategories.filter(p => 
      p.name.includes("Psychology") || p.name.includes("Sociology") || p.name.includes("Political") || 
      p.name.includes("International") || p.name.includes("Public Policy")
    ),
    "Natural Sciences": programCategories.filter(p => 
      p.name.includes("Physics") || p.name.includes("Chemistry") || p.name.includes("Biology") || 
      p.name.includes("Mathematics") || p.name.includes("Statistics")
    ),
    "Medical & Health Sciences": programCategories.filter(p => 
      p.name.includes("Public Health") || p.name.includes("Nursing") || p.name.includes("Medical") || 
      p.name.includes("Health") || p.name.includes("Clinical")
    ),
    "Law": programCategories.filter(p => p.name.includes("LLM") || p.name.includes("Law")),
    "Education": programCategories.filter(p => p.name.includes("Education") || p.name.includes("Teaching")),
    "Arts & Humanities": programCategories.filter(p => 
      p.name.includes("English") || p.name.includes("Creative") || p.name.includes("History") || 
      p.name.includes("Philosophy") || p.name.includes("Linguistics")
    ),
    "Architecture & Design": programCategories.filter(p => 
      p.name.includes("Architecture") || p.name.includes("Design") || p.name.includes("Urban")
    ),
    "Media & Communications": programCategories.filter(p => 
      p.name.includes("Journalism") || p.name.includes("Media") || p.name.includes("Communication")
    ),
    "Environment & Sustainability": programCategories.filter(p => 
      p.name.includes("Environmental") || p.name.includes("Sustainability") || p.name.includes("Climate")
    ),
    "Research Degrees": programCategories.filter(p => 
      p.name.includes("MPhil") || p.name.includes("MRes") || p.name.includes("MLitt")
    ),
    "Online Masters": programCategories.filter(p => p.studyMode === "Online"),
    "Executive Programs": programCategories.filter(p => p.studyMode === "Executive")
  };

  // Render Step 1
  const renderStep1 = () => (
    <div className="form-section">
      <h3 className="section-title">Basic Information (Masters Programs)</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label>University Name *</label>
          <input
            type="text"
            name="universityName"
            value={formData.universityName}
            onChange={handleChange}
            placeholder="e.g., Harvard University"
            className={errors.universityName ? "error" : ""}
          />
          {errors.universityName && <span className="error-message">{errors.universityName}</span>}
        </div>
        
        <div className="form-group">
          <label>University Code *</label>
          <input
            type="text"
            name="universityCode"
            value={formData.universityCode}
            onChange={handleChange}
            placeholder="e.g., HARV001"
            className={errors.universityCode ? "error" : ""}
          />
          {errors.universityCode && <span className="error-message">{errors.universityCode}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Established Year *</label>
          <input
            type="number"
            name="establishedYear"
            value={formData.establishedYear}
            onChange={handleChange}
            placeholder="e.g., 1636"
            min="1000"
            max={new Date().getFullYear()}
            className={errors.establishedYear ? "error" : ""}
          />
          {errors.establishedYear && <span className="error-message">{errors.establishedYear}</span>}
        </div>
        
        <div className="form-group">
          <label>University Type *</label>
          <select
            name="universityType"
            value={formData.universityType}
            onChange={handleChange}
            className={errors.universityType ? "error" : ""}
          >
            <option value="">Select type</option>
            {universityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.universityType && <span className="error-message">{errors.universityType}</span>}
        </div>
      </div>
          
      <div className="form-row">
        <div className="form-group">
          <label>Accreditation</label>
          <input
            type="text"
            name="accreditation"
            value={formData.accreditation}
            onChange={handleChange}
            placeholder="e.g., AACSB, ABET, NECHE"
          />
        </div>
        
        <div className="form-group">
          <label>Global Ranking</label>
          <input
            type="text"
            name="ranking"
            value={formData.ranking}
            onChange={handleChange}
            placeholder="e.g., #50 in QS World Rankings"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Website *</label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://www.university.edu"
          className={errors.website ? "error" : ""}
        />
        {errors.website && <span className="error-message">{errors.website}</span>}
      </div>
    </div>
  );

  // Render Step 2 - Location (FIXED with complete statesByCountry)
  const renderStep2 = () => {
    const getStatesForCountry = (country) => {
      let states = statesByCountry[country] || statesByCountry["default"];
      return sortStatesWithOtherLast(states);
    };

    const availableStates = formData.country ? getStatesForCountry(formData.country) : [];

    return (
      <div className="form-section">
        <h3 className="section-title">Location Details</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Country *</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={errors.country ? "error" : ""}
            >
              <option value="">Select country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors.country && <span className="error-message">{errors.country}</span>}
          </div>
          
          <div className="form-group">
            <label>State/Province/Region *</label>
            <select
              name="state"
              value={isOtherSelected ? "Other" : formData.state}
              onChange={handleChange}
              className={errors.state ? "error" : ""}
              disabled={!formData.country}
            >
              <option value="">
                {formData.country ? "Select state/province" : "First select country"}
              </option>
              {availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <span className="error-message">{errors.state}</span>}
            
            {!formData.country && (
              <small className="field-hint">Please select a country first</small>
            )}
          </div>
        </div>

        {/* Show manual state input only when "Other" is selected */}
        {isOtherSelected && (
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '2 / 3' }}>
              <label>Enter State/Province/Region *</label>
              <input
                type="text"
                value={formData.state === "Other" ? "" : formData.state}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, state: e.target.value }));
                }}
                placeholder="Type your state/province/region"
                className={errors.state ? "error" : ""}
              />
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              className={errors.city ? "error" : ""}
            />
            {errors.city && <span className="error-message">{errors.city}</span>}
          </div>
          
          <div className="form-group">
            <label>Postal/ZIP Code *</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="e.g., 02138 or SW1A 1AA"
              className={errors.zipCode ? "error" : ""}
            />
            {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Address *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            placeholder="Street address, building, etc."
            className={errors.address ? "error" : ""}
          />
          {errors.address && <span className="error-message">{errors.address}</span>}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="form-section">
      <h3 className="section-title">Contact Information</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label>Admin Email *</label>
          <input
            type="email"
            name="adminEmail"
            value={formData.adminEmail}
            onChange={handleChange}
            placeholder="admin@university.edu"
            className={errors.adminEmail ? "error" : ""}
          />
          {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
        </div>
        
        <div className="form-group">
          <label>Admin Phone *</label>
          <input
            type="tel"
            name="adminPhone"
            value={formData.adminPhone}
            onChange={handleChange}
            placeholder="+1 617-495-1000"
            className={errors.adminPhone ? "error" : ""}
          />
          {errors.adminPhone && <span className="error-message">{errors.adminPhone}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Admission Email *</label>
          <input
            type="email"
            name="admissionEmail"
            value={formData.admissionEmail}
            onChange={handleChange}
            placeholder="gradadmissions@university.edu"
            className={errors.admissionEmail ? "error" : ""}
          />
          {errors.admissionEmail && <span className="error-message">{errors.admissionEmail}</span>}
        </div>
        
        <div className="form-group">
          <label>Admission Phone</label>
          <input
            type="tel"
            name="admissionPhone"
            value={formData.admissionPhone}
            onChange={handleChange}
            placeholder="+1 617-495-1551"
          />
        </div>
      </div>
    </div>
  );

  // Render Step 4 (Academic Details) with Masters-specific fields
  const renderStep4 = () => (
    <div className="form-section">
      <h3 className="section-title">Academic Details (Masters Programs)</h3>
      
      <div className="form-group">
        <label>Programs Offered *</label>
        <div className="programs-by-category">
          {Object.entries(groupedPrograms).map(([category, programs]) => (
            programs.length > 0 && (
              <div key={category} className="program-category">
                <h4 className="category-title">{category} ({programs.length})</h4>
                <div className="checkbox-grid">
                  {programs.map(program => (
                    <label key={program.name} className="checkbox-label program-checkbox">
                      <input
                        type="checkbox"
                        value={program.name}
                        checked={formData.programs.includes(program.name)}
                        onChange={() => handleArrayInput('programs', program.name)}
                      />
                      <span className="program-name">{program.name}</span>
                      <span className="program-badge" style={{ 
                        backgroundColor: '#FF9800', // Orange for Masters
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginLeft: '8px'
                      }}>
                        {program.level}
                      </span>
                      <span className="program-mode" style={{
                        backgroundColor: '#e2e8f0',
                        color: '#475569',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginLeft: '4px'
                      }}>
                        {program.studyMode}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
        {errors.programs && <span className="error-message">{errors.programs}</span>}
      </div>

      <div className="form-group">
        <label>Available Intakes</label>
        <div className="checkbox-grid">
          {availableIntakes.map(intake => (
            <label key={intake} className="checkbox-label">
              <input
                type="checkbox"
                value={intake}
                checked={formData.intakes.includes(intake)}
                onChange={() => handleArrayInput('intakes', intake)}
              />
              <span>{intake}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Masters-specific Requirements Section */}
      <div className="form-section">
        <h4>Masters Program Requirements</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label>Minimum Undergraduate GPA *</label>
            <input
              type="text"
              name="minimumUndergraduateGPA"
              value={formData.minimumUndergraduateGPA}
              onChange={handleChange}
              placeholder="e.g., 3.0 on 4.0 scale"
            />
          </div>
          
          <div className="form-group">
            <label>Work Experience Required?</label>
            <div className="checkbox-single">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="workExperienceRequired"
                  checked={formData.workExperienceRequired}
                  onChange={handleChange}
                />
                <span>Yes, work experience required</span>
              </label>
            </div>
          </div>
        </div>

        {formData.workExperienceRequired && (
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Work Experience (years)</label>
              <input
                type="number"
                name="minimumWorkExperience"
                value={formData.minimumWorkExperience}
                onChange={handleChange}
                placeholder="e.g., 2"
                min="0"
                step="0.5"
              />
            </div>
            <div className="form-group">
              <label>Preferred Work Experience</label>
              <input
                type="text"
                name="preferredWorkExperience"
                value={formData.preferredWorkExperience}
                onChange={handleChange}
                placeholder="e.g., Management experience"
              />
            </div>
          </div>
        )}

        <h5>GRE Requirements (if applicable)</h5>
        <div className="form-row">
          <div className="form-group">
            <label>Quantitative</label>
            <input
              type="text"
              value={formData.greRequirements.quantitative}
              onChange={(e) => handleNestedChange('greRequirements', 'quantitative', e.target.value)}
              placeholder="e.g., 155-170"
            />
          </div>
          <div className="form-group">
            <label>Verbal</label>
            <input
              type="text"
              value={formData.greRequirements.verbal}
              onChange={(e) => handleNestedChange('greRequirements', 'verbal', e.target.value)}
              placeholder="e.g., 150-165"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Analytical Writing</label>
            <input
              type="text"
              value={formData.greRequirements.analytical}
              onChange={(e) => handleNestedChange('greRequirements', 'analytical', e.target.value)}
              placeholder="e.g., 3.5-5.0"
            />
          </div>
          <div className="form-group">
            <label>Total</label>
            <input
              type="text"
              value={formData.greRequirements.total}
              onChange={(e) => handleNestedChange('greRequirements', 'total', e.target.value)}
              placeholder="e.g., 310-340"
            />
          </div>
        </div>

        <h5>GMAT Requirements (for MBA/Business Programs)</h5>
        <div className="form-row">
          <div className="form-group">
            <label>Total Score</label>
            <input
              type="text"
              value={formData.gmatRequirements.total}
              onChange={(e) => handleNestedChange('gmatRequirements', 'total', e.target.value)}
              placeholder="e.g., 600-750"
            />
          </div>
          <div className="form-group">
            <label>Quantitative</label>
            <input
              type="text"
              value={formData.gmatRequirements.quantitative}
              onChange={(e) => handleNestedChange('gmatRequirements', 'quantitative', e.target.value)}
              placeholder="e.g., 40-51"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Additional Requirements</h4>
        <div className="form-row">
          <div className="form-group checkbox-single">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="researchProposalRequired"
                checked={formData.researchProposalRequired}
                onChange={handleChange}
              />
              <span>Research Proposal Required</span>
            </label>
          </div>
          
          <div className="form-group checkbox-single">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="writingSampleRequired"
                checked={formData.writingSampleRequired}
                onChange={handleChange}
              />
              <span>Writing Sample Required</span>
            </label>
          </div>
          
          <div className="form-group checkbox-single">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="interviewRequired"
                checked={formData.interviewRequired}
                onChange={handleChange}
              />
              <span>Interview Required</span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Application Deadlines</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Early Decision</label>
            <input
              type="text"
              value={formData.applicationDeadlines.earlyDecision}
              onChange={(e) => handleNestedChange('applicationDeadlines', 'earlyDecision', e.target.value)}
              placeholder="e.g., Nov 1, 2026"
            />
          </div>
          <div className="form-group">
            <label>Regular Decision</label>
            <input
              type="text"
              value={formData.applicationDeadlines.regularDecision}
              onChange={(e) => handleNestedChange('applicationDeadlines', 'regularDecision', e.target.value)}
              placeholder="e.g., Jan 15, 2027"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Tuition Fees (Annual)</h4>
        <div className="form-row">
          <div className="form-group">
            <label>In-State/Local *</label>
            <input
              type="text"
              value={formData.tuitionFees.inState}
              onChange={(e) => handleNestedChange('tuitionFees', 'inState', e.target.value)}
              placeholder="$"
            />
          </div>
          <div className="form-group">
            <label>Out-of-State/International</label>
            <input
              type="text"
              value={formData.tuitionFees.outOfState}
              onChange={(e) => handleNestedChange('tuitionFees', 'outOfState', e.target.value)}
              placeholder="$"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="form-section">
      <h3 className="section-title">Application Requirements & Media</h3>
      
      <div className="form-group">
        <label>Application Requirements</label>
        <div className="requirement-selector">
          <select
            onChange={(e) => handleRequirementAdd(e.target.value)}
            value=""
          >
            <option value="">Add requirement...</option>
            {commonRequirements.map(req => (
              <option key={req} value={req}>{req}</option>
            ))}
          </select>
        </div>
        
        <div className="requirements-list">
          {formData.applicationRequirements.map((req, index) => (
            <div key={index} className="requirement-tag">
              <span>{req}</span>
              <button type="button" onClick={() => handleRequirementRemove(index)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>English Tests Accepted</label>
        <div className="checkbox-grid">
          {["TOEFL iBT", "IELTS Academic", "PTE Academic", "Duolingo English Test", "Cambridge English"].map(test => (
            <label key={test} className="checkbox-label">
              <input
                type="checkbox"
                value={test}
                checked={formData.englishTests.includes(test)}
                onChange={() => handleArrayInput('englishTests', test)}
              />
              <span>{test}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>University Logo</label>
          <input
            type="file"
            name="universityLogo"
            onChange={handleChange}
            accept="image/*"
          />
        </div>
        
        <div className="form-group">
          <label>Cover Image</label>
          <input
            type="file"
            name="coverImage"
            onChange={handleChange}
            accept="image/*"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group checkbox-single">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span>Active (Visible to students)</span>
          </label>
        </div>
        
        <div className="form-group checkbox-single">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
            />
            <span>Featured University</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Enhanced Preview with Edit Options - Like Bachelors Preview
// Enhanced Preview with Professional Edit Options - Like Bachelors Preview
const renderPreview = () => (
  <div className="preview-modal-overlay" onClick={() => setShowPreview(false)}>
    <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
      {/* Header with title and close button */}
      <div className="preview-modal-header">
        <h2>Masters University Preview</h2>
        <button className="preview-close-btn" onClick={() => setShowPreview(false)}>×</button>
      </div>

      {/* Preview Content */}
      <div className="preview-modal-body">
        {/* Basic Information Section */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>🏛️ Basic Information</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(1); }}
              title="Edit basic information"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">University Name</span>
              <span className="preview-value">{formData.universityName || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">University Code</span>
              <span className="preview-value">{formData.universityCode || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Established</span>
              <span className="preview-value">{formData.establishedYear || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Type</span>
              <span className="preview-value">{formData.universityType || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Accreditation</span>
              <span className="preview-value">{formData.accreditation || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Ranking</span>
              <span className="preview-value">{formData.ranking || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Website</span>
              <span className="preview-value">{formData.website || '—'}</span>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>📍 Location</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(2); }}
              title="Edit location details"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Country</span>
              <span className="preview-value">{formData.country || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">State</span>
              <span className="preview-value">{formData.state || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">City</span>
              <span className="preview-value">{formData.city || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">ZIP/Postal</span>
              <span className="preview-value">{formData.zipCode || '—'}</span>
            </div>
            <div className="preview-item" style={{ gridColumn: 'span 2' }}>
              <span className="preview-label">Address</span>
              <span className="preview-value">{formData.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>📞 Contact</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(3); }}
              title="Edit contact information"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Admin Email</span>
              <span className="preview-value">{formData.adminEmail || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Admin Phone</span>
              <span className="preview-value">{formData.adminPhone || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Admission Email</span>
              <span className="preview-value">{formData.admissionEmail || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Admission Phone</span>
              <span className="preview-value">{formData.admissionPhone || '—'}</span>
            </div>
          </div>
        </div>

        {/* Masters Programs Section */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>🎓 Masters Programs ({formData.programs.length})</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(4); }}
              title="Edit programs"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="program-tags-container">
            {formData.programs.length > 0 ? (
              formData.programs.slice(0, 15).map(prog => (
                <span key={prog} className="program-tag" style={{ background: '#FF9800', color: 'white' }}>
                  {prog}
                </span>
              ))
            ) : (
              <span className="preview-value">—</span>
            )}
            {formData.programs.length > 15 && (
              <span className="program-tag" style={{ background: '#64748b', color: 'white' }}>
                +{formData.programs.length - 15} more
              </span>
            )}
          </div>
        </div>

        {/* Academic Details */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>📚 Academic Details</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(4); }}
              title="Edit academic details"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Intakes</span>
              <span className="preview-value">{formData.intakes.join(', ') || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Early Decision</span>
              <span className="preview-value">{formData.applicationDeadlines.earlyDecision || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Regular Decision</span>
              <span className="preview-value">{formData.applicationDeadlines.regularDecision || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">In-State Tuition</span>
              <span className="preview-value">{formData.tuitionFees.inState || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Out-of-State</span>
              <span className="preview-value">{formData.tuitionFees.outOfState || '—'}</span>
            </div>
          </div>
        </div>

        {/* Masters Requirements */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>📋 Masters Requirements</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(5); }}
              title="Edit requirements"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Min Undergrad GPA</span>
              <span className="preview-value">{formData.minimumUndergraduateGPA || '—'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Work Experience</span>
              <span className="preview-value">
                {formData.workExperienceRequired 
                  ? `Yes (${formData.minimumWorkExperience || 'varies'} years)` 
                  : 'Not required'}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">GRE Requirements</span>
              <span className="preview-value">
                {formData.greRequirements.total || 'Not specified'}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Interview</span>
              <span className="preview-value">{formData.interviewRequired ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Application Requirements */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>📄 Application Requirements</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(5); }}
              title="Edit application requirements"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="program-tags-container">
            {formData.applicationRequirements.length > 0 ? (
              formData.applicationRequirements.map(req => (
                <span key={req} className="program-tag" style={{ background: '#e2e8f0', color: '#334155' }}>
                  {req}
                </span>
              ))
            ) : (
              <span className="preview-value">—</span>
            )}
          </div>
        </div>

        {/* English Tests */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>🌐 English Tests Accepted</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(5); }}
              title="Edit English tests"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="program-tags-container">
            {formData.englishTests.map(test => (
              <span key={test} className="program-tag" style={{ background: '#e2e8f0', color: '#334155' }}>
                {test}
              </span>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>⚙️ Status</h3>
            <button 
              className="preview-edit-btn" 
              onClick={() => { setShowPreview(false); setCurrentStep(5); }}
              title="Edit status"
            >
              <span className="edit-icon">✎</span> Edit
            </button>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Active</span>
              <span className="preview-value">
                <span className={`status-badge ${formData.isActive ? 'active' : 'inactive'}`}>
                  {formData.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Featured</span>
              <span className="preview-value">
                {formData.featured ? '⭐ Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with action buttons */}
      <div className="preview-modal-footer">
        <button className="preview-edit-footer-btn" onClick={() => { setShowPreview(false); }}>
          ← Back
        </button>
        <button 
          className="preview-create-footer-btn" 
          onClick={() => {
            setShowPreview(false);
            // Trigger form submission if on step 5
            if (currentStep === 5) {
              handleSubmit(new Event('submit'));
            } else {
              setCurrentStep(5);
            }
          }}
        >
          Confirm & Create University
        </button>
      </div>
    </div>
  </div>
);

  return (
    <div className="university-admin-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}

      {apiError && (
        <div className="error-banner">
          <span>⚠️ {apiError}</span>
          <button onClick={() => setApiError(null)}>×</button>
        </div>
      )}

      <div className="admin-header">
        <h1>🎓 Masters University Management</h1>
        <p>Create and manage graduate university profiles for Masters degree applications</p>
      </div>

      <div className="university-form-container">
        <h2>{editingUniversity ? 'Edit Masters University' : 'Create New Masters University'}</h2>
        
        <div className="progress-steps">
          {['Basic Info', 'Location', 'Contact', 'Academics', 'Requirements'].map((step, index) => (
            <div 
              key={step}
              className={`step ${currentStep === index + 1 ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(index + 1)}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-label">{step}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="btn-prev">
                ← Previous
              </button>
            )}
            
            {currentStep < 5 && (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="btn-next">
                Next →
              </button>
            )}
            
            {currentStep === 5 && (
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Saving...' : (editingUniversity ? 'Update Masters University' : 'Create Masters University')}
              </button>
            )}
            
            <button type="button" onClick={() => setShowPreview(true)} className="btn-preview">
              👁️ Preview
            </button>
          </div>
        </form>
      </div>

      {showPreview && renderPreview()}
    </div>
  );
};

export default MastersUniversityAdminTemplate;