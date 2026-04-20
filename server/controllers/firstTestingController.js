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
// =====================================================
const createDocUpload = (folder) => {
 const storage = multerS3({
  s3,
  bucket: BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ ADD THIS
  serverSideEncryption: "AES256",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const timestamp = Date.now();
      const random    = Math.round(Math.random() * 1e9);
      const ext       = path.extname(file.originalname).toLowerCase();
      const filename  = `${folder}/${timestamp}-${random}${ext}`;
      console.log(`📁 S3 Key: ${filename}`);
      cb(null, filename);
    },
  });

  return multer({
    storage,
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
};

const cvUpload          = createDocUpload("testing-cv");
const scoreDocUpload    = createDocUpload("testing-score-docs");

// =====================================================
// ASYNC TEXTRACT POLLING
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
    `Textract job timed out after ${maxPolls} polls. The document may be too large or complex.`
  );
};

// =====================================================
// SHARED TEXTRACT RUNNER
// Handles both PDF (async) and DOCX/TXT (sync)
// =====================================================
const runTextract = async (file) => {
  const isPDF =
    file.mimetype === "application/pdf" ||
    file.originalname?.toLowerCase().endsWith(".pdf");

  let lines = [];

  if (file.bucket && file.key) {
    if (isPDF) {
      console.log("📑 PDF → async Textract");
    const jobId  = await startAsyncTextract(file.bucket, file.key);
      console.log(`🚀 Textract job started: ${jobId}`);
      const blocks = await pollTextractJob(jobId, 60, 5000);
      lines = blocks
        .filter((b) => b.BlockType === "LINE")
        .map((b) => b.Text || "")
        .filter(Boolean);
    } else {
      console.log("📄 Non-PDF → sync Textract");
      const cmd = new DetectDocumentTextCommand({
      Document: { S3Object: { Bucket: file.bucket, Name: file.key } },
      });
      const response = await textractClient.send(cmd);
      lines = (response.Blocks || [])
        .filter((b) => b.BlockType === "LINE")
        .map((b) => b.Text || "")
        .filter(Boolean);
    }
  } else {
    throw new Error("Cannot locate uploaded file in S3. Check multer-s3 configuration.");
  }

  return lines;
};

