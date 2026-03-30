// server/controllers/accountController.js
import Account from "../models/accountModel.js";
import Otp from "../models/otpModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import Notification from "../models/notificationModel.js";
import { createNewUserNotification } from "./notificationController.js";
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  AnalyzeDocumentCommand,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";
import jwt from "jsonwebtoken";
import fs from "fs";
import os from "os";
import path from "path";
import { fromBuffer } from "pdf2pic";

// =====================================================
// AWS CLIENTS
// =====================================================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const textract = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// =====================================================
// HELPERS
// =====================================================

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (userId, email, studentType) => {
  return jwt.sign(
    { userId, email, studentType },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    { expiresIn: "7d" }
  );
};

const validateProfileSection = (section, data) => {
  switch (section) {
    case 'personal':
      return !!(data.firstName && data.lastName && data.birthDate);
    case 'contact':
      return !!(data.phone && data.preferredPhoneType);
    case 'address':
      return !!(data.addressLine1 && data.city && data.state && data.zipCode && data.country);
    case 'demographics':
      return true;
    case 'language':
      return (
        Array.isArray(data.languages) &&
        data.languages.length > 0 &&
        data.languages.every(l => l.language && l.language.trim() !== '')
      );
    case 'geography':
      return !!data.citizenshipStatus;
    default:
      return false;
  }
};

const calculateProfileProgress = (profileCompletion) => {
  if (!profileCompletion) return 0;
  const VALID_KEYS = ['personalInfo', 'contactDetails', 'address', 'demographics', 'language', 'geography'];
  const completedCount = VALID_KEYS.filter(key => profileCompletion[key] === true).length;
  return Math.round((completedCount / VALID_KEYS.length) * 100);
};

// =====================================================
// PASSPORT MRZ PARSER HELPERS
// =====================================================

const isoToCountryName = (code) => {
  if (!code) return "";
  const map = {
    IND: "India", USA: "United States", GBR: "United Kingdom",
    CAN: "Canada", AUS: "Australia", DEU: "Germany", FRA: "France",
    CHN: "China", JPN: "Japan", KOR: "South Korea", PAK: "Pakistan",
    BGD: "Bangladesh", LKA: "Sri Lanka", NPL: "Nepal", MMR: "Myanmar",
    PHL: "Philippines", IDN: "Indonesia", MYS: "Malaysia", SGP: "Singapore",
    THA: "Thailand", VNM: "Vietnam", NGA: "Nigeria", GHA: "Ghana",
    KEN: "Kenya", ZAF: "South Africa", EGY: "Egypt", MAR: "Morocco",
    BRA: "Brazil", MEX: "Mexico", ARG: "Argentina", COL: "Colombia",
    SAU: "Saudi Arabia", ARE: "United Arab Emirates", IRN: "Iran",
    TUR: "Turkey", RUS: "Russia", UKR: "Ukraine", POL: "Poland",
    ITA: "Italy", ESP: "Spain", PRT: "Portugal", NLD: "Netherlands",
    BEL: "Belgium", CHE: "Switzerland", SWE: "Sweden", NOR: "Norway",
    DNK: "Denmark", FIN: "Finland", NZL: "New Zealand", ZWE: "Zimbabwe",
    ETH: "Ethiopia", UGA: "Uganda", TZA: "Tanzania", IRQ: "Iraq",
    SYR: "Syria", JOR: "Jordan", LBN: "Lebanon", ISR: "Israel",
    AFG: "Afghanistan", UZB: "Uzbekistan", KAZ: "Kazakhstan",
  };
  return map[code.toUpperCase()] || code;
};

const mrzDateToISO = (mrzDate, isExpiry = false) => {
  if (!mrzDate || mrzDate.length !== 6) return "";
  if (!/^\d{6}$/.test(mrzDate)) return "";
  const yy = parseInt(mrzDate.substring(0, 2), 10);
  const mm = mrzDate.substring(2, 4);
  const dd = mrzDate.substring(4, 6);
  let year;
  if (isExpiry) {
    year = yy < 70 ? 2000 + yy : 1900 + yy;
  } else {
    year = yy <= 30 ? 2000 + yy : 1900 + yy;
  }
  return `${year}-${mm}-${dd}`;
};

const restoreMrzLine = (raw) => {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9<\s]/g, "")
    .trim()
    .replace(/\s+/g, "<")
    .padEnd(44, "<")
    .substring(0, 44);
};

const findMrzLines = (lines) => {
  let mrzLine1 = null;
  let mrzLine2 = null;
  for (const line of lines) {
    const upper = line.toUpperCase().trim();
    const restored1 = restoreMrzLine(upper);
    if (!mrzLine1 && /^P<[A-Z]{3}/.test(restored1) && restored1.length >= 40) {
      mrzLine1 = restored1;
      continue;
    }
    const restored2 = restoreMrzLine(upper);
    if (!mrzLine2 && /^[A-Z0-9]{6,9}[A-Z]{3}\d{6}[MF<]/.test(restored2) && restored2.length >= 30) {
      mrzLine2 = restored2;
    }
  }
  return { mrzLine1, mrzLine2 };
};

const parseMrzLine1 = (line) => {
  if (!line || line.length < 30) return {};
  const clean = line.padEnd(44, "<");
  const issuingCountryCode = clean.substring(2, 5).replace(/</g, "");
  const nameField = clean.substring(5, 44);
  const nameParts = nameField.split("<<");
  const surname = (nameParts[0] || "").replace(/</g, " ").trim();
  const givenNamesRaw = nameParts.slice(1).join(" ").replace(/</g, " ").trim();
  const givenNames = givenNamesRaw.split(/\s+/).filter(Boolean).join(" ");
  return { surname, givenNames, issuingCountry: isoToCountryName(issuingCountryCode), issuingCountryCode };
};

const parseMrzLine2 = (line) => {
  if (!line || line.length < 27) return {};
  const clean = line.padEnd(44, "<");
  const passportNumber  = clean.substring(0, 9).replace(/</g, "");
  const nationalityCode = clean.substring(10, 13).replace(/</g, "");
  const dobRaw          = clean.substring(13, 19);
  const sex             = clean.substring(20, 21);
  const expiryRaw       = clean.substring(21, 27);
  return {
    passportNumber,
    nationality: isoToCountryName(nationalityCode),
    nationalityCode,
    dateOfBirth: mrzDateToISO(dobRaw, false),
    sex: sex === "M" ? "male" : sex === "F" ? "female" : "",
    expiryDate: mrzDateToISO(expiryRaw, true),
  };
};

