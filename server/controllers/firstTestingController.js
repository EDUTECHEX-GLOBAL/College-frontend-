// server/controllers/firstTestingController.js
import FirstTesting from "../models/firstTestingModel.js";
import Account from "../models/accountModel.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";
import { getFileUrl } from "../middleware/uploadMiddleware.js";

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
  console.log(`⏱️ Polling Textract job ${jobId} (max ${maxPolls} polls × ${intervalMs}ms)`);

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
    `Textract job timed out after ${maxPolls} polls. The CV may be too large or complex.`
  );
};

// Create upload middleware for CV
const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT file'), false);
    }
  }
});

// Helper function to parse text and extract test data
const parseTextForTestData = (text) => {
  const extractedData = {
    tests: [],
    act: null,
    sat: null,
    ap: [],
    ib: [],
    ielts: null,
    toefl: null,
    duolingo: null,
    pte: null,
    cambridge: null
  };
  
  const textLower = text.toLowerCase();
  
  // Detect tests present
  if (textLower.includes('act')) extractedData.tests.push('ACT');
  if (textLower.includes('sat')) extractedData.tests.push('SAT');
  if (textLower.includes('ap ') || textLower.includes('advanced placement')) extractedData.tests.push('AP');
  if (textLower.includes('ib ') || textLower.includes('international baccalaureate')) extractedData.tests.push('IB');
  if (textLower.includes('ielts')) extractedData.tests.push('IELTS');
  if (textLower.includes('toefl')) extractedData.tests.push('TOEFL');
  if (textLower.includes('duolingo')) extractedData.tests.push('Duolingo');
  if (textLower.includes('pte')) extractedData.tests.push('PTE');
  if (textLower.includes('cambridge')) extractedData.tests.push('Cambridge');
  
  // Extract ACT scores
  const actCompositeMatch = text.match(/ACT[:\s]*(\d+)\s*(?:composite|score)?/i);
  const actMathMatch = text.match(/ACT\s+math[:\s]*(\d+)/i);
  const actEnglishMatch = text.match(/ACT\s+english[:\s]*(\d+)/i);
  const actReadingMatch = text.match(/ACT\s+reading[:\s]*(\d+)/i);
  const actScienceMatch = text.match(/ACT\s+science[:\s]*(\d+)/i);
  
  if (actCompositeMatch || actMathMatch || actEnglishMatch || actReadingMatch || actScienceMatch) {
    extractedData.act = {
      pastTests: '1',
      scores: {
        composite: actCompositeMatch ? actCompositeMatch[1] : null,
        math: actMathMatch ? actMathMatch[1] : null,
        english: actEnglishMatch ? actEnglishMatch[1] : null,
        reading: actReadingMatch ? actReadingMatch[1] : null,
        science: actScienceMatch ? actScienceMatch[1] : null
      }
    };
  }
  
  // Extract SAT scores
  const satTotalMatch = text.match(/SAT[:\s]*(\d{3,4})/i);
  const satMathMatch = text.match(/SAT\s+math[:\s]*(\d{3,4})/i);
  const satReadingMatch = text.match(/SAT\s+(?:reading|evidence-based reading)[:\s]*(\d{3,4})/i);
  const satWritingMatch = text.match(/SAT\s+writing[:\s]*(\d{3,4})/i);
  
  if (satTotalMatch || satMathMatch || satReadingMatch || satWritingMatch) {
    extractedData.sat = {
      pastTests: '1',
      scores: {
        total: satTotalMatch ? satTotalMatch[1] : null,
        math: satMathMatch ? satMathMatch[1] : null,
        reading: satReadingMatch ? satReadingMatch[1] : null,
        writing: satWritingMatch ? satWritingMatch[1] : null
      }
    };
  }
  
  // Extract AP tests
  const apPattern = /AP\s+(\w+(?:\s+\w+)*)\s*[:\-]?\s*(\d+)/gi;
  let apMatch;
  while ((apMatch = apPattern.exec(text)) !== null) {
    extractedData.ap.push({
      subject: apMatch[1].trim(),
      score: apMatch[2],
      year: null,
      month: null
    });
  }
  
  // Extract IB tests
  const ibPattern = /IB\s+(\w+(?:\s+\w+)*)\s*(?:HL|SL)\s*[:\-]?\s*(\d+)/gi;
  let ibMatch;
  while ((ibMatch = ibPattern.exec(text)) !== null) {
    extractedData.ib.push({
      subject: ibMatch[1].trim(),
      level: text.includes('HL') ? 'HL' : 'SL',
      score: ibMatch[2],
      year: null,
      month: null
    });
  }
  
  // Extract IELTS scores
  const ieltsOverallMatch = text.match(/IELTS[:\s]*(\d+\.?\d*)/i);
  const ieltsListeningMatch = text.match(/listening[:\s]*(\d+\.?\d*)/i);
  const ieltsReadingMatch = text.match(/reading[:\s]*(\d+\.?\d*)/i);
  const ieltsWritingMatch = text.match(/writing[:\s]*(\d+\.?\d*)/i);
  const ieltsSpeakingMatch = text.match(/speaking[:\s]*(\d+\.?\d*)/i);
  
  if (ieltsOverallMatch || ieltsListeningMatch || ieltsReadingMatch || ieltsWritingMatch || ieltsSpeakingMatch) {
    extractedData.ielts = {
      pastTests: '1',
      scores: {
        overall: ieltsOverallMatch ? ieltsOverallMatch[1] : null,
        listening: ieltsListeningMatch ? ieltsListeningMatch[1] : null,
        reading: ieltsReadingMatch ? ieltsReadingMatch[1] : null,
        writing: ieltsWritingMatch ? ieltsWritingMatch[1] : null,
        speaking: ieltsSpeakingMatch ? ieltsSpeakingMatch[1] : null
      }
    };
  }
  
  // Extract TOEFL scores
  const toeflTotalMatch = text.match(/TOEFL[:\s]*(\d+)/i);
  const toeflReadingMatch = text.match(/reading[:\s]*(\d+)/i);
  const toeflListeningMatch = text.match(/listening[:\s]*(\d+)/i);
  const toeflSpeakingMatch = text.match(/speaking[:\s]*(\d+)/i);
  const toeflWritingMatch = text.match(/writing[:\s]*(\d+)/i);
  
  if (toeflTotalMatch || toeflReadingMatch || toeflListeningMatch || toeflSpeakingMatch || toeflWritingMatch) {
    extractedData.toefl = {
      pastTests: '1',
      scores: {
        total: toeflTotalMatch ? toeflTotalMatch[1] : null,
        reading: toeflReadingMatch ? toeflReadingMatch[1] : null,
        listening: toeflListeningMatch ? toeflListeningMatch[1] : null,
        speaking: toeflSpeakingMatch ? toeflSpeakingMatch[1] : null,
        writing: toeflWritingMatch ? toeflWritingMatch[1] : null
      }
    };
  }
  
  // Extract Duolingo scores
  const duolingoTotalMatch = text.match(/Duolingo[:\s]*(\d+)/i);
  const duolingoLiteracyMatch = text.match(/literacy[:\s]*(\d+)/i);
  const duolingoComprehensionMatch = text.match(/comprehension[:\s]*(\d+)/i);
  const duolingoConversationMatch = text.match(/conversation[:\s]*(\d+)/i);
  const duolingoProductionMatch = text.match(/production[:\s]*(\d+)/i);
  
  if (duolingoTotalMatch || duolingoLiteracyMatch || duolingoComprehensionMatch || duolingoConversationMatch || duolingoProductionMatch) {
    extractedData.duolingo = {
      pastTests: '1',
      scores: {
        total: duolingoTotalMatch ? duolingoTotalMatch[1] : null,
        literacy: duolingoLiteracyMatch ? duolingoLiteracyMatch[1] : null,
        comprehension: duolingoComprehensionMatch ? duolingoComprehensionMatch[1] : null,
        conversation: duolingoConversationMatch ? duolingoConversationMatch[1] : null,
        production: duolingoProductionMatch ? duolingoProductionMatch[1] : null
      }
    };
  }
  
  // Extract PTE scores
  const pteTotalMatch = text.match(/PTE[:\s]*(\d+)/i);
  const pteListeningMatch = text.match(/listening[:\s]*(\d+)/i);
  const pteReadingMatch = text.match(/reading[:\s]*(\d+)/i);
  const pteSpeakingMatch = text.match(/speaking[:\s]*(\d+)/i);
  const pteWritingMatch = text.match(/writing[:\s]*(\d+)/i);
  
  if (pteTotalMatch || pteListeningMatch || pteReadingMatch || pteSpeakingMatch || pteWritingMatch) {
    extractedData.pte = {
      pastTests: '1',
      scores: {
        total: pteTotalMatch ? pteTotalMatch[1] : null,
        listening: pteListeningMatch ? pteListeningMatch[1] : null,
        reading: pteReadingMatch ? pteReadingMatch[1] : null,
        speaking: pteSpeakingMatch ? pteSpeakingMatch[1] : null,
        writing: pteWritingMatch ? pteWritingMatch[1] : null
      }
    };
  }
  
  return extractedData;
};

