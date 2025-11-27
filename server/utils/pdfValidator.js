import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";
import Tesseract from "tesseract.js";
import { fromPath } from "pdf2pic";

// Normalize text by lowercasing, cleaning, and trimming for consistent processing
const normalize = (txt) =>
  String(txt || "")
    .toLowerCase()
    .replace(/[^a-z0-9<\s\/\-\:\.%]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Extract text from PDFs via pdf2json; supports normal text PDFs
export const extractPDFText = (filePath) =>
  new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser();
      const timeout = setTimeout(() => {
        console.log("⏱️ PDF parsing timeout");
        resolve("");
      }, 10000);

      pdfParser.on("pdfParser_dataError", (err) => {
        clearTimeout(timeout);
        console.log("❌ pdf2json error:", err?.parserError || err);
        resolve("");
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        clearTimeout(timeout);
        try {
          console.log("📄 PDF Data received, extracting text...");
          const pages = pdfData?.Pages || pdfData?.formImage?.Pages || [];

          if (!pages || pages.length === 0) {
            console.log("⚠️ No pages found in PDF");
            resolve("");
            return;
          }

          const extracted = pages
            .map((page, pageIndex) => {
              if (!page.Texts || !Array.isArray(page.Texts)) {
                console.log(`⚠️ Page ${pageIndex + 1} has no Texts array`);
                return "";
              }
              return page.Texts.map((textItem) => {
                try {
                  if (textItem.R && Array.isArray(textItem.R)) {
                    return textItem.R.map((r) => decodeURIComponent(r.T || "")).join(" ");
                  }
                  return "";
                } catch {
                  return "";
                }
              }).join(" ");
            })
            .join(" ");

          const normalized = normalize(extracted);
          console.log(`✅ Extracted ${normalized.length} characters from PDF`);
          if (normalized.length > 0) {
            console.log(`📝 Preview: ${normalized.substring(0, 200)}...`);
          }
          resolve(normalized);
        } catch (err) {
          console.log("⚠️ Error parsing PDF text:", err.message);
          resolve("");
        }
      });

      pdfParser.loadPDF(filePath);
    } catch (err) {
      console.log("❌ PDF parser crashed:", err.message);
      resolve("");
    }
  });

// OCR text extraction for image files using Tesseract
export const extractImageText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) {
    console.log("⚠️ OCR skipped — not an image");
    return "";
  }
  try {
    console.log("📌 Running OCR on image...");
    const { data } = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    const normalized = normalize(data.text);
    console.log(`✅ OCR extracted ${normalized.length} characters`);
    if (normalized.length > 0) {
      console.log(`📝 Preview: ${normalized.substring(0, 200)}...`);
    }
    return normalized;
  } catch (err) {
    console.log("❌ OCR error:", err.message);
    return "";
  }
};