const parsePassportFromOcrLines = (lines) => {
  const fullText = lines.join("\n");
  const result = {};

  const passportNoMatch = fullText.match(/passport\s+no\.?\s*[:\s]+([A-Z]\d{7})/i);
  if (passportNoMatch) result.passportNumber = passportNoMatch[1];

  const surnameIdx   = lines.findIndex(l => /^surname$/i.test(l.trim()));
  const givenNameIdx = lines.findIndex(l => /^given\s*name$/i.test(l.trim()));
  if (surnameIdx !== -1 && lines[surnameIdx + 1])   result.lastName   = lines[surnameIdx + 1].trim();
  if (givenNameIdx !== -1 && lines[givenNameIdx + 1]) {
    const givenParts  = lines[givenNameIdx + 1].trim().split(/\s+/);
    result.firstName  = givenParts[0] || "";
    result.middleName = givenParts.slice(1).join(" ") || "";
  }

  if (!result.lastName || !result.firstName) {
    const combinedNameLine = lines.find(l =>
      /^[A-Z]+\s{2,}[A-Z]+/.test(l.trim()) &&
      !/republic|passport|nationality|date|place|father|mother|address|signature/i.test(l)
    );
    if (combinedNameLine) {
      const parts = combinedNameLine.trim().split(/\s{2,}/);
      if (!result.lastName)  result.lastName  = parts[0] || "";
      if (!result.firstName) result.firstName = parts[1] || "";
    }
  }

  const nationalityIdx = lines.findIndex(l => /^nationality$/i.test(l.trim()));
  if (nationalityIdx !== -1 && lines[nationalityIdx + 1]) {
    const nat = lines[nationalityIdx + 1].trim();
    result.nationality    = nat;
    result.birthCountry   = nat === "INDIAN" ? "India" : nat;
    result.country        = nat === "INDIAN" ? "India" : nat;
    result.nationalityCode = nat === "INDIAN" ? "IND" : "";
    if (nat === "INDIAN") result.primaryLanguage = "English";
  }

  const dobMatch = fullText.match(/date\s+of\s+birth\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i);
  if (dobMatch) {
    const parts = dobMatch[1].split(/[-\/]/);
    if (parts.length === 3) result.dateOfBirth = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }

  const sexMatch = fullText.match(/sex\s+([MF])\b/i);
  if (sexMatch) result.sex = sexMatch[1].toUpperCase() === "M" ? "male" : "female";

  const pobMatch = fullText.match(/place\s+of\s+birth\s+([A-Z ,]+?)(?:\s+sex|\s*\n)/i);
  if (pobMatch) result.cityOfBirth = pobMatch[1].trim();

  const expiryMatch = fullText.match(/date\s+of\s+expiry\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i);
  if (expiryMatch) {
    const parts = expiryMatch[1].split(/[-\/]/);
    if (parts.length === 3) result.expiryDate = `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }

  const addressIdx = lines.findIndex(l => /^address$/i.test(l.trim()));
  if (addressIdx !== -1) {
    result.addressLine1 = lines[addressIdx + 1]?.trim() || "";
    result.addressLine2 = lines[addressIdx + 2]?.trim() || "";
  }

  if (!result.addressLine1) {
    const houseMatch = fullText.match(/(?:house|flat|door|h\.no|s\/o|d\/o|w\/o)[^\n,]*[,\n]([^\n,]+)/i);
    if (houseMatch) result.addressLine1 = houseMatch[0].replace(/\n/g, ", ").trim();
  }

  const pincodeMatch = fullText.match(/(?:pin(?:code)?|postal\s*code|zip)[:\s]*(\d{5,6})/i);
  if (pincodeMatch) result.zipCode = pincodeMatch[1];
  if (!result.zipCode) {
    const standalonePin = fullText.match(/\b(\d{6})\b/);
    if (standalonePin) result.zipCode = standalonePin[1];
  }

  const cityMatch = fullText.match(/(?:city|district|dist\.?)[:\s]+([A-Za-z\s]+?)(?:\n|,|state|pin)/i);
  if (cityMatch) result.city = cityMatch[1].trim();

  const stateMatch = fullText.match(/(?:\bstate\b)[:\s]+([A-Za-z\s]+?)(?:\n|,|pin|zip|\d)/i);
  if (stateMatch) result.state = stateMatch[1].trim();

  const countryMatch = fullText.match(/(?:country)[:\s]+([A-Za-z\s]+?)(?:\n|,|\d)/i);
  if (countryMatch && !result.country) result.country = countryMatch[1].trim();

  const phoneMatch = fullText.match(/(?:mobile|phone|contact|mob\.?|ph\.?)[:\s]+(\+?[\d\s\-]{8,15})/i);
  if (phoneMatch) {
    result.phone = phoneMatch[1].replace(/[\s\-]/g, "").trim();
    result.preferredPhoneType = "mobile";
  }
  if (!result.phone) {
    const mobileMatch = fullText.match(/\b([6-9]\d{9})\b/);
    if (mobileMatch) {
      result.phone = mobileMatch[1];
      result.preferredPhoneType = "mobile";
    }
  }

  return result;
};

const extractTextLines = (textractResponse) => {
  const lines = [];
  if (textractResponse?.Blocks) {
    for (const block of textractResponse.Blocks) {
      if (block.BlockType === "LINE" && block.Text) lines.push(block.Text.trim());
    }
  }
  return lines;
};

const mapToFormFields = (line1Data, line2Data, ocrData) => {
  const givenNames     = line1Data.givenNames || "";
  const givenNameParts = givenNames.split(/\s+/).filter(Boolean);
  const firstName      = givenNameParts[0]                 || ocrData.firstName  || "";
  const middleName     = givenNameParts.slice(1).join(" ") || ocrData.middleName || "";
  const lastName       = line1Data.surname                 || ocrData.lastName   || "";
  const birthDate      = line2Data.dateOfBirth             || ocrData.dateOfBirth || "";
  const gender         = line2Data.sex                     || ocrData.sex        || "";
  const birthCountry   = line2Data.nationality    || ocrData.birthCountry || line1Data.issuingCountry || "";
  const cityOfBirth    = ocrData.cityOfBirth      || "";
  const country        = line1Data.issuingCountry || ocrData.country      || "";

  let citizenshipStatus = "";
  const natCode = (line2Data.nationalityCode || ocrData.nationalityCode || "").toUpperCase();
  if (natCode === "USA")     citizenshipStatus = "us-citizen-national";
  else if (natCode)          citizenshipStatus = "citizen-non-us-country";

  return {
    firstName, middleName, lastName, birthDate, gender,
    birthCountry, cityOfBirth, country, citizenshipStatus,
    addressLine1:       ocrData.addressLine1       || "",
    addressLine2:       ocrData.addressLine2       || "",
    city:               ocrData.city               || "",
    state:              ocrData.state              || "",
    zipCode:            ocrData.zipCode            || "",
    phone:              ocrData.phone              || "",
    preferredPhoneType: ocrData.preferredPhoneType || "",
    primaryLanguage:    ocrData.primaryLanguage    || "",
    _passportMeta: {
      passportNumber:     line2Data.passportNumber    || ocrData.passportNumber || "",
      nationality:        line2Data.nationality       || ocrData.nationality    || "",
      nationalityCode:    line2Data.nationalityCode   || ocrData.nationalityCode || "",
      issuingCountry:     line1Data.issuingCountry    || ocrData.country         || "",
      issuingCountryCode: line1Data.issuingCountryCode || "",
      expiryDate:         line2Data.expiryDate        || ocrData.expiryDate      || "",
    },
  };
};

// =====================================================
// ASYNC TEXTRACT — multi-page PDF support via S3
// =====================================================

/**
 * extractTextWithAsyncTextract
 *
 * Uses StartDocumentTextDetection (async) instead of
 * DetectDocumentTextCommand (sync) so multi-page PDFs work.
 *
 * Required IAM:
 *   textract:StartDocumentTextDetection
 *   textract:GetDocumentTextDetection
 *   s3:GetObject on the bucket
 */
const extractTextWithAsyncTextract = async (s3Key) => {
  // 1. Start job
  const startResponse = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
    })
  );

  const jobId = startResponse.JobId;
  if (!jobId) throw new Error("Textract did not return a JobId. Check IAM permissions.");
  console.log(`🚀 Async Textract job started. JobId: ${jobId}`);

  // 2. Poll until done
  const MAX_POLLS  = 30;
  const POLL_DELAY = 2000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let jobStatus = "IN_PROGRESS";
  let pollCount  = 0;

  while (jobStatus === "IN_PROGRESS" && pollCount < MAX_POLLS) {
    await sleep(POLL_DELAY);
    pollCount++;

    const getResponse = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId })
    );
    jobStatus = getResponse.JobStatus;
    console.log(`  ⏳ Poll ${pollCount}/${MAX_POLLS}: status = ${jobStatus}`);

    if (jobStatus === "SUCCEEDED") {
      // 3. Collect all lines (handle NextToken pagination)
      const allLines = extractTextLines(getResponse);
      let nextToken  = getResponse.NextToken;
      while (nextToken) {
        const pageResponse = await textract.send(
          new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken })
        );
        allLines.push(...extractTextLines(pageResponse));
        nextToken = pageResponse.NextToken;
      }
      console.log(`✅ Async Textract complete. Total lines: ${allLines.length}`);
      return allLines;
    }

    if (jobStatus === "FAILED") {
      throw new Error(`Textract async job failed: ${getResponse.StatusMessage || "Unknown error"}`);
    }
  }

  throw new Error(
    `Textract job timed out after ${(MAX_POLLS * POLL_DELAY) / 1000}s. Try a smaller file.`
  );
};

// =====================================================
// CV OCR PARSER — fixed name extraction
// =====================================================

/**
 * toTitleCase  "VEDA SHEENA RAJAN" → "Veda Sheena Rajan"
 */
const toTitleCase = (str) =>
  str.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/**
 * SUBJECT_WORDS
 * Common words found in grade/score tables that should NOT be
 * mistaken for a person's name.
 */
const SUBJECT_WORDS = new Set([
  "english","general","paper","mathematics","economics","psychology",
  "history","biology","physics","geography","science","chemistry",
  "literature","computing","music","art","design","business","accounting",
  "sociology","philosophy","religious","studies","physical","education",
  "technology","language","french","spanish","german","chinese","arabic",
  "further","statistics","mechanics","calculus","algebra","grade","level",
  "subject","predicted","uniform","mark","score","result","examination",
  "checkpoint","igcse","cambridge","international","advanced","subsidiary",
  "lower","secondary","primary","school","college","university","institute",
]);

const isLikelySubjectLine = (line) => {
  const words      = line.trim().toLowerCase().split(/\s+/);
  const matchCount = words.filter(w => SUBJECT_WORDS.has(w)).length;
  return words.length > 0 && matchCount / words.length > 0.4;
};

/**
 * extractNameFromCV
 *
 * Priority order:
 *  1. ALL-CAPS name in first 8 lines  e.g. "VEDA SHEENA RAJAN"
 *  2. Title-Case name in first 8 lines e.g. "Veda Sheena Rajan"
 *  3. Explicit "Name:" / "Full Name:" label anywhere in the document
 */
const extractNameFromCV = (lines) => {
  const SECTION_RE = /^(education|experience|work|employment|skills|testing|activities|awards|certifications|projects|internship|objective|summary|profile|contact|references|standardized|leadership|sports|interests|achievements|honours|honors|volunteering|publications|languages|training)/i;

  for (const line of lines.slice(0, 8)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;
    if (SECTION_RE.test(trimmed))        continue;   // section heading
    if (/\d/.test(trimmed))              continue;   // contains digits
    if (/@/.test(trimmed))               continue;   // email
    if (/[,|;:]/.test(trimmed))          continue;   // address / metadata
    if (isLikelySubjectLine(trimmed))    continue;   // subject/grade keyword

    // ── ALL-CAPS: "VEDA SHEENA RAJAN" ──
    if (/^[A-Z][A-Z\s]{3,}$/.test(trimmed)) {
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length >= 2 && words.length <= 5 && words.every(w => /^[A-Z]+$/.test(w))) {
        const titled = toTitleCase(trimmed);
        const parts  = titled.split(/\s+/);
        return {
          firstName:  parts[0]                                         || "",
          middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
          lastName:   parts[parts.length - 1]                          || "",
        };
      }
    }

    // ── Title-Case: "Veda Sheena Rajan" ──
    if (/^[A-Z][a-z]+(?: [A-Z][a-z]*){1,4}$/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      return {
        firstName:  parts[0]                                         || "",
        middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
        lastName:   parts[parts.length - 1]                          || "",
      };
    }
  }

  // ── Fallback: explicit "Name:" label ──
  const fullText      = lines.join("\n");
  const nameLabelMatch = fullText.match(/^(?:name|full\s+name)[:\s]+([A-Za-z\s]{3,40})$/im);
  if (nameLabelMatch) {
    const parts = toTitleCase(nameLabelMatch[1].trim()).split(/\s+/);
    return {
      firstName:  parts[0]                                         || "",
      middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
      lastName:   parts[parts.length - 1]                          || "",
    };
  }

  return { firstName: "", middleName: "", lastName: "" };
};

/**
 * parseCVFromOcrLines
 */
const parseCVFromOcrLines = (lines) => {
  const fullText = lines.join("\n");
  const result   = {};

  // ── NAME (handles ALL-CAPS names like "VEDA SHEENA RAJAN") ──
  const nameData    = extractNameFromCV(lines);
  result.firstName  = nameData.firstName;
  result.middleName = nameData.middleName;
  result.lastName   = nameData.lastName;

  // ── EMAIL ──
  const emailMatch = fullText.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) result._cvEmail = emailMatch[0];

  // ── PHONE ──
  const phoneMatch = fullText.match(/(?:phone|mobile|mob|tel|contact)?[\s:]*(\+?[\d][\d\s\-().]{8,14}\d)/i);
  if (phoneMatch) {
    result.phone              = phoneMatch[1].replace(/[\s\-().]/g, "").trim();
    result.preferredPhoneType = "mobile";
  }

  // ── ADDRESS — Indian format (comma-list + 6-digit PIN) ──
  const indianAddressMatch = fullText.match(
    /([A-Za-z][^,\n]+(?:,\s*[A-Za-z][^,\n]+){2,})[,\s–\-]+(\d{6})/
  );
  if (indianAddressMatch) {
    const fullAddr = indianAddressMatch[1].trim();
    const pin      = indianAddressMatch[2].trim();
    const parts    = fullAddr.split(",").map(p => p.trim()).filter(Boolean);

    const indianStates = [
      "Kerala","Tamil Nadu","Karnataka","Andhra Pradesh","Telangana",
      "Maharashtra","Gujarat","Rajasthan","Uttar Pradesh","Madhya Pradesh",
      "West Bengal","Bihar","Odisha","Punjab","Haryana","Himachal Pradesh",
      "Uttarakhand","Jharkhand","Chhattisgarh","Assam","Goa","Delhi",
      "Jammu and Kashmir","Ladakh","Manipur","Meghalaya","Mizoram",
      "Nagaland","Sikkim","Tripura","Arunachal Pradesh",
    ];

    const stateIdx   = parts.findIndex(p => indianStates.some(s => p.toLowerCase().includes(s.toLowerCase())));
    const countryIdx = parts.findIndex(p => /^india$/i.test(p.trim()));
    const cityIdx    = stateIdx > 0 ? stateIdx - 1 : parts.length - 2;

    result.addressLine1 = parts[0] || "";
    result.addressLine2 = cityIdx > 1 ? parts.slice(1, cityIdx).join(", ") : "";
    result.city         = parts[cityIdx]   || "";
    result.state        = stateIdx  !== -1 ? parts[stateIdx]   : "";
    result.country      = countryIdx !== -1 ? parts[countryIdx] : (result.country || "India");
    result.zipCode      = pin;
  }

  // Western address: "123 Main St, City, State 90210"
  if (!result.city) {
    const westernMatch = fullText.match(
      /(\d+[^,\n]+),\s*([A-Za-z\s]+),\s*([A-Za-z\s]+)[,\s]+(\d{5,6})/
    );
    if (westernMatch) {
      result.addressLine1 = westernMatch[1].trim();
      result.city         = westernMatch[2].trim();
      result.state        = westernMatch[3].trim();
      result.zipCode      = westernMatch[4].trim();
    }
  }

  // US "City, ST 10001"
  if (!result.city) {
    const cityStateMatch = fullText.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\s+(\d{5,6})\b/);
    if (cityStateMatch) {
      result.city    = cityStateMatch[1].trim();
      result.state   = cityStateMatch[2].trim();
      result.zipCode = cityStateMatch[3].trim();
    }
  }

  if (!result.zipCode) {
    const pinMatch = fullText.match(/\b(\d{6})\b/);
    if (pinMatch) result.zipCode = pinMatch[1];
  }

  // ── NATIONALITY / COUNTRY ──
  const natMatch = fullText.match(/(?:nationality|citizenship)[:\s]+([A-Za-z\s]+?)(?:\n|,|\.|;)/i);
  if (natMatch) {
    result.country           = natMatch[1].trim();
    result.birthCountry      = natMatch[1].trim();
    result.citizenshipStatus = "citizen-non-us-country";
  }
  if (!result.country) {
    if (/\bindia\b/i.test(fullText) || /\b[1-9]\d{5}\b/.test(fullText)) {
      result.country           = "India";
      result.birthCountry      = "India";
      result.citizenshipStatus = "citizen-non-us-country";
    }
  }

  // ── DATE OF BIRTH — numeric "04/08/2008" or "04-08-2008" ──
  const dobMatch = fullText.match(
    /(?:dob|date\s+of\s+birth|born)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  );
  if (dobMatch) {
    const parts = dobMatch[1].split(/[\/\-\.]/);
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `19${parts[2]}` : parts[2];
      result.birthDate = `${year}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
    }
  }

  // ── DATE OF BIRTH — long form "04 August 2008" or "August 04, 2008" ──
  if (!result.birthDate) {
    const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
    const dobLongMatch =
      fullText.match(new RegExp(`(?:dob|date\\s+of\\s+birth|born)?[:\\s]*(\\d{1,2})\\s+(${MONTHS})\\s+(\\d{4})`, "i")) ||
      fullText.match(new RegExp(`(${MONTHS})\\s+(\\d{1,2}),?\\s+(\\d{4})`, "i"));

    if (dobLongMatch) {
      const monthMap = {
        january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",
        july:"07",august:"08",september:"09",october:"10",november:"11",december:"12",
      };
      if (/^\d/.test(dobLongMatch[1])) {
        // "04 August 2008"
        const day   = dobLongMatch[1].padStart(2,"0");
        const month = monthMap[dobLongMatch[2].toLowerCase()];
        const year  = dobLongMatch[3];
        if (month) result.birthDate = `${year}-${month}-${day}`;
      } else {
        // "August 04, 2008"
        const month = monthMap[dobLongMatch[1].toLowerCase()];
        const day   = dobLongMatch[2].padStart(2,"0");
        const year  = dobLongMatch[3];
        if (month) result.birthDate = `${year}-${month}-${day}`;
      }
    }
  }

  // ── GENDER ──
  const genderMatch = fullText.match(/\bgender[:\s]+(male|female|non-binary|other)\b/i);
  if (genderMatch) result.gender = genderMatch[1].toLowerCase();

  // ── PRIMARY LANGUAGE ──
  const langMatch = fullText.match(/(?:language|languages)[:\s]+([A-Za-z]+(?:,\s*[A-Za-z]+)*)/i);
  if (langMatch) result.primaryLanguage = langMatch[1].split(",")[0].trim();

  // ─────────────────────────────────────────
  // EDUCATION
  // ─────────────────────────────────────────
  result.education = [];

  const SECTION_HEADINGS_RE = /^(experience|work|employment|skills|testing|activities|awards|certifications|projects|internship|objective|summary|profile|references|standardized|leadership|sports|interests|achievements|honours|honors)/i;

  const educationStartIdx = lines.findIndex(l =>
    /^education$/i.test(l.trim()) ||
    /^academic\s+background$/i.test(l.trim()) ||
    /^educational\s+qualifications?$/i.test(l.trim())
  );

  let educationEndIdx = lines.length;
  if (educationStartIdx !== -1) {
    for (let i = educationStartIdx + 1; i < lines.length; i++) {
      if (SECTION_HEADINGS_RE.test(lines[i].trim())) { educationEndIdx = i; break; }
    }
  }

  if (educationStartIdx !== -1) {
    const eduLines = lines.slice(educationStartIdx + 1, educationEndIdx);
    const eduText  = eduLines.join("\n");

    const degreePattern = /\b(bachelor|master|b\.?tech|b\.?e\.?|m\.?tech|m\.?e\.?|b\.?sc|m\.?sc|mba|phd|ph\.d|diploma|associate|high\s+school|secondary|senior\s+secondary|class\s+x{1,2}|12th|10th|igcse|a\s+levels?|as\s+levels?|cambridge)\b/gi;
    const degrees = [];
    let degreeMatch;
    while ((degreeMatch = degreePattern.exec(eduText)) !== null) {
      degrees.push({ index: degreeMatch.index, degree: degreeMatch[0] });
    }

    degrees.forEach(({ index, degree }) => {
      const entry            = {};
      const charsBefore      = eduText.substring(0, index);
      const lineNumber       = charsBefore.split("\n").length - 1;
      const surroundingLines = eduLines.slice(Math.max(0, lineNumber - 1), lineNumber + 5);
      const entryText        = surroundingLines.join(" ");

      entry.degree = degree.trim();

      const institutionMatch = entryText.match(
        /(?:university|college|institute|school|iit|nit|bits|vit|srm|manipal|lpu|amity|trins|trivandrum)[^\n,;]*/i
      );
      if (institutionMatch) entry.institution = institutionMatch[0].trim();

      const yearMatch =
        entryText.match(/(\d{4})\s*[-–]\s*(\d{4}|\bpresent\b)/i) ||
        entryText.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) { entry.startYear = yearMatch[1]; entry.endYear = yearMatch[2] || ""; }

      const gpaMatch =
        entryText.match(/(?:cgpa|gpa|percentage|%)[:\s]*([\d.]+)/i) ||
        entryText.match(/([\d.]+)\s*(?:cgpa|gpa|%)/i);
      if (gpaMatch) entry.gpa = gpaMatch[1];

      const majorMatch = entryText.match(
        /(?:in|of|major|specialization)[:\s]+([A-Za-z\s&]+?)(?:\s*,|\s*\(|\n|$)/i
      );
      if (majorMatch) entry.major = majorMatch[1].trim();

      if (entry.degree || entry.institution) result.education.push(entry);
    });
  }

  // ─────────────────────────────────────────
  // TESTING — standardised scores
  // ─────────────────────────────────────────
  result.testing = {};

  const satTotalMatch =
    fullText.match(/Total\s+Score[:\s]+([\d]+)\s*\/\s*1600/i) ||
    fullText.match(/\bSAT\b[^:\n]*Total[:\s]+([\d]+)/i)       ||
    fullText.match(/\bSAT\b[^:\n]*[:\s]+([\d]{3,4})\b/i)     ||
    fullText.match(/SAT\s+Score[:\s]+([\d]+)/i);
  if (satTotalMatch) result.testing.sat = satTotalMatch[1];

  const satRWMatch =
    fullText.match(/Reading\s+[&\/]\s+Writing[:\s]+([\d]+)\s*\/\s*800/i) ||
    fullText.match(/SAT\s+(?:Reading(?:\s+&\s+Writing)?|EBRW)[:\s]+([\d]+)/i);
  if (satRWMatch) result.testing.satReading = satRWMatch[1];

  const satMathMatch =
    fullText.match(/Mathematics[:\s]+([\d]+)\s*\/\s*800/i) ||
    fullText.match(/SAT\s+Math(?:ematics)?[:\s]+([\d]+)/i);
  if (satMathMatch) result.testing.satMath = satMathMatch[1];

  const actMatch =
    fullText.match(/\bACT\b[^:\n]*[:\s]+([\d]+)/i) ||
    fullText.match(/ACT\s+(?:Composite\s+)?Score[:\s]+([\d]+)/i);
  if (actMatch) result.testing.act = actMatch[1];

  const greMatch       = fullText.match(/GRE[:\s]+([\d]+)/i);
  const greVerbalMatch = fullText.match(/GRE\s+Verbal[:\s]+([\d]+)/i);
  const greQuantMatch  = fullText.match(/GRE\s+(?:Quant(?:itative)?)[:\s]+([\d]+)/i);
  if (greMatch)       result.testing.gre       = greMatch[1];
  if (greVerbalMatch) result.testing.greVerbal = greVerbalMatch[1];
  if (greQuantMatch)  result.testing.greQuant  = greQuantMatch[1];

  const gmatMatch = fullText.match(/GMAT[:\s]+([\d]+)/i);
  if (gmatMatch) result.testing.gmat = gmatMatch[1];

  const toeflTotalMatch =
    fullText.match(/TOEFL[^:\n]*Total\s+Score[:\s]+([\d]+)/i) ||
    fullText.match(/TOEFL[^:\n]*[:\s]+([\d]+)/i);
  if (toeflTotalMatch) result.testing.toefl = toeflTotalMatch[1];

  const toeflReadingMatch   = fullText.match(/Reading[:\s]+([\d]+).*?Listening/is);
  const toeflListeningMatch = fullText.match(/Listening[:\s]+([\d]+)/i);
  const toeflSpeakingMatch  = fullText.match(/Speaking[:\s]+([\d]+)/i);
  const toeflWritingMatch   = fullText.match(/Writing[:\s]+([\d]+)/i);
  if (toeflReadingMatch)   result.testing.toeflReading   = toeflReadingMatch[1];
  if (toeflListeningMatch) result.testing.toeflListening = toeflListeningMatch[1];
  if (toeflSpeakingMatch)  result.testing.toeflSpeaking  = toeflSpeakingMatch[1];
  if (toeflWritingMatch)   result.testing.toeflWriting   = toeflWritingMatch[1];

  const ieltsMatch    = fullText.match(/IELTS[:\s]+([\d.]+)/i);
  if (ieltsMatch) result.testing.ielts = ieltsMatch[1];

  const duolingoMatch = fullText.match(/Duolingo[:\s]+([\d]+)/i);
  if (duolingoMatch) result.testing.duolingo = duolingoMatch[1];

  const apMatches = [...fullText.matchAll(/AP\s+([A-Za-z\s]+?)[:\s]+([\d])\b/g)];
  if (apMatches.length > 0) {
    result.testing.apScores = apMatches.map(m => ({ subject: m[1].trim(), score: m[2].trim() }));
  }

  // ─────────────────────────────────────────
  // ACTIVITIES
  // ─────────────────────────────────────────
  result.activities = [];

  const activitiesStartIdx = lines.findIndex(l =>
    /^(?:extracurricular\s+)?activities$/i.test(l.trim())       ||
    /^clubs?\s+(&|and)?\s+activities$/i.test(l.trim())          ||
    /^leadership\s+(&\s+activities)?$/i.test(l.trim())          ||
    /^co-?curricular\s+activities$/i.test(l.trim())             ||
    /^work\s+experience\s+(&\s+internships?)?$/i.test(l.trim()) ||
    /^other\s+interests?.*co-?curricular/i.test(l.trim())
  );

  const activitiesEndIdx = (() => {
    if (activitiesStartIdx === -1) return lines.length;
    for (let i = activitiesStartIdx + 1; i < lines.length; i++) {
      if (SECTION_HEADINGS_RE.test(lines[i].trim()) && !/activities/i.test(lines[i].trim())) return i;
    }
    return lines.length;
  })();

  if (activitiesStartIdx !== -1) {
    lines.slice(activitiesStartIdx + 1, activitiesEndIdx).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 4 || /^\d{4}/.test(trimmed)) return;

      const entry = { description: trimmed };
      const yearMatch =
        trimmed.match(/(\d{4})\s*[-–]\s*(\d{4}|\bpresent\b)/i) ||
        trimmed.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        entry.startYear   = yearMatch[1];
        entry.endYear     = yearMatch[2] || "";
        entry.description = trimmed.replace(yearMatch[0], "").replace(/[,\s]+$/, "").trim();
      }
      const roleMatch = entry.description.match(/^([^,\-–|@]+?)(?:\s*[,\-–|]\s*|\s+at\s+|\s+@\s+)/i);
      if (roleMatch) {
        entry.role         = roleMatch[1].trim();
        entry.organization = entry.description.replace(roleMatch[0], "").trim();
      }
      if (entry.description) result.activities.push(entry);
    });
  }

  const volunteerMatches = [...fullText.matchAll(/(?:volunteer(?:ing)?|community\s+service)[:\s]+([^\n]+)/gi)];
  volunteerMatches.forEach(m => {
    const desc = m[1].trim();
    if (desc) result.activities.push({ description: desc, type: "volunteer" });
  });

  return result;
};

