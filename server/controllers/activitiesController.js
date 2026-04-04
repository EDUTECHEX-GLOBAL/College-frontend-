import Activities from "../models/activitiesModel.js";
import Account from "../models/accountModel.js";
import fs from "fs";
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
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// =====================================================
// ASYNC TEXTRACT POLLING
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
  console.log(
    `⏱️  Polling Textract job ${jobId} (max ${maxPolls} polls × ${intervalMs}ms = ${
      (maxPolls * intervalMs) / 1000
    }s)`
  );

  for (let i = 1; i <= maxPolls; i++) {
    await sleep(intervalMs);

    const res = await textractClient.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId })
    );
    const status = res.JobStatus;
    console.log(`  ⏳ Poll ${i}/${maxPolls}: status = ${status}`);

    if (status === "SUCCEEDED") {
      let blocks = res.Blocks || [];
      let nextToken = res.NextToken;
      let page = 1;

      while (nextToken) {
        page++;
        console.log(`  📄 Fetching Textract page ${page}…`);
        const next = await textractClient.send(
          new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken })
        );
        blocks = blocks.concat(next.Blocks || []);
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
  }

  throw new Error(
    `Textract job timed out after ${maxPolls} polls (${(maxPolls * intervalMs) / 1000}s). ` +
    `The PDF may be too large or complex. Try uploading a smaller / text-based PDF.`
  );
};

// =====================================================
// NORMALIZERS FOR ACTIVITIES
// =====================================================

const normaliseActivityType = (position = "", organization = "") => {
  const combined = `${position} ${organization}`.toLowerCase();

  // Athletics
  if (/captain|co-captain|team|varsity|jv|intramural/i.test(combined)) {
    return /varsity|jv|state|regional/i.test(combined)
      ? "Athletics: JV/Varsity"
      : "Athletics: Club";
  }

  // Arts
  if (/art|paint|draw|sculpt/i.test(combined)) return "Art";

  // Music
  if (/instrument|band|orchestra|symphony/i.test(combined))
    return "Music: Instrumental";
  if (/vocal|choir|song|singing|acapella/i.test(combined)) return "Music: Vocal";

  // Debate/Speech
  if (/debate|speech|forensic|moot|parliament/i.test(combined))
    return "Debate/Speech";

  // Dance
  if (/dance|ballet|hip.?hop|contemporary/i.test(combined)) return "Dance";

  // Theater/Drama
  if (/theater|drama|play|act|stage|musical/i.test(combined))
    return "Theater/Drama";

  // Community Service
  if (/volunteer|serve|charity|community|ngo|helper/i.test(combined))
    return "Community Service";

  // Student Government
  if (/student.*government|president|vice.*president|council/i.test(combined))
    return "Student Government";

  // Robotics
  if (/robot|stem|science|tech|club/i.test(combined)) return "Robotics";

  // Research
  if (/research|project|experiment|study|paper/i.test(combined))
    return "Research";

  // Work (Paid)
  if (/intern|job|work|employment|employee|paid/i.test(combined))
    return "Work (Paid)";

  // Internship
  if (/internship|intern/i.test(combined)) return "Internship";

  // Environmental
  if (/environment|green|sustainability|eco/i.test(combined))
    return "Environmental";

  // Cultural
  if (/cultural|culture|heritage|ethnic/i.test(combined)) return "Cultural";

  // Social Justice
  if (/justice|rights|equality|advocacy|social/i.test(combined))
    return "Social Justice";

  // Computer/Technology
  if (/computer|tech|coding|programming|software/i.test(combined))
    return "Computer/Technology";

  // Science/Math
  if (/science|math|stem/i.test(combined)) return "Science/Math";

  // Religious
  if (/religious|faith|church|temple|mosque|synagogue/i.test(combined))
    return "Religious";

  // Journalism/Publication
  if (/journalism|publication|newspaper|magazine|newsletter|write/i.test(combined))
    return "Journalism/Publication";

  // Foreign Language
  if (/language|spanish|french|german|mandarin|hindi/i.test(combined))
    return "Foreign Language";

  // Junior ROTC
  if (/rotc|military|cadet/i.test(combined)) return "Junior ROTC";

  // Career Oriented
  if (/career|professional|business|management/i.test(combined))
    return "Career Oriented";

  // School Spirit
  if (/spirit|mascot|pep|rally|cheer/i.test(combined)) return "School Spirit";

  // Foreign Exchange
  if (/exchange|abroad|international|study.*abroad/i.test(combined))
    return "Foreign Exchange";

  // Family Responsibilities
  if (/family|sibling|caregiver|dependent/i.test(combined))
    return "Family Responsibilities";

  return "Other";
};

const normaliseGradeLevels = (description = "") => {
  const levels = [];

  if (/\b9\b|fresh/i.test(description)) levels.push(9);
  if (/\b10\b|soph/i.test(description)) levels.push(10);
  if (/\b11\b|junior/i.test(description)) levels.push(11);
  if (/\b12\b|senior/i.test(description)) levels.push(12);
  if (/post.?grad|college|undergrad/i.test(description))
    levels.push("Post-graduate");

  // If nothing found, assume current grades (11-12)
  return levels.length > 0 ? levels : [11, 12];
};

