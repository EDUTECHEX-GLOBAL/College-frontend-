// src/controllers/collegeSearchController.js
import University from '../models/University.js';
import College from '../models/College.js';
import UserProfile from '../models/userprofilemodel.js';
import BachelorsUniversity from '../models/bachelorsUniversityModel.js';
import MastersUniversity from '../models/mastersUniversityModel.js';

// ─────────────────────────────────────────────────────────────────────────────
// CORE HELPER: find a university across ALL three collections
// IDs can be:
//   • numeric string  → admin University (UNITID)
//   • 24-char hex     → any collection (_id)
//   • "PRIN001" style → BachelorsUniversity / MastersUniversity (universityCode)
// Returns { doc, source } or null
// ─────────────────────────────────────────────────────────────────────────────
const findUniversityAcrossCollections = async (idStr) => {
  // 1. Numeric → admin University UNITID
  if (/^\d+$/.test(idStr)) {
    const u = await University.findOne({ UNITID: parseInt(idStr, 10) });
    if (u) return { doc: u, source: 'admin' };
  }

  // 2. 24-char hex → try all three by _id
  if (idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
    const u = await University.findById(idStr);
    if (u) return { doc: u, source: 'admin' };
    const b = await BachelorsUniversity.findById(idStr);
    if (b) return { doc: b, source: 'bachelors' };
    const m = await MastersUniversity.findById(idStr);
    if (m) return { doc: m, source: 'masters' };
  }

  // 3. universityCode (case-insensitive) → bachelors first, then masters
  const bCode = await BachelorsUniversity.findOne({
    universityCode: { $regex: new RegExp(`^${idStr}$`, 'i') }
  });
  if (bCode) return { doc: bCode, source: 'bachelors' };

  const mCode = await MastersUniversity.findOne({
    universityCode: { $regex: new RegExp(`^${idStr}$`, 'i') }
  });
  if (mCode) return { doc: mCode, source: 'masters' };

  // 4. String UNITID fallback on admin collection
  const uStr = await University.findOne({ UNITID: idStr });
  if (uStr) return { doc: uStr, source: 'admin' };

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: extract programs from any collection's document shape
// ─────────────────────────────────────────────────────────────────────────────
const extractProgramsFromUniversity = (uniObj, source = 'admin') => {
  const city    = uniObj.CITY  || uniObj.city  || uniObj.location?.city  || '';
  const state   = uniObj.STABBR|| uniObj.state || uniObj.location?.state || '';
  const name    = uniObj.INSTNM|| uniObj.universityName || '';
  const defaultLoc = [city, state].filter(Boolean).join(', ');

  // bachelors / masters template universities
  if ((source === 'bachelors' || source === 'masters') &&
      Array.isArray(uniObj.programs) && uniObj.programs.length > 0) {
    return uniObj.programs.map((p, i) => {
      if (typeof p === 'string') {
        return {
          id: `prog-${uniObj.universityCode || uniObj._id}-${i}`,
          title: p, name: p, program_name: p,
          level: source === 'bachelors' ? 'Bachelor' : 'Master',
          studyMode: 'On Campus',
          duration: source === 'bachelors' ? '4 years' : '2 years',
          locations: [defaultLoc], majorArea: 'General',
          description: `${p} at ${name}`,
        };
      }
      const pName = p.name || p.title || p.program_name || `Program ${i + 1}`;
      return {
        id: p.id || p._id?.toString() || `prog-${uniObj.universityCode || uniObj._id}-${i}`,
        title: pName, name: pName, program_name: p.program_name || pName,
        level: p.level || (source === 'bachelors' ? 'Bachelor' : 'Master'),
        studyMode: p.studyMode || 'On Campus',
        duration: p.duration || (source === 'bachelors' ? '4 years' : '2 years'),
        locations: p.locations?.length ? p.locations : [defaultLoc],
        majorArea: p.majorArea || p.category || 'General',
        description: p.description || `${pName} at ${name}`,
      };
    });
  }

  // admin / imported universities
  if (Array.isArray(uniObj.metadata?.programs) && uniObj.metadata.programs.length > 0) {
    return uniObj.metadata.programs.map((p, i) => ({
      id: p.id || `prog-${uniObj.UNITID}-${i + 1}`,
      title: p.title || 'Unknown Program', program_name: p.program_name || p.title,
      level: p.level || (uniObj.metadata?.iclevel === 1 ? 'Undergraduate' : 'Graduate'),
      studyMode: p.studyMode || 'On Campus',
      locations: p.locations?.length ? p.locations : [defaultLoc],
      duration: p.duration || getDurationForLevel(p.level),
      description: p.description || `${p.title} at ${name}`,
      majorArea: p.majorArea || 'General',
    }));
  }

  if (Array.isArray(uniObj.GUS_DATA?.programs_data) && uniObj.GUS_DATA.programs_data.length > 0) {
    return uniObj.GUS_DATA.programs_data.map((p, i) => ({
      id: p.id || `prog-${uniObj.UNITID}-${i + 1}`,
      title: p.title || p.program_name || 'Program', program_name: p.program_name || p.title,
      level: p.level || uniObj.GUS_DATA?.level || 'Undergraduate',
      studyMode: p.studyMode || 'On Campus',
      locations: p.locations?.length ? p.locations : [defaultLoc],
      duration: p.duration || '3-4 years',
      description: p.description || `${p.title || p.program_name} at ${name}`,
      majorArea: p.majorArea || 'General',
    }));
  }

  if (Array.isArray(uniObj.GUS_DATA?.major_areas) && uniObj.GUS_DATA.major_areas.length > 0) {
    const programs = [];
    uniObj.GUS_DATA.major_areas.forEach(area => {
      (area.specific_programs || []).forEach(prog => {
        programs.push({
          id: `area-${area.major_area}-${prog.program_name.replace(/\s+/g, '-')}`,
          title: prog.program_name, program_name: prog.program_name,
          level: uniObj.GUS_DATA?.level || 'Undergraduate',
          studyMode: 'On Campus', locations: [defaultLoc], duration: '3-4 years',
          description: `${prog.program_name} in ${area.major_area} at ${name}`,
          majorArea: area.major_area,
        });
      });
    });
    if (programs.length) return programs;
  }

  return [];
};

const getDurationForLevel = (level) => {
  if (!level) return '3-4 years';
  const l = level.toLowerCase();
  if (l.includes('master')) return '1-2 years';
  if (l.includes('phd'))    return '3-5 years';
  return '3-4 years';
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: normalise a raw doc into consistent shape
// ─────────────────────────────────────────────────────────────────────────────
const normaliseDoc = (rawDoc, source) => {
  const u = rawDoc.toObject ? rawDoc.toObject() : rawDoc;
  const programs = extractProgramsFromUniversity(u, source);
  return {
    UNITID:         u.UNITID         || null,
    universityCode: u.universityCode || null,
    _id:            u._id?.toString() || '',
    INSTNM:  u.INSTNM  || u.universityName || 'Unknown University',
    IALIAS:  u.IALIAS  || '',
    CITY:    u.CITY    || u.city    || u.location?.city  || '',
    STABBR:  u.STABBR  || u.state   || u.location?.state || '',
    COUNTRY: u.COUNTRY || u.country || u.location?.country || 'USA',
    WEBADDR: u.WEBADDR || u.website || u.contact?.website || '',
    logo:    getUniversityLogo(u.INSTNM || u.universityName || 'University'),
    fallbackLogo: '/default-university-logo.png',
    programs,
    programCount: programs.length,
    location: u.location || { city: u.city || u.CITY, state: u.state || u.STABBR, country: u.country || u.COUNTRY },
    contact:  u.contact  || { website: u.website || u.WEBADDR },
    stats:    u.stats    || {},
    metadata: { iclevel: u.metadata?.iclevel, control: u.metadata?.control, sector: u.metadata?.sector },
    tuitionFees:     u.tuitionFees     || null,
    establishedYear: u.establishedYear || null,
    universityType:  u.universityType  || null,
    ranking:         u.ranking         || null,
    importedByAdmin: u.importedByAdmin || false,
    source,
    _raw: u,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: calculate match % against student profile
// ─────────────────────────────────────────────────────────────────────────────
const calcMatch = (normUni, profile) => {
  let pct = 0;
  const reasons = [];

  if (profile.eligibleProgram) {
    const lvl = profile.eligibleProgram;
    if (
      (lvl === 'Bachelor' && (normUni.source === 'bachelors' || normUni.source === 'profile-fallback' || normUni._raw?.metadata?.iclevel === 1)) ||
      (lvl === 'Master'   && (normUni.source === 'masters'   || normUni._raw?.metadata?.iclevel === 3)) ||
      (lvl === 'PhD'      && normUni._raw?.metadata?.iclevel === 4)
    ) { pct += 40; reasons.push('Program level matches your qualification'); }
  }

  if (profile.education?.field && normUni.programs.length > 0) {
    const f = profile.education.field.toLowerCase();
    if (normUni.programs.some(p => (p.title||'').toLowerCase().includes(f) || (p.program_name||'').toLowerCase().includes(f)))
    { pct += 30; reasons.push('Programs available in your field of study'); }
  }

  if (profile.basicInfo?.residence && normUni.COUNTRY) {
    if (normUni.COUNTRY.toLowerCase().includes(profile.basicInfo.residence.toLowerCase()))
    { pct += 20; reasons.push('Located in your preferred country'); }
  }

  const pc = normUni.programCount;
  if (pc > 20)      { pct += 10; reasons.push('Extensive program offerings'); }
  else if (pc > 10) { pct += 7;  reasons.push('Good variety of programs'); }
  else if (pc > 5)  { pct += 5;  reasons.push('Multiple programs available'); }

  return { matchPercentage: Math.min(100, pct), matchReasons: reasons };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: build response item
// ─────────────────────────────────────────────────────────────────────────────
const buildResponseItem = (normUni, selectedUniData, studentProfile) => {
  const { matchPercentage, matchReasons } = calcMatch(normUni, studentProfile);
  return {
    UNITID:         normUni.UNITID,
    universityCode: normUni.universityCode,
    _id:            normUni._id,
    INSTNM:   normUni.INSTNM,
    IALIAS:   normUni.IALIAS,
    CITY:     normUni.CITY,
    STABBR:   normUni.STABBR,
    COUNTRY:  normUni.COUNTRY,
    WEBADDR:  normUni.WEBADDR,
    logo:     normUni.logo,
    fallbackLogo: normUni.fallbackLogo,
    programCount:  normUni.programCount,
    programs:      normUni.programs,
    matchPercentage,
    matchReasons,
    location:  normUni.location,
    contact:   normUni.contact,
    stats:     normUni.stats,
    metadata:  normUni.metadata,
    source:    normUni.source,
    importedByAdmin: normUni.importedByAdmin,
    // ── CRITICAL: courses the student chose in their profile ────────────────
    selectedCourses:        selectedUniData?.selectedCourses || [],
    isKansas:               selectedUniData?.isKansas        || false,
    selectedUniversityData: selectedUniData,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: GET /api/college-search
// ─────────────────────────────────────────────────────────────────────────────
export const searchColleges = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.userId;

    console.log('🔍 College Search Request:', { query, userId });

    // 1. Load student profile
    let studentProfile = null;
    if (userId) {
      try {
        studentProfile = await UserProfile.findOne({ userId });
        console.log('📋 Student Profile Found:', studentProfile ? 'Yes' : 'No');
      } catch (e) {
        console.error('Error fetching student profile:', e);
      }
    }

    if (!studentProfile) {
      return res.status(200).json({
        success: true, count: 0, colleges: [], hasProfile: false,
        message: 'Please complete your profile to see university recommendations',
      });
    }

    const selectedUniversities = studentProfile.selectedUniversities || [];
    console.log(`   - Selected Universities in profile: ${selectedUniversities.length}`);
    selectedUniversities.forEach((u, i) => console.log(`     ${i+1}. ${u.name} [id: ${u.id}]`));

    if (selectedUniversities.length === 0) {
      return res.status(200).json({
        success: true, count: 0, colleges: [], hasProfile: true,
        message: 'No universities selected in your profile. Please select universities in your profile first.',
      });
    }

    // 2. Build id → selectedUni map
    const selectedUniMap = {};
    selectedUniversities.forEach(uni => {
      const key = String(uni.id || uni.unitid || '').trim();
      if (key) selectedUniMap[key] = uni;
    });

    const universityIds = Object.keys(selectedUniMap);
    console.log('🔎 Looking for university IDs:', universityIds);

    // 3. Fetch each university across all collections, with profile-data fallback
    const results = [];

    for (const idStr of universityIds) {
      try {
        const found = await findUniversityAcrossCollections(idStr);

        if (found) {
          const normUni = normaliseDoc(found.doc, found.source);
          console.log(`✅ Found [${found.source}]: ${normUni.INSTNM} for ID: ${idStr}`);
          results.push({ normUni, selectedUniData: selectedUniMap[idStr] });
        } else {
          // FALLBACK: use data already stored in the student's profile
          const profileUni = selectedUniMap[idStr];
          console.log(`⚠️  Not in DB — using profile data for: ${profileUni?.name} (${idStr})`);

          if (profileUni?.name) {
            const fallbackNorm = {
              UNITID: null, universityCode: idStr, _id: '',
              INSTNM:   profileUni.name,
              IALIAS:   '',
              CITY:     profileUni.city    || '',
              STABBR:   profileUni.state   || '',
              COUNTRY:  profileUni.country || 'USA',
              WEBADDR:  '',
              logo:     getUniversityLogo(profileUni.name),
              fallbackLogo: '/default-university-logo.png',
              programs:     [],
              programCount: 0,
              location: { city: profileUni.city, state: profileUni.state, country: profileUni.country },
              contact: {}, stats: {}, metadata: {},
              source: 'profile-fallback', importedByAdmin: false, _raw: profileUni,
            };
            results.push({ normUni: fallbackNorm, selectedUniData: profileUni });
          }
        }
      } catch (err) {
        console.error(`Error finding university for ID ${idStr}:`, err.message);
      }
    }

    console.log(`📚 Found/built ${results.length} / ${universityIds.length} universities`);

    // 4. Optional text filter
    let filtered = results;
    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      filtered = results.filter(({ normUni }) =>
        normUni.INSTNM.toLowerCase().includes(q) ||
        normUni.CITY.toLowerCase().includes(q) ||
        normUni.STABBR.toLowerCase().includes(q)
      );
    }

    // 5. Build response
    const colleges = filtered
      .map(({ normUni, selectedUniData }) => buildResponseItem(normUni, selectedUniData, studentProfile))
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    return res.status(200).json({
      success: true,
      count: colleges.length,
      colleges,
      hasProfile: true,
      totalSelected: selectedUniversities.length,
      profileUsed: {
        program:      studentProfile.eligibleProgram,
        field:        studentProfile.education?.field,
        country:      studentProfile.basicInfo?.residence,
        selectedCount: selectedUniversities.length,
      },
      selectedCoursesSummary: colleges
        .filter(u => u.selectedCourses?.length > 0)
        .map(u => ({
          universityName: u.INSTNM,
          universityId:   u.UNITID || u.universityCode,
          courseCount:    u.selectedCourses.length,
          courses:        u.selectedCourses,
        })),
    });

  } catch (error) {
    console.error('❌ College search error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while searching for colleges',
      error: error.message,
      colleges: [],
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/college-search/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) return res.status(400).json({ success: false, message: 'University ID is required' });

    const found = await findUniversityAcrossCollections(id.toString());
    if (!found) return res.status(404).json({ success: false, message: 'University not found' });

    const normUni = normaliseDoc(found.doc, found.source);

    let selectedUniversityData = null;
    if (userId) {
      try {
        const profile = await UserProfile.findOne({ userId });
        if (profile?.selectedUniversities) {
          selectedUniversityData = profile.selectedUniversities.find(u => {
            const key = String(u.id || u.unitid || '').trim();
            return key === id.toString() ||
                   key === normUni.UNITID?.toString() ||
                   key === normUni.universityCode;
          });
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      data: {
        UNITID:         normUni.UNITID,
        universityCode: normUni.universityCode,
        _id:            normUni._id,
        INSTNM:   normUni.INSTNM,
        IALIAS:   normUni.IALIAS,
        CITY:     normUni.CITY,
        STABBR:   normUni.STABBR,
        COUNTRY:  normUni.COUNTRY,
        ADDRESS:  normUni._raw?.ADDR || normUni._raw?.address || '',
        ZIP:      normUni._raw?.ZIP  || normUni._raw?.zipCode  || '',
        WEBADDR:  normUni.WEBADDR,
        logo:     normUni.logo,
        fallbackLogo: normUni.fallbackLogo,
        programs:     normUni.programs,
        programCount: normUni.programCount,
        stats:    normUni.stats,
        location: normUni.location,
        contact:  normUni.contact,
        metadata: normUni.metadata,
        GUS_DATA: normUni._raw?.GUS_DATA || {},
        tuitionFees:     normUni.tuitionFees,
        establishedYear: normUni.establishedYear,
        universityType:  normUni.universityType,
        ranking:         normUni.ranking,
        importedByAdmin: normUni.importedByAdmin,
        source:          normUni.source,
        selectedCourses:        selectedUniversityData?.selectedCourses || [],
        isKansas:               selectedUniversityData?.isKansas        || false,
        selectedUniversityData,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching university details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch university details', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/college-search/:id/programs
// ─────────────────────────────────────────────────────────────────────────────
export const getUniversityPrograms = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'University ID is required' });

    const found = await findUniversityAcrossCollections(id.toString());
    if (!found) return res.status(404).json({ success: false, message: 'University not found' });

    const normUni = normaliseDoc(found.doc, found.source);
    const programs = normUni.programs;

    const majorAreaSet = new Set();
    const majorAreas = [];
    programs.forEach(p => {
      if (p.majorArea && !majorAreaSet.has(p.majorArea)) {
        majorAreaSet.add(p.majorArea);
        majorAreas.push({ major_area: p.majorArea });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        universityId:   normUni.UNITID || normUni.universityCode || normUni._id,
        universityName: normUni.INSTNM,
        source:         normUni.source,
        programs,
        majorAreas,
        studyModes: ['All', ...new Set(programs.map(p => p.studyMode).filter(Boolean))],
        programCount: programs.length,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching university programs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch university programs', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/college-search/recommendations
// ─────────────────────────────────────────────────────────────────────────────
export const getRecommendedUniversities = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });

    const studentProfile = await UserProfile.findOne({ userId });
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found. Please complete your profile first.' });
    }

    const selectedUniversities = studentProfile.selectedUniversities || [];
    if (selectedUniversities.length === 0) {
      return res.status(200).json({
        success: true, count: 0, recommendations: [],
        profile: { program: studentProfile.eligibleProgram, field: studentProfile.education?.field, country: studentProfile.basicInfo?.residence },
        message: 'No universities selected in your profile.',
      });
    }

    const selectedUniMap = {};
    selectedUniversities.forEach(uni => {
      const key = String(uni.id || uni.unitid || '').trim();
      if (key) selectedUniMap[key] = uni;
    });

    const recommendations = [];
    for (const idStr of Object.keys(selectedUniMap)) {
      try {
        const profileUni = selectedUniMap[idStr];
        const found = await findUniversityAcrossCollections(idStr);

        let normUni;
        if (found) {
          normUni = normaliseDoc(found.doc, found.source);
        } else if (profileUni?.name) {
          normUni = {
            UNITID: null, universityCode: idStr, _id: '',
            INSTNM: profileUni.name, IALIAS: '',
            CITY: profileUni.city || '', STABBR: profileUni.state || '',
            COUNTRY: profileUni.country || 'USA', WEBADDR: '',
            logo: getUniversityLogo(profileUni.name),
            fallbackLogo: '/default-university-logo.png',
            programs: [], programCount: 0,
            location: {}, contact: {}, stats: {}, metadata: {},
            source: 'profile-fallback', importedByAdmin: false, _raw: profileUni,
          };
        } else {
          continue;
        }

        const { matchPercentage: score, matchReasons: reasons } = calcMatch(normUni, studentProfile);
        recommendations.push({
          UNITID:         normUni.UNITID,
          universityCode: normUni.universityCode,
          _id:            normUni._id,
          INSTNM:   normUni.INSTNM,
          CITY:     normUni.CITY,
          STABBR:   normUni.STABBR,
          COUNTRY:  normUni.COUNTRY,
          logo:     normUni.logo,
          fallbackLogo: normUni.fallbackLogo,
          programCount:    normUni.programCount,
          matchScore:      Math.min(100, score),
          matchReasons:    reasons,
          isRecommended:   score > 50,
          source:          normUni.source,
          importedByAdmin: normUni.importedByAdmin,
          selectedCourses: profileUni?.selectedCourses || [],
          isKansas:        profileUni?.isKansas        || false,
        });
      } catch (err) {
        console.error(`Error in recommendations for ID ${idStr}:`, err.message);
      }
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true, count: recommendations.length, recommendations,
      profile: {
        program:      studentProfile.eligibleProgram,
        field:        studentProfile.education?.field,
        country:      studentProfile.basicInfo?.residence,
        selectedCount: selectedUniversities.length,
      },
    });
  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    return res.status(500).json({ success: false, message: 'Failed to get recommendations', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy college search
// ─────────────────────────────────────────────────────────────────────────────
export const searchCollegesLegacy = async (req, res) => {
  try {
    const { query } = req.query;
    let searchQuery = { isVisible: true };
    if (query?.trim()) {
      const t = query.trim();
      searchQuery.$or = [
        { INSTNM: { $regex: t, $options: 'i' } },
        { 'location.city':  { $regex: t, $options: 'i' } },
        { 'location.state': { $regex: t, $options: 'i' } },
      ];
    }
    const colleges = await College.find(searchQuery).select('UNITID INSTNM IALIAS location contact importedByAdmin').limit(50);
    return res.status(200).json({
      success: true, count: colleges.length,
      colleges: colleges.map(col => {
        const c = col.toObject ? col.toObject() : col;
        return {
          UNITID: c.UNITID || c._id.toString(), _id: c._id.toString(),
          INSTNM: c.INSTNM || 'Unknown College', IALIAS: c.IALIAS || '',
          CITY:   c.location?.city  || c.CITY   || '',
          STABBR: c.location?.state || c.STABBR || '',
          ZIP:    c.location?.zip   || c.ZIP    || '',
          COUNTRY: c.location?.country || 'USA',
          logo: getUniversityLogo(c.INSTNM || 'College'),
          fallbackLogo: '/default-college-logo.png',
          isCollege: true, importedByAdmin: c.importedByAdmin || false,
        };
      }),
    });
  } catch (error) {
    console.error('❌ College search error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const getUniversityLogo = (name) => {
  if (!name) return '/default-university-logo.png';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff&size=128&length=2&font-size=0.5&rounded=true&bold=true`;
};