/**
 * mapCVToAllSections
 */
const mapCVToAllSections = (cvData) => ({
  // ── Profile flat fields ──
  firstName:          cvData.firstName         || "",
  middleName:         cvData.middleName         || "",
  lastName:           cvData.lastName           || "",
  birthDate:          cvData.birthDate          || "",
  gender:             cvData.gender             || "",
  phone:              cvData.phone              || "",
  preferredPhoneType: cvData.preferredPhoneType || "",
  addressLine1:       cvData.addressLine1        || "",
  addressLine2:       cvData.addressLine2        || "",
  city:               cvData.city               || "",
  state:              cvData.state              || "",
  zipCode:            cvData.zipCode            || "",
  country:            cvData.country            || "",
  birthCountry:       cvData.birthCountry        || "",
  citizenshipStatus:  cvData.citizenshipStatus   || "",
  primaryLanguage:    cvData.primaryLanguage     || "",
  // ── Structured sections (arrays/objects — handled by their own components) ──
  cvEducation:  cvData.education  || [],
  cvTesting:    cvData.testing    || {},
  cvActivities: cvData.activities || [],
  // ── Meta ──
  _cvMeta: { email: cvData._cvEmail || "", parsedAt: new Date().toISOString() },
});

// ================================
// 🔐 FORGOT PASSWORD
// ================================