// Fallback: convert PDF to image, then extract text via OCR, cleaning temporary images
export const extractPDFTextViaOCR = async (filePath) => {
  try {
    console.log("🔄 Converting PDF to image for OCR...");
    console.log("⏳ This may take 10-30 seconds...");
    const tempDir = path.join(path.dirname(filePath), "temp_ocr");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const options = {
      density: 300,
      saveFilename: "page",
      savePath: tempDir,
      format: "png",
      width: 2480,
      height: 3508,
    };

    const convert = fromPath(filePath, options);
    const result = await convert(1, { responseType: "image" });

    if (!result || !result.path) {
      console.log("❌ Failed to convert PDF to image");
      return "";
    }

    console.log("✅ PDF converted to image:", result.path);
    console.log("🔍 Running OCR on converted image...");
    const { data } = await Tesseract.recognize(result.path, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const normalized = normalize(data.text);
    console.log(`✅ OCR extracted ${normalized.length} characters from PDF`);
    if (normalized.length > 0) {
      console.log(`📝 Preview: ${normalized.substring(0, 200)}...`);
    }

    if (fs.existsSync(result.path))  fs.unlinkSync(result.path);
    try { fs.rmdirSync(tempDir); } catch { /* ignore */ }

    return normalized;
  } catch (err) {
    console.log("❌ PDF OCR setup error:", err.message);
    return "";
  }
};

// Validate marksheet documents based on keywords and patterns
const validateMarksheet = (text) => {
  const KEYWORDS = [
    "marksheet","mark sheet","certificate","board","subject","roll","secondary",
    "higher secondary","10th","tenth","12th","twelfth","maximum marks","marks obtained",
    "obtained","total marks","percentage","grade","result","examination","cbse","icse",
    "state board"
  ];
  const details = {
    keywordsFound: KEYWORDS.filter((k) => text.includes(k)),
    hasPercentage: /\b\d{1,3}(\.\d{1,2})?%/.test(text) || /percentage\s*:?\s*\d+/.test(text),
    hasRoll: /roll\s*(no|number)?\s*:?\s*\d{5,12}/i.test(text) || /\b\d{5,12}\b/.test(text),
    hasMarks: /marks?\s*(obtained|secured)?.*\d+/.test(text),
    hasSubjects: /(mathematics|english|science|physics|chemistry|biology|history)/i.test(text),
  };
  let confidence = 0;
  confidence += details.keywordsFound.length * 8;
  if (details.hasPercentage) confidence += 15;
  if (details.hasRoll) confidence += 15;
  if (details.hasMarks) confidence += 15;
  if (details.hasSubjects) confidence += 10;

  console.log("📊 Marksheet validation:", {confidence, keywordsFound: details.keywordsFound.length, keywords: details.keywordsFound});
  return {
    valid: confidence >= 30,
    confidence: Math.min(confidence, 100),
    matchedKeywords: details.keywordsFound,
    details,
  };
};

// Validate passports by keywords and MRZ detection
const validatePassport = (text) => {
  const KEYWORDS = ["passport","nationality","given name","given names","surname","date of birth","place of birth","date of issue","date of expiry","republic of india","government of"];
  const MRZ_RE = /([A-Z0-9<]{10,}\s?){2,}/;
  const PASS_RE = /\b[A-Z][0-9]{7}\b/;
  const PASS_RE_ALT = /\b[A-Z]{1,2}[0-9]{6,8}\b/;

  const details = {
    mrz: MRZ_RE.test(text),
    number: (text.match(PASS_RE) || text.match(PASS_RE_ALT) || [null])[0],
    keywordsFound: KEYWORDS.filter((k) => text.includes(k)),
    hasNationality: /nationality.*india/i.test(text),
  };
  let confidence = 0;
  if (details.mrz) confidence += 50;
  if (details.number) confidence += 25;
  if (details.hasNationality) confidence += 10;
  confidence += details.keywordsFound.length * 4;

  console.log("📊 Passport validation:", {confidence, keywordsFound: details.keywordsFound.length, keywords: details.keywordsFound});
  return {
    valid: confidence >= 40,
    confidence: Math.min(confidence, 100),
    matchedKeywords: details.keywordsFound,
    details,
  };
};

// Main unified validation function, tries PDF extraction then falls back to OCR or image OCR
export const validateDocumentType = async (filePath, expectedType) => {
  console.log("\n🔍 Starting document validation...");
  console.log(`📁 File: ${path.basename(filePath)}`);
  console.log(`📋 Expected Type: ${expectedType}`);

  const ext = path.extname(filePath).toLowerCase();
  let text = "";

  if (ext === ".pdf") {
    console.log("📄 Extracting text from PDF using pdf2json...");
    text = await extractPDFText(filePath);

    if (!text || text.length < 10) {
      console.log("⚠️ pdf2json returned insufficient text");
      console.log("🔄 Switching to OCR fallback (this may take 10-30 seconds)...");
      text = await extractPDFTextViaOCR(filePath);
    }
  } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
    text = await extractImageText(filePath);
  } else {
    console.log("❌ Unsupported file type:", ext);
    return {
      valid: false,
      confidence: 0,
      message: `Unsupported file type: ${ext}. Allowed: PDF, JPG, PNG`,
      expectedType,
    };
  }

  console.log(`📏 Extracted text length: ${text.length} characters`);

  if (!text || text.length < 10) {
    console.log("❌ Insufficient text extracted");
    return {
      valid: false,
      confidence: 0,
      message: "Unable to extract readable text from document. Please ensure the file is not corrupted and contains readable text or clear images.",
      extractedText: text.substring(0, 100),
      expectedType,
    };
  }

  let validationResult;
  if (expectedType === "passport") {
    validationResult = validatePassport(text);
  } else if (expectedType === "tenthMarksheet" || expectedType === "twelfthMarksheet") {
    validationResult = validateMarksheet(text);
  } else {
    validationResult = {
      valid: text.length > 20,
      confidence: Math.min(text.length / 2, 100),
      matchedKeywords: [],
    };
  }

  console.log(`✅ Validation complete: ${validationResult.valid ? "VALID" : "INVALID"}`);
  console.log(`📊 Confidence: ${validationResult.confidence}%\n`);

  return {
    ...validationResult,
    expectedType,
    extractedTextLength: text.length,
    extractedTextPreview: text.substring(0, 200),
  };
};
