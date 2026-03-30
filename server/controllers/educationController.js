// server/controllers/educationController.js

import Education from "../models/educationModel.js";
import Account from "../models/accountModel.js";
import path from "path";
import fs from "fs";
import { getFileUrl, UPLOAD_DIR } from "../middleware/uploadMiddleware.js";

import {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";

// =====================================================
// AWS CONFIG
// =====================================================
const textractClient = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// =====================================================
// ASYNC TEXTRACT POLLING
// Fixed: increased to 60 polls × 5s = 5 minutes max
// Most CVs finish within 30–60 seconds on AWS Textract
// =====================================================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const startAsyncTextract = async (bucket, key) => {
  const cmd = new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
  });
  const res = await textractClient.send(cmd);
  return res.JobId;
};

const pollTextractJob = async (jobId, maxPolls = 60, intervalMs = 5000) => {
  console.log(`⏱️  Polling Textract job ${jobId} (max ${maxPolls} polls × ${intervalMs}ms = ${(maxPolls * intervalMs) / 1000}s)`);

  for (let i = 1; i <= maxPolls; i++) {
    await sleep(intervalMs);

    const res = await textractClient.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId })
    );
    const status = res.JobStatus;
    console.log(`  ⏳ Poll ${i}/${maxPolls}: status = ${status}`);

    if (status === "SUCCEEDED") {
      // Collect all pages (Textract paginates large docs)
      let blocks    = res.Blocks || [];
      let nextToken = res.NextToken;
      let page      = 1;

      while (nextToken) {
        page++;
        console.log(`  📄 Fetching Textract page ${page}…`);
        const next = await textractClient.send(
          new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken })
        );
        blocks    = blocks.concat(next.Blocks || []);
        nextToken = next.NextToken;
      }

      console.log(`✅ Textract SUCCEEDED. Total blocks: ${blocks.length}`);
      return blocks;
    }

    if (status === "FAILED") {
      const reason = res.StatusMessage || "Unknown reason";
      console.error(`❌ Textract job FAILED: ${reason}`);
      throw new Error(`Textract job failed: ${reason}`);
    }

    // Still IN_PROGRESS — keep polling
  }

  throw new Error(
    `Textract job timed out after ${maxPolls} polls (${(maxPolls * intervalMs) / 1000}s). ` +
    `The PDF may be too large or complex. Try uploading a smaller / text-based PDF.`
  );
};

// =====================================================
// VALUE NORMALISERS — match frontend select/radio values
// =====================================================

const normaliseCourseLevel = (raw = "") => {
  const r = raw.toLowerCase();
  if (r.includes("a-level") || r.includes("a level") || r.includes("as-level")) return "ap";
  if (r.includes("ib"))            return "ib";
  if (r.includes("honor"))         return "honors";
  if (r.includes("ap"))            return "ap";
  if (r.includes("college-level") || r.includes("college level")) return "college-level";
  return "regular";
};

const normaliseGpaScale = (raw = "") => {
  const s = String(raw).trim();
  if (s === "4" || s === "4.0") return "4.0";
  if (s === "5" || s === "5.0") return "5.0";
  if (s === "100")              return "100";
  return "other";
};

const normaliseCountry = (raw = "") => {
  const r = raw.toLowerCase().trim();
  if (r.includes("india"))                                       return "IN";
  if (r.includes("united states") || r.includes("usa"))         return "US";
  if (r.includes("united kingdom") || r.includes("uk"))         return "UK";
  if (r.includes("canada"))                                     return "CA";
  if (r.includes("australia"))                                   return "AU";
  return raw;
};

const normaliseHighestDegree = (raw = "") => {
  const r = raw.toLowerCase();
  if (r.includes("phd") || r.includes("doctor"))  return "doctorate";
  if (r.includes("master"))                        return "master";
  if (r.includes("bachelor"))                      return "bachelor";
  if (r.includes("associate"))                     return "associate";
  return "bachelor";
};