export const forgotPasswordRequestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const account = await Account.findOne({ email: email.toLowerCase() });
    if (!account) {
      return res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent to your email." });
    }

    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "password_reset" });
    const otpCode  = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.create({ email: email.toLowerCase(), otp: otpCode, expiresAt: otpExpiry, purpose: "password_reset" });

    await sendEmail(email, "College App - Reset Your Password", `
      <h2>Password Reset Code</h2>
      <p>Hi ${account.firstName || 'there'},</p>
      <p>Your code is:</p>
      <h1 style="letter-spacing:3px">${otpCode}</h1>
      <p>Expires in <b>10 minutes</b>.</p>
    `);

    res.status(200).json({ success: true, message: "If an account exists, an OTP has been sent to your email." });
  } catch (error) {
    console.error("❌ Forgot password OTP error:", error);
    res.status(500).json({ success: false, message: "Server error sending OTP" });
  }
};

export const forgotPasswordReset = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "Email, password, and confirmPassword are required" });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

    const normalizedEmail = email.toLowerCase();
    const account = await Account.findOne({ email: normalizedEmail });
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });

    const token      = generateToken(account._id, account.email, account.studentType);
    account.password = password;
    await account.save();
    await Otp.deleteMany({ email: normalizedEmail, purpose: "password_reset" });

    const accountResponse = account.toObject();
    delete accountResponse.password;
    res.status(200).json({ success: true, message: "Password reset successful. You are now logged in.", token, account: accountResponse });
  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({ success: false, message: "Server error resetting password" });
  }
};