// Calculate testing progress based on ONLY RELEVANT sections
const calculateTestingProgress = (testingCompletion, testsToReport = []) => {
  if (!testingCompletion) return 0;

  const testToCompletionMap = {
    'act-tests': 'actTests',
    'sat-tests': 'satTests',
    'sat-subject-tests': 'satSubjectTests',
    'ap-subject-tests': 'apSubjectTests',
    'ib-subject-tests': 'ibSubjectTests',
    'cambridge': 'cambridge',
    'toefl-ibt': 'toeflIbt',
    'pte-academic-tests': 'pteAcademic',
    'ielts': 'ielts',
    'duolingo-english-test': 'duolingo',
    'senior-secondary-exams': 'seniorSecondary',
  };

  const mandatorySections = ['testsTaken'];
  const relevantSections = [...mandatorySections];
  
  testsToReport.forEach(test => {
    const completionField = testToCompletionMap[test];
    if (completionField && testingCompletion[completionField] !== undefined) {
      relevantSections.push(completionField);
    }
  });

  let completedCount = 0;
  let totalRelevantSections = relevantSections.length;

  relevantSections.forEach(section => {
    if (testingCompletion[section]) {
      completedCount++;
    }
  });

  if (totalRelevantSections === 0) return 0;
  return Math.round((completedCount / totalRelevantSections) * 100);
};