const normaliseTiming = (description = "") => {
  const d = description.toLowerCase();

  if (/summer|vacation|break|holiday/i.test(d)) return "During school break";
  if (/all year|throughout|continuous|ongoing/i.test(d)) return "All year";
  return "During school year"; // default
};

const normaliseHoursPerWeek = (description = "") => {
  const match = description.match(
    /(\d+)\s*(?:hrs?\/week|hours per week|hours weekly)/i
  );
  return match ? match[1] : "";
};

const normaliseWeeksPerYear = (description = "") => {
  const match = description.match(
    /(\d+)\s*(?:weeks?\/year|weeks per year|weeks annually)/i
  );
  return match ? match[1] : "";
};

const normaliseContinueInCollege = (description = "") => {
  const d = description.toLowerCase();
  if (/continue|intend|plan|will|future|college|pursuing/i.test(d))
    return true;
  if (/stop|quit|end|not.*continue|no longer|did not/i.test(d)) return false;
  return null; // unclear
};

// =====================================================
// TEXT EXTRACTION HELPERS
// =====================================================

const lineIdx = (lines, keywords) => {
  for (let i = 0; i < lines.length; i++) {
    if (keywords.some((k) => new RegExp(k, "i").test(lines[i]))) return i;
  }
  return -1;
};

const sectionLines = (lines, startKw, endKw, maxLen = 50) => {
  const start = lineIdx(lines, startKw);
  if (start === -1) return [];
  let end = lines.length;
  for (const kw of endKw) {
    const idx = lineIdx(lines, [kw]);
    if (idx > start && idx < end) end = idx;
  }
  return lines.slice(start, Math.min(start + maxLen, end));
};

// =====================================================
// MAIN PARSER FUNCTION
// =====================================================

const extractActivitiesFromText = (lines) => {
  const activities = [];
  const text = lines.join("\n");

  // Find activities section
  const actSection = sectionLines(
    lines,
    ["activities", "extracurricular", "clubs", "sports", "leadership"],
    [
      "skills",
      "projects",
      "awards",
      "education",
      "experience",
      "volunteer",
      "references",
    ]
  );

  if (actSection.length === 0) {
    console.log("⚠️  No activities section found in CV");
    return activities;
  }

  console.log(`📝 Found activities section with ${actSection.length} lines`);

  // Pattern 1: "Position, Organization" format
  const pattern1 = /^([A-Z][A-Za-z\s&()]+),\s*([A-Za-z\s&().-]+)$/;

  // Pattern 2: "Position - Organization" format
  const pattern2 = /^([A-Z][A-Za-z\s&()]+)\s*[-–—]\s*([A-Za-z\s&().-]+)$/;

  // Pattern 3: Bullet format "• Position, Organization"
  const pattern3 = /^[-•*]\s*([A-Z][A-Za-z\s&()]+),\s*([A-Za-z\s&().-]+)$/;

  let currentActivity = null;
  let activityIndex = 0;

  for (let i = 0; i < actSection.length; i++) {
    const line = actSection[i].trim();

    // Skip empty lines and section headers
    if (!line || /^activities|extracurricular|clubs|sports|leadership/i.test(line)) {
      continue;
    }

    // Try to match activity header (position, organization)
    let posMatch = line.match(pattern1) || line.match(pattern2) || line.match(pattern3);

    if (posMatch && posMatch[1] && posMatch[2]) {
      // Save previous activity if exists
      if (currentActivity) {
        activities.push(currentActivity);
        activityIndex++;
      }

      // Start new activity
      const position = posMatch[1].trim();
      const organization = posMatch[2].trim();

      currentActivity = {
        id: activityIndex + 1,
        type: normaliseActivityType(position, organization),
        position: position.substring(0, 50), // Max 50 chars
        organization: organization.substring(0, 100), // Max 100 chars
        description: "",
        gradeLevels: [],
        timing: "During school year",
        hoursPerWeek: "",
        weeksPerYear: "",
        continueInCollege: null,
      };
    } else if (currentActivity) {
      // Append to description of current activity
      if (line.length > 5) {
        currentActivity.description += (currentActivity.description ? " " : "") + line;
      }
    }
  }

  // Save last activity
  if (currentActivity) {
    activities.push(currentActivity);
  }

  // Post-process: extract embedded data from descriptions
  for (const activity of activities) {
    // Truncate description to 150 chars max
    if (activity.description) {
      activity.description = activity.description.substring(0, 150);

      // Extract grade levels
      const grades = normaliseGradeLevels(activity.description);
      if (grades.length > 0) {
        activity.gradeLevels = grades;
      }

      // Extract timing
      const timing = normaliseTiming(activity.description);
      if (timing) {
        activity.timing = timing;
      }

      // Extract hours per week
      const hours = normaliseHoursPerWeek(activity.description);
      if (hours) {
        activity.hoursPerWeek = hours;
      }

      // Extract weeks per year
      const weeks = normaliseWeeksPerYear(activity.description);
      if (weeks) {
        activity.weeksPerYear = weeks;
      }

      // Extract continue in college intent
      const continueIntent = normaliseContinueInCollege(activity.description);
      if (continueIntent !== null) {
        activity.continueInCollege = continueIntent;
      }
    }

    // Set default grade levels if empty
    if (activity.gradeLevels.length === 0) {
      activity.gradeLevels = [11, 12];
    }

    // Set default values for missing fields
    if (!activity.hoursPerWeek) {
      activity.hoursPerWeek = "5";
    }
    if (!activity.weeksPerYear) {
      activity.weeksPerYear = "26";
    }
    if (activity.continueInCollege === null) {
      activity.continueInCollege = true;
    }
  }

  console.log(`✅ Extracted ${activities.length} activities`);
  return activities;
};