// ================================
// 🟢 Register
// ================================
export const createFirstYearAccount = async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, agreeToTerms, studentType, ...otherData } = req.body;

    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ success: false, message: "Please fill all required fields" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    if (!agreeToTerms)
      return res.status(400).json({ success: false, message: "You must agree to the terms of use" });

    const existingUser = await Account.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ success: false, message: "Email already registered" });

    const newAccount = await Account.create({
      email: email.toLowerCase(), password, firstName, lastName, agreeToTerms,
      studentType: studentType || "first-year",
      isVerified: false, status: 'pending', isApprovedByAdmin: false, role: 'student',
      ...otherData,
    });

    const otpCode  = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.create({ email: email.toLowerCase(), otp: otpCode, expiresAt: otpExpiry });

    await sendEmail(email, "College App - Verify Your Email", `
      <h2>College App Verification Code</h2>
      <p>Hi ${firstName},</p>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:3px">${otpCode}</h1>
      <p>Expires in <b>10 minutes</b>.</p>
    `);

    await createNewUserNotification(newAccount);
    await Notification.create({ type: "WELCOME", title: "Welcome to EduTechEx", message: `Hi ${firstName}, your account has been created successfully!`, userId: newAccount._id, targetRole: "student", isRead: false });
    await Notification.create({ type: "PENDING_APPROVAL", title: "Account Pending Approval", message: "Your account is awaiting admin approval.", userId: newAccount._id, targetRole: "student", isRead: false });

    const accountResponse = newAccount.toObject();
    delete accountResponse.password;
    res.status(201).json({ success: true, message: "Account created successfully. Please check your email for the OTP.", requireOtpVerification: true, account: accountResponse });
  } catch (error) {
    console.error("❌ Error creating account:", error);
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Email already registered" });
    res.status(500).json({ success: false, message: "Server error while creating account", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

// ================================
// 🔐 Verify OTP
// ================================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const normalizedEmail = email.toLowerCase();
    const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(400).json({ success: false, message: "OTP not found or expired" });

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    const isMatch = await otpRecord.compareOTP(otp);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (otpRecord.purpose === "password_reset") {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(200).json({ success: true, message: "Password reset OTP verified successfully.", otpValid: true });
    }

    await Account.updateOne({ email: normalizedEmail }, { isVerified: true });
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(200).json({ success: true, message: "Account verified successfully. You can now log in." });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

// ================================
// 🔑 Login
// ================================
export const loginAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Please provide email and password" });

    const account = await Account.findOne({ email: email.toLowerCase() });
    if (!account) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await account.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (!account.isVerified) return res.status(403).json({ success: false, message: "Please verify your email before logging in." });

    if (!account.isApprovedByAdmin || account.status === 'pending') {
      return res.status(403).json({ success: false, message: "Your account is pending admin approval.", requiresAdminApproval: true, isVerified: account.isVerified, isApprovedByAdmin: account.isApprovedByAdmin, status: account.status });
    }
    if (account.status === 'suspended') return res.status(403).json({ success: false, message: "Your account has been suspended.", isSuspended: true, status: account.status });
    if (account.status === 'inactive')  return res.status(403).json({ success: false, message: "Your account is inactive.", isInactive: true, status: account.status });

    account.lastLogin = new Date();
    await account.save();

    const token = generateToken(account._id, account.email, account.studentType);
    const accountResponse = account.toObject();
    delete accountResponse.password;
    res.status(200).json({ success: true, message: "Login successful", token, account: accountResponse });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

// ================================
// 🔍 Verify Token
// ================================
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token is required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    const account = await Account.findById(decoded.userId).select('status isApprovedByAdmin role');

    res.status(200).json({
      success: true,
      message: "Token verified successfully",
      user: { ...decoded, status: account?.status || 'unknown', isApprovedByAdmin: account?.isApprovedByAdmin || false, role: account?.role || 'student' },
    });
  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ================================
// 👤 Get Profile
// ================================
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: "User ID missing in request" });

    const account = await Account.findById(userId).select("-password");
    if (!account) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, account });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
};