// =====================================================
// TEXT → TEST DATA PARSER (full CV — all test types)
// =====================================================
const parseTextForTestData = (lines) => {
  const text      = lines.join("\n");
  const textLower = text.toLowerCase();

  const first = (patterns) => {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) return (m[1] || m[0]).trim();
    }
    return null;
  };

  const extractDateNear = (keyword) => {
    const re = new RegExp(
      `${keyword}[^\\n]{0,80}((?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+(?:\\d{1,2},?\\s+)?\\d{4})`,
      "i"
    );
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  const extractAnyDate = () => {
    const m = text.match(
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},?\s+)?\d{4})/i
    );
    return m ? m[1].trim() : "";
  };

  const testsDetected = [];
  if (textLower.includes("act"))                                              testsDetected.push("act-tests");
  if (textLower.includes("sat"))                                              testsDetected.push("sat-tests");
  if (/\bap\b|\badvanced placement\b/i.test(text))                           testsDetected.push("ap-subject-tests");
  if (/\bib\b|\binternational baccalaureate\b/i.test(text))                  testsDetected.push("ib-subject-tests");
  if (textLower.includes("cambridge"))                                        testsDetected.push("cambridge");
  if (textLower.includes("ielts"))                                            testsDetected.push("ielts");
  if (textLower.includes("toefl"))                                            testsDetected.push("toefl-ibt");
  if (textLower.includes("duolingo"))                                         testsDetected.push("duolingo-english-test");
  if (/\bpte\b/i.test(text))                                                  testsDetected.push("pte-academic-tests");
  if (textLower.includes("sat subject"))                                      testsDetected.push("sat-subject-tests");

  // ACT - Updated for attempt-based structure
  let actAttempts = [];
  const actPattern = /ACT[:\s]*(\d{1,2})\s+(?:Math[:\s]*(\d{1,2})\s+)?(?:English[:\s]*(\d{1,2})\s+)?(?:Reading[:\s]*(\d{1,2})\s+)?(?:Science[:\s]*(\d{1,2})\s+)?(?:Writing[:\s]*(\d{1,2}))?/i;
  const actMatch = text.match(actPattern);
  if (actMatch) {
    const attempt = {
      date: extractDateNear("ACT") || extractAnyDate(),
      composite: actMatch[1] || "",
      english: actMatch[3] || "",
      math: actMatch[2] || "",
      reading: actMatch[4] || "",
      science: actMatch[5] || "",
      writing: actMatch[6] || "",
      percentile: "",
    };
    if (attempt.composite) actAttempts.push(attempt);
  }

  // SAT - Enhanced parsing for College Board format
  let satAttempts = [];
  const linesArray = Array.isArray(lines) ? lines : [];
  
  // Method 1: Look for "Your Total Score" pattern
  const totalScoreIndex = linesArray.findIndex(line => line.includes("Your Total Score"));
  let totalScore = "";
  let mathScore = "";
  let readingWritingScore = "";
  let percentile = "";
  
  if (totalScoreIndex !== -1) {
    // Look for a 4-digit number within the next 5 lines
    for (let i = totalScoreIndex + 1; i <= Math.min(totalScoreIndex + 5, linesArray.length - 1); i++) {
      const numMatch = linesArray[i].match(/\b(1[2-9][0-9]{2}|1600)\b/);
      if (numMatch) {
        totalScore = numMatch[1];
        break;
      }
    }
  }
  
  // Method 2: Look for "Section Scores" to get Reading/Writing and Math
  const sectionScoresIndex = linesArray.findIndex(line => line.includes("Section Scores"));
  if (sectionScoresIndex !== -1) {
    let scoresFound = 0;
    for (let i = sectionScoresIndex + 1; i <= Math.min(sectionScoresIndex + 10, linesArray.length - 1); i++) {
      const scoreMatch = linesArray[i].match(/(\d{3})\s*\|/);
      if (scoreMatch) {
        if (scoresFound === 0) {
          readingWritingScore = scoreMatch[1];
        } else if (scoresFound === 1) {
          mathScore = scoreMatch[1];
        }
        scoresFound++;
      }
    }
  }
  
  // Method 3: Direct number matching for Math score
  if (!mathScore) {
    const mathPattern = /Math[\s\S]*?(\d{3})\s*\|\s*200 to 800/i;
    const mathMatch = text.match(mathPattern);
    if (mathMatch) mathScore = mathMatch[1];
  }
  
  // Method 4: Extract percentile
  const percentileMatch = text.match(/(\d{1,3})(?:st|nd|rd|th)/i);
  if (percentileMatch) {
    percentile = percentileMatch[1];
  }
  
  // Method 5: Fallback pattern
  if (!totalScore && !readingWritingScore && !mathScore) {
    const satPattern = /SAT[:\s]*(\d{3,4})\s+(?:Math[:\s]*(\d{3})\s+)?(?:Reading[:\s]*(\d{3})\s+)?(?:Writing[:\s]*(\d{3}))?/i;
    const satMatch = text.match(satPattern);
    if (satMatch) {
      totalScore = satMatch[1] || "";
      mathScore = satMatch[2] || "";
      readingWritingScore = satMatch[3] || "";
    }
  }
  
  if (totalScore || mathScore || readingWritingScore) {
    const attempt = {
      date: extractDateNear("SAT") || extractAnyDate(),
      total: totalScore || "",
      math: mathScore || "",
      reading: readingWritingScore || "",
      writing: readingWritingScore || "",
      percentile: percentile || "",
    };
    satAttempts.push(attempt);
    console.log(`📊 SAT extracted: Total=${totalScore}, Math=${mathScore}, Reading/Writing=${readingWritingScore}`);
  }

  // AP Subject Tests
  const apTests = [];
  const apPattern = /AP\s+([A-Za-z &:]+?)\s*[:\-]?\s*(\d)\b/gi;
  let apMatch;
  while ((apMatch = apPattern.exec(text)) !== null) {
    const subject = apMatch[1].trim();
    const score   = apMatch[2];
    if (!apTests.find((t) => t.subject === subject)) {
      apTests.push({ subject, score, month: "", year: "" });
    }
  }

  // IB Subject Tests
  const ibTests = [];
  const ibPattern = /IB\s+([A-Za-z &:]+?)\s+(HL|SL)\s*[:\-]?\s*(\d)\b/gi;
  let ibMatch;
  while ((ibMatch = ibPattern.exec(text)) !== null) {
    const subject = ibMatch[1].trim();
    const level   = ibMatch[2];
    const score   = ibMatch[3];
    if (!ibTests.find((t) => t.subject === subject)) {
      ibTests.push({ subject, level, score, year: "" });
    }
  }

  // Cambridge Exams
  const cambridgeTests = [];
  const cambridgePattern = /Cambridge\s+([A-Za-z &:]+?)\s+(AS|A|O)\s+Grade[:\s]*([A-FU*]+)\s+Date[:\s]*(\w+\s+\d{4})/i;
  let cambridgeMatch;
  while ((cambridgeMatch = cambridgePattern.exec(text)) !== null) {
    cambridgeTests.push({
      subject: cambridgeMatch[1].trim(),
      level: cambridgeMatch[2],
      grade: cambridgeMatch[3],
      date: cambridgeMatch[4],
    });
  }

  // IELTS - Simplified structure
  let ielts = null;
  const ieltsOverall   = first([/IELTS\s*(?:overall|band|score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsListening = first([/IELTS\s+listening\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsReading   = first([/IELTS\s+reading\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsWriting   = first([/IELTS\s+writing\s*[:\-]?\s*(\d+\.?\d*)\b/i]);
  const ieltsSpeaking  = first([/IELTS\s+speaking\s*[:\-]?\s*(\d+\.?\d*)\b/i]);

  if (ieltsOverall || ieltsListening || ieltsReading || ieltsWriting || ieltsSpeaking) {
    ielts = {
      ieltsPastTests: "1",
      ieltsTestDate: extractDateNear("IELTS") || extractAnyDate(),
      ieltsOverallBandScore: ieltsOverall || "",
      ieltsListeningScore: ieltsListening || "",
      ieltsReadingScore: ieltsReading || "",
      ieltsWritingScore: ieltsWriting || "",
      ieltsSpeakingScore: ieltsSpeaking || "",
    };
  }

  // TOEFL iBT - Simplified structure
  let toefl = null;
  const toeflTotal     = first([/TOEFL\s*(?:ibt|total|score)?\s*[:\-]?\s*(\d{2,3})\b/i]);
  const toeflReading   = first([/TOEFL\s+reading\s*[:\-]?\s*(\d{1,2})\b/i]);
  const toeflListening = first([/TOEFL\s+listening\s*[:\-]?\s*(\d{1,2})\b/i]);
  const toeflSpeaking  = first([/TOEFL\s+speaking\s*[:\-]?\s*(\d{1,2})\b/i]);
  const toeflWriting   = first([/TOEFL\s+writing\s*[:\-]?\s*(\d{1,2})\b/i]);

  if (toeflTotal || toeflReading || toeflListening || toeflSpeaking || toeflWriting) {
    toefl = {
      toeflPastTests: "1",
      toeflTestDate: extractDateNear("TOEFL") || extractAnyDate(),
      toeflTotalScore: toeflTotal || "",
      toeflReadingScore: toeflReading || "",
      toeflListeningScore: toeflListening || "",
      toeflSpeakingScore: toeflSpeaking || "",
      toeflWritingScore: toeflWriting || "",
    };
  }

  // Duolingo - Simplified structure
  let duolingo = null;
  const duoTotal         = first([/Duolingo\s*(?:total|overall|score)?\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoliteracy      = first([/literacy\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duocomprehension = first([/comprehension\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoconversation  = first([/conversation\s*[:\-]?\s*(\d{2,3})\b/i]);
  const duoproduction    = first([/production\s*[:\-]?\s*(\d{2,3})\b/i]);

  if (duoTotal || duoliteracy || duocomprehension || duoconversation || duoproduction) {
    duolingo = {
      duolingoPastTests: "1",
      duolingoTestDate: extractDateNear("Duolingo") || extractAnyDate(),
      duolingoTotalScore: duoTotal || "",
      duolingoLiteracyScore: duoliteracy || "",
      duolingoComprehensionScore: duocomprehension || "",
      duolingoConversationScore: duoconversation || "",
      duolingoProductionScore: duoproduction || "",
    };
  }

  // PTE Academic - Simplified structure
  let pte = null;
  const pteListening = first([/PTE\s+listening\s*[:\-]?\s*(\d{1,3})\b/i]);
  const pteReading   = first([/PTE\s+reading\s*[:\-]?\s*(\d{1,3})\b/i]);
  const pteSpeaking  = first([/PTE\s+speaking\s*[:\-]?\s*(\d{1,3})\b/i]);
  const pteWriting   = first([/PTE\s+writing\s*[:\-]?\s*(\d{1,3})\b/i]);
  const pteGrammar   = first([/grammar\s*[:\-]?\s*(\d{1,3})\b/i]);
  const pteVocabulary = first([/vocabulary\s*[:\-]?\s*(\d{1,3})\b/i]);

  if (pteListening || pteReading || pteSpeaking || pteWriting) {
    pte = {
      ptePastTests: "1",
      pteTestDate: extractDateNear("PTE") || extractAnyDate(),
      pteListeningScore: pteListening || "",
      pteReadingScore: pteReading || "",
      pteSpeakingScore: pteSpeaking || "",
      pteWritingScore: pteWriting || "",
      pteGrammarScore: pteGrammar || "",
      pteVocabularyScore: pteVocabulary || "",
    };
  }

  // SAT Subject Tests
  const satSubjectTests = [];
  const satSubjectPattern = /([A-Za-z][A-Za-z\s]+?)\s*[:\-]?\s*(\d{3})\b/g;
  let ssMatch;
  while ((ssMatch = satSubjectPattern.exec(text)) !== null) {
    const subject = ssMatch[1].trim();
    const score   = ssMatch[2];
    const scoreNum = parseInt(score);
    if (scoreNum >= 200 && scoreNum <= 800 && subject.length > 2) {
      if (!satSubjectTests.find((t) => t.subject === subject)) {
        satSubjectTests.push({ subject, score, date: extractAnyDate() });
      }
    }
  }

  return {
    testsDetected,
    actAttempts: actAttempts.length > 0 ? actAttempts : null,
    satAttempts: satAttempts.length > 0 ? satAttempts : null,
    satSubjectTests: satSubjectTests.length > 0 ? satSubjectTests : null,
    apTests: apTests.length > 0 ? apTests : null,
    ibTests: ibTests.length > 0 ? ibTests : null,
    cambridgeTests: cambridgeTests.length > 0 ? cambridgeTests : null,
    ielts,
    toefl,
    duolingo,
    pte,
  };
};

// =====================================================
// TEXT → SECTION-SPECIFIC PARSER
// Parses only the fields relevant to the given testType
// =====================================================
const parseTextForSection = (lines, testType) => {
  const text      = lines.join("\n");
  const textLower = text.toLowerCase();

  const first = (patterns) => {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) return (m[1] || m[0]).trim();
    }
    return null;
  };

  const extractDateNear = (keyword) => {
    const re = new RegExp(
      `${keyword}[^\\n]{0,80}((?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+(?:\\d{1,2},?\\s+)?\\d{4})`,
      "i"
    );
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  const extractAnyDate = () => {
    const m = text.match(
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},?\s+)?\d{4})/i
    );
    return m ? m[1].trim() : "";
  };

  switch (testType) {
    case "act-tests": {
      const actAttempts = [];
      const composite = first([/composite\s*[:\-]?\s*(\d{1,2})\b/i]);
      const math      = first([/math\s*[:\-]?\s*(\d{1,2})\b/i]);
      const english   = first([/english\s*[:\-]?\s*(\d{1,2})\b/i]);
      const reading   = first([/reading\s*[:\-]?\s*(\d{1,2})\b/i]);
      const science   = first([/science\s*[:\-]?\s*(\d{1,2})\b/i]);
      const writing   = first([/writing\s*[:\-]?\s*(\d{1,2})\b/i]);
      const dateStr   = extractDateNear("ACT") || extractAnyDate();

      if (composite || math || english || reading) {
        actAttempts.push({
          date: dateStr,
          composite: composite || "",
          english: english || "",
          math: math || "",
          reading: reading || "",
          science: science || "",
          writing: writing || "",
          percentile: "",
        });
      }
      return actAttempts.length > 0 ? { actAttempts, pastACTScores: String(actAttempts.length) } : {};
    }

    case "sat-tests": {
      const satAttempts = [];
      const linesArray = Array.isArray(lines) ? lines : [];
      
      let totalScore = "";
      let mathScore = "";
      let readingWritingScore = "";
      let percentile = "";
      let dateStr = extractDateNear("SAT") || extractAnyDate();
      
      // Method 1: Look for "Your Total Score" pattern
      const totalScoreIndex = linesArray.findIndex(line => line.includes("Your Total Score"));
      if (totalScoreIndex !== -1) {
        for (let i = totalScoreIndex + 1; i <= Math.min(totalScoreIndex + 5, linesArray.length - 1); i++) {
          const numMatch = linesArray[i].match(/\b(1[2-9][0-9]{2}|1600)\b/);
          if (numMatch) {
            totalScore = numMatch[1];
            break;
          }
        }
      }
      
      // Method 2: Look for "Section Scores"
      const sectionScoresIndex = linesArray.findIndex(line => line.includes("Section Scores"));
      if (sectionScoresIndex !== -1) {
        let scoresFound = 0;
        for (let i = sectionScoresIndex + 1; i <= Math.min(sectionScoresIndex + 10, linesArray.length - 1); i++) {
          const scoreMatch = linesArray[i].match(/(\d{3})\s*\|/);
          if (scoreMatch) {
            if (scoresFound === 0) {
              readingWritingScore = scoreMatch[1];
            } else if (scoresFound === 1) {
              mathScore = scoreMatch[1];
            }
            scoresFound++;
          }
        }
      }
      
      // Method 3: Extract percentile
      const percentileMatch = text.match(/(\d{1,3})(?:st|nd|rd|th)/i);
      if (percentileMatch) {
        percentile = percentileMatch[1];
      }
      
      // Method 4: Fallback regex
      if (!totalScore && !readingWritingScore && !mathScore) {
        const total   = first([/total\s*[:\-]?\s*(\d{3,4})\b/i]);
        const math    = first([/math\s*[:\-]?\s*(\d{3,4})\b/i]);
        const reading = first([/reading\s*[:\-]?\s*(\d{3,4})\b/i]);
        const writing = first([/writing\s*[:\-]?\s*(\d{3,4})\b/i]);
        
        totalScore = total || "";
        mathScore = math || "";
        readingWritingScore = reading || writing || "";
      }
      
      console.log(`📊 SAT section extraction: Total=${totalScore}, Math=${mathScore}, Reading/Writing=${readingWritingScore}`);
      
      if (totalScore || mathScore || readingWritingScore) {
        satAttempts.push({
          date: dateStr,
          total: totalScore || "",
          math: mathScore || "",
          reading: readingWritingScore || "",
          writing: readingWritingScore || "",
          percentile: percentile || "",
        });
      }
      
      return satAttempts.length > 0 ? { satAttempts, pastSATScores: String(satAttempts.length) } : {};
    }

    case "sat-subject-tests": {
      const satSubjectTests = [];
      const subjectPattern = /([A-Za-z][A-Za-z\s]+?)\s*[:\-]?\s*(\d{3})\b/g;
      let ssMatch;
      while ((ssMatch = subjectPattern.exec(text)) !== null) {
        const subject = ssMatch[1].trim();
        const score   = ssMatch[2];
        const scoreNum = parseInt(score);
        if (scoreNum >= 200 && scoreNum <= 800 && subject.length > 2) {
          if (!satSubjectTests.find((t) => t.subject === subject)) {
            satSubjectTests.push({ subject, score, date: extractAnyDate() });
          }
        }
      }
      return satSubjectTests.length > 0 
        ? { satSubjectTests, numberOfSATSubjectTests: String(satSubjectTests.length) } 
        : {};
    }

 case "ap-subject-tests": {
  const apTests = [];
  const joinedLines = lines.map(l => l.trim());

  const subjectList = [
    "Biology", "Chemistry", "Physics", "Calculus AB", "Calculus BC",
    "Statistics", "English Language", "English Literature",
    "US History", "World History", "Psychology"
  ];

  for (let i = 0; i < joinedLines.length; i++) {
    const line = joinedLines[i];

    for (const subject of subjectList) {
      if (line.toLowerCase().includes(subject.toLowerCase())) {

        // 🔍 Look ahead for score (next 1–2 lines)
        let score = "";

        for (let j = i; j <= i + 2; j++) {
          const scoreMatch = joinedLines[j]?.match(/\b([1-5])\b/);
          if (scoreMatch) {
            score = scoreMatch[1];
            break;
          }
        }

        if (score) {
          apTests.push({
            subject,
            score,
            month: "May",
            year: (extractAnyDate()?.match(/\d{4}/) || [""])[0]
          });
        }
      }
    }
  }

  return apTests.length > 0
    ? {
        apSubjectTests: apTests,
        numberOfAPTests: String(apTests.length)
      }
    : {};
}
   case "ib-subject-tests": {
  const ibTests = [];

  // ✅ Improved regex (IB optional + flexible subjects)
  const ibPattern = /(?:IB\s+)?([A-Za-z &()]+?)\s+(HL|SL)\s*[:\-]?\s*(\d)\b/gi;

  let ibMatch;
  while ((ibMatch = ibPattern.exec(text)) !== null) {
    const subject = ibMatch[1].trim();
    const level   = ibMatch[2];
    const score   = ibMatch[3];

    // ✅ Extract only YEAR (fixes frontend issue)
    const fullDate = extractAnyDate();
    const yearOnly = fullDate ? fullDate.match(/\d{4}/)?.[0] : "";

    // ✅ Prevent duplicate (subject + level)
    if (!ibTests.find((t) => t.subject === subject && t.level === level)) {
      ibTests.push({
        subject,
        level,
        score,
        year: yearOnly,
      });
    }
  }

  // ✅ Fallback for multiline PDFs (VERY IMPORTANT)
  if (ibTests.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/HL|SL/i.test(line)) {
        const subject = lines[i - 1] || "";
        const levelMatch = line.match(/HL|SL/i);
        const level = levelMatch ? levelMatch[0] : "";

        const scoreMatch = lines[i + 1]?.match(/\b\d\b/);
        const score = scoreMatch ? scoreMatch[0] : "";

        const fullDate = extractAnyDate();
        const yearOnly = fullDate ? fullDate.match(/\d{4}/)?.[0] : "";

        if (
          subject &&
          level &&
          score &&
          !ibTests.find((t) => t.subject === subject && t.level === level)
        ) {
          ibTests.push({
            subject: subject.trim(),
            level,
            score,
            year: yearOnly,
          });
        }
      }
    }
  }

  return ibTests.length > 0
    ? {
        ibSubjectTests: ibTests,
        numberOfIBTests: String(ibTests.length),
      }
    : {};
}

case "cambridge": {
  const cambridgeTests = [];
  const joinedLines = lines.map(l => l.trim()).filter(Boolean);

  const levelRegex = /\b(AS|A|O)\b/i;
  const gradeRegex = /\b(A\*|A|B|C|D|E|F|G|U|Pending)\b/i;
  const dateRegex  = /\b(January|February|March|April|May|June|July|August|September|October|November|December|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}\b/i;

  for (let i = 0; i < joinedLines.length; i++) {
    const line = joinedLines[i];

    let subject = "";
    let level = "";
    let grade = "";
    let date = "";

    // 👉 Assume subject = current line (if it's not just numbers/keywords)
    if (
      line.length > 3 &&
      !levelRegex.test(line) &&
      !gradeRegex.test(line) &&
      !dateRegex.test(line)
    ) {
      subject = line;
    } else {
      continue;
    }

    // 🔍 Look ahead for details
    for (let j = i + 1; j <= i + 4 && j < joinedLines.length; j++) {
      const next = joinedLines[j];

      if (!level) {
        const m = next.match(levelRegex);
        if (m) level = m[1].toUpperCase();
      }

      if (!grade) {
        const m = next.match(gradeRegex);
        if (m) grade = m[1].toUpperCase();
      }

      if (!date) {
        const m = next.match(dateRegex);
        if (m) {
          let rawDate = m[0];

          // Normalize to "MON YYYY"
          const parts = rawDate.split(" ");
          const monthMap = {
            january: "JAN", february: "FEB", march: "MAR", april: "APR",
            may: "MAY", june: "JUN", july: "JUL", august: "AUG",
            september: "SEP", october: "OCT", november: "NOV", december: "DEC"
          };

          const month = monthMap[parts[0].toLowerCase()] || parts[0].toUpperCase();
          const year = parts[1];

          date = `${month} ${year}`;
        }
      }
    }

    // ✅ Push only valid entries
    if (subject && (level || grade || date)) {
      cambridgeTests.push({
        subject,
        level,
        grade,
        date
      });
    }
  }

  return cambridgeTests.length > 0
    ? {
        cambridgeTests,
       cambridgeNumberOfTests: cambridgeTests.length
      }
    : {};
}
   case "ielts": {
  const overall = first([
    /overall\s*(?:band\s*)?(?:score)?\s*[:\-]?\s*(\d+\.?\d*)\b/i
  ]);

  const listening = first([
    /listening\s*[:\-]?\s*(\d+\.?\d*)\b/i
  ]);

  const reading = first([
    /reading\s*[:\-]?\s*(\d+\.?\d*)\b/i
  ]);

  const writing = first([
    /writing\s*[:\-]?\s*(\d+\.?\d*)\b/i
  ]);

  const speaking = first([
    /speaking\s*[:\-]?\s*(\d+\.?\d*)\b/i
  ]);

  const dateStr = extractDateNear("IELTS") || extractAnyDate();

  // ❗ Only return IELTS block if at least ONE score exists
  const hasAnyScore =
    overall || listening || reading || writing || speaking;

  if (!hasAnyScore) return {};

  return {
    ieltsPastTests: "1",
    ...(dateStr && { ieltsTestDate: dateStr }),

    ...(overall && { ieltsOverallBandScore: overall }),
    ...(listening && { ieltsListeningScore: listening }),
    ...(reading && { ieltsReadingScore: reading }),
    ...(writing && { ieltsWritingScore: writing }),
    ...(speaking && { ieltsSpeakingScore: speaking }),
  };
}

  case "toefl-ibt": {
  const total     = first([/total\s*(?:score)?\s*[:\-]?\s*(\d{2,3})\b/i]);
  const reading   = first([/reading\s*[:\-]?\s*(\d{1,2})\b/i]);
  const listening = first([/listening\s*[:\-]?\s*(\d{1,2})\b/i]);
  const speaking  = first([/speaking\s*[:\-]?\s*(\d{1,2})\b/i]);
  const writing   = first([/writing\s*[:\-]?\s*(\d{1,2})\b/i]);
  const dateStr   = extractDateNear("TOEFL") || extractAnyDate();

  // count how many section scores exist
  const sectionCount = [reading, listening, speaking, writing]
    .filter(Boolean).length;

  // only mark as valid TOEFL if enough data exists
  const hasValidToefl = total || sectionCount >= 2;

  if (!hasValidToefl) return {};

  return {
    toeflPastTests: "1",
    ...(dateStr && { toeflTestDate: dateStr }),

    ...(total && { toeflTotalScore: total }),
    ...(reading && { toeflReadingScore: reading }),
    ...(listening && { toeflListeningScore: listening }),
    ...(speaking && { toeflSpeakingScore: speaking }),
    ...(writing && { toeflWritingScore: writing }),
  };
}

    case "pte-academic-tests": {
      const listening  = first([/listening\s*[:\-]?\s*(\d{1,3})\b/i]);
      const reading    = first([/reading\s*[:\-]?\s*(\d{1,3})\b/i]);
      const speaking   = first([/speaking\s*[:\-]?\s*(\d{1,3})\b/i]);
      const writing    = first([/writing\s*[:\-]?\s*(\d{1,3})\b/i]);
      const grammar    = first([/grammar\s*[:\-]?\s*(\d{1,3})\b/i]);
      const vocabulary = first([/vocabulary\s*[:\-]?\s*(\d{1,3})\b/i]);
      const dateStr    = extractDateNear("PTE") || extractAnyDate();

      return {
        ...(listening && { ptePastTests: "1", pteListeningScore: listening, pteTestDate: dateStr }),
        ...(reading && { pteReadingScore: reading }),
        ...(speaking && { pteSpeakingScore: speaking }),
        ...(writing && { pteWritingScore: writing }),
        ...(grammar && { pteGrammarScore: grammar }),
        ...(vocabulary && { pteVocabularyScore: vocabulary }),
      };
    }

  case "duolingo-english-test": {
  const joinedText = lines.join(" ").toLowerCase();

  // ✅ Extract all 3-digit numbers (Duolingo scores range: 10–160 → mostly 3-digit)
  const numbers = joinedText.match(/\b\d{2,3}\b/g) || [];

  let literacy = "";
  let comprehension = "";
  let conversation = "";
  let production = "";
  let total = "";

  // ✅ Filter only valid Duolingo score range (10–160)
  const validScores = numbers
    .map(n => Number(n))
    .filter(n => n >= 10 && n <= 160);

  if (validScores.length >= 4) {
    // Standard DET order mapping
    conversation  = String(validScores[0]); // speaking
    production    = String(validScores[1]); // writing
    literacy      = String(validScores[2]); // reading
    comprehension = String(validScores[3]); // listening
  }

  // ✅ Calculate total if not directly available
  if (validScores.length >= 4) {
    total = String(
      Math.round(
        (validScores[0] + validScores[1] + validScores[2] + validScores[3]) / 4
      )
    );
  }

  // ✅ Extract Test Date (better pattern)
  let testDate = "";
  const dateMatch = joinedText.match(/test taken:\s*([a-z]+\s+\d{1,2},\s+\d{4})/i);

  if (dateMatch) {
    const parts = dateMatch[1].split(" ");
    const month = parts[0];
    const year = parts[2];
    testDate = `${month} ${year}`; // October 2024
  }

  return {
    duolingoPastTests: "1",
    duolingoTestDate: testDate,
    duolingoLiteracyScore: literacy,
    duolingoComprehensionScore: comprehension,
    duolingoConversationScore: conversation,
    duolingoProductionScore: production,
    duolingoTotalScore: total,
  };
}
    default:
      const full = parseTextForTestData(lines);
      return full[testType] || {};
  }
};

// =====================================================
// VALIDATION helpers
// =====================================================
const calculateTestingProgress = (testingCompletion, testsToReport = []) => {
  if (!testingCompletion) return 0;

  const testToCompletionMap = {
    "act-tests":             "actTests",
    "sat-tests":             "satTests",
    "sat-subject-tests":     "satSubjectTests",
    "ap-subject-tests":      "apSubjectTests",
    "ib-subject-tests":      "ibSubjectTests",
    cambridge:               "cambridge",
    "toefl-ibt":             "toeflIbt",
    "pte-academic-tests":    "pteAcademic",
    ielts:                   "ielts",
    "duolingo-english-test": "duolingo",
    "senior-secondary-exams":"seniorSecondary",
  };

  const mandatorySections = ["testsTaken"];
  const relevantSections  = [...mandatorySections];

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
      return data.pastACTScores !== undefined && data.pastACTScores !== "";

    case "sat-tests":
      return data.pastSATScores !== undefined && data.pastSATScores !== "";

    case "sat-subject-tests":
      return data.numberOfSATSubjectTests !== undefined && data.numberOfSATSubjectTests !== "";

    case "ap-subject-tests":
      return data.numberOfAPTests !== undefined && data.numberOfAPTests !== "";

    case "ib-subject-tests":
      return data.numberOfIBTests !== undefined && data.numberOfIBTests !== "";

    case "cambridge":
      return data.cambridgeNumberOfTests !== undefined && data.cambridgeNumberOfTests !== "";

    case "toefl-ibt":
      return data.toeflPastTests !== undefined && data.toeflPastTests !== "";

    case "pte-academic-tests":
      return data.ptePastTests !== undefined && data.ptePastTests !== "";

    case "ielts":
      return data.ieltsPastTests !== undefined && data.ieltsPastTests !== "";

    case "duolingo-english-test":
      return data.duolingoPastTests !== undefined && data.duolingoPastTests !== "";

    case "senior-secondary-exams":
      return !!(data.seniorSecondaryExams && data.seniorSecondaryExams.length > 0);

    default:
      return false;
  }
};

// =====================================================
// 📤  PARSE CV
// =====================================================
export const parseCV = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

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
      // ⏳ Ensure S3 upload is fully available
await new Promise((resolve) => setTimeout(resolve, 1500));

const lines = await runTextract(req.file);

      if (lines.length < 3) {
        return res.status(422).json({
          success: false,
          message: "Textract could not extract enough text from this document. Please ensure the file is text-based (not a scanned image) and try again.",
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
// 📤  PARSE SCORE DOCUMENT
// =====================================================
export const parseScoreDocument = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  scoreDocUpload.single("file")(req, res, async (err) => {
    if (err) {
      console.error("Multer/S3 upload error:", err);
      return res.status(400).json({ success: false, message: err.message || "File upload error" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const testType = req.body?.testType || req.query?.testType || "";
    if (!testType) {
      return res.status(400).json({ success: false, message: "testType is required" });
    }

    const validTypes = [
      "act-tests", "sat-tests", "sat-subject-tests", "ap-subject-tests",
      "ib-subject-tests", "ielts", "toefl-ibt", "pte-academic-tests",
      "duolingo-english-test", "cambridge",
    ];
    if (!validTypes.includes(testType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid testType. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    console.log(`📄 Score doc uploaded for section: ${testType}`);
    console.log(`📁 S3 Key: ${req.file.key}`);

    try {
      const lines = await runTextract(req.file);

      if (lines.length < 2) {
        return res.status(422).json({
          success: false,
          message: "Could not extract text from this document. Please ensure it is a text-based (not scanned) PDF and try again.",
        });
      }

      console.log(`📝 Extracted ${lines.length} lines for ${testType}. First 10:`, lines.slice(0, 10));

      const extractedFields = parseTextForSection(lines, testType);
      const fieldCount      = Object.keys(extractedFields).length;

      if (fieldCount === 0) {
        return res.status(200).json({
          success: true,
          message: `Document uploaded but no ${testType.replace(/-/g, " ").toUpperCase()} scores were detected. Please fill the fields manually.`,
          extractedFields: {},
          detectedCount: 0,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Successfully extracted ${fieldCount} field(s) from your score report.`,
        extractedFields,
        detectedCount: fieldCount,
      });
    } catch (parseError) {
      console.error("Score doc parsing error:", parseError);
      const isTimeout = parseError.message?.includes("timed out");
      return res.status(isTimeout ? 504 : 500).json({
        success: false,
        message: isTimeout
          ? "The document is taking too long to process. Please try a smaller or text-based PDF."
          : parseError.message || "Failed to parse score document",
      });
    }
  });
};

// =====================================================
// 📥  CREATE OR UPDATE TESTING DATA
// =====================================================
export const createOrUpdateFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updateData = { ...req.body };
    delete updateData.studentId;
    delete updateData.account;

    // Normalize IB level values
    if (Array.isArray(updateData.ibSubjectTests)) {
      updateData.ibSubjectTests = updateData.ibSubjectTests.map((test) => {
        if (!test) return test;
        let level = test.level;
        if (level === "Higher level (HL)") level = "HL";
        else if (level === "Standard level (SL)") level = "SL";
        else if (!level) level = "";
        return { ...test, level };
      });
    }

    const completionStatus = {
      testsTaken:      validateTestingSection("tests-taken", updateData),
      actTests:        validateTestingSection("act-tests", updateData),
      satTests:        validateTestingSection("sat-tests", updateData),
      satSubjectTests: validateTestingSection("sat-subject-tests", updateData),
      apSubjectTests:  validateTestingSection("ap-subject-tests", updateData),
      ibSubjectTests:  validateTestingSection("ib-subject-tests", updateData),
      cambridge:       validateTestingSection("cambridge", updateData),
      toeflIbt:        validateTestingSection("toefl-ibt", updateData),
      pteAcademic:     validateTestingSection("pte-academic-tests", updateData),
      ielts:           validateTestingSection("ielts", updateData),
      duolingo:        validateTestingSection("duolingo-english-test", updateData),
      seniorSecondary: validateTestingSection("senior-secondary-exams", updateData),
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