// =====================================================
// CV UPLOAD + TEXTRACT
// =====================================================

export const parseCVForActivities = async (req, res) => {
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

    console.log(
      `📝 CV extracted ${lines.length} lines. First 10 lines:`,
      lines.slice(0, 10)
    );

    if (lines.length < 5) {
      return res.status(422).json({
        success: false,
        message:
          "Textract could not extract enough text from this document. " +
          "Please ensure the PDF is text-based (not a scanned image) and try again.",
      });
    }

    const extractedActivities = extractActivitiesFromText(lines);

    // Map to response format
    const mappedActivities = extractedActivities.map((a, idx) => ({
      id: idx + 1,
      type: a.type,
      position: a.position,
      organization: a.organization,
      description: a.description,
      gradeLevels: a.gradeLevels,
      timing: a.timing,
      hoursPerWeek: a.hoursPerWeek,
      weeksPerYear: a.weeksPerYear,
      continueInCollege: a.continueInCollege,
    }));

    return res.status(200).json({
      success: true,
      extractedData: {
        activities: mappedActivities,
      },
    });
  } catch (error) {
    console.error("❌ CV Extraction Error:", error);

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
// GET ACTIVITIES DATA
// =====================================================

export const getActivities = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let activitiesData = await Activities.findOne({ studentId: userId });

    // If no activities data exists, create default one
    if (!activitiesData) {
      activitiesData = await Activities.create({
        studentId: userId,
        hasActivities: null,
        activities: [],
      });
    }

    res.status(200).json({
      success: true,
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching activities data:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching activities data",
    });
  }
};

// =====================================================
// SAVE HAS ACTIVITIES PREFERENCE
// =====================================================

export const saveHasActivities = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { hasActivities } = req.body;

    // Update or create activities data
    const activitiesData = await Activities.findOneAndUpdate(
      { studentId: userId },
      {
        hasActivities: hasActivities,
        // If user selects "No", clear any existing activities
        ...(hasActivities === false && { activities: [] }),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Update application progress in Account
    let progressValue = 0;
    if (hasActivities === false) {
      progressValue = 100;
    } else if (hasActivities === true) {
      progressValue = 10;
    }

    await Account.findByIdAndUpdate(userId, {
      "applicationProgress.activities": progressValue,
    });

    res.status(200).json({
      success: true,
      message: "Activities preference saved successfully",
      applicationProgress: {
        activities: progressValue,
      },
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities,
      },
    });
  } catch (error) {
    console.error("❌ Error saving activities preference:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving activities preference",
    });
  }
};

// =====================================================
// SAVE ACTIVITIES DETAILS
// =====================================================

export const saveActivitiesDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { activities } = req.body;

    const activitiesData = await Activities.findOneAndUpdate(
      { studentId: userId },
      {
        activities: activities,
        hasActivities: true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Update application progress to 100%
    await Account.findByIdAndUpdate(userId, {
      "applicationProgress.activities": 100,
    });

    res.status(200).json({
      success: true,
      message: "Activities details saved successfully",
      applicationProgress: {
        activities: 100,
      },
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities,
      },
    });
  } catch (error) {
    console.error("❌ Error saving activities details:", error);
    res.status(500).json({
      success: false,
      message: "Server error saving activities details",
    });
  }
};

// =====================================================
// CLEAR HAS ACTIVITIES ANSWER
// =====================================================

export const clearHasActivities = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const activitiesData = await Activities.findOneAndUpdate(
      { studentId: userId },
      {
        hasActivities: null,
        activities: [],
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // Reset application progress
    await Account.findByIdAndUpdate(userId, {
      "applicationProgress.activities": 0,
    });

    res.status(200).json({
      success: true,
      message: "Activities answer cleared successfully",
      applicationProgress: {
        activities: 0,
      },
      activitiesData: {
        hasActivities: activitiesData.hasActivities,
        activities: activitiesData.activities,
      },
    });
  } catch (error) {
    console.error("❌ Error clearing activities answer:", error);
    res.status(500).json({
      success: false,
      message: "Server error clearing activities answer",
    });
  }
};