// ================================
// ✏️ Update Profile
// ================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const existingAccount = await Account.findById(userId);
    if (!existingAccount) return res.status(404).json({ success: false, message: "User not found" });

    const updatedData = { ...req.body };
    delete updatedData.password;

    ['gender','legalSex','pronouns','armedForcesStatus','hispanicOrLatino','citizenshipStatus','preferredPhoneType','alternatePhoneType']
      .forEach(field => { if (updatedData[field] === '') updatedData[field] = undefined; });

    if (Array.isArray(updatedData.ethnicity)) updatedData.ethnicity = updatedData.ethnicity.filter(e => e !== '');
    if (Array.isArray(updatedData.languages)) updatedData.languages = updatedData.languages.filter(l => l.language && l.language.trim() !== '');

    const mergedData = { ...existingAccount.toObject(), ...updatedData };
    const completionStatus = {
      personalInfo:   validateProfileSection('personal',     mergedData),
      contactDetails: validateProfileSection('contact',      mergedData),
      address:        validateProfileSection('address',      mergedData),
      demographics:   validateProfileSection('demographics', mergedData),
      language:       validateProfileSection('language',     mergedData),
      geography:      validateProfileSection('geography',    mergedData),
    };

    updatedData.profileCompletion   = completionStatus;
    const profileProgress           = calculateProfileProgress(completionStatus);
    updatedData.applicationProgress = { ...existingAccount.applicationProgress, profile: profileProgress };

    const updatedAccount = await Account.findByIdAndUpdate(userId, updatedData, {
      new: true, runValidators: true, setDefaultsOnInsert: true,
    }).select("-password");

    if (!updatedAccount) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "Profile updated successfully", account: updatedAccount, progress: { profile: profileProgress }, profileProgress });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    if (error.name === 'ValidationError')
      return res.status(400).json({ success: false, message: "Validation error", error: process.env.NODE_ENV === "development" ? error.message : undefined });
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
};