const normaliseCareerInterest = (raw = "") => {
  const r = raw.toLowerCase();
  if (r.includes("engineer") || r.includes("mechanic"))                      return "engineering";
  if (r.includes("tech") || r.includes("software") || r.includes("comput")) return "technology";
  if (r.includes("business") || r.includes("commerce") || r.includes("finance") || r.includes("econom")) return "business";
  if (r.includes("health") || r.includes("medic") || r.includes("doctor") || r.includes("pharma"))       return "healthcare";
  if (r.includes("science") && (r.includes("social") || r.includes("psych") || r.includes("socio")))     return "social-sciences";
  if (r.includes("science") || r.includes("physics") || r.includes("chem") || r.includes("bio"))         return "sciences";
  if (r.includes("art") || r.includes("design") || r.includes("music") || r.includes("literature"))      return "arts";
  if (r.includes("education") || r.includes("teach"))                        return "education";
  return "";
};

const normaliseClassRankReporting = (raw = "") => {
  const r = raw.toLowerCase();
  if (r === "exact")    return "exact";
  if (r === "decile")   return "decile";
  if (r === "quintile") return "quintile";
  if (r === "quartile") return "quartile";
  return raw ? "exact" : "";
};

// =====================================================
// CV PARSER
// =====================================================
const extractEducationFromText = (lines) => {
  const text = lines.join("\n");

  const matchFirst = (patterns) => {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) return (m[1] || m[0]).trim();
    }
    return "";
  };

  const lineIdx = (keywords) => {
    for (let i = 0; i < lines.length; i++) {
      if (keywords.some((k) => new RegExp(k, "i").test(lines[i]))) return i;
    }
    return -1;
  };

  const sectionLines = (startKw, endKw, maxLen = 40) => {
    const start = lineIdx(startKw);
    if (start === -1) return [];
    let end = lines.length;
    for (const kw of endKw) {
      const idx = lineIdx([kw]);
      if (idx > start && idx < end) end = idx;
    }
    return lines.slice(start, Math.min(start + maxLen, end));
  };

  // ── 1. currentSchool ────────────────────────────────────────────────────────
  const eduLines = sectionLines(
    ["^education$", "education"],
    ["experience", "activities", "skills", "awards", "honors", "projects", "achievements"]
  );

  let schoolName = "";
  const schoolNamePat = /^([A-Z][A-Za-z\s'&().-]{6,80}(?:school|college|academy|vidyalaya|convent|institute)[A-Za-z\s'&().-]*)$/i;
  for (const line of eduLines) {
    if (schoolNamePat.test(line.trim())) { schoolName = line.trim(); break; }
  }
  if (!schoolName) {
    const m = text.match(/([A-Z][A-Za-z\s'&().-]{4,60}(?:School|Academy|Vidyalaya|Convent)(?:\s*\([A-Z]+\))?)/);
    if (m) schoolName = m[1].trim();
  }

  let schoolCity = "", schoolState = "", schoolCountry = "";
  const schoolIdx = lines.findIndex((l) => schoolName && l.includes(schoolName.split(" ")[0]));
  if (schoolIdx !== -1) {
    for (let i = schoolIdx + 1; i <= schoolIdx + 3 && i < lines.length; i++) {
      const m3 = lines[i].match(/^([A-Za-z\s]+),\s*([A-Za-z\s]+),\s*([A-Za-z\s]+)$/);
      if (m3) { schoolCity = m3[1].trim(); schoolState = m3[2].trim(); schoolCountry = m3[3].trim(); break; }
      const m2 = lines[i].match(/^([A-Za-z\s]+),\s*([A-Za-z\s]+)$/);
      if (m2) { schoolCity = m2[1].trim(); schoolCountry = m2[2].trim(); break; }
    }
  }
  if (!schoolCountry) {
    if (/india/i.test(text))                  schoolCountry = "India";
    else if (/usa|united states/i.test(text)) schoolCountry = "USA";
    else if (/uk|united kingdom/i.test(text)) schoolCountry = "UK";
  }

  let dateOfEntry = "";
  const dateRangeMatch = text.match(/(\d{4})\s*[-–—]\s*(?:present|current|ongoing|\d{4})/i);
  if (dateRangeMatch) {
    dateOfEntry = `${dateRangeMatch[1]}-09`;
  } else {
    const sy = matchFirst([/(?:since|from|joined|enrolled|entry|admitted)\s*[:\-]?\s*(\d{4})/i]);
    if (sy) dateOfEntry = `${sy}-09`;
  }

  let graduationDate = "";
  const gradMatch = text.match(
    /(?:graduating|graduation|class of|batch of|expected|completing|passing out)[^\d]*(\w+\s+\d{4}|\d{4})/i
  );
  if (gradMatch) {
    const raw = gradMatch[1].trim();
    if (/^\d{4}$/.test(raw)) {
      graduationDate = `${raw}-05`;
    } else {
      const months = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
                       jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
      const mMatch = raw.match(/^(\w{3})\w*\s+(\d{4})$/i);
      if (mMatch) {
        graduationDate = `${mMatch[2]}-${months[mMatch[1].toLowerCase()] || "05"}`;
      } else {
        graduationDate = `${raw.slice(-4)}-05`;
      }
    }
  }

  const isBoardingSchool = /boarding\s*school/i.test(text) ? "yes" : "no";

  // ── 2. otherSchools ─────────────────────────────────────────────────────────
  const otherSchools = [];
  const allSchoolRe = /([A-Z][A-Za-z\s'&().-]{4,60}(?:school|academy|vidyalaya|convent)(?:\s*\([A-Z]+\))?)/gi;
  const foundSchools = [];
  let sm;
  while ((sm = allSchoolRe.exec(text)) !== null) {
    const name = sm[1].trim();
    if (!foundSchools.includes(name)) foundSchools.push(name);
  }
  foundSchools.slice(1).forEach((name) => {
    otherSchools.push({
      schoolName:       name,
      schoolCEEBCode:   "",
      dateOfEntry:      "",
      dateOfExit:       "",
      isBoardingSchool: "",
      graduated:        "",
      graduationDate:   "",
      schoolAddress:    { street: "", city: "", state: "", zipCode: "", country: "" },
    });
  });

  // ── 3. colleges ─────────────────────────────────────────────────────────────
  // Only match lines that are clearly a college/university name:
  //   • Must start with a capital letter
  //   • Must be reasonably short (not a sentence)
  //   • Must NOT contain common sentence words that indicate it's activity text
  //   • Must appear in a COLLEGES / UNIVERSITIES section OR look like a standalone name
  const collegeMatches = [];

  // Strict: match only lines that look like institution names (short, title-case, no verbs)
  const COLLEGE_SECTION_KW = /college|universit|higher\s+education|post.?secondary|undergraduate/i;
  const SKIP_WORDS = /\b(the|and|at|for|with|from|to|in|of|on|by|a|an|is|was|were|has|have|had|been|be|will|would|could|should|may|might|that|this|which|who|whom|whose|when|where|how|why|represented|organised|led|mentored|helped|contributed|supported|taught|designed|gained|worked|introduced|oversaw|partnered|coordinated|achieved|completed|participated|demonstrated)\b/i;

  // Only search within a college/university section if one exists
  const collegeSectionStart = lineIdx(["college", "universit", "higher education", "post-secondary"]);

  if (collegeSectionStart !== -1) {
    // There is an explicit college section — parse only those lines
    const colLines = sectionLines(
      ["college", "universit", "higher education"],
      ["grades", "courses", "honors", "activities", "skills", "awards", "sports", "leadership", "work experience"]
    );

    const collegeNameRe = /^([A-Z][A-Za-z\s'&().-]{4,60}(?:university|college|institute|iit|nit|bits|iim)[A-Za-z\s'&().-]{0,30})$/i;
    for (const line of colLines) {
      const l = line.trim();
      // Must look like a name: short, no sentence-like words, matches pattern
      if (collegeNameRe.test(l) && !SKIP_WORDS.test(l) && l.split(" ").length <= 10) {
        if (!collegeMatches.find((c) => c.collegeName === l)) {
          const degreeM = text.match(/(?:b\.?tech|b\.?e\.?|m\.?tech|m\.?sc|b\.?sc|mba|phd|bachelor|master)\b/i);
          const fieldM  = text.match(/(?:computer science|cse|ece|mechanical|electrical|civil|information technology)/i);
          collegeMatches.push({
            collegeName:   l,
            collegeType:   "",
            datesAttended: { from: "", to: "" },
            creditsEarned: "",
            degreeEarned:  degreeM ? degreeM[0] : "",
            major:         fieldM  ? fieldM[0]  : "",
          });
        }
      }
    }
  }
  // If no college section found → collegeMatches stays empty (correct for high school students)

  // ── 4. grades ───────────────────────────────────────────────────────────────
  const cumulativeGPA = matchFirst([
    /(?:cgpa|gpa)\s*[:\-]?\s*([\d.]+\s*\/?\s*\d*)/i,
    /(?:percentage|aggregate|marks)\s*[:\-]?\s*([\d.]+\s*%?)/i,
  ]);
  const rawGpaScale = matchFirst([/(?:out of|\/)\s*(10|4|100)/i]) ||
    (cumulativeGPA.includes("%") ? "100" : "10");
  const classRank = matchFirst([/(?:rank|position|stood)\s*[:\-]?\s*(\d+)/i]);

  // ── 5. currentCourses ───────────────────────────────────────────────────────
  const courses = [];
  const subjectKeywords = [
    "english", "mathematics", "economics", "psychology", "physics",
    "chemistry", "biology", "history", "geography", "computer science",
    "general paper", "further mathematics", "business", "accounting",
    "sociology", "art", "music",
  ];
  const rawCourseLevel =
    /a.?level|as.?level/i.test(text) ? "A-Level" :
    /ib|international baccalaureate/i.test(text) ? "IB" :
    /cbse/i.test(text) ? "CBSE" : "";

  const fullLower = text.toLowerCase();
  for (const kw of subjectKeywords) {
    if (fullLower.includes(kw)) {
      const subjectRe = new RegExp(`${kw}[^\\n]{0,30}([A-Ea-e*])`, "i");
      const gm = text.match(subjectRe);
      courses.push({
        courseName:  kw.charAt(0).toUpperCase() + kw.slice(1),
        courseLevel: normaliseCourseLevel(rawCourseLevel),
        credits:     "",
        grade:       gm ? gm[1].toUpperCase() : "",
        term:        "",
      });
    }
  }

  // Fallback — always ensure at least one blank course row
  if (courses.length === 0) {
    courses.push({ courseName: "", courseLevel: "", credits: "", grade: "", term: "" });
  }

  // ── 6. honors ───────────────────────────────────────────────────────────────
  const honorsList = [];
  const honorSection = sectionLines(
    ["honors", "honours", "awards", "achievements", "distinctions", "recognition"],
    ["experience", "activities", "skills", "projects", "education"]
  );
  const honorRe = /(?:award|honor|honour|distinction|merit|scholarship|prize|rank|topper|winner|recipient|selected|finalist)\b(.{5,80})/gi;
  let hm;
  while ((hm = honorRe.exec(honorSection.join("\n"))) !== null) {
    const honorName = hm[0].trim();
    if (!honorsList.find((h) => h.honorName === honorName)) {
      const yearM = honorName.match(/\d{4}/);
      honorsList.push({
        honorName,
        honorLevel:   /national|international/i.test(honorName) ? "National" : "School",
        yearReceived: yearM ? yearM[0] : "",
        description:  "",
      });
    }
  }

  // ── 7. communityOrganizations ───────────────────────────────────────────────
  const organizations = [];
  const actSection = sectionLines(
    ["activities", "extracurricular", "community", "volunteer", "clubs", "leadership"],
    ["skills", "projects", "references", "honors", "awards"]
  );
  for (const line of actSection) {
    const l = line.trim();
    if (
      l.length > 8 && l.length < 100 &&
      /[A-Z]/.test(l[0]) &&
      !/^(activities|extracurricular|community|volunteer|clubs)/i.test(l)
    ) {
      if (!organizations.find((o) => o.organizationName === l)) {
        organizations.push({ organizationName: l, assistanceType: "", duration: "", contactPerson: "" });
      }
      if (organizations.length >= 8) break;
    }
  }

  // ── 8. futurePlans ──────────────────────────────────────────────────────────
  const rawHighestDegree = (() => {
    if (/phd|doctorate/i.test(text))                return "PhD";
    if (/master|m\.tech|mba|m\.sc/i.test(text))    return "Master's";
    if (/bachelor|b\.tech|b\.e|b\.sc/i.test(text)) return "Bachelor's";
    return "Bachelor's";
  })();

  const rawCareerInterest = matchFirst([
    /(?:career|objective|goal|aspire|interest|pursuing|intend to)\s*[:\-]?\s*([^\n]{10,120})/i,
  ]);

  // ── assemble ──────────────────────────────────────────────────────────────
  return {
    currentSchool: {
      schoolName,
      schoolCEEBCode:  "",
      dateOfEntry,
      isBoardingSchool,
      liveOnCampus:    "",
      willGraduate:    graduationDate ? "yes" : "",
      graduationDate,
      schoolAddress: {
        street:  "",
        city:    schoolCity,
        state:   schoolState,
        zipCode: "",
        country: normaliseCountry(schoolCountry),
      },
    },

    otherSchools: {
      numberOfSchools: otherSchools.length,
      schools:         otherSchools,
    },

    colleges: {
      numberOfColleges: collegeMatches.length,
      collegesList:     collegeMatches,
    },

    grades: {
      graduatingClassSize: "",
      classRankReporting:  normaliseClassRankReporting(classRank ? "exact" : ""),
      classRank,
      gpaScale:            normaliseGpaScale(rawGpaScale),
      cumulativeGPA,
      gpaWeighting:        "",
      gpaMaxScale:         rawGpaScale,
    },

    currentCourses: {
      numberOfCourses:  courses.length,
      schedulingSystem: "",
      courses,
    },

    honors: {
      reportHonors: honorsList.length > 0 ? "yes" : "no",
      honorsList,
    },

    communityOrganizations: {
      numberOfOrganizations: organizations.length,
      organizations,
    },

    futurePlans: {
      studentType:         "first-year-2025-2026",
      highestDegree:       normaliseHighestDegree(rawHighestDegree),
      careerInterest:      normaliseCareerInterest(rawCareerInterest),
      additionalInterests: [],
    },
  };
};

// =====================================================
// CV UPLOAD + TEXTRACT
// =====================================================
export const uploadCVAndExtract = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!req.file)
      return res.status(400).json({ success: false, message: "No CV uploaded" });

    console.log(`🔍 Checking file: ${req.file.originalname} MIME: ${req.file.mimetype}`);
    console.log(`📁 S3 Key: ${req.file.key || "local"}`);

    const isPDF =
      req.file.mimetype === "application/pdf" ||
      req.file.originalname?.toLowerCase().endsWith(".pdf");

    let lines = [];

    if (req.file.bucket && req.file.key) {
      // ── S3 path ───────────────────────────────────────────────────────────
      if (isPDF) {
        console.log("📑 PDF detected — using async Textract (multi-page safe)");
        const jobId = await startAsyncTextract(req.file.bucket, req.file.key);
        console.log(`🚀 Async Textract job started. JobId: ${jobId}`);

        // ✅ FIX: 60 polls × 5s = 5 minutes (was 30 × 2s = 1 minute — too short)
        const blocks = await pollTextractJob(jobId, 60, 5000);

        lines = blocks
          .filter((b) => b.BlockType === "LINE")
          .map((b) => b.Text || "")
          .filter(Boolean);

        console.log(`✅ Async Textract complete. Total lines: ${lines.length}`);
      } else {
        console.log("📄 Non-PDF — using sync Textract");
        const cmd = new DetectDocumentTextCommand({
          Document: { S3Object: { Bucket: req.file.bucket, Name: req.file.key } },
        });
        const response = await textractClient.send(cmd);
        lines = response.Blocks
          ?.filter((b) => b.BlockType === "LINE")
          .map((b) => b.Text || "")
          .filter(Boolean) || [];
      }
    } else if (req.file.path) {
      // ── Local file path ───────────────────────────────────────────────────
      console.log("💾 Using local file for Textract:", req.file.path);
      const fileBuffer = fs.readFileSync(req.file.path);
      const cmd = new DetectDocumentTextCommand({
        Document: { Bytes: fileBuffer },
      });
      const response = await textractClient.send(cmd);
      lines = response.Blocks
        ?.filter((b) => b.BlockType === "LINE")
        .map((b) => b.Text || "")
        .filter(Boolean) || [];
    } else {
      return res.status(500).json({
        success: false,
        message: "Cannot locate uploaded file. Check multer storage configuration.",
      });
    }

    console.log(`📝 CV extracted ${lines.length} lines. First 10 lines:`, lines.slice(0, 10));

    if (lines.length < 5) {
      return res.status(422).json({
        success: false,
        message:
          "Textract could not extract enough text from this document. " +
          "Please ensure the PDF is text-based (not a scanned image) and try again.",
      });
    }

    const parsedData = extractEducationFromText(lines);

    console.log("Parsed data summary:", {
      schoolName:         parsedData.currentSchool?.schoolName,
      coursesCount:       parsedData.currentCourses?.courses?.length,
      honorsCount:        parsedData.honors?.honorsList?.length,
      organizationsCount: parsedData.communityOrganizations?.organizations?.length,
    });

    return res.status(200).json({ success: true, parsedData });

  } catch (error) {
    console.error("❌ CV Extraction Error:", error);

    // Return a user-friendly message for the timeout case
    const isTimeout = error.message?.includes("timed out");
    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      message: isTimeout
        ? "The CV is taking too long to process. Please try a smaller or text-based PDF (not a scanned image)."
        : "Error processing CV",
      error: error.message,
    });
  }
};

