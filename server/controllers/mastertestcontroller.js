import mongoose from 'mongoose';
import MasterTest from '../models/mastertestmodel.js';

// ── Allowed test score fields ─────────────────────────────────────────────────
const TEST_FIELDS = ['ielts', 'toefl', 'pte', 'gre', 'gmat', 'sat', 'act', 'duolingo'];

// ── Allowed education string fields ──────────────────────────────────────────
const EDU_STRING_FIELDS = [
  'educationMode',
  'selectedDegree',
  'selectedBranch',
  'degreeGpa',
  'degreeGpaSystem',
  'degreeYear',
];

// ── Valid degree GPA systems ──────────────────────────────────────────────────
const VALID_GPA_SYSTEMS = ['percentage', '4.0', '10.0', 'cgpa'];
const VALID_EDU_MODES   = ['school', 'degree', ''];

/**
 * 📥 GET — Fetch test + education data for the logged-in user
 */
export const getMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const data = await MasterTest.findOne({ userId });

    if (!data) {
      return res.status(404).json({ success: false, message: 'No test data found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ Get Master Test Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching test data' });
  }
};

/**
 * 💾 POST — Create / update test + education data
 */
export const saveMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const body = req.body;
    const updatePayload = {};

    // ── 1. Test scores ────────────────────────────────────────────────────────
    TEST_FIELDS.forEach(field => {
      if (body[field] !== undefined && body[field] !== '') {
        const num = Number(body[field]);
        if (!isNaN(num)) updatePayload[field] = num;
      } else if (body[field] === '') {
        // Explicitly unset removed tests
        updatePayload[field] = undefined;
      }
    });

    // ── 2. Education mode ──────────────────────────────────────────────────────
    if (body.educationMode !== undefined) {
      if (VALID_EDU_MODES.includes(body.educationMode)) {
        updatePayload.educationMode = body.educationMode;
      }
    }

    // ── 3. School grades ──────────────────────────────────────────────────────
    if (body.selectedGrades && typeof body.selectedGrades === 'object') {
      const grades = {};
      ['grade9', 'grade10', 'grade11', 'grade12'].forEach(g => {
        const entry = body.selectedGrades[g];
        if (entry && typeof entry === 'object') {
          grades[g] = {
            gpa:    String(entry.gpa ?? ''),
            system: VALID_GPA_SYSTEMS.includes(entry.system) ? entry.system : 'percentage',
          };
        } else {
          grades[g] = undefined; // clear if not present
        }
      });
      updatePayload.selectedGrades = grades;
    }

    // ── 4. Degree fields ──────────────────────────────────────────────────────
    EDU_STRING_FIELDS.filter(f => f !== 'educationMode').forEach(field => {
      if (body[field] !== undefined) {
        // Validate gpaSystem
        if (field === 'degreeGpaSystem' && !VALID_GPA_SYSTEMS.includes(body[field])) return;
        updatePayload[field] = String(body[field]);
      }
    });

    // ── 5. If payload is effectively empty (no tests, no education) → clear ──
    const hasTests = TEST_FIELDS.some(f => updatePayload[f] !== undefined);
    const hasEdu   =
      (updatePayload.educationMode && updatePayload.educationMode !== '') ||
      updatePayload.selectedDegree ||
      (updatePayload.selectedGrades && Object.keys(updatePayload.selectedGrades).some(k => updatePayload.selectedGrades[k]));

    if (!hasTests && !hasEdu) {
      await MasterTest.findOneAndDelete({ userId });
      return res.status(200).json({ success: true, message: 'All data cleared' });
    }

    // ── 6. Upsert ──────────────────────────────────────────────────────────────
    const updated = await MasterTest.findOneAndUpdate(
      { userId },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Save Master Test Error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving data' });
  }
};

/**
 * 🗑️ DELETE — Remove all test + education data for the user
 */
export const deleteMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    await MasterTest.findOneAndDelete({ userId });

    res.status(200).json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('❌ Delete Master Test Error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting data' });
  }
};