// ================================
// 🔍 Get Detailed Profile
// ================================
export const getDetailedProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const account = await Account.findById(userId).select("-password");
    if (!account) return res.status(404).json({ success: false, message: "User not found" });

    const profileProgress = calculateProfileProgress(account.profileCompletion);
    res.status(200).json({ success: true, account, profileProgress, applicationProgress: account.applicationProgress });
  } catch (error) {
    console.error("❌ Error fetching detailed profile:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
};

// ================================
// 🛡️ ADMIN: Get All Users
// ================================
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await Account.find().select("-password -otp");
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("❌ Admin get users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// ================================
// 🔔 Notifications
// ================================
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const unread = notifications.filter(n => !n.isRead).length;
    res.status(200).json({ success: true, notifications, total: notifications.length, unread });
  } catch (error) {
    console.error("❌ Failed to fetch user notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user?.userId;
    if (!userId || !notificationId) return res.status(400).json({ success: false, message: "Invalid request" });

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId }, { isRead: true }, { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("❌ Mark as read failed:", error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

// ================================
// 🛂 Parse Passport
// POST /api/students/passport/parse
// ================================
export const parsePassport = async (req, res) => {
  let s3Key = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No passport file uploaded." });

    s3Key = req.file.key;
    const userId = req.user?.userId;

    let textractResponse;
    try {
      textractResponse = await textract.send(new AnalyzeDocumentCommand({
        Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
        FeatureTypes: ["FORMS"],
      }));
    } catch {
      try {
        textractResponse = await textract.send(new DetectDocumentTextCommand({
          Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
        }));
      } catch {
        throw new Error("Could not read the passport. Please ensure the image is clear and try again.");
      }
    }

    const allLines  = extractTextLines(textractResponse);
    const { mrzLine1, mrzLine2 } = findMrzLines(allLines);
    const line1Data = mrzLine1 ? parseMrzLine1(mrzLine1) : {};
    const line2Data = mrzLine2 ? parseMrzLine2(mrzLine2) : {};
    const ocrData   = parsePassportFromOcrLines(allLines);
    const formFields = mapToFormFields(line1Data, line2Data, ocrData);

    if (!formFields.firstName && !formFields.lastName) {
      return res.status(422).json({ success: false, message: "Could not extract name fields. Please upload a clearer image." });
    }

    const filledCount = Object.entries(formFields)
      .filter(([key, val]) => key !== "_passportMeta" && val && String(val).trim() !== "")
      .length;

    if (userId) {
      await Account.findByIdAndUpdate(userId, {
        passportS3Key: s3Key, passportUploadedAt: new Date(),
        passportExtractedData: { ...formFields._passportMeta, extractedAt: new Date() },
      });
    }

    res.status(200).json({ success: true, message: `Passport scanned successfully. ${filledCount} fields extracted.`, filledCount, data: formFields });
  } catch (error) {
    console.error("❌ Passport parse error:", error);
    if (s3Key) { try { await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })); } catch (_) {} }
    res.status(500).json({ success: false, message: error.message || "Server error while parsing passport." });
  }
};