// Validate individual testing sections
const validateTestingSection = (section, data) => {
  switch (section) {
    case "tests-taken":
      if (!data.selfReportScores || !data.internationalPromotionExams) {
        return false;
      }
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
      const hasNumberOfTests = !!data.cambridgeNumberOfTests;
      const hasValidTests = !data.cambridgeNumberOfTests || (data.cambridgeTests && data.cambridgeTests.length === parseInt(data.cambridgeNumberOfTests));
      const hasCertificateAnswer = !!data.cambridgeCertificateReport;
      const hasCertificateDetails = data.cambridgeCertificateReport !== "yes" || (data.cambridgeCertificateDetails?.level && data.cambridgeCertificateDetails?.date);
      return hasNumberOfTests && hasValidTests && hasCertificateAnswer && hasCertificateDetails;
    }

    case "toefl-ibt": {
      const hasPastTests = !!data.toeflPastTests;
      const hasFutureSittings = !!data.toeflFutureSittings;
      const hasScores = !data.toeflPastTests || parseInt(data.toeflPastTests) === 0 || (data.toeflHighestReadingScore && data.toeflReadingScoreDate && data.toeflHighestSpeakingScore && data.toeflSpeakingScoreDate && data.toeflHighestListeningScore && data.toeflListeningScoreDate && data.toeflHighestWritingScore && data.toeflWritingScoreDate && data.toeflHighestTotalScore && data.toeflTotalScoreDate);
      return hasPastTests && hasFutureSittings && hasScores;
    }

    case "pte-academic-tests": {
      const pteHasPastTests = !!data.ptePastTests;
      const pteHasFutureSittings = !!data.pteFutureSittings;
      const pteHasScores = !data.ptePastTests || parseInt(data.ptePastTests) === 0 || (data.pteHighestListeningScore && data.pteListeningScoreDate && data.pteHighestReadingScore && data.pteReadingScoreDate && data.pteHighestSpeakingScore && data.pteSpeakingScoreDate && data.pteHighestWritingScore && data.pteWritingScoreDate);
      return pteHasPastTests && pteHasFutureSittings && pteHasScores;
    }

    case "ielts": {
      const ieltsHasPastTests = !!data.ieltsPastTests;
      const ieltsHasFutureSittings = !!data.ieltsFutureSittings;
      const ieltsHasScores = !data.ieltsPastTests || parseInt(data.ieltsPastTests) === 0 || (data.ieltsHighestListeningScore && data.ieltsListeningScoreDate && data.ieltsHighestReadingScore && data.ieltsReadingScoreDate && data.ieltsHighestWritingScore && data.ieltsWritingScoreDate && data.ieltsHighestSpeakingScore && data.ieltsSpeakingScoreDate && data.ieltsHighestOverallScore && data.ieltsOverallScoreDate);
      return ieltsHasPastTests && ieltsHasFutureSittings && ieltsHasScores;
    }

    case "duolingo-english-test": {
      const duolingoHasPastTests = !!data.duolingoPastTests;
      const duolingoHasFutureSittings = !!data.duolingoFutureSittings;
      const duolingoHasScores = !data.duolingoPastTests || parseInt(data.duolingoPastTests) === 0 || (data.duolingoHighestLiteracyScore && data.duolingoLiteracyScoreDate && data.duolingoHighestComprehensionScore && data.duolingoComprehensionScoreDate && data.duolingoHighestConversationScore && data.duolingoConversationScoreDate && data.duolingoHighestProductionScore && data.duolingoProductionScoreDate && data.duolingoHighestTotalScore && data.duolingoTotalScoreDate);
      return duolingoHasPastTests && duolingoHasFutureSittings && duolingoHasScores;
    }

    case "senior-secondary-exams":
      return !!(data.seniorSecondaryExams && data.seniorSecondaryExams.length > 0);

    default:
      return false;
  }
};

