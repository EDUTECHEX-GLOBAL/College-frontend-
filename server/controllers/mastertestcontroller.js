import mongoose from 'mongoose';
import MasterTest from '../models/mastertestmodel.js';

// ─── Allowed test keys ────────────────────────────────────────────────────

const TEST_KEYS = [
  'sat', 'act',
  'satSubject', 'ap', 'ib', 'cambridge',
  'toefl', 'ielts', 'pte', 'duolingo',
  'gre', 'gmat',
];

const FUTURE_DATE_KEYS = [
  'sat_futureDates',
  'act_futureDates',
  'satSubject_futureDates',
  'ap_futureDates',
];

// ─── Field-level validation rules per test ─────────────────────────────────
// Only required fields are validated server-side; optional fields are accepted if present.

const REQUIRED_FIELDS = {
  sat:        ['testDate', 'total', 'math', 'ebrw'],
  act:        ['testDate', 'composite', 'english', 'math', 'reading', 'science'],
  satSubject: ['subject', 'score', 'testDate'],
  ap:         ['subject', 'score', 'testDate'],
  ib:         ['subject', 'level', 'score', 'year'],
  cambridge:  ['subject', 'level', 'grade', 'testDate'],
  toefl:      ['testDate', 'reading', 'listening', 'speaking', 'writing', 'total'],
  ielts:      ['testDate', 'listening', 'reading', 'writing', 'speaking', 'overall'],
  pte:        ['testDate', 'listening', 'reading', 'speaking', 'writing', 'overall'],
  duolingo:   ['testDate', 'overall', 'literacy', 'comprehension', 'conversation', 'production'],
  gre:        ['testDate', 'verbal', 'quant', 'analyticalWrite', 'total'],
  gmat:       ['testDate', 'total', 'verbal', 'quant', 'dataInsights'],
};

// Strips internal frontend keys (_id, _isValid) from attempt objects
const sanitizeAttempt = (attempt) => {
  const cleaned = { ...attempt };
  delete cleaned._id;
  delete cleaned._isValid;
  return cleaned;
};

// Validates a single attempt object for a test
const validateAttempt = (testKey, attempt) => {
  const required = REQUIRED_FIELDS[testKey] || [];
  for (const field of required) {
    const val = attempt[field];
    if (val === undefined || val === null || val === '') {
      return { valid: false, message: `Missing required field "${field}" in ${testKey} attempt` };
    }
  }
  return { valid: true };
};

// ─── GET ──────────────────────────────────────────────────────────────────

/**
 * GET /api/master-test
 * Returns saved test score data for the authenticated user.
 */
export const getMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const data = await MasterTest.findOne({ userId }).lean();

    // New user — no data yet. Return 200 with empty object so the
    // browser console stays clean (404 would show as a red error even
    // though the frontend handles it correctly).
    if (!data) {
      return res.status(200).json({ success: true, data: {} });
    }

    // Build a clean response — only return test keys that have data
    const responseData = {};
    TEST_KEYS.forEach(key => {
      if (data[key] && data[key].length > 0) {
        responseData[key] = data[key];
      }
    });
    FUTURE_DATE_KEYS.forEach(key => {
      if (data[key] && data[key].length > 0) {
        responseData[key] = data[key];
      }
    });

    return res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    console.error('❌ Get Master Test Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching test data' });
  }
};

// ─── POST ─────────────────────────────────────────────────────────────────

/**
 * POST /api/master-test
 * Creates or updates test scores for the authenticated user.
 *
 * Request body shape:
 * {
 *   sat:      [{ testDate, total, math, ebrw, percentile? }, ...],
 *   act:      [{ testDate, composite, english, math, reading, science, writing?, percentile? }],
 *   ielts:    [{ testDate, listening, reading, writing, speaking, overall }],
 *   sat_futureDates: ['2025-05', '2025-11'],
 *   ...
 * }
 */
export const saveMasterTest = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const body = req.body;
    const updatePayload = {};
    const validationErrors = [];

    // ── Process test arrays ──
    TEST_KEYS.forEach(testKey => {
      const incoming = body[testKey];

      // Key not present in request → don't touch this field in DB
      if (incoming === undefined) return;

      // Key explicitly set to null or empty array → clear this test
      if (incoming === null || (Array.isArray(incoming) && incoming.length === 0)) {
        updatePayload[testKey] = undefined; // will unset in DB
        return;
      }

      if (!Array.isArray(incoming)) {
        validationErrors.push(`"${testKey}" must be an array of attempt objects`);
        return;
      }

      const sanitized = [];
      for (let i = 0; i < incoming.length; i++) {
        const attempt = sanitizeAttempt(incoming[i]);
        const { valid, message } = validateAttempt(testKey, attempt);
        if (!valid) {
          validationErrors.push(`${testKey}[${i}]: ${message}`);
          continue;
        }
        sanitized.push(attempt);
      }

      if (sanitized.length > 0) {
        updatePayload[testKey] = sanitized;
      }
    });

    // ── Process future date arrays ──
    FUTURE_DATE_KEYS.forEach(key => {
      const incoming = body[key];
      if (incoming === undefined) return;
      if (!Array.isArray(incoming)) return;
      // Filter out empty strings
      const filtered = incoming.filter(d => typeof d === 'string' && d.trim() !== '');
      updatePayload[key] = filtered.length > 0 ? filtered : undefined;
    });

    // Return early if there are validation errors
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors in test data',
        errors: validationErrors,
      });
    }

    // ── If body is entirely empty → clear the full record ──
    const hasAnyTest = TEST_KEYS.some(k => body[k] !== undefined);
    if (!hasAnyTest && Object.keys(updatePayload).length === 0) {
      await MasterTest.findOneAndDelete({ userId });
      return res.status(200).json({ success: true, message: 'All test data cleared' });
    }

    // ── Upsert ──
    // Use $set for fields we want to update, and $unset for fields explicitly cleared
    const setFields = {};
    const unsetFields = {};

    Object.entries(updatePayload).forEach(([key, val]) => {
      if (val === undefined) {
        unsetFields[key] = 1;
      } else {
        setFields[key] = val;
      }
    });

    const mongoUpdate = {};
    if (Object.keys(setFields).length > 0)   mongoUpdate.$set   = setFields;
    if (Object.keys(unsetFields).length > 0)  mongoUpdate.$unset = unsetFields;

    const updated = await MasterTest.findOneAndUpdate(
      { userId },
      mongoUpdate,
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Test scores saved successfully',
      data: updated,
    });

  } catch (error) {
    console.error('❌ Save Master Test Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving test data' });
  }
};