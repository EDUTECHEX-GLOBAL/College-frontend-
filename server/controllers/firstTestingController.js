// server/controllers/firstTestingController.js
import FirstTesting from "../models/firstTestingModel.js";
import Account from "../models/accountModel.js";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import {
  S3Client,
} from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";

// =====================================================
// AWS CONFIG
// =====================================================
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const textractClient = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// =====================================================
// MULTER → S3 UPLOAD (for CV files)
// Mirrors the educationController pattern exactly
// =====================================================
const cvS3Storage = multerS3({
  s3,
  bucket: BUCKET_NAME,
  serverSideEncryption: "AES256",
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const timestamp = Date.now();
    const random    = Math.round(Math.random() * 1e9);
    const ext       = path.extname(file.originalname).toLowerCase();
    const filename  = `testing-cv/${timestamp}-${random}${ext}`;
    console.log(`📁 S3 CV Key: ${filename}`);
    cb(null, filename);
  },
});

const cvUpload = multer({
  storage: cvS3Storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload PDF, DOC, DOCX, or TXT."), false);
    }
  },
});

// =====================================================
// ASYNC TEXTRACT POLLING  (identical to educationController)
// 60 polls × 5 s = 5 minutes max
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
  console.log(`⏱️  Polling Textract job ${jobId} (max ${maxPolls} × ${intervalMs}ms)`);

  for (let i = 1; i <= maxPolls; i++) {
    await sleep(intervalMs);

    const res    = await textractClient.send(new GetDocumentTextDetectionCommand({ JobId: jobId }));
    const status = res.JobStatus;
    console.log(`  ⏳ Poll ${i}/${maxPolls}: status = ${status}`);

    if (status === "SUCCEEDED") {
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
    // IN_PROGRESS → keep polling
  }

  throw new Error(
    `Textract job timed out after ${maxPolls} polls. The CV may be too large or complex.`
  );
};

