import mongoose from 'mongoose';
import MasterOverview from '../models/masteroverviewmodels.js';

const getRawUserId = (req) =>
  req.userId       ||
  req.user?.userId ||
  req.user?.id     ||
  req.user?._id    ||
  '';

const resolveUserId = (rawId) => {
  if (!rawId) return null;
  const str = rawId.toString().trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

// POST /api/master-overview/save
export const saveOrUpdateOverview = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);

    console.log(`saveOrUpdateOverview → rawId: ${rawId} | oid: ${oid}`);

    if (!oid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — userId not found in token.',
      });
    }

    const { course } = req.body;

    if (!course || !course.preferredCourse) {
      return res.status(400).json({
        success: false,
        message: 'Preferred course is required.',
      });
    }

    const overview = await MasterOverview.findOneAndUpdate(
      { userId: oid },
      { $set: { userId: oid, course } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Overview saved for userId: ${oid}`);

    return res.status(200).json({
      success: true,
      message: 'Overview saved successfully.',
      data:    overview,
    });
  } catch (error) {
    console.error('saveOrUpdateOverview error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/master-overview
export const getOverview = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);

    if (!oid) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const overview = await MasterOverview.findOne({ userId: oid });

    if (!overview) {
      return res.status(404).json({ success: false, message: 'No overview found.' });
    }

    return res.status(200).json({ success: true, data: overview });
  } catch (error) {
    console.error('getOverview error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/master-overview
export const deleteOverview = async (req, res) => {
  try {
    const rawId = getRawUserId(req);
    const oid   = resolveUserId(rawId);

    if (!oid) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    await MasterOverview.findOneAndDelete({ userId: oid });

    return res.status(200).json({ success: true, message: 'Overview deleted successfully.' });
  } catch (error) {
    console.error('deleteOverview error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};