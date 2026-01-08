// server/controllers/firstTestingController.js
import FirstTesting from "../models/firstTestingModel.js";
import Account from "../models/accountModel.js";

// Calculate testing progress based on ONLY RELEVANT sections
const calculateTestingProgress = (testingCompletion, testsToReport = []) => {
  if (!testingCompletion) return 0;

  // Define which completion field corresponds to which test
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

  // Always include testsTaken section (mandatory)
  const mandatorySections = ['testsTaken'];
  
  // Determine which sections are relevant based on selected tests
  const relevantSections = [...mandatorySections];
  
  // Add sections for selected tests
  testsToReport.forEach(test => {
    const completionField = testToCompletionMap[test];
    if (completionField && testingCompletion[completionField] !== undefined) {
      relevantSections.push(completionField);
    }
  });

  // Calculate progress based only on relevant sections
  let completedCount = 0;
  let totalRelevantSections = relevantSections.length;

  relevantSections.forEach(section => {
    if (testingCompletion[section]) {
      completedCount++;
    }
  });

  // Ensure we don't divide by zero
  if (totalRelevantSections === 0) return 0;

  return Math.round((completedCount / totalRelevantSections) * 100);
};

// Validate individual testing sections
const validateTestingSection = (section, data) => {
  switch (section) {
    case "tests-taken":
      // User must answer both questions
      if (!data.selfReportScores || !data.internationalPromotionExams) {
        return false;
      }
      
      // If user says "Yes" to self-reporting, they must select at least one test
      if (data.selfReportScores === "yes") {
        return Array.isArray(data.testsToReport) && data.testsToReport.length > 0;
      }
      
      // If user says "No" to self-reporting, they don't need to select tests
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
      const hasValidTests =
        !data.cambridgeNumberOfTests ||
        (data.cambridgeTests &&
          data.cambridgeTests.length ===
            parseInt(data.cambridgeNumberOfTests));
      const hasCertificateAnswer = !!data.cambridgeCertificateReport;
      const hasCertificateDetails =
        data.cambridgeCertificateReport !== "yes" ||
        (data.cambridgeCertificateDetails?.level &&
          data.cambridgeCertificateDetails?.date);

      return (
        hasNumberOfTests &&
        hasValidTests &&
        hasCertificateAnswer &&
        hasCertificateDetails
      );
    }

    case "toefl-ibt": {
      const hasPastTests = !!data.toeflPastTests;
      const hasFutureSittings = !!data.toeflFutureSittings;
      const hasScores =
        !data.toeflPastTests ||
        parseInt(data.toeflPastTests) === 0 ||
        (data.toeflHighestReadingScore &&
          data.toeflReadingScoreDate &&
          data.toeflHighestSpeakingScore &&
          data.toeflSpeakingScoreDate &&
          data.toeflHighestListeningScore &&
          data.toeflListeningScoreDate &&
          data.toeflHighestWritingScore &&
          data.toeflWritingScoreDate &&
          data.toeflHighestTotalScore &&
          data.toeflTotalScoreDate);

      return hasPastTests && hasFutureSittings && hasScores;
    }

    case "pte-academic-tests": {
      const pteHasPastTests = !!data.ptePastTests;
      const pteHasFutureSittings = !!data.pteFutureSittings;
      const pteHasScores =
        !data.ptePastTests ||
        parseInt(data.ptePastTests) === 0 ||
        (data.pteHighestListeningScore &&
          data.pteListeningScoreDate &&
          data.pteHighestReadingScore &&
          data.pteReadingScoreDate &&
          data.pteHighestSpeakingScore &&
          data.pteSpeakingScoreDate &&
          data.pteHighestWritingScore &&
          data.pteWritingScoreDate);

      return pteHasPastTests && pteHasFutureSittings && pteHasScores;
    }

    case "ielts": {
      const ieltsHasPastTests = !!data.ieltsPastTests;
      const ieltsHasFutureSittings = !!data.ieltsFutureSittings;
      const ieltsHasScores =
        !data.ieltsPastTests ||
        parseInt(data.ieltsPastTests) === 0 ||
        (data.ieltsHighestListeningScore &&
          data.ieltsListeningScoreDate &&
          data.ieltsHighestReadingScore &&
          data.ieltsReadingScoreDate &&
          data.ieltsHighestWritingScore &&
          data.ieltsWritingScoreDate &&
          data.ieltsHighestSpeakingScore &&
          data.ieltsSpeakingScoreDate &&
          data.ieltsHighestOverallScore &&
          data.ieltsOverallScoreDate);

      return ieltsHasPastTests && ieltsHasFutureSittings && ieltsHasScores;
    }

    case "duolingo-english-test": {
      const duolingoHasPastTests = !!data.duolingoPastTests;
      const duolingoHasFutureSittings = !!data.duolingoFutureSittings;
      const duolingoHasScores =
        !data.duolingoPastTests ||
        parseInt(data.duolingoPastTests) === 0 ||
        (data.duolingoHighestLiteracyScore &&
          data.duolingoLiteracyScoreDate &&
          data.duolingoHighestComprehensionScore &&
          data.duolingoComprehensionScoreDate &&
          data.duolingoHighestConversationScore &&
          data.duolingoConversationScoreDate &&
          data.duolingoHighestProductionScore &&
          data.duolingoProductionScoreDate &&
          data.duolingoHighestTotalScore &&
          data.duolingoTotalScoreDate);

      return (
        duolingoHasPastTests && duolingoHasFutureSittings && duolingoHasScores
      );
    }

    case "senior-secondary-exams":
      return !!(
        data.seniorSecondaryExams && data.seniorSecondaryExams.length > 0
      );

    default:
      return false;
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

    // 🔒 Safety: remove legacy / client-controlled IDs
    delete updateData.studentId;
    delete updateData.account; // always use userId from token

    // ✅ Normalise IB levels: labels -> short codes
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

    // Auto-calculate testing completion based on ALL sections
    const completionStatus = {
      testsTaken: validateTestingSection("tests-taken", updateData),
      actTests: validateTestingSection("act-tests", updateData),
      satTests: validateTestingSection("sat-tests", updateData),
      satSubjectTests: validateTestingSection(
        "sat-subject-tests",
        updateData
      ),
      apSubjectTests: validateTestingSection("ap-subject-tests", updateData),
      ibSubjectTests: validateTestingSection("ib-subject-tests", updateData),
      cambridge: validateTestingSection("cambridge", updateData),
      toeflIbt: validateTestingSection("toefl-ibt", updateData),
      pteAcademic: validateTestingSection("pte-academic-tests", updateData),
      ielts: validateTestingSection("ielts", updateData),
      duolingo: validateTestingSection("duolingo-english-test", updateData),
      seniorSecondary: validateTestingSection(
        "senior-secondary-exams",
        updateData
      ),
    };

    // Calculate overall testing progress based on relevant sections only
    const testingProgress = calculateTestingProgress(completionStatus, updateData.testsToReport || []);
    updateData.testingCompletion = completionStatus;
    updateData.testingProgress = testingProgress;

    // Find and update or create testing record for THIS account
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

    // Update account's testing progress
    await Account.findByIdAndUpdate(userId, {
      $set: {
        "applicationProgress.testing": testingProgress,
      },
    });

    console.log("📊 Testing progress updated:", {
      testingProgress,
      testsToReport: updateData.testsToReport || [],
      completedSections: Object.values(completionStatus).filter(Boolean).length,
      totalSections: Object.values(completionStatus).length,
      calculatedForSections: testingProgress === 0 ? 0 : Math.round(testingProgress * (1 + (updateData.testsToReport?.length || 0)) / 100)
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
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error saving testing data",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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

    // If no data yet, return success with null and 0 progress
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

    // If no testing data yet, still return success
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

    // Reset testing progress in account
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