// =====================================================
// TEXT → TEST DATA PARSER
// Extracts ACT, SAT, AP, IB, IELTS, TOEFL, Duolingo, PTE scores
// =====================================================
const parseTextForTestData = (lines) => {
  const text      = lines.join("\n");
  const textLower = text.toLowerCase();

  // ── helpers ──────────────────────────────────────────────────────────────
  const first = (patterns) => {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) return (m[1] || m[0]).trim();
    }
    return null;
  };

  // Parse a "Month day, year" or "Month year" date string near a keyword
  const extractDateNear = (keyword) => {
    const re = new RegExp(
      `${keyword}[^\\n]{0,60}((?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+(?:\\d{1,2},?\\s+)?\\d{4})`,
      "i"
    );
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  // ── detected test types ───────────────────────────────────────────────────
  const testsDetected = [];
  if (textLower.includes("act"))                                             testsDetected.push("act-tests");
  if (textLower.includes("sat"))                                             testsDetected.push("sat-tests");
  if (/\bap\b|\badvanced placement\b/i.test(text))                          testsDetected.push("ap-subject-tests");
  if (/\bib\b|\binternational baccalaureate\b/i.test(text))                 testsDetected.push("ib-subject-tests");
  if (textLower.includes("cambridge"))                                       testsDetected.push("cambridge");
  if (textLower.includes("ielts"))                                           testsDetected.push("ielts");
  if (textLower.includes("toefl"))                                           testsDetected.push("toefl-ibt");
  if (textLower.includes("duolingo"))                                        testsDetected.push("duolingo-english-test");
  if (/\bpte\b/i.test(text))                                                 testsDetected.push("pte-academic-tests");

  // ── ACT ──────────────────────────────────────────────────────────────────
  let act = null;
  const actComposite = first([/ACT\s*(?:composite|score|:)?\s*[:\-]?\s*(\d{1,2})\b/i]);
  const actMath      = first([/ACT\s+math\s*[:\-]?\s*(\d{1,2})\b/i]);
  const actEnglish   = first([/ACT\s+english\s*[:\-]?\s*(\d{1,2})\b/i]);
  const actReading   = first([/ACT\s+reading\s*[:\-]?\s*(\d{1,2})\b/i]);
  const actScience   = first([/ACT\s+science\s*[:\-]?\s*(\d{1,2})\b/i]);
  const actWriting   = first([/ACT\s+writing\s*[:\-]?\s*(\d{1,2})\b/i]);

  if (actComposite || actMath || actEnglish || actReading || actScience) {
    act = {
      pastACTScores:        "1",
      highestCompositeScore: actComposite || "",
      highestCompositeDate:  extractDateNear("ACT") || extractDateNear("composite"),
      highestMathScore:      actMath    || "",
      highestMathDate:       extractDateNear("math"),
      highestEnglishScore:   actEnglish || "",
      highestEnglishDate:    extractDateNear("english"),
      highestReadingScore:   actReading || "",
      highestReadingDate:    extractDateNear("reading"),
      reportScienceScore:    actScience ? "yes" : "no",
      highestScienceScore:   actScience || "",
      highestScienceDate:    extractDateNear("science"),
      reportWritingScore:    actWriting ? "yes" : "no",
      highestWritingScore:   actWriting || "",
      highestWritingDate:    extractDateNear("writing"),
    };
  }

  // ── SAT ──────────────────────────────────────────────────────────────────
  let sat = null;
  const satTotal   = first([/SAT\s*(?:total|score|:)?\s*[:\-]?\s*(\d{3,4})\b/i]);
  const satMath    = first([/SAT\s+math\s*[:\-]?\s*(\d{3,4})\b/i]);
  const satReading = first([/SAT\s+(?:reading|ebrw|evidence.based)\s*[:\-]?\s*(\d{3,4})\b/i]);
  const satWriting = first([/SAT\s+writing\s*[:\-]?\s*(\d{3,4})\b/i]);

  if (satTotal || satMath || satReading || satWriting) {
    sat = {
      pastSATScores:         "1",
      satHighestTotalScore:  satTotal   || "",
      satHighestTotalDate:   extractDateNear("SAT"),
      satHighestMathScore:   satMath    || "",
      satHighestMathDate:    extractDateNear("SAT math"),
      satHighestReadingScore: satReading || "",
      satHighestReadingDate: extractDateNear("SAT reading"),
      satHighestWritingScore: satWriting || "",
      satHighestWritingDate: extractDateNear("SAT writing"),
    };
  }

  // ── AP ───────────────────────────────────────────────────────────────────
  const apTests    = [];
  const apPattern  = /AP\s+([A-Za-z &:]+?)\s*[:\-]?\s*(\d)\b/gi;
  let apMatch;
  while ((apMatch = apPattern.exec(text)) !== null) {
    const subject = apMatch[1].trim();
    const score   = apMatch[2];
    // Avoid duplicates
    if (!apTests.find((t) => t.subject === subject)) {
      apTests.push({ subject, score, month: "", year: "" });
    }
  }

  // ── IB ───────────────────────────────────────────────────────────────────
  const ibTests   = [];
  const ibPattern = /IB\s+([A-Za-z &:]+?)\s+(HL|SL)\s*[:\-]?\s*(\d)\b/gi;
  let ibMatch;
  while ((ibMatch = ibPattern.exec(text)) !== null) {
    const subject = ibMatch[1].trim();
    const level   = ibMatch[2] === "HL" ? "Higher level (HL)" : "Standard level (SL)";
    const score   = ibMatch[3];
    if (!ibTests.find((t) => t.subject === subject)) {
      ibTests.push({ subject, level, score, month: "", year: "" });
    }
  }

  // ── IELTS ─────────────────────────────────────────────────────────────────
  let ielts = null;
  const ieltsOverall   = first([/IELTS\s*(?:overall|band|score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsListening = first([/IELTS\s+listening\s*[:\-]?\s*(\d+\.?\d*)\b/i,
                                 /listening\s*(?:band|score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsReading   = first([/IELTS\s+reading\s*[:\-]?\s*(\d+\.?\d*)\b/i,
                                 /reading\s*(?:band|score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsWriting   = first([/IELTS\s+writing\s*[:\-]?\s*(\d+\.?\d*)\b/i,
                                 /writing\s*(?:band|score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsSpeaking  = first([/IELTS\s+speaking\s*[:\-]?\s*(\d+\.?\d*)\b/i,
                                 /speaking\s*(?:band|score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i]);

  if (ieltsOverall || ieltsListening || ieltsReading || ieltsWriting || ieltsSpeaking) {
    const dateNear = extractDateNear("IELTS");
    ielts = {
      ieltsPastTests:              "1",
      ieltsHighestOverallScore:    ieltsOverall    || "",
      ieltsOverallScoreDate:       dateNear,
      ieltsHighestListeningScore:  ieltsListening  || "",
      ieltsListeningScoreDate:     dateNear,
      ieltsHighestReadingScore:    ieltsReading    || "",
      ieltsReadingScoreDate:       dateNear,
      ieltsHighestWritingScore:    ieltsWriting    || "",
      ieltsWritingScoreDate:       dateNear,
      ieltsHighestSpeakingScore:   ieltsSpeaking   || "",
      ieltsSpeakingScoreDate:      dateNear,
    };
  }

  // ── TOEFL ─────────────────────────────────────────────────────────────────
  let toefl = null;
  const toeflTotal     = first([/TOEFL\s*(?:ibt|total|score)?\s*[:\-]?\s*(\d{2,3})\b/i]);
  const toeflReading   = first([/TOEFL\s+reading\s*[:\-]?\s*(\d{1,2})\b/i]);
  const toeflListening = first([/TOEFL\s+listening\s*[:\-]?\s*(\d{1,2})\b/i]);
  const toeflSpeaking  = first([/TOEFL\s+speaking\s*[:\-]?\s*(\d{1,2})\b/i]);
  const toeflWriting   = first([/TOEFL\s+writing\s*[:\-]?\s*(\d{1,2})\b/i]);

  if (toeflTotal || toeflReading || toeflListening || toeflSpeaking || toeflWriting) {
    const dateNear = extractDateNear("TOEFL");
    toefl = {
      toeflPastTests:             "1",
      toeflHighestTotalScore:     toeflTotal     || "",
      toeflTotalScoreDate:        dateNear,
      toeflHighestReadingScore:   toeflReading   || "",
      toeflReadingScoreDate:      dateNear,
      toeflHighestListeningScore: toeflListening || "",
      toeflListeningScoreDate:    dateNear,
      toeflHighestSpeakingScore:  toeflSpeaking  || "",
      toeflSpeakingScoreDate:     dateNear,
      toeflHighestWritingScore:   toeflWriting   || "",
      toeflWritingScoreDate:      dateNear,
    };
  }

  // ── Duolingo ──────────────────────────────────────────────────────────────
  let duolingo = null;
  const duoTotal         = first([/Duolingo\s*(?:total|overall|score)?\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoLiteracy      = first([/(?:Duolingo\s+)?literacy\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoComprehension = first([/(?:Duolingo\s+)?comprehension\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoConversation  = first([/(?:Duolingo\s+)?conversation\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoProduction    = first([/(?:Duolingo\s+)?production\s*[:\-]?\s*(\d{2,3})\b/i]);

  if (duoTotal || duoLiteracy || duoComprehension || duoConversation || duoProduction) {
    const dateNear = extractDateNear("Duolingo");
    duolingo = {
      duolingoPastTests:                "1",
      duolingoHighestTotalScore:        duoTotal         || "",
      duolingoTotalScoreDate:           dateNear,
      duolingoHighestLiteracyScore:     duoLiteracy      || "",
      duolingoLiteracyScoreDate:        dateNear,
      duolingoHighestComprehensionScore: duoComprehension || "",
      duolingoComprehensionScoreDate:   dateNear,
      duolingoHighestConversationScore: duoConversation  || "",
      duolingoConversationScoreDate:    dateNear,
      duolingoHighestProductionScore:   duoProduction    || "",
      duolingoProductionScoreDate:      dateNear,
    };
  }

  // ── PTE ───────────────────────────────────────────────────────────────────
  let pte = null;
  const pteListening = first([/PTE\s+listening\s*[:\-]?\s*(\d{1,2})\b/i]);
  const pteReading   = first([/PTE\s+reading\s*[:\-]?\s*(\d{1,2})\b/i]);
  const pteSpeaking  = first([/PTE\s+speaking\s*[:\-]?\s*(\d{1,2})\b/i]);
  const pteWriting   = first([/PTE\s+writing\s*[:\-]?\s*(\d{1,2})\b/i]);

  if (pteListening || pteReading || pteSpeaking || pteWriting) {
    const dateNear = extractDateNear("PTE");
    pte = {
      ptePastTests:               "1",
      pteHighestListeningScore:   pteListening || "",
      pteListeningScoreDate:      dateNear,
      pteHighestReadingScore:     pteReading   || "",
      pteReadingScoreDate:        dateNear,
      pteHighestSpeakingScore:    pteSpeaking  || "",
      pteSpeakingScoreDate:       dateNear,
      pteHighestWritingScore:     pteWriting   || "",
      pteWritingScoreDate:        dateNear,
    };
  }

  return {
    testsDetected,
    act,
    sat,
    apTests,
    ibTests,
    ielts,
    toefl,
    duolingo,
    pte,
  };
};

// =====================================================
// VALIDATION helpers (unchanged from your original)
// =====================================================
const calculateTestingProgress = (testingCompletion, testsToReport = []) => {
  if (!testingCompletion) return 0;

  const testToCompletionMap = {
    "act-tests":            "actTests",
    "sat-tests":            "satTests",
    "sat-subject-tests":    "satSubjectTests",
    "ap-subject-tests":     "apSubjectTests",
    "ib-subject-tests":     "ibSubjectTests",
    cambridge:              "cambridge",
    "toefl-ibt":            "toeflIbt",
    "pte-academic-tests":   "pteAcademic",
    ielts:                  "ielts",
    "duolingo-english-test":"duolingo",
    "senior-secondary-exams":"seniorSecondary",
  };

  const mandatorySections  = ["testsTaken"];
  const relevantSections   = [...mandatorySections];

  testsToReport.forEach((test) => {
    const completionField = testToCompletionMap[test];
    if (completionField && testingCompletion[completionField] !== undefined) {
      relevantSections.push(completionField);
    }
  });

  const completedCount = relevantSections.filter((s) => testingCompletion[s]).length;
  if (relevantSections.length === 0) return 0;
  return Math.round((completedCount / relevantSections.length) * 100);
};

const validateTestingSection = (section, data) => {
  switch (section) {
    case "tests-taken":
      if (!data.selfReportScores || !data.internationalPromotionExams) return false;
      if (data.selfReportScores === "yes") {
        return Array.isArray(data.testsToReport) && data.testsToReport.length > 0;
      }
      return true;
    case "act-tests":
      return !!(data.pastACTScores && data.futureACTSittings);
    case "sat-tests":
      return !!(data.pastSATScores && data.futureSATSittings);
    case "sat-subject-tests":
      return !!(data.satSubjectTests && data.satSubjectTests.length > 0);
    case "ap-subject-tests":
      return !!(data.apSubjectTests && data.apSubjectTests.length > 0);
    case "ib-subject-tests":
      return !!(data.ibSubjectTests && data.ibSubjectTests.length > 0);
    case "cambridge": {
      const hasNumberOfTests  = !!data.cambridgeNumberOfTests;
      const hasValidTests     = !data.cambridgeNumberOfTests ||
        (data.cambridgeTests && data.cambridgeTests.length === parseInt(data.cambridgeNumberOfTests));
      const hasCertAnswer     = !!data.cambridgeCertificateReport;
      const hasCertDetails    =
        data.cambridgeCertificateReport !== "yes" ||
        (data.cambridgeCertificateDetails?.level && data.cambridgeCertificateDetails?.date);
      return hasNumberOfTests && hasValidTests && hasCertAnswer && hasCertDetails;
    }
    case "toefl-ibt": {
      const hasPast    = !!data.toeflPastTests;
      const hasFuture  = !!data.toeflFutureSittings;
      const hasScores  =
        !data.toeflPastTests || parseInt(data.toeflPastTests) === 0 ||
        (data.toeflHighestReadingScore && data.toeflReadingScoreDate &&
         data.toeflHighestSpeakingScore && data.toeflSpeakingScoreDate &&
         data.toeflHighestListeningScore && data.toeflListeningScoreDate &&
         data.toeflHighestWritingScore && data.toeflWritingScoreDate &&
         data.toeflHighestTotalScore && data.toeflTotalScoreDate);
      return hasPast && hasFuture && hasScores;
    }
    case "pte-academic-tests": {
      const hasPast   = !!data.ptePastTests;
      const hasFuture = !!data.pteFutureSittings;
      const hasScores =
        !data.ptePastTests || parseInt(data.ptePastTests) === 0 ||
        (data.pteHighestListeningScore && data.pteListeningScoreDate &&
         data.pteHighestReadingScore && data.pteReadingScoreDate &&
         data.pteHighestSpeakingScore && data.pteSpeakingScoreDate &&
         data.pteHighestWritingScore && data.pteWritingScoreDate);
      return hasPast && hasFuture && hasScores;
    }
    case "ielts": {
      const hasPast   = !!data.ieltsPastTests;
      const hasFuture = !!data.ieltsFutureSittings;
      const hasScores =
        !data.ieltsPastTests || parseInt(data.ieltsPastTests) === 0 ||
        (data.ieltsHighestListeningScore && data.ieltsListeningScoreDate &&
         data.ieltsHighestReadingScore && data.ieltsReadingScoreDate &&
         data.ieltsHighestWritingScore && data.ieltsWritingScoreDate &&
         data.ieltsHighestSpeakingScore && data.ieltsSpeakingScoreDate &&
         data.ieltsHighestOverallScore && data.ieltsOverallScoreDate);
      return hasPast && hasFuture && hasScores;
    }
    case "duolingo-english-test": {
      const hasPast   = !!data.duolingoPastTests;
      const hasFuture = !!data.duolingoFutureSittings;
      const hasScores =
        !data.duolingoPastTests || parseInt(data.duolingoPastTests) === 0 ||
        (data.duolingoHighestLiteracyScore && data.duolingoLiteracyScoreDate &&
         data.duolingoHighestComprehensionScore && data.duolingoComprehensionScoreDate &&
         data.duolingoHighestConversationScore && data.duolingoConversationScoreDate &&
         data.duolingoHighestProductionScore && data.duolingoProductionScoreDate &&
         data.duolingoHighestTotalScore && data.duolingoTotalScoreDate);
      return hasPast && hasFuture && hasScores;
    }
    case "senior-secondary-exams":
      return !!(data.seniorSecondaryExams && data.seniorSecondaryExams.length > 0);
    default:
      return false;
  }
};

// =====================================================
// 📤  PARSE CV  —  S3 upload + async Textract
//     Mirrors educationController.uploadCVAndExtract
// =====================================================
export const parseCV = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  // Run multer middleware first so the file lands in S3
  cvUpload.single("cv")(req, res, async (err) => {
    if (err) {
      console.error("Multer/S3 upload error:", err);
      return res.status(400).json({ success: false, message: err.message || "File upload error" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log(`🔍 CV uploaded: ${req.file.originalname}  MIME: ${req.file.mimetype}`);
    console.log(`📁 S3 Key: ${req.file.key}`);

    try {
      const isPDF =
        req.file.mimetype === "application/pdf" ||
        req.file.originalname?.toLowerCase().endsWith(".pdf");

      let lines = [];

      if (req.file.bucket && req.file.key) {
        // ── File is in S3 ────────────────────────────────────────────────
        if (isPDF) {
          console.log("📑 PDF → async Textract");
          const jobId = await startAsyncTextract(req.file.bucket, req.file.key);
          console.log(`🚀 Textract job started: ${jobId}`);
          const blocks = await pollTextractJob(jobId, 60, 5000);
          lines = blocks
            .filter((b) => b.BlockType === "LINE")
            .map((b) => b.Text || "")
            .filter(Boolean);
          console.log(`✅ Textract done. Lines: ${lines.length}`);
        } else {
          // DOCX / TXT — sync Textract
          console.log("📄 Non-PDF → sync Textract");
          const cmd = new DetectDocumentTextCommand({
            Document: { S3Object: { Bucket: req.file.bucket, Name: req.file.key } },
          });
          const response = await textractClient.send(cmd);
          lines = (response.Blocks || [])
            .filter((b) => b.BlockType === "LINE")
            .map((b) => b.Text || "")
            .filter(Boolean);
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "Cannot locate uploaded file in S3. Check multer-s3 configuration.",
        });
      }

      if (lines.length < 3) {
        return res.status(422).json({
          success: false,
          message:
            "Textract could not extract enough text from this document. " +
            "Please ensure the file is text-based (not a scanned image) and try again.",
        });
      }

      console.log(`📝 Extracted ${lines.length} lines. First 10:`, lines.slice(0, 10));

      const extractedData = parseTextForTestData(lines);

      return res.status(200).json({
        success: true,
        message: "CV parsed successfully",
        extractedData,
      });
    } catch (parseError) {
      console.error("CV parsing error:", parseError);
      const isTimeout = parseError.message?.includes("timed out");
      return res.status(isTimeout ? 504 : 500).json({
        success: false,
        message: isTimeout
          ? "The CV is taking too long to process. Please try a smaller or text-based PDF."
          : parseError.message || "Failed to parse CV content",
      });
    }
  });
};

// =====================================================
// 📥  CREATE OR UPDATE TESTING DATA  (unchanged)
// =====================================================
export const createOrUpdateFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updateData = { ...req.body };
    delete updateData.studentId;
    delete updateData.account;

    if (Array.isArray(updateData.ibSubjectTests)) {
      updateData.ibSubjectTests = updateData.ibSubjectTests.map((test) => {
        if (!test) return test;
        let level = test.level;
        if (level === "Higher level (HL)") level = "hl";
        else if (level === "Standard level (SL)") level = "sl";
        else if (!level) level = "";
        return { ...test, level };
      });
    }

    const completionStatus = {
      testsTaken:     validateTestingSection("tests-taken", updateData),
      actTests:       validateTestingSection("act-tests", updateData),
      satTests:       validateTestingSection("sat-tests", updateData),
      satSubjectTests:validateTestingSection("sat-subject-tests", updateData),
      apSubjectTests: validateTestingSection("ap-subject-tests", updateData),
      ibSubjectTests: validateTestingSection("ib-subject-tests", updateData),
      cambridge:      validateTestingSection("cambridge", updateData),
      toeflIbt:       validateTestingSection("toefl-ibt", updateData),
      pteAcademic:    validateTestingSection("pte-academic-tests", updateData),
      ielts:          validateTestingSection("ielts", updateData),
      duolingo:       validateTestingSection("duolingo-english-test", updateData),
      seniorSecondary:validateTestingSection("senior-secondary-exams", updateData),
    };

    const testingProgress = calculateTestingProgress(
      completionStatus,
      updateData.testsToReport || []
    );

    updateData.testingCompletion = completionStatus;
    updateData.testingProgress   = testingProgress;

    const testingRecord = await FirstTesting.findOneAndUpdate(
      { account: userId },
      { ...updateData, account: userId },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await Account.findByIdAndUpdate(userId, {
      $set: { "applicationProgress.testing": testingProgress },
    });

    res.status(200).json({
      success: true,
      message: "Testing data saved successfully",
      testing: testingRecord,
      testingProgress,
    });
  } catch (error) {
    console.error("❌ Error saving testing data:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error saving testing data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// 🔍  GET TESTING DATA
// =====================================================
export const getFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const testingData = await FirstTesting.findOne({ account: userId });
    if (!testingData) {
      return res.status(200).json({ success: true, testing: null, testingProgress: 0 });
    }
    res.status(200).json({
      success: true,
      testing: testingData,
      testingProgress: testingData.testingProgress || 0,
    });
  } catch (error) {
    console.error("❌ Error fetching testing data:", error);
    res.status(500).json({ success: false, message: "Server error fetching testing data" });
  }
};

// =====================================================
// 🔍  GET DETAILED TESTING DATA
// =====================================================
export const getDetailedFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const testingData = await FirstTesting.findOne({ account: userId });
    const account     = await Account.findById(userId).select("applicationProgress");

    if (!testingData) {
      return res.status(200).json({
        success: true,
        testing: null,
        testingProgress: 0,
        applicationProgress: account?.applicationProgress || {},
      });
    }

    res.status(200).json({
      success: true,
      testing: testingData,
      testingProgress: testingData.testingProgress || 0,
      applicationProgress: account?.applicationProgress || {},
    });
  } catch (error) {
    console.error("❌ Error fetching detailed testing data:", error);
    res.status(500).json({ success: false, message: "Server error fetching testing data" });
  }
};

// =====================================================
// 🗑️  DELETE TESTING DATA
// =====================================================
export const deleteFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await FirstTesting.findOneAndDelete({ account: userId });
    await Account.findByIdAndUpdate(userId, {
      $set: { "applicationProgress.testing": 0 },
    });

    res.status(200).json({ success: true, message: "Testing data deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting testing data:", error);
    res.status(500).json({ success: false, message: "Server error deleting testing data" });
  }
};