// ================================
// 📤 PARSE CV UPLOAD
// ================================
export const parseCV = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    cvUpload.single('cv')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      try {
        let text = '';
        
        // Handle different file types
        if (file.mimetype === 'application/pdf') {
          // For PDF, we need to use Textract
          console.log("📑 PDF detected — using Textract");
          
          // For now, since we don't have S3 upload set up for testing, 
          // we'll use a simple approach for text files
          // For PDFs, you may need to implement S3 upload similar to educationController
          text = file.buffer.toString('utf-8');
        } else if (file.mimetype.includes('word')) {
          // For DOCX, we'll use a simple approach
          text = file.buffer.toString('utf-8');
        } else if (file.mimetype === 'text/plain') {
          text = file.buffer.toString('utf-8');
        } else {
          throw new Error('Unsupported file type');
        }

        if (!text || text.trim().length === 0) {
          throw new Error('Could not extract text from file');
        }

        const extractedData = parseTextForTestData(text);

        res.status(200).json({
          success: true,
          message: 'CV parsed successfully',
          extractedData
        });
      } catch (parseError) {
        console.error('CV parsing error:', parseError);
        res.status(500).json({
          success: false,
          message: parseError.message || 'Failed to parse CV content'
        });
      }
    });
  } catch (error) {
    console.error('Error in CV upload:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing CV'
    });
  }
};

// ================================
// 📥 CREATE OR UPDATE TESTING DATA
// ================================
export const createOrUpdateFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

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
      testsTaken: validateTestingSection("tests-taken", updateData),
      actTests: validateTestingSection("act-tests", updateData),
      satTests: validateTestingSection("sat-tests", updateData),
      satSubjectTests: validateTestingSection("sat-subject-tests", updateData),
      apSubjectTests: validateTestingSection("ap-subject-tests", updateData),
      ibSubjectTests: validateTestingSection("ib-subject-tests", updateData),
      cambridge: validateTestingSection("cambridge", updateData),
      toeflIbt: validateTestingSection("toefl-ibt", updateData),
      pteAcademic: validateTestingSection("pte-academic-tests", updateData),
      ielts: validateTestingSection("ielts", updateData),
      duolingo: validateTestingSection("duolingo-english-test", updateData),
      seniorSecondary: validateTestingSection("senior-secondary-exams", updateData),
    };

    const testingProgress = calculateTestingProgress(completionStatus, updateData.testsToReport || []);
    updateData.testingCompletion = completionStatus;
    updateData.testingProgress = testingProgress;

    const testingRecord = await FirstTesting.findOneAndUpdate(
      { account: userId },
      { ...updateData, account: userId },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await Account.findByIdAndUpdate(userId, {
      $set: {
        "applicationProgress.testing": testingProgress,
      },
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

// ================================
// 🔍 GET TESTING DATA
// ================================
export const getFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const testingData = await FirstTesting.findOne({ account: userId });

    if (!testingData) {
      return res.status(200).json({
        success: true,
        testing: null,
        testingProgress: 0,
      });
    }

    res.status(200).json({
      success: true,
      testing: testingData,
      testingProgress: testingData.testingProgress || 0,
    });
  } catch (error) {
    console.error("❌ Error fetching testing data:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching testing data",
    });
  }
};

// ================================
// 🔍 GET DETAILED TESTING DATA
// ================================
export const getDetailedFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const testingData = await FirstTesting.findOne({ account: userId });
    const account = await Account.findById(userId).select(
      "applicationProgress"
    );

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
    res.status(500).json({
      success: false,
      message: "Server error fetching testing data",
    });
  }
};

// ================================
// 🗑️ DELETE TESTING DATA
// ================================
export const deleteFirstTesting = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    await FirstTesting.findOneAndDelete({ account: userId });

    await Account.findByIdAndUpdate(userId, {
      $set: {
        "applicationProgress.testing": 0,
      },
    });

    res.status(200).json({
      success: true,
      message: "Testing data deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting testing data:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting testing data",
    });
  }
};