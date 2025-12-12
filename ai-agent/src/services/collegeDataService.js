const fs = require('fs');
const path = require('path');

class CollegeDataService {
  constructor() {
    this.collegeData = this.loadCollegeData();
  }

  loadCollegeData() {
    try {
      // Assuming your college data is in college.json
      const dataPath = path.join(__dirname, '..', 'data', 'college.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading college data:', error);
      return { universities: [] };
    }
  }

  findCollegeByName(collegeName) {
    if (!this.collegeData.universities || !Array.isArray(this.collegeData.universities)) {
      return null;
    }

    const normalizedSearch = collegeName.toLowerCase().trim();
    
    // Exact match
    let college = this.collegeData.universities.find(uni => 
      uni.name.toLowerCase() === normalizedSearch
    );

    // Partial match
    if (!college) {
      college = this.collegeData.universities.find(uni => 
        uni.name.toLowerCase().includes(normalizedSearch) ||
        normalizedSearch.includes(uni.name.toLowerCase())
      );
    }

    // Check common abbreviations
    if (!college) {
      const abbreviations = {
        'ua': 'University of Alabama',
        'uab': 'University of Alabama at Birmingham',
        'asu': 'Arizona State University',
        'harvard': 'Harvard University',
        'stanford': 'Stanford University',
        'mit': 'Massachusetts Institute of Technology'
      };
      
      if (abbreviations[normalizedSearch]) {
        college = this.collegeData.universities.find(uni => 
          uni.name === abbreviations[normalizedSearch]
        );
      }
    }

    return college;
  }

  getFormattedInfo(college) {
    if (!college) return null;

    let formattedText = `# ${college.name}\n`;

    // Add location if available
    if (college.location) {
      formattedText += `📍 **Location:** ${college.location}\n\n`;
    }

    // 1. Application Deadlines
    formattedText += `## 📅 Application Deadlines\n`;
    if (college.deadlines) {
      Object.entries(college.deadlines).forEach(([key, value]) => {
        const label = this.formatKey(key);
        formattedText += `• ${label}: ${value}\n`;
      });
    } else {
      formattedText += `• Fall Intake: Typically December-January\n`;
      formattedText += `• Spring Intake: Typically August-October\n`;
    }

    // 2. Estimated Costs
    formattedText += `\n## 💰 Estimated Annual Costs\n`;
    if (college.costs) {
      if (college.costs.tuition) {
        formattedText += `• Tuition: $${college.costs.tuition.toLocaleString()}\n`;
      }
      if (college.costs.room_board) {
        formattedText += `• Room & Board: $${college.costs.room_board.toLocaleString()}\n`;
      }
      if (college.costs.total_approx) {
        formattedText += `• **Total Approx:** $${college.costs.total_approx.toLocaleString()}\n`;
      } else if (college.costs.tuition && college.costs.room_board) {
        const total = college.costs.tuition + college.costs.room_board;
        formattedText += `• **Total Approx:** $${total.toLocaleString()}\n`;
      }
    } else {
      formattedText += `• Tuition: $15,000 - $50,000\n`;
      formattedText += `• Living Expenses: $10,000 - $15,000\n`;
      formattedText += `• **Total:** $25,000 - $65,000\n`;
    }

    // 3. Academic Documents Required
    formattedText += `\n## 📄 Required Documents\n`;
    if (college.documents && Array.isArray(college.documents)) {
      college.documents.forEach((doc, index) => {
        formattedText += `${index + 1}. ${doc}\n`;
      });
    } else {
      formattedText += `1. Official academic transcripts\n`;
      formattedText += `2. Standardized test scores (SAT/ACT)\n`;
      formattedText += `3. English proficiency proof (TOEFL/IELTS)\n`;
      formattedText += `4. Letters of recommendation (2-3)\n`;
      formattedText += `5. Statement of Purpose\n`;
    }

    // 4. Minimum Percentage/GPA Requirements
    formattedText += `\n## 🎯 Academic Requirements\n`;
    if (college.requirements) {
      if (college.requirements.gpa_min) {
        formattedText += `• **Minimum GPA:** ${college.requirements.gpa_min}/4.0\n`;
        const percentage = Math.round(college.requirements.gpa_min * 25);
        formattedText += `• **Equivalent Percentage:** ~${percentage}%\n`;
      }
      if (college.requirements.sat_range) {
        formattedText += `• **SAT Range:** ${college.requirements.sat_range}\n`;
      }
      if (college.requirements.act_range) {
        formattedText += `• **ACT Range:** ${college.requirements.act_range}\n`;
      }
      if (college.requirements.toefl_min) {
        formattedText += `• **TOEFL Minimum:** ${college.requirements.toefl_min}\n`;
      }
      if (college.requirements.ielts_min) {
        formattedText += `• **IELTS Minimum:** ${college.requirements.ielts_min}\n`;
      }
    } else {
      formattedText += `• Minimum GPA: 3.0/4.0 (75%)\n`;
      formattedText += `• Competitive Range: 3.5+ GPA (85%+)\n`;
      formattedText += `• Test Scores: Varies by program\n`;
    }

    // Add additional info if available
    formattedText += `\n---\n`;
    formattedText += `*Information retrieved from college database.*\n`;
    formattedText += `*Always verify with official university website.*`;

    return formattedText;
  }

  formatKey(key) {
    const formatMap = {
      'undergraduate_regular': 'Undergraduate Regular Decision',
      'undergraduate_early': 'Undergraduate Early Action',
      'graduate_vary': 'Graduate Programs',
      'fall': 'Fall Intake',
      'spring': 'Spring Intake',
      'priority': 'Priority Deadline',
      'tuition': 'Tuition Fees',
      'room_board': 'Room & Board',
      'total_approx': 'Total Annual Cost'
    };
    
    return formatMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getAllCollegeNames() {
    if (!this.collegeData.universities) return [];
    return this.collegeData.universities.map(uni => uni.name);
  }
}

module.exports = new CollegeDataService();