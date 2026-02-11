import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";
import Tesseract from "tesseract.js";

/* =====================================================
   SAFE HELPERS
===================================================== */

const normalize = (txt) =>
  String(txt || "")
    .toLowerCase()
    .replace(/[^a-z0-9<\s\/\-\:\.%]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/* =====================================================
   FAST PDF TEXT EXTRACTION (NO OCR FALLBACK)
===================================================== */

export const extractPDFText = (filePath) =>
  new Promise((resolve) => {
    try {
      if (!fs.existsSync(filePath)) return resolve("");

      const pdfParser = new PDFParser();

      const timeout = setTimeout(() => {
        resolve("");
      }, 7000);

      pdfParser.on("pdfParser_dataError", () => {
        clearTimeout(timeout);
        resolve("");
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        clearTimeout(timeout);

        try {
          const pages = pdfData?.Pages || [];
          const extracted = pages
            .map((p) =>
              (p.Texts || [])
                .map((t) =>
                  (t.R || [])
                    .map((r) => decodeURIComponent(r.T || ""))
                    .join(" ")
                )
                .join(" ")
            )
            .join(" ");

          resolve(normalize(extracted));
        } catch {
          resolve("");
        }
      });

      pdfParser.loadPDF(filePath);
    } catch {
      resolve("");
    }
  });

/* =====================================================
   SAFE IMAGE OCR (ONLY FOR IMAGES)
===================================================== */

export const extractImageText = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return "";

    const ext = path.extname(filePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) return "";

    const result = await Tesseract.recognize(filePath, "eng", {
      logger: () => {},
    });

    if (!result || !result.data) return "";

    return normalize(result.data.text);
  } catch {
    return "";
  }
};

/* =====================================================
   PASSPORT VALIDATION
===================================================== */

const validatePassport = (text) => {
  const KEYWORDS = [
    "passport",
    "surname",
    "given name",
    "nationality",
    "date of birth",
    "place of birth",
    "date of issue",
    "date of expiry",
    "passport number",
    "p<",
  ];

  const details = {
    mrz: /[A-Z0-9<]{25,}/i.test(text),
    number: /\b[A-Z]{1,2}[0-9]{6,8}\b/i.test(text),
    hasYear: /(19|20)\d{2}/.test(text),
    keywordsFound: KEYWORDS.filter((k) => text.includes(k)),
  };

  let confidence = 0;

  if (details.mrz) confidence += 40;
  if (details.number) confidence += 25;
  if (details.hasYear) confidence += 10;
  confidence += details.keywordsFound.length * 5;

  return {
    valid: confidence >= 35,
    confidence: Math.min(confidence, 100),
    matchedKeywords: details.keywordsFound,
    details,
  };
};

/* =====================================================
   MAIN ENTRY FUNCTION
===================================================== */

export const validateDocumentType = async (filePath, expectedType) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, confidence: 0, message: "File not found" };
    }

    const ext = path.extname(filePath).toLowerCase();
    let text = "";

    if (ext === ".pdf") {
      text = await extractPDFText(filePath);
    } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      text = await extractImageText(filePath);
    } else {
      return {
        valid: false,
        confidence: 0,
        message: "Unsupported file type",
      };
    }

    if (!text || text.length < 10) {
      return {
        valid: false,
        confidence: 0,
        message: "Unable to extract readable text",
      };
    }

    if (expectedType === "passport") {
      return validatePassport(text);
    }

    return {
      valid: true,
      confidence: 50,
      matchedKeywords: [],
      details: { generic: true },
    };
  } catch (error) {
    return {
      valid: false,
      confidence: 0,
      message: error.message,
    };
  }
};

/* =====================================================
   QUICK BASIC VALIDATION
===================================================== */

export const quickValidatePassport = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, message: "File not found" };
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (![".pdf", ".png", ".jpg", ".jpeg"].includes(ext)) {
      return { valid: false, message: "Invalid file type" };
    }

    if (stats.size > 10 * 1024 * 1024) {
      return { valid: false, message: "File too large (10MB max)" };
    }

    return {
      valid: true,
      confidence: 40,
      message: "Basic validation passed",
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message,
    };
  }
};