// =====================================================
// VALIDATION
// =====================================================
const validateEducationSection = (section, data) => {
  switch (section) {
    case "currentSchool":
      return !!(data && (data.schoolName || data.dateOfEntry));
    case "otherSchools":
      return !!(data && Array.isArray(data.schools) && data.schools.length > 0);
    case "colleges":
      return !!(data && Array.isArray(data.collegesList) && data.collegesList.length > 0);
    case "grades":
      return !!(data && data.cumulativeGPA && data.gpaScale);
    case "currentCourses":
      return !!(data && Array.isArray(data.courses) && data.courses.length > 0);
    case "honors":
      return (data && data.reportHonors === "no") ||
             !!(data && Array.isArray(data.honorsList) && data.honorsList.length > 0);
    case "communityOrganizations":
      return true;
    case "futurePlans":
      return !!(data && data.highestDegree && data.careerInterest);
    case "documents":
      return !!(data && data.passport && data.tenthMarksheet);
    default:
      return false;
  }
};

// =====================================================
// GET EDUCATION
// =====================================================
export const getEducation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let education = await Education.findOne({ userId });
    if (!education) education = await Education.create({ userId });
    res.json({ success: true, education });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =====================================================
// UPDATE SECTION
// =====================================================
export const updateEducationSection = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { section, data } = req.body;

    let education = await Education.findOne({ userId });
    if (!education) education = await Education.create({ userId });

    education[section] = { ...education[section]?.toObject?.() ?? {}, ...data };

    const isComplete = validateEducationSection(section, education[section]);
    education.educationCompletion[section] = isComplete;

    const vals = Object.values(education.educationCompletion.toObject?.() ?? education.educationCompletion);
    education.overallProgress = Math.round(
      (vals.filter(Boolean).length / vals.length) * 100
    );

    await education.save();

    await Account.findByIdAndUpdate(userId, {
      "applicationProgress.education": education.overallProgress,
    });

    res.json({ success: true, education });
  } catch (error) {
    console.error("❌ updateEducationSection error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =====================================================
// GET SUMMARY
// =====================================================
export const getEducationSummary = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const education = await Education.findOne({ userId }).lean();
    res.json({
      success: true,
      summary: {
        completion: education.educationCompletion,
        progress:   education.overallProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =====================================================
// DOCUMENT UPLOAD
// =====================================================
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const field  = req.query.field;

    let education = await Education.findOne({ userId });
    if (!education) education = await Education.create({ userId });

    const fileMeta = {
      filename:     req.file.filename || req.file.key,
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      url:          req.file.location || getFileUrl(req.file.filename),
    };

    education.documents[field] = fileMeta;
    await education.save();

    res.json({ success: true, education, file: fileMeta });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =====================================================
// DOCUMENT DELETE
// =====================================================
export const removeDocument = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { field } = req.query;

    const education = await Education.findOne({ userId });

    const stored = education.documents[field];
    if (stored?.filename && !stored.url?.startsWith("https://")) {
      const filePath = path.join(UPLOAD_DIR, stored.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    education.documents[field] = undefined;
    await education.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};