// ================================
// 🛂 Delete Passport
// DELETE /api/students/passport
// ================================
export const deletePassport = async (req, res) => {
  try {
    const userId  = req.user?.userId;
    const account = await Account.findById(userId);
    if (!account?.passportS3Key) return res.status(404).json({ success: false, message: "No passport found." });

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: account.passportS3Key }));
    await Account.findByIdAndUpdate(userId, { $unset: { passportS3Key: "", passportUploadedAt: "", passportExtractedData: "" } });
    res.status(200).json({ success: true, message: "Passport deleted successfully." });
  } catch (error) {
    console.error("❌ Delete passport error:", error);
    res.status(500).json({ success: false, message: "Server error deleting passport." });
  }
};

// ================================
// 🪪 Parse Aadhaar / Govt ID
// POST /api/students/aadhaar/parse
// ================================
export const parseAadhaar = async (req, res) => {
  let s3Key = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

    s3Key = req.file.key;
    const userId = req.user?.userId;

    let textractResponse;
    try {
      textractResponse = await textract.send(new AnalyzeDocumentCommand({
        Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
        FeatureTypes: ["FORMS"],
      }));
    } catch {
      try {
        textractResponse = await textract.send(new DetectDocumentTextCommand({
          Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
        }));
      } catch {
        throw new Error("Could not read the document. Please ensure the image is clear and try again.");
      }
    }

    const allLines = extractTextLines(textractResponse);
    const ocrData  = parsePassportFromOcrLines(allLines);

    const formFields = {
      firstName: ocrData.firstName || "", lastName: ocrData.lastName || "",
      birthDate: ocrData.dateOfBirth || "", gender: ocrData.sex || "",
      addressLine1: ocrData.addressLine1 || "", addressLine2: ocrData.addressLine2 || "",
      city: ocrData.city || "", state: ocrData.state || "",
      zipCode: ocrData.zipCode || "", country: ocrData.country || "India",
      phone: ocrData.phone || "", preferredPhoneType: ocrData.preferredPhoneType || "",
    };

    const data = Object.fromEntries(Object.entries(formFields).filter(([_, v]) => v && String(v).trim() !== ""));
    if (Object.keys(data).length === 0) {
      return res.status(422).json({ success: false, message: "Could not extract data. Please upload a clearer image." });
    }

    if (userId) await Account.findByIdAndUpdate(userId, { aadhaarS3Key: s3Key, aadhaarUploadedAt: new Date() });

    res.status(200).json({ success: true, message: `Document scanned successfully. ${Object.keys(data).length} fields extracted.`, filledCount: Object.keys(data).length, data });
  } catch (error) {
    console.error("❌ Aadhaar parse error:", error);
    if (s3Key) { try { await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })); } catch (_) {} }
    res.status(500).json({ success: false, message: error.message || "Server error while parsing document." });
  }
};

// ================================
// 📄 Parse CV / Résumé
// POST /api/students/cv/parse
// ================================
export const parseCV = async (req, res) => {
  let s3Key = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No CV file uploaded." });

    s3Key    = req.file.key;
    const userId   = req.user?.userId;
    const mimeType = req.file.mimetype || "";

    console.log(`📄 CV uploaded for user ${userId}: ${s3Key} (${mimeType})`);

    let allLines = [];
    const isPdf  = mimeType === "application/pdf" || s3Key.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      // Multi-page PDF — async Textract via S3
      console.log("📑 PDF detected — using async Textract (multi-page safe)");
      try {
        allLines = await extractTextWithAsyncTextract(s3Key);
      } catch (asyncErr) {
        console.error("❌ Async Textract failed:", asyncErr);
        throw new Error("Could not read the CV PDF. Please ensure the file is not password-protected and try again.");
      }
    } else {
      // Image — sync Textract
      console.log("🖼️ Image detected — using sync Textract");
      try {
        const textractResponse = await textract.send(new DetectDocumentTextCommand({
          Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
        }));
        allLines = extractTextLines(textractResponse);
      } catch (syncErr) {
        console.error("❌ Sync Textract failed:", syncErr);
        throw new Error("Could not read the CV image. Please upload a clear JPG or PNG.");
      }
    }

    console.log(`📝 CV extracted ${allLines.length} lines. First 20:`, allLines.slice(0, 20));

    if (allLines.length === 0) {
      return res.status(422).json({ success: false, message: "No text could be extracted. Please upload a text-based PDF or a clear image." });
    }

    const cvData    = parseCVFromOcrLines(allLines);
    const formFields = mapCVToAllSections(cvData);

    console.log("✅ CV name extracted:", { firstName: formFields.firstName, middleName: formFields.middleName, lastName: formFields.lastName });

    const filledCount = Object.entries(formFields).filter(([key, val]) => {
      if (key.startsWith('_') || key.startsWith('cv')) return false;
      return val && String(val).trim() !== '';
    }).length;

    const totalExtracted =
      filledCount +
      (formFields.cvEducation?.length  || 0) +
      Object.keys(formFields.cvTesting || {}).length +
      (formFields.cvActivities?.length || 0);

    if (totalExtracted === 0) {
      return res.status(422).json({ success: false, message: "Could not extract meaningful data. Please upload a clearer file." });
    }

    if (userId) {
      await Account.findByIdAndUpdate(userId, {
        cvS3Key: s3Key, cvUploadedAt: new Date(),
        cvExtractedMeta: {
          email:           cvData._cvEmail || "",
          educationCount:  (cvData.education  || []).length,
          activitiesCount: (cvData.activities || []).length,
          extractedAt:     new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `CV scanned successfully. ${totalExtracted} fields/entries extracted.`,
      filledCount: totalExtracted,
      summary: {
        profileFields:     filledCount,
        educationEntries:  (formFields.cvEducation  || []).length,
        testingEntries:    Object.keys(formFields.cvTesting || {}).length,
        activitiesEntries: (formFields.cvActivities || []).length,
      },
      data: formFields,
    });
  } catch (error) {
    console.error("❌ CV parse error:", error);
    if (s3Key) { try { await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })); } catch (_) {} }
    res.status(500).json({ success: false, message: error.message || "Server error while parsing CV." });
  }
};