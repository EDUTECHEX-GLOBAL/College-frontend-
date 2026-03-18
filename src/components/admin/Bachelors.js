import React, { useState } from "react";
import "./Bachelors.css";

const UniversityAdminTemplate = () => {
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
    const currentMonth = new Date().getMonth(); // 0 = January, 11 = December
    
    for (let year = currentYear; year <= currentYear + 3; year++) {
      seasons.forEach(season => {
        // Skip past seasons in the current year
        if (year === currentYear) {
          if (season === "Spring" && currentMonth > 4) return; // Skip Spring if past May (month 4)
          if (season === "Summer" && currentMonth > 7) return; // Skip Summer if past August (month 7)
          if (season === "Fall" && currentMonth > 10) {
            // If we're past November, show Fall of next year instead
            if (year === currentYear) return;
          }
        }
        intakes.push(`${season} ${year}`);
      });
    }
    
    // Sort intakes chronologically
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

  // Program Categories with ONLY Bachelor's programs
  const programCategories = [
    // ========== COMPUTER SCIENCE & IT ==========
    { name: "Computer Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Information Technology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Data Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Artificial Intelligence (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Cybersecurity (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Software Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Computer Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Information Systems (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Cloud Computing (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Web Development (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Mobile App Development (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Game Development (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Network Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Bioinformatics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ENGINEERING ==========
    { name: "Mechanical Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Electrical Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Civil Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Chemical Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Aerospace Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Biomedical Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Industrial Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Environmental Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Materials Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Petroleum Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Automotive Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Robotics Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Mechatronics Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Nuclear Engineering (BEng)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== BUSINESS & MANAGEMENT ==========
    { name: "Business Administration (BBA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Finance (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Marketing (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Accounting (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "International Business (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Entrepreneurship (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Human Resources (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Supply Chain Management (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Economics (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "E-commerce (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Real Estate (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Hospitality Management (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ARTS & HUMANITIES ==========
    { name: "English Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Creative Writing (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Linguistics (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Comparative Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Philosophy (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "History (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Fine Arts (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Graphic Design (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Animation (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Film Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Photography (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Music (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Theatre Arts (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Religious Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Archaeology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Classics (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Medieval Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "American Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Asian Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "European Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== SOCIAL SCIENCES ==========
    { name: "Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Sociology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Anthropology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Political Science (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "International Relations (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Geography (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Criminology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Social Work (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Gender Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Public Policy (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Urban Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Development Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Peace and Conflict Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "African Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Latin American Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Middle Eastern Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== NATURAL SCIENCES ==========
    { name: "Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Biology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Mathematics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Statistics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Environmental Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Geology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Astronomy (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Neuroscience (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Genetics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Biochemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Molecular Biology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Cell Biology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Marine Biology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Astrophysics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Applied Mathematics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Pure Mathematics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Organic Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Inorganic Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Physical Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Theoretical Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Quantum Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== MEDICAL & HEALTH SCIENCES ==========
    { name: "Medicine (MBBS)", level: "Bachelor", duration: "5 years", studyMode: "On Campus" },
    { name: "Nursing (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Dentistry (BDS)", level: "Bachelor", duration: "5 years", studyMode: "On Campus" },
    { name: "Physiotherapy (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Veterinary Science (BVSc)", level: "Bachelor", duration: "5 years", studyMode: "On Campus" },
    { name: "Nutrition (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Occupational Therapy (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Radiology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Pharmacology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Kinesiology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Exercise Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Sports Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Public Health (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Health Sciences (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Medical Laboratory Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== LAW ==========
    { name: "Law (LLB)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Criminal Justice (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Legal Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Paralegal Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== EDUCATION ==========
    { name: "Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Early Childhood Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Primary Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Secondary Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Special Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Physical Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Music Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Art Education (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ARCHITECTURE & DESIGN ==========
    { name: "Architecture (BArch)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Interior Design (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Landscape Architecture (BLA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Fashion Design (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Product Design (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Industrial Design (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Game Design (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "UX/UI Design (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Fashion Merchandising (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== MEDIA & COMMUNICATIONS ==========
    { name: "Journalism (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Media Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Public Relations (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Advertising (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Digital Media (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Broadcasting (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Communication Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Film Production (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Radio Production (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Television Production (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== AGRICULTURE & ENVIRONMENT ==========
    { name: "Agriculture (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Forestry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Horticulture (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Food Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Wildlife Conservation (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Renewable Energy (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Sustainability (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Environmental Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Marine Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Ecology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== LANGUAGES & LINGUISTICS ==========
    { name: "English Language (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "French (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Spanish (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "German (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Italian (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Portuguese (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Russian (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Chinese (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Japanese (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Korean (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Arabic (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Hebrew (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Hindi (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Sanskrit (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Latin (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Ancient Greek (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Applied Linguistics (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Translation Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Interpretation (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ADDITIONAL ENGLISH/HUMANITIES ==========
    { name: "English with Creative Writing (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "English with Drama (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "English with Film Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Shakespeare Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Modern Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Postcolonial Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "American Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "British Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "World Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Children's Literature (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ADDITIONAL MATHEMATICS ==========
    { name: "Mathematics with Statistics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Mathematics with Finance (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Mathematics with Computer Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Mathematics with Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Applied Statistics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Financial Mathematics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Actuarial Science (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Operations Research (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Computational Mathematics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Discrete Mathematics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ADDITIONAL PHYSICS ==========
    { name: "Applied Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Engineering Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Medical Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Nuclear Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Particle Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Condensed Matter Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Optics and Photonics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Acoustics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Geophysics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Space Physics (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ADDITIONAL CHEMISTRY ==========
    { name: "Analytical Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Synthetic Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Medicinal Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Pharmaceutical Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Polymer Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Materials Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Environmental Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Forensic Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Food Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Industrial Chemistry (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ADDITIONAL SOCIAL SCIENCES ==========
    { name: "Social Anthropology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Cultural Anthropology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Physical Anthropology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Forensic Anthropology (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Political Theory (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Comparative Politics (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "International Politics (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Diplomacy (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Conflict Resolution (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Human Rights (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Social Policy (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Social Justice (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Community Development (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Youth Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Family Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Aging Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Disability Studies (BA)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    
    // ========== ADDITIONAL PSYCHOLOGY ==========
    { name: "Clinical Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Cognitive Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Developmental Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Social Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Organizational Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Educational Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Forensic Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Health Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Sports Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Neuropsychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Experimental Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" },
    { name: "Behavioral Psychology (BSc)", level: "Bachelor", duration: "3 years", studyMode: "On Campus" }
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
    
    // Requirements
    minimumGPA: "",
    satRequirements: {
      math: "",
      reading: "",
      total: ""
    },
    actRequirements: {
      composite: ""
    },
    englishTests: ["TOEFL iBT", "IELTS Academic"],
    applicationRequirements: [],
    
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

  // All Countries List
  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "New Zealand",
    "Germany",
    "France",
    "Netherlands",
    "Sweden",
    "Switzerland",
    "Ireland",
    "Singapore",
    "Japan",
    "South Korea",
    "China",
    "India",
    "Italy",
    "Spain",
    "Denmark",
    "Finland",
    "Norway",
    "Belgium",
    "Austria",
    "Hong Kong",
    "Malaysia",
    "UAE",
    "Saudi Arabia",
    "Qatar",
    "South Africa",
    "Brazil",
    "Mexico",
    "Chile",
    "Argentina",
    "Colombia",
    "Thailand",
    "Vietnam",
    "Philippines",
    "Indonesia",
    "Pakistan",
    "Bangladesh",
    "Sri Lanka",
    "Nepal",
    "Kenya",
    "Nigeria",
    "Egypt",
    "Morocco",
    "Israel",
    "Turkey",
    "Russia",
    "Ukraine",
    "Poland",
    "Czech Republic",
    "Hungary",
    "Greece",
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

  // Enhanced statesByCountry - EVERY country gets states + "Other"
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
      "Hessen", "Nordrhein-Westfalen", "Other"
    ],
    "France": ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Other"],
    "Netherlands": ["North Holland", "South Holland", "North Brabant", "Gelderland", "Other"],
    "Sweden": ["Stockholm", "Västra Götaland", "Skåne", "Uppsala", "Other"],
    "Switzerland": ["Zurich", "Bern", "Geneva", "Vaud", "Other"],
    "Ireland": ["Leinster", "Munster", "Connacht", "Ulster", "Other"],
    "Singapore": ["Central", "North-East", "North", "East", "West", "Other"],
    "Japan": ["Tokyo", "Osaka", "Kanagawa", "Aichi", "Other"],
    "South Korea": ["Seoul", "Gyeonggi", "Incheon", "Gyeongsangbuk", "Other"],
    "China": ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Other"],
    "India": [
      "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra",
      "Delhi", "Uttar Pradesh", "Gujarat", "West Bengal", "Other"
    ],
    "Italy": ["Lombardy", "Lazio", "Campania", "Veneto", "Other"],
    "Spain": ["Catalonia", "Andalusia", "Madrid", "Valencia", "Other"],
    "Denmark": ["Capital Region", "Central Denmark", "North Denmark", "Other"],
    "Finland": ["Uusimaa", "Pirkanmaa", "Ostrobothnia", "Other"],
    "Norway": ["Oslo", "Viken", "Trøndelag", "Other"],
    "Belgium": ["Flanders", "Wallonia", "Brussels", "Other"],
    "Austria": ["Vienna", "Lower Austria", "Upper Austria", "Other"],
    "Hong Kong": ["Hong Kong Island", "Kowloon", "New Territories", "Other"],
    "Malaysia": ["Selangor", "Johor", "Penang", "Kuala Lumpur", "Other"],
    "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Other"],
    "Saudi Arabia": ["Riyadh", "Makkah", "Madinah", "Other"],
    "Qatar": ["Doha", "Al Rayyan", "Other"],
    "South Africa": ["Gauteng", "Western Cape", "KwaZulu-Natal", "Other"],
    "Brazil": ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Other"],
    "Mexico": ["Mexico City", "Jalisco", "Nuevo León", "Other"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Other"],
    "Vietnam": ["Hanoi", "Ho Chi Minh City", "Da Nang", "Other"],
    "Philippines": ["Metro Manila", "Cebu", "Davao", "Other"],
    "Indonesia": ["Jakarta", "West Java", "East Java", "Other"],
    "Pakistan": ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Other"],
    "Bangladesh": ["Dhaka", "Chittagong", "Rajshahi", "Other"],
    "Sri Lanka": ["Western", "Central", "Southern", "Other"],
    "Nepal": ["Bagmati", "Gandaki", "Lumbini", "Other"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Other"],
    "Nigeria": ["Lagos", "Abuja", "Rivers", "Other"],
    "Egypt": ["Cairo", "Alexandria", "Giza", "Other"],
    "Morocco": ["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Other"],
    "Israel": ["Tel Aviv", "Jerusalem", "Haifa", "Other"],
    "Turkey": ["Istanbul", "Ankara", "Izmir", "Other"],
    "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Other"],
    "Ukraine": ["Kyiv", "Kharkiv", "Odesa", "Other"],
    "Poland": ["Masovian", "Lesser Poland", "Lower Silesian", "Other"],
    "Czech Republic": ["Prague", "Central Bohemian", "South Moravian", "Other"],
    "Hungary": ["Budapest", "Pest", "Hajdú-Bihar", "Other"],
    "Greece": ["Attica", "Central Macedonia", "Crete", "Other"],
    "Portugal": ["Lisbon", "Porto", "Braga", "Other"],
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

  // University Types
  const universityTypes = [
    "Public University",
    "Private University",
    "Ivy League",
    "Liberal Arts College",
    "Research University",
    "Community College",
    "Technical Institute",
    "Art School"
  ];

  // Common US University Requirements
  const commonRequirements = [
    "Official High School Transcripts",
    "Letters of Recommendation",
    "Personal Essay / Statement of Purpose",
    "SAT or ACT Scores",
    "English Proficiency Test Scores",
    "Application Fee",
    "Portfolio (for Art Programs)",
    "Interview",
    "Extracurricular Activities List",
    "AP/IB Scores",
    "Financial Affidavit",
    "Passport Copy",
    "Resume/CV",
    "Writing Sample",
    "GRE/GMAT Scores",
    "Work Experience",
    "Research Proposal",
    "Teaching Philosophy Statement"
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
    
    // Track when "Other" is selected in the state dropdown
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

    // Basic Information
    if (!formData.universityName.trim()) newErrors.universityName = "University name is required";
    if (!formData.universityCode.trim()) newErrors.universityCode = "University code is required";
    if (!formData.establishedYear) newErrors.establishedYear = "Established year is required";
    if (!formData.universityType) newErrors.universityType = "University type is required";
    if (!formData.website.trim()) newErrors.website = "Website is required";
    
    // Location
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.state.trim()) newErrors.state = "State/Province is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "Postal/ZIP code is required";
    
    // Contact
    if (!formData.adminEmail.trim()) newErrors.adminEmail = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) newErrors.adminEmail = "Valid email is required";
    if (!formData.admissionEmail.trim()) newErrors.admissionEmail = "Admission email is required";
    if (!formData.adminPhone.trim()) newErrors.adminPhone = "Admin phone is required";
    
    // Academic Details
    if (formData.programs.length === 0) newErrors.programs = "At least one program is required";
    if (!formData.tuitionFees.inState) newErrors.tuitionInState = "In-state tuition is required";
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Safety check - only allow submission on step 5
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
        // Prepare data for API with enhanced program details
        const selectedPrograms = formData.programs.map(programName => {
          // Find the program in programCategories to get its details
          const programDetails = programCategories.find(p => p.name === programName) || {
            name: programName,
            level: "Bachelor",
            duration: "3 years",
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
          source: 'bachelors',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          programCount: selectedPrograms.length
        };

        // Remove file objects before sending
        delete universityData.universityLogo;
        delete universityData.coverImage;

        console.log("Submitting university with programs:", selectedPrograms);

        const url = editingUniversity 
          ? `${API_BASE_URL}/bachelors/universities/${editingUniversity._id}`
          : `${API_BASE_URL}/bachelors/universities`;
        
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
          alert(`✅ University ${editingUniversity ? 'updated' : 'created'} successfully!`);
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
      satRequirements: {
        math: "",
        reading: "",
        total: ""
      },
      actRequirements: {
        composite: ""
      },
      englishTests: ["TOEFL iBT", "IELTS Academic"],
      applicationRequirements: [],
      universityLogo: null,
      coverImage: null,
      isActive: true,
      featured: false
    });
    setIsOtherSelected(false);
    setCurrentStep(1);
    setErrors({});
  };

  const handleEdit = (university) => {
    setFormData({
      ...university,
      establishedYear: university.establishedYear?.toString() || "",
      programs: university.programs?.map(p => p.name || p) || []
    });
    
    // Check if the state value is not in the predefined list for that country
    if (university.country && university.state) {
      const statesForCountry = statesByCountry[university.country] || [];
      setIsOtherSelected(!statesForCountry.includes(university.state) && university.state !== "");
    } else {
      setIsOtherSelected(false);
    }
    
    setEditingUniversity(university);
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };

  // Helper function to get current year range for display
  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear} - ${currentYear + 3}`;
  };

  // Helper function to get color based on program level
  const getLevelColor = (level) => {
    const levelStr = level?.toLowerCase() || '';
    if (levelStr.includes('bachelor') || levelStr.includes('undergraduate') || levelStr.includes('ba') || levelStr.includes('bs') || levelStr.includes('bsc') || levelStr.includes('beng')) {
      return '#4CAF50'; // Green
    } else if (levelStr.includes('master') || levelStr.includes('graduate') || levelStr.includes('ma') || levelStr.includes('ms') || levelStr.includes('msc') || levelStr.includes('meng') || levelStr.includes('mba') || levelStr.includes('llm') || levelStr.includes('mph') || levelStr.includes('mfa') || levelStr.includes('march')) {
      return '#FF9800'; // Orange
    } else if (levelStr.includes('phd') || levelStr.includes('doctorate') || levelStr.includes('dclinpsy') || levelStr.includes('md')) {
      return '#F44336'; // Red
    } else if (levelStr.includes('foundation')) {
      return '#FF6B6B'; // Coral
    } else {
      return '#757575'; // Grey
    }
  };

  const renderStep1 = () => (
    <div className="form-section">
      <h3 className="section-title">Basic Information</h3>
      
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
          <label>National/Global Ranking</label>
          <input
            type="text"
            name="ranking"
            value={formData.ranking}
            onChange={handleChange}
            placeholder="e.g., #15 in National Universities"
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
            placeholder="admissions@university.edu"
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

  const renderStep4 = () => {
    // Group programs by category for better organization
    const groupedPrograms = {
      "Computer Science & IT": programCategories.filter(p => 
        p.name.includes("Computer") || p.name.includes("Data") || p.name.includes("AI") || 
        p.name.includes("Cyber") || p.name.includes("Software") || p.name.includes("IT") || 
        p.name.includes("Cloud") || p.name.includes("Web") || p.name.includes("Mobile") || 
        p.name.includes("Game") || p.name.includes("Network") || p.name.includes("Bioinformatics")
      ),
      "Engineering": programCategories.filter(p => 
        p.name.includes("Engineering") || p.name.includes("Robotics") || p.name.includes("Mechatronics") || 
        p.name.includes("Aerospace") || p.name.includes("Biomedical") || p.name.includes("Nuclear")
      ),
      "Business & Management": programCategories.filter(p => 
        p.name.includes("Business") || p.name.includes("Finance") || p.name.includes("Marketing") || 
        p.name.includes("Accounting") || p.name.includes("Economics") || p.name.includes("Management") || 
        p.name.includes("Entrepreneurship") || p.name.includes("Human Resources") || p.name.includes("Supply Chain") || 
        p.name.includes("Real Estate") || p.name.includes("Hospitality")
      ),
      "Mathematics & Statistics": programCategories.filter(p => 
        p.name.includes("Mathematics") || p.name.includes("Statistics") || p.name.includes("Actuarial") || 
        p.name.includes("Applied Math") || p.name.includes("Pure Math") || p.name.includes("Operations Research") ||
        p.name.includes("Financial Math") || p.name.includes("Discrete Math") || p.name.includes("Computational Math")
      ),
      "Physics & Astronomy": programCategories.filter(p => 
        p.name.includes("Physics") || p.name.includes("Astronomy") || p.name.includes("Astrophysics") || 
        p.name.includes("Geophysics") || p.name.includes("Space") || p.name.includes("Optics") ||
        p.name.includes("Acoustics") || p.name.includes("Nuclear Physics") || p.name.includes("Quantum")
      ),
      "Chemistry": programCategories.filter(p => 
        p.name.includes("Chemistry") || p.name.includes("Biochemistry") || p.name.includes("Analytical") || 
        p.name.includes("Organic") || p.name.includes("Inorganic") || p.name.includes("Physical") ||
        p.name.includes("Medicinal") || p.name.includes("Pharmaceutical") || p.name.includes("Polymer") ||
        p.name.includes("Materials") || p.name.includes("Environmental Chemistry") || p.name.includes("Forensic Chemistry")
      ),
      "Biology & Life Sciences": programCategories.filter(p => 
        p.name.includes("Biology") || p.name.includes("Neuroscience") || p.name.includes("Genetics") || 
        p.name.includes("Molecular") || p.name.includes("Cell") || p.name.includes("Marine") ||
        p.name.includes("Biochemistry") || p.name.includes("Bioinformatics") || p.name.includes("Ecology")
      ),
      "English & Literature": programCategories.filter(p => 
        p.name.includes("English") || p.name.includes("Literature") || p.name.includes("Creative Writing") || 
        p.name.includes("Shakespeare") || p.name.includes("Poetry") || p.name.includes("Drama") ||
        p.name.includes("Fiction") || p.name.includes("American Literature") || p.name.includes("British Literature") ||
        p.name.includes("World Literature") || p.name.includes("Children's Literature")
      ),
      "Languages & Linguistics": programCategories.filter(p => 
        p.name.includes("French") || p.name.includes("Spanish") || p.name.includes("German") || 
        p.name.includes("Italian") || p.name.includes("Portuguese") || p.name.includes("Russian") ||
        p.name.includes("Chinese") || p.name.includes("Japanese") || p.name.includes("Korean") ||
        p.name.includes("Arabic") || p.name.includes("Hindi") || p.name.includes("Latin") ||
        p.name.includes("Greek") || p.name.includes("Linguistics") || p.name.includes("Translation") ||
        p.name.includes("Interpretation")
      ),
      "Social Sciences": programCategories.filter(p => 
        p.name.includes("Sociology") || p.name.includes("Anthropology") || p.name.includes("Political Science") || 
        p.name.includes("International Relations") || p.name.includes("Geography") || p.name.includes("Criminology") ||
        p.name.includes("Social Work") || p.name.includes("Gender Studies") || p.name.includes("Public Policy") ||
        p.name.includes("Urban Studies") || p.name.includes("Development Studies") || p.name.includes("Peace Studies") ||
        p.name.includes("Human Rights") || p.name.includes("Social Justice") || p.name.includes("Community Development")
      ),
      "Psychology": programCategories.filter(p => 
        p.name.includes("Psychology") || p.name.includes("Clinical Psychology") || p.name.includes("Cognitive") || 
        p.name.includes("Developmental") || p.name.includes("Social Psychology") || p.name.includes("Organizational") ||
        p.name.includes("Educational") || p.name.includes("Forensic") || p.name.includes("Health") ||
        p.name.includes("Sports") || p.name.includes("Neuropsychology") || p.name.includes("Experimental") ||
        p.name.includes("Behavioral")
      ),
      "Arts & Humanities": programCategories.filter(p => 
        p.name.includes("Fine Arts") || p.name.includes("Graphic Design") || p.name.includes("Animation") || 
        p.name.includes("Film") || p.name.includes("Photography") || p.name.includes("Music") ||
        p.name.includes("Theatre") || p.name.includes("Philosophy") || p.name.includes("History") ||
        p.name.includes("Archaeology") || p.name.includes("Classics") || p.name.includes("Religious Studies") ||
        p.name.includes("Medieval") || p.name.includes("American Studies") || p.name.includes("Asian Studies")
      ),
      "Medical & Health Sciences": programCategories.filter(p => 
        p.name.includes("Medicine") || p.name.includes("Nursing") || p.name.includes("Dentistry") || 
        p.name.includes("Physiotherapy") || p.name.includes("Veterinary") || p.name.includes("Nutrition") ||
        p.name.includes("Occupational Therapy") || p.name.includes("Radiology") || p.name.includes("Pharmacology") ||
        p.name.includes("Kinesiology") || p.name.includes("Exercise Science") || p.name.includes("Sports Science") ||
        p.name.includes("Public Health") || p.name.includes("Health Sciences")
      ),
      "Law & Justice": programCategories.filter(p => 
        p.name.includes("Law") || p.name.includes("LLB") || p.name.includes("Criminal Justice") || 
        p.name.includes("Legal Studies") || p.name.includes("Paralegal")
      ),
      "Education": programCategories.filter(p => 
        p.name.includes("Education") || p.name.includes("Early Childhood") || p.name.includes("Primary") || 
        p.name.includes("Secondary") || p.name.includes("Special Education") || p.name.includes("Physical Education") ||
        p.name.includes("Music Education") || p.name.includes("Art Education")
      ),
      "Architecture & Design": programCategories.filter(p => 
        p.name.includes("Architecture") || p.name.includes("Interior Design") || p.name.includes("Landscape") || 
        p.name.includes("Fashion Design") || p.name.includes("Product Design") || p.name.includes("Industrial Design") ||
        p.name.includes("Game Design") || p.name.includes("UX/UI") || p.name.includes("Fashion Merchandising")
      ),
      "Media & Communications": programCategories.filter(p => 
        p.name.includes("Journalism") || p.name.includes("Media") || p.name.includes("Public Relations") || 
        p.name.includes("Advertising") || p.name.includes("Digital Media") || p.name.includes("Broadcasting") ||
        p.name.includes("Communication") || p.name.includes("Film Production") || p.name.includes("Radio") ||
        p.name.includes("Television")
      ),
      "Agriculture & Environment": programCategories.filter(p => 
        p.name.includes("Agriculture") || p.name.includes("Forestry") || p.name.includes("Horticulture") || 
        p.name.includes("Food Science") || p.name.includes("Wildlife") || p.name.includes("Renewable Energy") ||
        p.name.includes("Sustainability") || p.name.includes("Environmental Studies") || p.name.includes("Marine Science") ||
        p.name.includes("Ecology")
      )
    };

    return (
      <div className="form-section">
        <h3 className="section-title">Academic Details</h3>
        
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
                          backgroundColor: getLevelColor(program.level),
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
          <label>Available Intakes ({getYearRange()})</label>
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
          <small className="field-hint">Select the intakes your university is accepting applications for</small>
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
              <label>Early Action</label>
              <input
                type="text"
                value={formData.applicationDeadlines.earlyAction}
                onChange={(e) => handleNestedChange('applicationDeadlines', 'earlyAction', e.target.value)}
                placeholder="e.g., Nov 15, 2026"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Regular Decision</label>
              <input
                type="text"
                value={formData.applicationDeadlines.regularDecision}
                onChange={(e) => handleNestedChange('applicationDeadlines', 'regularDecision', e.target.value)}
                placeholder="e.g., Jan 1, 2027"
              />
            </div>
            <div className="form-group">
              <label>Rolling Admission</label>
              <input
                type="text"
                value={formData.applicationDeadlines.rolling}
                onChange={(e) => handleNestedChange('applicationDeadlines', 'rolling', e.target.value)}
                placeholder="e.g., Ongoing"
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
                className={errors.tuitionInState ? "error" : ""}
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
          <div className="form-row">
            <div className="form-group">
              <label>International (if different)</label>
              <input
                type="text"
                value={formData.tuitionFees.international}
                onChange={(e) => handleNestedChange('tuitionFees', 'international', e.target.value)}
                placeholder="$"
              />
            </div>
            <div className="form-group">
              <label>Room & Board</label>
              <input
                type="text"
                value={formData.tuitionFees.roomAndBoard}
                onChange={(e) => handleNestedChange('tuitionFees', 'roomAndBoard', e.target.value)}
                placeholder="$"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Test Score Requirements</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Minimum GPA</label>
              <input
                type="text"
                name="minimumGPA"
                value={formData.minimumGPA}
                onChange={handleChange}
                placeholder="e.g., 3.0 on 4.0 scale"
              />
            </div>
          </div>
          
          <h5>SAT Requirements (if applicable)</h5>
          <div className="form-row">
            <div className="form-group">
              <label>Math</label>
              <input
                type="text"
                value={formData.satRequirements.math}
                onChange={(e) => handleNestedChange('satRequirements', 'math', e.target.value)}
                placeholder="e.g., 600-800"
              />
            </div>
            <div className="form-group">
              <label>Reading/Writing</label>
              <input
                type="text"
                value={formData.satRequirements.reading}
                onChange={(e) => handleNestedChange('satRequirements', 'reading', e.target.value)}
                placeholder="e.g., 600-800"
              />
            </div>
            <div className="form-group">
              <label>Total</label>
              <input
                type="text"
                value={formData.satRequirements.total}
                onChange={(e) => handleNestedChange('satRequirements', 'total', e.target.value)}
                placeholder="e.g., 1200-1600"
              />
            </div>
          </div>

          <h5>ACT Requirements (if applicable)</h5>
          <div className="form-row">
            <div className="form-group">
              <label>Composite</label>
              <input
                type="text"
                value={formData.actRequirements.composite}
                onChange={(e) => handleNestedChange('actRequirements', 'composite', e.target.value)}
                placeholder="e.g., 25-32"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="form-section">
      <h3 className="section-title">Requirements & Media</h3>
      
      <div className="form-group">
        <label>Application Requirements</label>
        <div className="requirement-selector">
          <select
            id="requirementSelect"
            onChange={(e) => handleRequirementAdd(e.target.value)}
            value=""
          >
            <option value="">Add common requirement...</option>
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
        <div className="checkbox-group">
          {["TOEFL iBT", "IELTS Academic", "PTE Academic", "Duolingo English Test", "Cambridge English", "GRE", "GMAT"].map(test => (
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

const renderPreview = () => (
  <div
    className="preview-modal-overlay"
    onClick={() => setShowPreview(false)}
  >
    <div
      className="preview-modal"
      onClick={e => e.stopPropagation()}
    >
      {/* Header: ONLY × at top-right, no title */}
      <div className="preview-modal-header" style={{ justifyContent: 'flex-end', padding: '16px 24px' }}>
        <button
          className="preview-close-btn"
          onClick={() => setShowPreview(false)}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="preview-modal-body">
        {/* University main info */}
        <div className="preview-university-header">
          <div className="preview-title-section">
            <h1>{formData.universityName || "University Name"}</h1>
            <span className="preview-badge">{formData.universityCode || "N/A"}</span>
          </div>

          <div className="preview-status">
            {formData.isActive ? (
              <span className="status-badge active">● Active</span>
            ) : (
              <span className="status-badge inactive">● Inactive</span>
            )}
            {formData.featured && <span className="featured-badge">Featured</span>}
          </div>
        </div>

        {/* University Details */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>University Details</h3>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Established Year</span>
              <span className="preview-value">{formData.establishedYear || 'N/A'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">University Type</span>
              <span className="preview-value">{formData.universityType || 'N/A'}</span>
            </div>
            <div className="preview-item full-width">
              <span className="preview-label">Location</span>
              <span className="preview-value">
                {formData.address || 'N/A'}, {formData.city || 'N/A'}, {formData.state || 'N/A'}, {formData.country || 'N/A'} {formData.zipCode ? `(${formData.zipCode})` : ''}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Website</span>
              <span className="preview-value">
                {formData.website ? (
                  <a href={formData.website} target="_blank" rel="noopener noreferrer" className="preview-link">
                    {formData.website}
                  </a>
                ) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Programs */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Programs Offered ({formData.programs.length})</h3>
          </div>
          {formData.programs.length > 0 ? (
            <div className="program-tags-container">
              {formData.programs.map((prog, index) => {
                const detail = programCategories.find(p => p.name === prog) || {
                  level: "Bachelor",
                  studyMode: "On Campus"
                };
                return (
                  <span key={index} className="program-tag">
                    {prog}
                    <span className="program-tag-detail">
                      {detail.level} • {detail.studyMode}
                    </span>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="preview-empty">No programs selected yet</p>
          )}
        </div>

        {/* Intakes */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Available Intakes</h3>
          </div>
          <div className="intakes-container">
            {formData.intakes.length > 0 ? (
              formData.intakes.map((intake, idx) => (
                <span key={idx} className="intake-tag">{intake}</span>
              ))
            ) : (
              <p className="preview-empty">No intakes selected</p>
            )}
          </div>
        </div>

        {/* Tuition */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Tuition Fees</h3>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">In-State/Local:</span>
              <span className="preview-value">${formData.tuitionFees.inState || 'N/A'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Out-of-State/International:</span>
              <span className="preview-value">
                ${formData.tuitionFees.outOfState || formData.tuitionFees.international || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Contact Information</h3>
          </div>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Admin Email:</span>
              <span className="preview-value">{formData.adminEmail || 'N/A'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Admin Phone:</span>
              <span className="preview-value">{formData.adminPhone || 'N/A'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Admission Email:</span>
              <span className="preview-value">{formData.admissionEmail || 'N/A'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Admission Phone:</span>
              <span className="preview-value">{formData.admissionPhone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Edit (left) + Create University (right) */}
      <div className="preview-modal-footer">
        {/* Edit button */}
        <button
          className="preview-edit-footer-btn"
          onClick={() => {
            setShowPreview(false);
            setCurrentStep(1); // Jump back to step 1 (or change to 4 for programs)
          }}
        >
          ✏️ Edit
        </button>

        {/* Create University - primary action */}
        <button
          className="preview-create-footer-btn"
          onClick={() => {
            handleSubmit({ preventDefault: () => {} }); // Triggers creation/save
            setShowPreview(false);
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              Creating...
            </>
          ) : (
            <>
              <span className="btn-icon">✓</span>
               Confirm &Create University
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

  return (
    <div className="university-admin-container">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="error-banner">
          <span>⚠️ {apiError}</span>
          <button onClick={() => setApiError(null)}>×</button>
        </div>
      )}

      <div className="admin-header">
        <h1>🏛️ University Management</h1>
        <p>Create and manage university profiles for student applications</p>
      </div>

      {/* University Creation Form */}
      <div className="university-form-container">
        <h2>{editingUniversity ? 'Edit University' : 'Create New University'}</h2>
        
        {/* Progress Steps */}
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

        <form onSubmit={handleSubmit} onKeyDown={(e) => {
          if (e.key === 'Enter' && currentStep !== 5) {
            e.preventDefault();
          }
        }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Form Navigation */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="btn-prev">
                <span className="btn-icon">←</span> Previous
              </button>
            )}
            
            {currentStep < 5 && (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="btn-next">
                Next <span className="btn-icon">→</span>
              </button>
            )}
            
            {currentStep === 5 && (
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✓</span>
                    {editingUniversity ? 'Update University' : 'Create University'}
                  </>
                )}
              </button>
            )}
            
            <button type="button" onClick={() => setShowPreview(true)} className="btn-preview">
              <span className="btn-icon">👁️</span> Preview
            </button>
          </div>
        </form>
      </div>

      {showPreview && renderPreview()}
    </div>
  );
};

export default UniversityAdminTemplate;