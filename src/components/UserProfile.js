// src/components/UserProfile.js
import { FaCheck } from 'react-icons/fa';
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from '../api/axiosInstance';
import "./UserProfile.css";
import EdutechLogo from "./../assets/Edutech-logo.svg";

const URP_POLL_MS = 12000;
const URP_WAIT_MS = 10 * 60 * 1000;
const COURSE_CHIP_PREVIEW_LIMIT = 10;
const UNIVERSITY_RENDER_BATCH = 30;
const STUDENT_UNIVERSITY_SEARCH_LIMIT = 30;
const PROGRAM_GROUP_RENDER_BATCH = 30;
const PROGRAM_SEARCH_LIMIT = 30;
const SEARCH_DEBOUNCE_MS = 400;

const normalizeCourseText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeCategoryName = (value = "") => value.toString().trim();

const segmentNamesMatch = (left = "", right = "") =>
  Boolean(left && right && left.toString().trim() === right.toString().trim());

const emptyBasicInfo = (email = '') => ({
  fullName: '',
  email,
  mobile: '',
  dob: '',
  gender: '',
  nationality: '',
  residence: '',
});

const getAccountBasicInfo = (account = {}) => {
  const fullName = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
  const phone = [account.countryCode, account.phone].filter(Boolean).join(' ').trim();

  return {
    ...emptyBasicInfo(account.email || ''),
    fullName,
    mobile: phone,
    dob: account.birthDate || '',
  };
};

const mergeBasicInfo = (accountBasicInfo, profileBasicInfo = {}) => {
  const merged = { ...accountBasicInfo };

  Object.keys(merged).forEach((key) => {
    const value = profileBasicInfo[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      merged[key] = value;
    }
  });

  return merged;
};

const sanitizePercentageCgpa = (value) => {
  return value
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .slice(0, 6);
};

const isValidPercentageCgpa = (value) => {
  if (!value) return false;
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(value)) return false;
  const numericValue = Number(value);
  return !Number.isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "Not provided";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// REPLACE THESE 3 CONSTANTS IN YOUR UserProfile.js
// ─────────────────────────────────────────────────────────────────────────────

const createSegmentId = (programType = 'UG', name = '') =>
  `${programType.toLowerCase()}-${name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
const stripDiacritics = (value = '') =>
  value.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value = '') =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toDisplayTitle = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const lower = word.toLowerCase();
      if (['ai', 'it', 'mba', 'llm', 'mph'].includes(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');

const normalizeProgramDisplayKey = (value = '') => {
  const original = value.toString().trim();
  let normalized = normalizeText(original)
    .replace(/\bprogramme\b/g, 'program')
    .replace(/\bcybersecurity\b/g, 'cyber security');

  normalized = normalized
    .replace(/^(bachelor|bachelors|master|masters)\s+of\s+(arts?|science|sciences|engineering|technology|business\s+administration|business|commerce|laws?|law|education|fine\s+arts|design|public\s+health)\s+(in\s+)?/, '')
    .replace(/^(ba|b\s*a|bs|b\s*s|bsc|b\s*sc|beng|b\s*eng|btech|b\s*tech|bba|b\s*b\s*a|bcom|b\s*com|ma|m\s*a|ms|m\s*s|msc|m\s*sc|meng|m\s*eng|mtech|m\s*tech|mba|m\s*b\s*a|llm|mph|mdes|m\s*des|med|m\s*ed)\s+(in\s+|of\s+)?/, '')
    .replace(/^(undergraduate|postgraduate|graduate)\s+(degree\s+|program\s+|course\s+)?(in\s+)?/, '')
    .replace(/\b(degree|program|course)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || normalizeText(original);
};

const normalizeDegreeAwareText = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/[–—-]/g, ' ')
    .replace(/\bbachelor'?s?\b/g, 'bachelor')
    .replace(/\bunder graduate\b/g, 'undergraduate')
    .replace(/\bpost graduate\b/g, 'postgraduate')
    .replace(/\bb\s*sc\b/g, 'bsc bachelor science bs')
    .replace(/\bb\s*s\b/g, 'bs bachelor science bsc')
    .replace(/\bug\b/g, 'ug undergraduate bachelor')
    .replace(/\bundergraduate\b/g, 'undergraduate ug bachelor')
    .replace(/\bbachelor\s+of\s+science\b/g, 'bachelor science bsc bs')
    .replace(/\bbachelor\s+science\b/g, 'bachelor science bsc bs')
    .replace(/\bof\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const degreeAwareTextMatches = (searchText = '', query = '') => {
  const normalizedSearchText = normalizeDegreeAwareText(searchText);
  const normalizedQuery = normalizeDegreeAwareText(query);
  if (!normalizedQuery) return true;
  if (normalizedSearchText.includes(normalizedQuery)) return true;

  const searchTokens = new Set(normalizedSearchText.split(' ').filter(Boolean));
  return normalizedQuery.split(' ').filter(Boolean).every(token => searchTokens.has(token));
};

const getSearchTokens = (value = '') =>
  normalizeDegreeAwareText(value).split(' ').filter(Boolean);

const allTokensMatch = (searchText = '', query = '') => {
  const searchTokens = new Set(getSearchTokens(searchText));
  const queryTokens = getSearchTokens(query);
  return queryTokens.length > 0 && queryTokens.every(token => searchTokens.has(token));
};

const tokenSetsEqual = (left = '', right = '') => {
  const leftTokens = new Set(getSearchTokens(left));
  const rightTokens = new Set(getSearchTokens(right));
  if (!leftTokens.size || leftTokens.size !== rightTokens.size) return false;
  return [...leftTokens].every(token => rightTokens.has(token));
};

const isDegreeSearchQuery = (query = '') => {
  const normalized = normalizeDegreeAwareText(query);
  return /\b(bachelor|bsc|bs|undergraduate|ug|master|msc|ms|postgraduate|pg)\b/.test(normalized);
};

const getDegreeCompletenessScore = (degree = '') => {
  const raw = normalizeText(degree);
  const compact = raw.replace(/\s+/g, '');
  if (!raw) return 0;

  if (/\bbachelor\s+of\s+science\b/.test(raw)) return 100;
  if (/\bbachelor\s+of\s+engineering\b/.test(raw)) return 95;
  if (/\bbachelor\s+of\s+arts?\b/.test(raw)) return 90;
  if (/\bbachelor\s+of\s+business\s+administration\b/.test(raw)) return 88;
  if (['bsc', 'bs'].includes(compact)) return 60;
  if (raw === 'bachelor' || raw === 'bachelors') return 20;
  if (raw.includes('bachelor') && raw.split(' ').length > 1) return 75;
  return raw.split(' ').length > 1 ? 65 : 35;
};

const getCanonicalDegreeKey = (degree = '') => {
  const raw = normalizeText(degree);
  const compact = raw.replace(/\s+/g, '');
  if (!raw) return '';

  if (/\bbachelor\s+of\s+science\b/.test(raw) || ['bsc', 'bs'].includes(compact)) return 'bachelor science';
  if (/\bbachelor\s+of\s+engineering\b/.test(raw) || ['beng', 'be'].includes(compact)) return 'bachelor engineering';
  if (/\bbachelor\s+of\s+arts?\b/.test(raw) || compact === 'ba') return 'bachelor arts';
  if (/\bbachelor\s+of\s+business\s+administration\b/.test(raw) || compact === 'bba') return 'bachelor business administration';
  if (raw === 'bachelor' || raw === 'bachelors') return 'bachelor';
  return normalizeDegreeAwareText(degree) || raw;
};

const preferDisplayProgram = (existing, candidate) => {
  if (!existing) return candidate;
  if (!candidate) return existing;

  const existingScore = getDegreeCompletenessScore(existing.degree);
  const candidateScore = getDegreeCompletenessScore(candidate.degree);
  if (candidateScore !== existingScore) return candidateScore > existingScore ? candidate : existing;

  const existingFieldCount = [
    existing.degree,
    existing.level,
    existing.majorArea,
    existing.group,
    existing.searchText,
  ].filter(Boolean).length;
  const candidateFieldCount = [
    candidate.degree,
    candidate.level,
    candidate.majorArea,
    candidate.group,
    candidate.searchText,
  ].filter(Boolean).length;

  return candidateFieldCount > existingFieldCount ? candidate : existing;
};

const getProgramRelevanceRank = ({
  title = '',
  degree = '',
  searchText = '',
  query = '',
}) => {
  const normalizedQuery = normalizeDegreeAwareText(query);
  if (!normalizedQuery) return 0;

  const normalizedTitle = normalizeDegreeAwareText(title);
  const normalizedDegree = normalizeDegreeAwareText(degree);
  const degreeQuery = isDegreeSearchQuery(query);
  const searchPool = [title, degree, searchText].filter(Boolean).join(' ');

  if (degreeQuery) {
    if (normalizedDegree && (normalizedDegree === normalizedQuery || tokenSetsEqual(degree, query))) return 1;
    if (normalizedDegree && (normalizedDegree.includes(normalizedQuery) || allTokensMatch(degree, query))) return 2;
    if (normalizedTitle === normalizedQuery) return 3;
    if (normalizedTitle.startsWith(normalizedQuery)) return 4;
    if (normalizedTitle.includes(normalizedQuery)) return 5;
    if (allTokensMatch(searchPool, query)) return 6;
    return 7;
  }

  if (normalizedTitle === normalizedQuery) return 1;
  if (normalizedTitle.startsWith(normalizedQuery)) return 2;
  if (normalizedTitle.includes(normalizedQuery)) return 3;
  if (normalizedDegree && (normalizedDegree === normalizedQuery || tokenSetsEqual(degree, query))) return 4;
  if (allTokensMatch(searchPool, query)) return 5;
  return 6;
};

const compareByRelevance = (left, right, query) => {
  const leftRank = getProgramRelevanceRank({ ...left, query });
  const rightRank = getProgramRelevanceRank({ ...right, query });
  if (leftRank !== rightRank) return leftRank - rightRank;
  if (!isDegreeSearchQuery(query)) {
    if (!left.degree && right.degree) return -1;
    if (left.degree && !right.degree) return 1;
  }
  return (left.title || '').localeCompare(right.title || '');
};

const getProgramSuggestionTitle = (program = '') => {
  if (typeof program === 'string') return program;
  return program.title || program.name || program.program_name || program.programName || '';
};

const getProgramSuggestionMajorArea = (program = '') => {
  if (!program || typeof program === 'string') return '';
  return program.majorArea || program.major_area || program.category || program.original_major_area || '';
};

const getProgramSuggestionGroup = (program = '') => {
  if (!program || typeof program === 'string') return '';
  return program.group || program.programGroup || '';
};

const getProgramSuggestionDegree = (program = '') => {
  if (!program || typeof program === 'string') return '';
  return program.degree || '';
};

const getProgramSuggestionLevel = (program = '') => {
  if (!program || typeof program === 'string') return '';
  return program.level || program.educationLevel || '';
};

const getProgramSuggestionSearchText = (program = '') => {
  if (!program || typeof program === 'string') return program || '';
  return [
    program.title,
    program.name,
    program.program_name,
    program.programName,
    program.degree,
    program.level,
    program.educationLevel,
    program.majorArea,
    program.major_area,
    program.category,
    program.original_major_area,
    program.group,
  ].filter(Boolean).join(' ');
};

const dedupeProgramsForDisplay = (programs = []) => {
  const grouped = new Map();

  programs.filter(Boolean).forEach(program => {
    const original = getProgramSuggestionTitle(program).toString().trim();
    const degree = getProgramSuggestionDegree(program);
    const majorArea = getProgramSuggestionMajorArea(program);
    const level = getProgramSuggestionLevel(program);
    const displayKey = normalizeProgramDisplayKey(original);
    const dedupeKey = `${displayKey}::${getCanonicalDegreeKey(degree)}::${normalizeText(level)}::${normalizeText(majorArea)}`;
    const renderKey = normalizeText(`${displayKey}::${degree}::${level}::${majorArea}`);
    if (!displayKey) return;

    const candidate = {
      key: displayKey,
      renderKey,
      label: toDisplayTitle(displayKey),
      value: original,
      majorArea,
      group: getProgramSuggestionGroup(program),
      degree,
      level,
      searchText: getProgramSuggestionSearchText(program),
    };

    grouped.set(dedupeKey, preferDisplayProgram(grouped.get(dedupeKey), candidate));
  });

  const bestByFamily = new Map();
  [...grouped.values()].forEach(course => {
    const familyKey = `${course.key}::${normalizeText(course.level)}`;
    const score = getDegreeCompletenessScore(course.degree);
    const current = bestByFamily.get(familyKey);
    if (!current || score > current.score) {
      bestByFamily.set(familyKey, {
        score,
        canonicalDegree: getCanonicalDegreeKey(course.degree),
      });
    }
  });

  return [...grouped.values()]
    .filter(course => {
      const familyKey = `${course.key}::${normalizeText(course.level)}`;
      const best = bestByFamily.get(familyKey);
      if (!best || best.score < 80) return true;

      const score = getDegreeCompletenessScore(course.degree);
      const canonicalDegree = getCanonicalDegreeKey(course.degree);
      const isGenericEquivalent = score <= 60 && (!canonicalDegree || canonicalDegree === 'bachelor' || canonicalDegree === best.canonicalDegree);
      return !isGenericEquivalent;
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

const getCourseInterestTitle = (course = '') => {
  if (typeof course === 'string') return course;
  return course.title || course.value || course.name || course.program_name || course.programName || '';
};

const getCourseInterestMajorArea = (course = '') => {
  if (!course || typeof course === 'string') return '';
  return course.majorArea || course.major_area || course.category || course.original_major_area || '';
};

const getCourseInterestCountry = (course = '') => {
  if (!course || typeof course === 'string') return '';
  return course.country || course.selectedCountry || '';
};

const getCourseInterestProgramType = (course = '') => {
  if (!course || typeof course === 'string') return '';
  return course.programType || '';
};

const getCourseInterestRenderKey = (course = '') => {
  if (!course || typeof course === 'string') return normalizeProgramDisplayKey(course);
  const title = getCourseInterestTitle(course);
  const degree = course.degree || '';
  const level = course.level || course.educationLevel || '';
  const majorArea = getCourseInterestMajorArea(course);
  const country = getCourseInterestCountry(course);
  const courseProgramType = getCourseInterestProgramType(course);
  return normalizeText([
    normalizeProgramDisplayKey(title),
    degree,
    level,
    majorArea,
    country,
    courseProgramType,
  ].join('|'));
};

const toCourseInterestObject = (course = '', fallbackGroup = '', context = {}) => {
  if (course && typeof course === 'object') {
    const title = getCourseInterestTitle(course).trim();
    const degree = course.degree || context.degree || (context.programType === 'PG' ? 'master' : context.programType === 'UG' ? 'bachelor' : '');
    const level = course.level || course.educationLevel || context.level || (context.programType === 'PG' ? 'Postgraduate' : context.programType === 'UG' ? 'Undergraduate' : '');
    const majorArea = getCourseInterestMajorArea(course) || context.majorArea || fallbackGroup || '';
    const country = course.country || context.country || '';
    const courseProgramType = course.programType || context.programType || '';
    const renderKey = normalizeText([
      normalizeProgramDisplayKey(title),
      degree,
      level,
      majorArea,
      country,
      courseProgramType,
    ].join('|'));

    return {
      title,
      degree,
      level,
      majorArea,
      country,
      programType: courseProgramType,
      group: course.group || fallbackGroup || '',
      value: course.value || title,
      renderKey,
    };
  }

  const title = String(course || '').trim();
  const country = context.country || '';
  const courseProgramType = context.programType || '';
  const degree = context.degree || (courseProgramType === 'PG' ? 'master' : courseProgramType === 'UG' ? 'bachelor' : '');
  const level = context.level || (courseProgramType === 'PG' ? 'Postgraduate' : courseProgramType === 'UG' ? 'Undergraduate' : '');
  return {
    title,
    degree,
    level,
    majorArea: context.majorArea || fallbackGroup || '',
    country,
    programType: courseProgramType,
    group: fallbackGroup || '',
    value: title,
    renderKey: normalizeText([normalizeProgramDisplayKey(title), degree, level, context.majorArea || fallbackGroup || '', country, courseProgramType].join('|')),
  };
};

const getCourseInterestLabel = (course = '') => {
  const title = getCourseInterestTitle(course);
  const degree = course && typeof course === 'object' ? course.degree : '';
  const country = getCourseInterestCountry(course);
  return [title, degree, country].filter(Boolean).join(' — ');
};

const getCourseInterestTitles = (courses = []) =>
  courses.map(getCourseInterestTitle).map(course => course.trim()).filter(Boolean);

const getCourseInterestMajorAreas = (courses = []) =>
  [...new Set(courses.map(getCourseInterestMajorArea).map(area => area.trim()).filter(Boolean))];

const sanitizeInterestedCourses = (courses = []) =>
  courses.slice(0, 5).map(course => ({
    title: getCourseInterestTitle(course),
    degree: course && typeof course === 'object' ? course.degree || '' : '',
    level: course && typeof course === 'object' ? course.level || '' : '',
    majorArea: course && typeof course === 'object' ? course.majorArea || course.major_area || '' : '',
    country: course && typeof course === 'object' ? course.country || '' : '',
    programType: course && typeof course === 'object' ? course.programType || '' : '',
    group: course && typeof course === 'object' ? course.group || '' : '',
    renderKey: getCourseInterestRenderKey(course),
  })).filter(course => course.title);

const sanitizeSelectedUniversities = (universities = []) =>
  universities.map(uni => {
    const locationText = getUniversityLocationText(uni);
    const id = getSafeUniversityId(uni);
    return {
      id,
      universityId: id,
      name: uni.name || uni.universityName || uni.university || uni.INSTNM || '',
      universityName: uni.universityName || uni.name || uni.university || uni.INSTNM || '',
      country: uni.country || uni.COUNTRY || '',
      location: typeof uni.location === 'string' ? uni.location : locationText || '',
      selectedCourses: (uni.selectedCourses || []).map(course => ({
        title: course.title || course.name || course.program_name || '',
        programId: String(course.programId || course.id || '').trim(),
        degree: course.degree || '',
        level: course.level || '',
        majorArea: course.majorArea || course.major_area || '',
      })).filter(course => course.title),
    };
  }).filter(uni => uni.id || uni.universityId || uni.name || uni.universityName);

const DEGREE_PREFIX_REGEX =
  /^(m\s?sc|ms|ma|mba|m\s?eng|llm|m\s?res|master\s+of|bachelor\s+of|b\s?sc|bs|ba|bfa|bmus|b\s?eng)\s*[-–—:]?\s*(in\s+|of\s+)?/i;

const stripDegreePrefix = (value = '') =>
  value.toString().replace(DEGREE_PREFIX_REGEX, '').trim();

const normalizeDegreeSource = (uni = {}, forcedSource = '') => {
  const degree = normalizeText(uni.degree || '');
  const educationLevel = normalizeText(uni.educationLevel || '');

  if (['bachelor', 'bachelors', 'undergraduate', 'ug'].includes(degree) || ['bachelor', 'bachelors', 'undergraduate', 'ug'].includes(educationLevel)) return 'bachelors';
  if (['master', 'masters', 'postgraduate', 'pg'].includes(degree) || ['master', 'masters', 'postgraduate', 'pg'].includes(educationLevel)) return 'masters';

  const fallback = normalizeText(forcedSource || '');
  if (['bachelor', 'bachelors', 'undergraduate', 'ug'].includes(fallback)) return 'bachelors';
  if (['master', 'masters', 'postgraduate', 'pg'].includes(fallback)) return 'masters';
  return '';
};

const getUniversityDisplayName = (uni = {}) =>
  uni.university || uni.universityName || uni.INSTNM || uni.name || '';

const getUniversityLocationText = (uni = {}) => {
  const location = uni.location;

  const rawParts = typeof location === 'string'
    ? [location]
    : location && typeof location === 'object' && !Array.isArray(location)
      ? [location.display, location.city, location.state, location.country]
      : [];

  const parts = [
    ...rawParts,
    uni.CITY,
    uni.city,
    uni.STABBR,
    uni.state,
    uni.country,
    uni.COUNTRY,
  ]
    .filter(Boolean)
    .map(v => String(v).trim())
    .filter(Boolean);

  const seen = new Set();
  const uniqueParts = parts.filter(part => {
    const key = normalizeText(part);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueParts.join(', ');
};

const getUniversityCountry = (uni = {}) => {
  const location = uni.location && typeof uni.location === 'object' && !Array.isArray(uni.location)
    ? uni.location
    : {};
  return (uni.country || uni.COUNTRY || location.country || uni.GUS_DATA?.country || '').toString().trim();
};

const getCountryFromLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') {
    const parts = location.split(',').map(part => part.trim()).filter(Boolean);
    return parts[parts.length - 1] || '';
  }
  if (typeof location === 'object') return location.country || '';
  return '';
};

const getUniversityCountryForFilter = (uni = {}) =>
  getUniversityCountry(uni) || getCountryFromLocation(uni.location);

const normalizeCountryForCompare = (value = '') => normalizeText(value);

const universityMatchesSelectedCountry = (uni = {}, selected = '') => {
  const normalizedSelected = normalizeCountryForCompare(selected);
  if (!normalizedSelected) return true;
  return normalizeCountryForCompare(getUniversityCountryForFilter(uni)) === normalizedSelected;
};

const getNormalizedUniversityName = (uni = {}) =>
  normalizeText(getUniversityDisplayName(uni));

const scoreUniversityForDisplay = (uni = {}, selectedProgramType = '') => {
  const source = normalizeText([uni.degree, uni.educationLevel, uni.universityType, uni._source].filter(Boolean).join(' '));
  const normalizedName = getNormalizedUniversityName(uni);
  const normalizedCountry = normalizeText(getUniversityCountry(uni));
  const matchesProgramType = selectedProgramType === 'PG'
    ? /(master|postgraduate|pg)/.test(source)
    : !/(master|postgraduate|pg)/.test(source);
  const locationScore = [
    getUniversityCountry(uni),
    getUniversityLocationText(uni),
    uni.CITY,
    uni.city,
    uni.STABBR,
    uni.state,
  ].filter(Boolean).length;
  const programScore = [
    ...(Array.isArray(uni.selectedCourses) ? uni.selectedCourses : []),
    ...(Array.isArray(uni.programs_data) ? uni.programs_data : []),
    ...(Array.isArray(uni.programs) ? uni.programs : []),
  ].length;

  return [
    matchesProgramType ? 1000 : 0,
    uni.isVisible === true ? 500 : 0,
    normalizedCountry && normalizedName.includes(normalizedCountry) ? 250 : 0,
    getUniversityCountry(uni) ? 200 : 0,
    locationScore * 25,
    (uni.matchedProgramCount || 0) * 50,
    programScore * 5,
    uni.stats?.totalPrograms || uni._programCount || 0,
  ].reduce((total, value) => total + value, 0);
};

const mergeUniversityForDisplay = (existing = {}, candidate = {}, selectedProgramType = '') => {
  if (!existing) return candidate;
  if (!candidate) return existing;

  const preferred = scoreUniversityForDisplay(candidate, selectedProgramType) > scoreUniversityForDisplay(existing, selectedProgramType)
    ? candidate
    : existing;
  const fallback = preferred === candidate ? existing : candidate;
  const matchedProgramsByKey = new Map();
  [
    ...(Array.isArray(fallback.matchedPrograms) ? fallback.matchedPrograms : []),
    ...(Array.isArray(preferred.matchedPrograms) ? preferred.matchedPrograms : []),
  ].forEach((program, index) => {
    const title = program?.title || program?.name || program?.program_name || '';
    const key = normalizeText([title, program?.degree, program?.level, program?.majorArea || program?.major_area].filter(Boolean).join('|')) || `program-${index}`;
    if (title && !matchedProgramsByKey.has(key)) matchedProgramsByKey.set(key, program);
  });
  const matchedPrograms = [...matchedProgramsByKey.values()];

  return {
    ...fallback,
    ...preferred,
    _id: preferred._id || fallback._id,
    id: getSafeUniversityId(preferred) || getSafeUniversityId(fallback),
    universityId: getSafeUniversityId(preferred) || getSafeUniversityId(fallback),
    UNITID: preferred.UNITID || fallback.UNITID,
    universityCode: preferred.universityCode || fallback.universityCode,
    INSTNM: preferred.INSTNM || fallback.INSTNM,
    university: preferred.university || fallback.university,
    universityName: preferred.universityName || fallback.universityName,
    location: preferred.location || fallback.location,
    CITY: preferred.CITY || fallback.CITY,
    STABBR: preferred.STABBR || fallback.STABBR,
    country: getUniversityCountry(preferred) || getUniversityCountry(fallback),
    programs: matchedPrograms,
    matchedPrograms,
    matchedProgramCount: matchedPrograms.length,
    _programCount: Math.max(preferred._programCount || 0, fallback._programCount || 0),
    stats: {
      ...(fallback.stats || {}),
      ...(preferred.stats || {}),
      totalPrograms: Math.max(preferred.stats?.totalPrograms || 0, fallback.stats?.totalPrograms || 0),
      matchedProgramCount: matchedPrograms.length,
    },
  };
};

const getUniversityDisplayMergeKey = (uni = {}) => {
  const country = normalizeText(getUniversityCountry(uni));
  const universityId = getSafeUniversityId(uni);
  const universityIdentity = universityId || normalizeText(getUniversityDisplayName(uni));
  return `${country}-${universityIdentity}`;
};

const mergeUniversitiesForDisplay = (universities = [], selectedProgramType = '') => {
  const byKey = new Map();
  universities.filter(Boolean).forEach(uni => {
    const key = getUniversityDisplayMergeKey(uni);
    byKey.set(key, mergeUniversityForDisplay(byKey.get(key), uni, selectedProgramType));
  });
  return [...byKey.values()];
};

const getRecordId = (record = {}) => {
  const rawId = record._id;
  if (typeof rawId === 'string') return rawId;
  if (rawId && typeof rawId === 'object') {
    return rawId.$oid || rawId.oid || rawId.id || '';
  }
  return '';
};

const getSafeUniversityId = (uni = {}) =>
  String(
    uni._id?.$oid ||
    uni._id ||
    uni.id ||
    uni.universityId ||
    uni.UNITID ||
    uni.universityCode ||
    ""
  ).trim();

const getCourseLevelText = (course = {}) =>
  [
    course.title,
    course.name,
    course.program_name,
    course.degree,
    course.level,
  ].filter(Boolean).join(' ');

const PG_COURSE_PATTERN = /(^|\b)(m\s?sc|ms|ma|mba|m\s?eng|llm|m\s?res)(\b|$)|\b(master|postgraduate)\b/i;
const UG_COURSE_PATTERN = /(^|\b)(ba|bs|b\s?sc|b\s?eng|bba|llb)(\b|$)|\b(bachelor|undergraduate)\b/i;

const getProgramTypeSafeCourses = (courses = [], selectedProgramType = '') => {
  if (selectedProgramType === 'UG') {
    return courses.filter(course => {
      const levelText = normalizeText([course.level, course.degree, course.educationLevel].filter(Boolean).join(' '));
      if (course._explicitProgramLevel && (levelText.includes('undergraduate') || levelText.includes('bachelor') || levelText === 'ug')) return true;
      return !PG_COURSE_PATTERN.test(getCourseLevelText(course));
    });
  }

  if (selectedProgramType === 'PG') {
    return courses.filter(course => {
      const levelText = normalizeText([course.level, course.degree, course.educationLevel].filter(Boolean).join(' '));
      if (course._explicitProgramLevel && (levelText.includes('postgraduate') || levelText.includes('master') || levelText === 'pg')) return true;
      return !UG_COURSE_PATTERN.test(getCourseLevelText(course));
    });
  }

  return courses;
};

const stripCourseDegreeSuffix = (title = '') =>
  title
    .toString()
    .replace(/\s*\((ba|b\.a\.|bba|b\.b\.a\.|bsc|b\.sc\.|bs|b\.s\.|ma|m\.a\.|mba|m\.b\.a\.|msc|m\.sc\.|ms|m\.s\.|meng|m\.eng\.|llm|l\.l\.m\.)\)\s*$/i, '')
    .trim();

const extractCourseDegreeSuffix = (title = '') => {
  const match = title
    .toString()
    .match(/\((ba|b\.a\.|bba|b\.b\.a\.|bsc|b\.sc\.|bs|b\.s\.|ma|m\.a\.|mba|m\.b\.a\.|msc|m\.sc\.|ms|m\.s\.|meng|m\.eng\.|llm|l\.l\.m\.)\)\s*$/i);
  return match ? match[1].replace(/\./g, '').toUpperCase() : '';
};

const normalizeCourseSpecializationTitle = (title = '') =>
  normalizeText(stripCourseDegreeSuffix(title))
    .replace(/^(bachelor'?s?\s+program\s+in|bachelors?\s+program\s+in|bachelor\s+of|bachelor\s+in|master'?s?\s+program\s+in|masters?\s+program\s+in|master\s+of|master\s+in)\s+/g, '')
    .replace(/\b(bachelor s|bachelors|bachelor|master s|masters|master|degree|programme|program|undergraduate|postgraduate)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getCourseMatchTokens = (value = '') =>
  normalizeCourseSpecializationTitle(value).split(' ').filter(Boolean);

const strictProgramTitleMatchFrontend = (courseTitle = '', selectedTitle = '') => {
  const normalizedCourse = normalizeCourseSpecializationTitle(courseTitle);
  const normalizedSelected = normalizeCourseSpecializationTitle(selectedTitle);
  if (!normalizedCourse || !normalizedSelected) return false;
  if (normalizedCourse === normalizedSelected) return true;
  if (normalizedCourse.includes(normalizedSelected)) return true;

  const courseTokens = getCourseMatchTokens(normalizedCourse);
  const selectedTokens = getCourseMatchTokens(normalizedSelected);
  return normalizedSelected.includes(normalizedCourse) &&
    courseTokens.length >= 2 &&
    selectedTokens.length - courseTokens.length <= 2;
};

const normalizeCourseDedupeDegree = (degree = '', degreeBucket = '') => {
  const normalizedDegree = normalizeText(degree);
  const normalizedBucket = normalizeText(degreeBucket);
  if (/\b(master|masters|postgraduate|pg|ma|msc|ms|mba|meng|llm)\b/.test(normalizedDegree)) return 'master';
  if (/\b(bachelor|bachelors|undergraduate|ug|ba|bba|bsc|bs)\b/.test(normalizedDegree)) return 'bachelor';
  if (normalizedBucket === 'pg' || normalizedBucket === 'master') return 'master';
  if (normalizedBucket === 'ug' || normalizedBucket === 'bachelor') return 'bachelor';
  return normalizedBucket || normalizedDegree;
};

const getCourseMajorArea = (course = {}) =>
  course.majorArea || course.major_area || course.category || course.field || course.original_major_area || '';

const getCourseCompletenessScore = (course = {}) =>
  [
    course.degree,
    course.duration,
    course.level || course.educationLevel,
    getCourseMajorArea(course),
    course.id || course._id,
  ].filter(Boolean).length;

const dedupeModalCourses = (courses = [], degreeBucket = '') => {
  const byKey = new Map();

  courses.filter(Boolean).forEach((course) => {
    const rawTitle = course.title || course.name || course.program_name || course.programName || '';
    const cleanTitle = stripCourseDegreeSuffix(rawTitle);
    const specializationTitle = normalizeCourseSpecializationTitle(rawTitle);
    const derivedDegree = course.degree || extractCourseDegreeSuffix(rawTitle);
    const normalizedDegree = normalizeCourseDedupeDegree(derivedDegree, degreeBucket);
    const majorArea = getCourseMajorArea(course);
    const key = normalizeText([specializationTitle, normalizedDegree, majorArea].join('|'));
    if (!key) return;

    const normalizedCourse = {
      ...course,
      title: cleanTitle || rawTitle,
      name: course.name ? stripCourseDegreeSuffix(course.name) : cleanTitle || rawTitle,
      program_name: course.program_name ? stripCourseDegreeSuffix(course.program_name) : cleanTitle || rawTitle,
      degree: derivedDegree,
      majorArea: course.majorArea || majorArea,
      major_area: course.major_area || majorArea,
    };
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, normalizedCourse);
      return;
    }

    const preferred =
      getCourseCompletenessScore(normalizedCourse) > getCourseCompletenessScore(existing)
        ? normalizedCourse
        : existing;
    const fallback = preferred === normalizedCourse ? existing : normalizedCourse;
    byKey.set(key, {
      ...fallback,
      ...preferred,
      id: preferred.id || fallback.id,
      _id: preferred._id || fallback._id,
      degree: preferred.degree || fallback.degree,
      duration: preferred.duration || fallback.duration,
      level: preferred.level || fallback.level,
      educationLevel: preferred.educationLevel || fallback.educationLevel,
      majorArea: preferred.majorArea || fallback.majorArea,
      major_area: preferred.major_area || fallback.major_area,
    });
  });

  return [...byKey.values()];
};

const getProgramTitle = (program = '') => {
  if (typeof program === 'string') return program;
  return program.title || program.name || program.program_name || program.programName || program.course_name || program.courseName || '';
};

const getUniversityProgramSource = (uni = {}) => normalizeDegreeSource(uni);

const programLevelMatchesType = (program = {}, university = {}, selectedProgramType = '') => {
  const programText = normalizeText([
    program.title,
    program.name,
    program.program_name,
  ].filter(Boolean).join(' '));
  const explicitLevelText = normalizeText([
    program._explicitProgramLevel ? program.level : '',
    program._explicitProgramLevel ? program.degree : '',
    program._explicitProgramLevel ? program.educationLevel : '',
  ].filter(Boolean).join(' '));
  const levelText = normalizeText([explicitLevelText, programText].filter(Boolean).join(' '));
  const hasCourseLevel = program._explicitProgramLevel === true ||
    PG_COURSE_PATTERN.test(programText) ||
    UG_COURSE_PATTERN.test(programText);

  if (selectedProgramType === 'UG') {
    if (hasCourseLevel) return UG_COURSE_PATTERN.test(levelText) || levelText.includes('bachelor') || levelText.includes('undergraduate');
    return getUniversityProgramSource(university) === 'bachelors';
  }

  if (selectedProgramType === 'PG') {
    if (hasCourseLevel) return PG_COURSE_PATTERN.test(levelText) || levelText.includes('master') || levelText.includes('postgraduate');
    return getUniversityProgramSource(university) === 'masters';
  }

  return true;
};

const collectProgramItems = (value, majorArea = '', target = []) => {
  if (!value) return target;

  if (Array.isArray(value)) {
    value.forEach(item => collectProgramItems(item, majorArea, target));
    return target;
  }

  if (typeof value === 'string') {
    target.push({ title: value, majorArea });
    return target;
  }

  if (typeof value !== 'object') return target;

  const area = value.majorArea || value.major_area || value.original_major_area || value.name || value.category || value.field || value.stream || majorArea || '';
  const nestedPrograms = value.programs || value.specific_programs || value.courses || value.items;
  if (nestedPrograms) {
    collectProgramItems(nestedPrograms, area, target);
    return target;
  }

  target.push({ ...value, majorArea: value.majorArea || value.major_area || majorArea || value.category || value.field || value.stream || '' });
  return target;
};

const collectProgramsData = (programsData, target = []) => {
  if (!programsData) return target;

  if (Array.isArray(programsData)) {
    programsData.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const area = item.major_area || item.majorArea || item.original_major_area || item.category || item.field || '';
        collectProgramItems(item.programs || item.specific_programs || item.courses || item.items || item, area, target);
      } else {
        collectProgramItems(item, '', target);
      }
    });
    return target;
  }

  if (typeof programsData === 'object') {
    Object.entries(programsData).forEach(([area, programs]) => collectProgramItems(programs, area, target));
  }

  return target;
};

const normalizeProgramRecord = (program, university = {}, selectedProgramType = 'UG', index = 0) => {
  const title = getProgramTitle(program).trim();
  if (!title) return null;

  const rawMajorArea = program.majorArea || program.major_area || program.original_major_area || program.category || program.field || program.stream || '';
  const majorArea = rawMajorArea || '';
  const category = normalizeCategoryName(program.category || rawMajorArea || '', title);
  const universityId = getRecordId(university) || university.UNITID || university.universityCode || normalizeText(getUniversityDisplayName(university)) || 'university';
  const fallbackDegree = selectedProgramType === 'PG' ? 'Master' : 'Bachelor';
  const fallbackLevel = selectedProgramType === 'PG' ? 'Postgraduate' : 'Undergraduate';
  const fallbackDuration = selectedProgramType === 'PG' ? '2 years' : '3-4 years';
  const resolvedDegree = program.degree || fallbackDegree;

  return {
    id: program.id || program._id || `${universityId}-${selectedProgramType}-${normalizeText(`${title}-${majorArea}`) || index}`,
    title,
    name: program.name || title,
    program_name: program.program_name || program.programName || title,
    majorArea,
    category: category || majorArea,
    level: program.level || program.educationLevel || fallbackLevel,
    degree: resolvedDegree,
    educationLevel: program.educationLevel || university.educationLevel || (selectedProgramType === 'PG' ? 'Postgraduate' : 'Undergraduate'),
    studyMode: program.studyMode || program.study_mode || program.mode || 'On Campus',
    duration: program.duration || fallbackDuration,
    description: program.description || `${title} at ${getUniversityDisplayName(university) || 'this university'}`,
    major_area: majorArea,
    original_major_area: program.original_major_area || rawMajorArea,
    locations: program.locations || [],
    _explicitProgramLevel: Boolean(program.level || program.degree || program.educationLevel),
  };
};

// eslint-disable-next-line no-unused-vars
const extractUniversityPrograms = (university = {}, selectedProgramType = 'UG') => {
  const rawPrograms = [];
  const bachelorTemplate = university.programTemplates?.bachelor;
  const masterTemplate = university.programTemplates?.master;
  const legacyTemplate = university.programTemplate;

  collectProgramsData(university.programs_data, rawPrograms);
  collectProgramsData(university.GUS_DATA?.programs_data, rawPrograms);
  if (legacyTemplate?.programSource !== 'fallback-template') {
    collectProgramsData(legacyTemplate?.programs_data, rawPrograms);
  }
  if (bachelorTemplate?.programSource !== 'fallback-template') {
    collectProgramsData(bachelorTemplate?.programs_data, rawPrograms);
    collectProgramItems(bachelorTemplate?.major_areas, '', rawPrograms);
  }
  if (masterTemplate?.programSource !== 'fallback-template') {
    collectProgramsData(masterTemplate?.programs_data, rawPrograms);
    collectProgramItems(masterTemplate?.major_areas, '', rawPrograms);
  }
  collectProgramItems(university.major_areas, '', rawPrograms);
  collectProgramItems(university.GUS_DATA?.major_areas, '', rawPrograms);
  if (legacyTemplate?.programSource !== 'fallback-template') {
    collectProgramItems(legacyTemplate?.major_areas, '', rawPrograms);
  }
  collectProgramItems(university.programs, '', rawPrograms);
  collectProgramItems(university.courses, '', rawPrograms);
  collectProgramItems(university.metadata?.programs, '', rawPrograms);

  const seen = new Set();
  return rawPrograms
    .map((program, index) => normalizeProgramRecord(program, university, selectedProgramType, index))
    .filter(Boolean)
    .filter(program => programLevelMatchesType(program, university, selectedProgramType))
    .filter(program => {
      const key = normalizeText(`${program.title}|${program.majorArea}|${selectedProgramType}`);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const normalizeCourseMatchText = (value = '') =>
  normalizeCourseText(stripDegreePrefix(stripDiacritics(value)).replace(/[^a-zA-Z0-9]+/g, ' '));

// eslint-disable-next-line no-unused-vars
const courseMatchesInterest = (course, interest = '') => {
  const courseName = course.title || course.name || course.program_name || '';
  const courseNormalized = normalizeCourseMatchText(courseName);
  const interestNormalized = normalizeCourseMatchText(interest);
  if (!courseNormalized || !interestNormalized) return false;
  return courseNormalized === interestNormalized;
};

const UserProfileSelect = ({
  id,
  value,
  options = [],
  placeholder = 'Select',
  onChange,
  disabled = false,
  searchable = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectRef = useRef(null);
  const listboxId = `${id}-listbox`;
  const normalizedOptions = options.map(option => (
    typeof option === 'string'
      ? { value: option, label: option }
      : option
  ));
  const selectedOption = normalizedOptions.find(option => option.value === value);
  const filteredOptions = query.trim()
    ? normalizedOptions.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : normalizedOptions;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={selectRef} className={`userprofile-custom-select${isOpen ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}>
      <button
        type="button"
        id={id}
        className={`userprofile-select-trigger ${className}${!selectedOption ? ' is-placeholder' : ''}`}
        onClick={() => !disabled && setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-haspopup="listbox"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="userprofile-select-arrow" aria-hidden="true">v</span>
      </button>

      {isOpen && (
        <div className="userprofile-select-menu" id={listboxId} role="listbox">
          {searchable && (
            <input
              type="text"
              className="userprofile-select-search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}
          <div className="userprofile-select-options">
            {!query.trim() && (
              <button
                type="button"
                className={`userprofile-select-option${value === '' ? ' is-selected' : ''}`}
                role="option"
                aria-selected={value === ''}
                onClick={() => handleSelect('')}
              >
                {placeholder}
              </button>
            )}
            {filteredOptions.map(option => (
              <button
                type="button"
                key={option.value}
                className={`userprofile-select-option${value === option.value ? ' is-selected' : ''}`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="userprofile-select-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// INLINE STYLES
// ─────────────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('urp-styles')) {
  const s = document.createElement('style');
  s.id = 'urp-styles';
  s.textContent = `
.urp-overlay{position:fixed;inset:0;z-index:99999;background:rgba(8,12,36,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:urp-fade-in .2s ease-out}
@keyframes urp-fade-in{from{opacity:0}to{opacity:1}}
.urp-card{background:#fff;border-radius:20px;width:100%;max-width:400px;position:relative;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.26),0 8px 24px rgba(0,0,0,.1);animation:urp-slide-up .38s cubic-bezier(.34,1.56,.64,1)}
@keyframes urp-slide-up{from{opacity:0;transform:translateY(28px) scale(.93)}to{opacity:1;transform:translateY(0) scale(1)}}
.urp-phase-waiting{border-top:4px solid #6366f1}
.urp-phase-approved{border-top:4px solid #10b981}
.urp-phase-rejected{border-top:4px solid #ef4444}
.urp-phase-timeout{border-top:4px solid #f59e0b}
.urp-body{padding:24px 22px 22px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;position:relative}
.urp-close{position:absolute;top:10px;right:12px;width:28px;height:28px;border-radius:50%;border:none;background:#f1f5f9;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
.urp-close:hover{background:#e2e8f0;color:#1e293b}
.urp-title{font-size:19px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-.3px;line-height:1.25}
.urp-title-green{color:#065f46}.urp-title-red{color:#7f1d1d}
.urp-desc{font-size:13px;color:#475569;margin:0;line-height:1.6;max-width:340px}
.urp-highlight{color:#1e293b}
.urp-rings{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.urp-ring{position:absolute;border-radius:50%;border:2px solid transparent}
.urp-ring-1{inset:0;border-top-color:#6366f1;border-right-color:#6366f1;animation:urp-spin 1.4s linear infinite}
.urp-ring-2{inset:8px;border-bottom-color:#8b5cf6;border-left-color:#8b5cf6;animation:urp-spin 2s linear infinite reverse}
.urp-ring-3{inset:16px;border-top-color:#a78bfa;animation:urp-spin 2.8s linear infinite}
@keyframes urp-spin{to{transform:rotate(360deg)}}
.urp-center-logo{position:relative;z-index:2;width:36px;height:36px;display:flex;align-items:center;justify-content:center}
.urp-center-logo img{width:100%;height:100%;object-fit:contain}
.urp-chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.urp-chip{background:#ede9fe;color:#5b21b6;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600}
.urp-status-badge{display:inline-flex;align-items:center;gap:7px;background:#f0f0ff;border:1px solid #c7d2fe;border-radius:999px;padding:7px 16px;font-size:12px;color:#4338ca;font-weight:600}
.urp-pulse{width:7px;height:7px;border-radius:50%;background:#6366f1;flex-shrink:0;animation:urp-pulse-anim 1.3s ease-in-out infinite}
@keyframes urp-pulse-anim{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.45}}
.urp-progress-track{width:100%;height:5px;background:#e2e8f0;border-radius:999px;overflow:hidden}
.urp-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:999px;transition:width 1s linear}
.urp-timer{width:100%;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
.urp-timer-value{font-weight:700;font-variant-numeric:tabular-nums;color:#6366f1;font-size:12px}
.urp-note{font-size:11px;color:#94a3b8;margin:0;line-height:1.5;max-width:320px}
.urp-burst{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.urp-burst-dot{position:absolute;width:7px;height:7px;border-radius:2px;animation:urp-burst-fly .7s ease-out forwards}
.urp-bd-0{background:#10b981;top:2px;left:34px;animation-delay:.30s}
.urp-bd-1{background:#f59e0b;top:8px;right:4px;animation-delay:.35s}
.urp-bd-2{background:#6366f1;top:34px;right:2px;animation-delay:.40s}
.urp-bd-3{background:#ef4444;bottom:8px;right:8px;animation-delay:.45s}
.urp-bd-4{background:#3b82f6;bottom:2px;left:34px;animation-delay:.30s}
.urp-bd-5{background:#ec4899;bottom:8px;left:4px;animation-delay:.35s}
.urp-bd-6{background:#10b981;top:34px;left:2px;animation-delay:.40s}
.urp-bd-7{background:#a78bfa;top:2px;left:10px;animation-delay:.45s}
.urp-bd-8{background:#fbbf24;top:2px;right:14px;animation-delay:.50s}
.urp-bd-9{background:#34d399;bottom:6px;right:20px;animation-delay:.55s}
@keyframes urp-burst-fly{0%{opacity:0;transform:scale(0) rotate(0deg)}60%{opacity:1;transform:scale(1.3) rotate(200deg) translate(10px,-14px)}100%{opacity:0;transform:scale(.8) rotate(360deg) translate(18px,-26px)}}
.urp-check-wrap{position:relative;z-index:2}
.urp-check-svg{width:64px;height:64px}
.urp-circle{fill:none;stroke:#10b981;stroke-width:2;stroke-dasharray:160;stroke-dashoffset:160;animation:urp-draw .55s cubic-bezier(.65,0,.45,1) .1s forwards}
.urp-tick{fill:none;stroke:#10b981;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:50;stroke-dashoffset:50;animation:urp-draw .35s ease-out .6s forwards}
@keyframes urp-draw{to{stroke-dashoffset:0}}
.urp-reject-wrap{display:flex;align-items:center;justify-content:center}
.urp-reject-circle{width:64px;height:64px;border-radius:50%;background:#fee2e2;border:2px solid #fca5a5;display:flex;align-items:center;justify-content:center;animation:urp-slide-up .45s cubic-bezier(.34,1.56,.64,1)}
.urp-reject-x{display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:28px;font-weight:700}
.urp-timeout-icon{display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:44px;animation:urp-float 3s ease-in-out infinite}
@keyframes urp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.urp-reason{width:100%;background:#fff1f2;border:1px dashed #fca5a5;border-radius:10px;padding:12px 14px;text-align:left}
.urp-reason-label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#ef4444;margin-bottom:5px}
.urp-reason-text{font-size:12px;color:#7f1d1d;margin:0;line-height:1.5;font-style:italic}
.urp-infobox{width:100%;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;text-align:left}
.urp-infobox-green{background:#f0fdf4;border:1px solid #bbf7d0}
.urp-infobox-red{background:#fff7f7;border:1px solid #fecaca}
.urp-infobox-amber{background:#fffbeb;border:1px solid #fde68a}
.urp-inforow{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#334155;line-height:1.5}
.urp-infoicon{display:flex;align-items:center;flex-shrink:0;margin-top:1px}
.urp-btn-primary{width:100%;padding:12px 18px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .18s,box-shadow .18s;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;letter-spacing:-.2px}
.urp-btn-green{background:linear-gradient(135deg,#10b981,#059669)}
.urp-btn-blue{background:linear-gradient(135deg,#3b82f6,#2563eb)}
.urp-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.16)}
.urp-btn-primary:active{transform:translateY(0);box-shadow:none}
.urp-btn-ghost{width:100%;padding:10px 18px;border:1.5px solid #e2e8f0;border-radius:12px;background:transparent;font-size:13px;font-weight:600;color:#475569;cursor:pointer;transition:border-color .15s,color .15s,background .15s}
.urp-btn-ghost:hover{border-color:#6366f1;color:#6366f1;background:#f0f0ff}
.urp-btn-link{background:none;border:none;font-size:12px;color:#94a3b8;cursor:pointer;padding:3px;text-decoration:underline;transition:color .15s}
.urp-btn-link:hover{color:#475569}
.urp-highlight-card{border:2px solid #10b981 !important;box-shadow:0 0 0 3px rgba(16,185,129,.15) !important;animation:urp-highlight-pulse 2s ease-in-out 3}
@keyframes urp-highlight-pulse{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,.15)}50%{box-shadow:0 0 0 6px rgba(16,185,129,.28)}}
.urp-new-badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(16,185,129,.4);z-index:10}
.urp-result-banner{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:12px;margin-bottom:14px;font-size:13px;line-height:1.5;position:relative}
.urp-banner-approved{background:#f0fdf4;border:1px solid #86efac;color:#065f46}
.urp-banner-rejected{background:#fff7f7;border:1px solid #fca5a5;color:#7f1d1d}
.urp-banner-icon{display:flex;align-items:center;flex-shrink:0;margin-top:1px}
.urp-banner-text{flex:1}
.urp-banner-text strong{font-weight:700}
.urp-banner-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.5;padding:0 2px;flex-shrink:0;display:flex;align-items:center}
.urp-banner-close:hover{opacity:1}
@media(max-width:480px){.urp-card{border-radius:16px}.urp-body{padding:20px 16px 18px;gap:12px}.urp-title{font-size:17px}}
.branch-step-wrapper{display:flex;flex-direction:column;align-items:center;gap:2rem;padding:1rem 0}
.branch-step-label{font-size:.85rem;color:#64748b;text-align:center;margin-bottom:.25rem}
.branch-cards-row{display:flex;gap:1.25rem;justify-content:center;width:100%;flex-wrap:wrap}
.branch-card{flex:1;min-width:200px;max-width:280px;border:2.5px solid #e2e8f0;border-radius:20px;padding:2rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:1rem;cursor:pointer;transition:all .22s cubic-bezier(.34,1.4,.64,1);background:#fff;position:relative;overflow:hidden}
.branch-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(99,102,241,.14)}
.branch-card.selected{border-color:#6366f1;background:linear-gradient(145deg,#f5f3ff,#eef2ff);box-shadow:0 8px 24px rgba(99,102,241,.18)}
.branch-card.ug-card.selected{border-color:#10b981;background:linear-gradient(145deg,#f0fdf4,#ecfdf5);box-shadow:0 8px 24px rgba(16,185,129,.18)}
.branch-card-title{font-size:1.15rem;font-weight:800;color:#1e293b;letter-spacing:-.3px}
.branch-card.selected .branch-card-title{color:#6366f1}
.branch-card.ug-card.selected .branch-card-title{color:#10b981}
.branch-card-subtitle{font-size:.78rem;color:#64748b;text-align:center;line-height:1.5}
.branch-card-tag{font-size:.65rem;font-weight:700;padding:.22rem .65rem;border-radius:999px;letter-spacing:.3px;text-transform:uppercase}
.branch-card-tag.pg-tag{background:#ede9fe;color:#5b21b6}
.branch-card-tag.ug-tag{background:#dcfce7;color:#15803d}
.branch-selected-indicator{display:inline-block;width:18px;height:18px;border-radius:50%;background:#6366f1;position:absolute;top:12px;right:12px}
.branch-card.ug-card.selected .branch-selected-indicator{background:#10b981}
.branch-info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:.875rem 1rem;font-size:.8rem;color:#475569;line-height:1.6;width:100%;max-width:480px;text-align:center}
.branch-info-box strong{color:#6366f1}
.segment-section{margin:0 0 1.5rem;padding:1rem;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0}
.segment-section-label{font-size:.8rem;font-weight:700;color:#475569;margin-bottom:.75rem;display:block;text-transform:uppercase;letter-spacing:.4px}
.segment-chips-row{display:flex;flex-wrap:wrap;gap:.5rem}
.segment-chip{padding:.45rem 1rem;border-radius:999px;border:2px solid #e2e8f0;background:#fff;font-size:.8rem;font-weight:600;color:#475569;cursor:pointer;transition:all .18s}
.segment-chip:hover{border-color:#6366f1;color:#6366f1}
.segment-chip.active-pg{border-color:#6366f1;background:#ede9fe;color:#5b21b6}
.segment-chip.active-ug{border-color:#10b981;background:#dcfce7;color:#15803d}

/* ── Course category display in step 3 ── */
.course-interest-row{display:block!important;width:100%;max-width:100%;grid-column:1/-1!important;background:transparent!important}
.course-interest-row>label,.course-interest-row>.course-category-grid,.course-interest-row>div,.course-interest-row>span{display:block;width:100%;max-width:100%;grid-column:1/-1!important}
.course-category-grid{display:flex;flex-direction:row;align-items:stretch;gap:.75rem;margin-top:.5rem;overflow-x:auto;overflow-y:hidden;padding:0 0 .45rem;scrollbar-width:thin;scroll-snap-type:x proximity}
.course-category-block{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:.75rem .85rem;flex:0 0 620px;max-width:620px;min-width:420px;scroll-snap-align:start}
.course-category-title{font-size:.75rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.55rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.course-quick-chips{display:flex;flex-direction:row;flex-wrap:wrap;align-content:flex-start;gap:.4rem;max-height:126px;overflow-y:auto;overflow-x:hidden;padding-right:.1rem;scrollbar-width:thin}
.course-quick-chip{flex:0 1 auto;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:.3rem .8rem;border-radius:999px;border:1.5px solid #e2e8f0;background:#fff;font-size:.75rem;font-weight:500;color:#475569;cursor:pointer;transition:all .15s}
.course-quick-chip:hover{border-color:#6366f1;color:#6366f1;background:#f0f0ff}
.course-quick-chip.selected-pg{border-color:#6366f1;background:#ede9fe;color:#5b21b6;font-weight:600}
.course-quick-chip.selected-ug{border-color:#10b981;background:#dcfce7;color:#15803d;font-weight:600}
.course-quick-chip:disabled{opacity:.45;cursor:not-allowed}
.course-more-chip{border-style:dashed;background:#eef2ff;color:#4f46e5;font-weight:700;max-width:none}
.course-more-chip:hover{border-color:#6366f1;color:#4338ca;background:#e0e7ff}
@media(max-width:640px){.course-category-block{flex-basis:86vw;min-width:260px;max-width:86vw}.course-quick-chips{max-height:118px}}

/* ── Field of study select ── */
.field-select-wrapper{position:relative}
.field-select-wrapper select{width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;color:#1e293b;background:#fff;appearance:none;cursor:pointer;transition:border-color .18s}
.field-select-wrapper select:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12)}
.field-select-wrapper::after{content:'▾';position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#94a3b8;font-size:14px}
`;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE UNIVERSITY
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// URP POPUP  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const UniversityRequestPopup = ({ token, pendingRequest, onApproved, onRejected, onDismiss }) => {
  const [phase,      setPhase]      = React.useState("waiting");
  const [timeLeft,   setTimeLeft]   = React.useState(URP_WAIT_MS);
  const [dotCount,   setDotCount]   = React.useState(1);
  const [resultData, setResultData] = React.useState(null);

  const startRef    = React.useRef(Date.now());
  const pollRef     = React.useRef(null);
  const timerRef    = React.useRef(null);
  const dotsRef     = React.useRef(null);
  const resolvedRef = React.useRef(false);
  const seenIds     = React.useRef(new Set());

  React.useEffect(() => {
    dotsRef.current = setInterval(() => setDotCount(d => d >= 3 ? 1 : d + 1), 550);
    return () => clearInterval(dotsRef.current);
  }, []);

  React.useEffect(() => {
    if (phase !== "waiting") return;
    timerRef.current = setInterval(() => {
      const remaining = URP_WAIT_MS - (Date.now() - startRef.current);
      if (remaining <= 0) {
        setTimeLeft(0);
        if (!resolvedRef.current) setPhase("timeout");
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const urpPoll = React.useCallback(async () => {
    if (resolvedRef.current || !token) return;
    try {
      const res = await axiosInstance.get('/api/user/notifications');
      const all = res.data?.notifications || res.data?.data || [];
      const uniLower = (pendingRequest?.universityName || "").toLowerCase();
      const matches = (n) =>
        !seenIds.current.has(n._id) &&
        (!uniLower || n.message?.toLowerCase().includes(uniLower));
      const approved = all.find(n => n.type === "UNIVERSITY_APPROVED" && matches(n));
      const rejected = all.find(n => n.type === "UNIVERSITY_REJECTED" && matches(n));
      if (approved) {
        resolvedRef.current = true; seenIds.current.add(approved._id);
        clearInterval(pollRef.current); clearInterval(timerRef.current);
        setResultData({ universityName: pendingRequest?.universityName || urpExtractName(approved.message) });
        setPhase("approved"); urpMarkRead(approved._id);
      } else if (rejected) {
        resolvedRef.current = true; seenIds.current.add(rejected._id);
        clearInterval(pollRef.current); clearInterval(timerRef.current);
        setResultData({
          universityName: pendingRequest?.universityName || urpExtractName(rejected.message),
          reason: urpExtractReason(rejected.message),
        });
        setPhase("rejected"); urpMarkRead(rejected._id);
      }
    } catch (_) {}
  }, [token, pendingRequest]);

  React.useEffect(() => {
    urpPoll();
    pollRef.current = setInterval(urpPoll, URP_POLL_MS);
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); clearInterval(dotsRef.current); };
  }, [urpPoll]);

  const urpMarkRead = async (id) => {
    try { await axiosInstance.patch(`/api/user/notifications/${id}/read`, {}); } catch (_) {}
  };

  const urpExtractName   = (msg = "") => msg.match(/"([^"]+)"/)?.[1] || "your university";
  const urpExtractReason = (msg = "") => msg.match(/[Rr]eason[:\s]+(.+)/)?.[1]?.trim() || null;
  const fmtTime = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const progressPct = Math.min(100, ((URP_WAIT_MS - timeLeft) / URP_WAIT_MS) * 100);
  const dots = ".".repeat(dotCount);
  const stopAll = () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  const handleDismiss        = () => { stopAll(); onDismiss?.(); };
  const handleApprovedAction = () => { stopAll(); onApproved?.(resultData); };
  const handleRejectedAction = () => { stopAll(); onRejected?.(resultData); };

  return (
    <div className="urp-overlay">
      <div className={`urp-card urp-phase-${phase}`}>
        {phase === "waiting" && (
          <div className="urp-body">
            <button className="urp-close" onClick={handleDismiss} aria-label="Close">x</button>
            <div className="urp-rings">
              <div className="urp-ring urp-ring-1" /><div className="urp-ring urp-ring-2" /><div className="urp-ring urp-ring-3" />
              <div className="urp-center-logo"><img src={EdutechLogo} alt="Edutech" /></div>
            </div>
            <h2 className="urp-title">Request Sent!</h2>
            <p className="urp-desc">Your request for <strong className="urp-highlight">"{pendingRequest?.universityName}"</strong> has been sent to the admin team.</p>
            {pendingRequest?.courses?.length > 0 && (
              <div className="urp-chips">{pendingRequest.courses.map((c, i) => <span key={i} className="urp-chip">{c}</span>)}</div>
            )}
            <div className="urp-status-badge"><span className="urp-pulse" />Waiting for admin review{dots}</div>
            <div className="urp-progress-track"><div className="urp-progress-fill" style={{ width: `${progressPct}%` }} /></div>
            <div className="urp-timer"><span>Time remaining</span><span className="urp-timer-value">{fmtTime(timeLeft)}</span></div>
            <p className="urp-note">Stay here to be notified instantly, or close and continue selecting other universities.</p>
            <button className="urp-btn-ghost" onClick={handleDismiss}>Continue Without Waiting</button>
          </div>
        )}
        {phase === "approved" && (
          <div className="urp-body">
            <div className="urp-burst">
              {[...Array(10)].map((_, i) => <div key={i} className={`urp-burst-dot urp-bd-${i}`} />)}
              <div className="urp-check-wrap"><svg className="urp-check-svg" viewBox="0 0 52 52"><circle className="urp-circle" cx="26" cy="26" r="24" /><path className="urp-tick" d="M14 27l8 8 16-16" /></svg></div>
            </div>
            <h2 className="urp-title urp-title-green">University Approved!</h2>
            <p className="urp-desc"><strong>"{resultData?.universityName}"</strong> has been added and is now visible in your list below.</p>
            <div className="urp-infobox urp-infobox-green">
              <div className="urp-inforow"><span>University is now in your search list</span></div>
              <div className="urp-inforow"><span>Search for it by name and click to select</span></div>
              <div className="urp-inforow"><span>Then pick 1 course from it</span></div>
            </div>
            <button className="urp-btn-primary urp-btn-green" onClick={handleApprovedAction}>Find and Select University</button>
            <button className="urp-btn-link" onClick={handleDismiss}>I'll do it later</button>
          </div>
        )}
        {phase === "rejected" && (
          <div className="urp-body">
            <div className="urp-reject-wrap"><div className="urp-reject-circle"><span className="urp-reject-x">X</span></div></div>
            <h2 className="urp-title urp-title-red">Request Not Approved</h2>
            <p className="urp-desc">Sorry, <strong>"{resultData?.universityName}"</strong> could not be added at this time.</p>
            {resultData?.reason && (<div className="urp-reason"><span className="urp-reason-label">Admin's note</span><p className="urp-reason-text">"{resultData.reason}"</p></div>)}
            <div className="urp-infobox urp-infobox-red">
              <div className="urp-inforow"><span>Please select from available universities below</span></div>
              <div className="urp-inforow"><span>You can re-submit with the official name</span></div>
            </div>
            <button className="urp-btn-primary urp-btn-blue" onClick={handleRejectedAction}>Select from Available Universities</button>
            <button className="urp-btn-link" onClick={handleDismiss}>Dismiss</button>
          </div>
        )}
        {phase === "timeout" && (
          <div className="urp-body">
            <div className="urp-timeout-icon">&#9201;</div>
            <h2 className="urp-title">Still Processing...</h2>
            <p className="urp-desc">Your request is still being reviewed. Admins usually respond within a few hours.</p>
            <div className="urp-infobox urp-infobox-amber">
              <div className="urp-inforow"><span>You'll be notified once admin responds</span></div>
              <div className="urp-inforow"><span>For now, select from existing universities</span></div>
            </div>
            <button className="urp-btn-primary" onClick={handleDismiss}>Continue Selecting Universities</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const sessionKey = sessionStorage.getItem('sessionKey') || '';
  const userEmail  = (sessionKey ? localStorage.getItem(`userEmail_${sessionKey}`) : null)
                     || localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
  const token      = (sessionKey ? localStorage.getItem(`token_${sessionKey}`) : null)
                     || localStorage.getItem('token') || '';
  const userType   = (sessionKey ? localStorage.getItem(`studentType_${sessionKey}`) : null)
                     || localStorage.getItem('studentType') || 'firstyear';

  const [profileImage,    setProfileImage]    = useState(null);
  const [imagePreview,    setImagePreview]    = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error,           setError]           = useState('');
  const [toast,           setToast]           = useState({ show: false, message: '', type: 'success' });
  const [showSuccess,     setShowSuccess]     = useState(false);

  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [pendingRequest,   setPendingRequest]   = useState(null);
  const [approvedUniName,  setApprovedUniName]  = useState(null);
  const [resultBanner,     setResultBanner]     = useState(null);

  const bgPollRef     = useRef(null);
  const bgSeenIds     = useRef(new Set());
  const bgResolved    = useRef(false);
  const bgPendingName = useRef(null);

  // ── Core state ────────────────────────────────────────────────────────────
  const [basicInfo, setBasicInfo] = useState({
    ...emptyBasicInfo(userEmail),
  });

  const [programType,     setProgramType]     = useState('');
  // ✅ FIX: education.field is now properly tracked and saved
  const [education,       setEducation]       = useState({ qualification: '', institution: '', field: '', cgpa: '' });
  const [availableCountries, setAvailableCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countryError, setCountryError] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [programSections, setProgramSections] = useState([]);
  const [programIndexMessage, setProgramIndexMessage] = useState('');
  const [majorAreaSearch, setMajorAreaSearch] = useState("");
  const [showAllMajorAreas, setShowAllMajorAreas] = useState(false);

  const [interestedCourses,     setInterestedCourses]     = useState([]);
  const [courseInterestInput,   setCourseInterestInput]   = useState('');
  const [courseInterestSuggest, setCourseInterestSuggest] = useState([]);
  const [courseInterestLoading, setCourseInterestLoading] = useState(false);
  const [courseProgramLoading,  setCourseProgramLoading]  = useState(false);
  const [programSectionsLoading, setProgramSectionsLoading] = useState(false);
  const [courseProgramLoadFailed, setCourseProgramLoadFailed] = useState({});
  const [selectedProgramGroup, setSelectedProgramGroup] = useState('');
  const [groupPrograms, setGroupPrograms] = useState([]);
  const [groupProgramsByKey, setGroupProgramsByKey] = useState({});
  const [groupProgramSearch, setGroupProgramSearch] = useState('');
  const [programGroupSearch, setProgramGroupSearch] = useState('');
  const [visibleProgramGroupCount, setVisibleProgramGroupCount] = useState(PROGRAM_GROUP_RENDER_BATCH);
  const [groupProgramsPagination, setGroupProgramsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showCourseInterestDdp, setShowCourseInterestDdp] = useState(false);
  const [expandedCourseCategories, setExpandedCourseCategories] = useState({});
  const courseInterestInputRef = useRef(null);
  const segmentSectionRef = useRef(null);
  const groupProgramAbortRef = useRef(null);
  const groupProgramInFlightRef = useRef(new Set());
  const groupProgramPaginationByKeyRef = useRef({});
  const courseInterestAbortRef = useRef(null);

  // ── Universities ──────────────────────────────────────────────────────────
  const [selectedUniversities,     setSelectedUniversities]     = useState([]);
  const [universities,             setUniversities]             = useState([]);
  const [searchTerm,               setSearchTerm]               = useState('');
  const [debouncedSearchTerm,      setDebouncedSearchTerm]      = useState('');
  const [visibleUniversityCount,   setVisibleUniversityCount]   = useState(UNIVERSITY_RENDER_BATCH);
  const [universityCourses,        setUniversityCourses]        = useState({});
  const [universityPagination,     setUniversityPagination]     = useState({ page: 1, pages: 1, total: 0 });
  const [loadingUniversityPrograms,setLoadingUniversityPrograms]= useState(false);
  const [dynamicCoursesByCategory, setDynamicCoursesByCategory] = useState({});
  const [showCourseModal,          setShowCourseModal]          = useState(false);
  const [currentUniversity,        setCurrentUniversity]        = useState(null);
  const [currentUniversityCourses, setCurrentUniversityCourses] = useState([]);
  const [filteredCourses,          setFilteredCourses]          = useState([]);
  const [courseModalNotice,        setCourseModalNotice]        = useState('');
  const [courseModalFieldLabel,    setCourseModalFieldLabel]    = useState('');
  const [courseModalShowingAll,    setCourseModalShowingAll]    = useState(false);
  const [tempSelectedCourses,      setTempSelectedCourses]      = useState([]);
  const [courseSearchTerm,         setCourseSearchTerm]         = useState('');
  const [courseFilter,             setCourseFilter]             = useState({ level: '', studyMode: '', majorArea: '' });
  const universitySearchAbortRef = useRef(null);
  const universitySearchInFlightRef = useRef(new Set());
  const universityProgramsAbortRef = useRef(null);
  const latestUniversityProgramsRequestKeyRef = useRef('');
  const previousInterestedCoursesKeyRef = useRef(null);

  const [showRequestModal,   setShowRequestModal]   = useState(false);
  const [requestForm,        setRequestForm]        = useState({ universityName: '', country: '' });
  const [requestFormErrors,  setRequestFormErrors]  = useState({});
  const [submittingRequest,  setSubmittingRequest]  = useState(false);
  const [requestSuccess,     setRequestSuccess]     = useState(false);
  const [reqCourseInput,     setReqCourseInput]     = useState('');
  const [reqCourses,         setReqCourses]         = useState([]);
  const [reqSuggestions,     setReqSuggestions]     = useState([]);
  const [showReqSuggestions, setShowReqSuggestions] = useState(false);
  const reqCourseInputRef = useRef(null);
  const [validationErrors,   setValidationErrors]   = useState({});

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  }, []);

  const normalizeProgramItemForSection = (program, fallbackMajorArea = '') => {
    if (typeof program === 'string') {
      return {
        title: program,
        name: program,
        program_name: program,
        majorArea: fallbackMajorArea,
        major_area: fallbackMajorArea,
        category: fallbackMajorArea,
      };
    }

    return {
      ...program,
      title: program.title || program.name || program.program_name || program.programName || '',
      majorArea: program.majorArea || program.major_area || program.category || fallbackMajorArea,
      major_area: program.major_area || program.majorArea || program.category || fallbackMajorArea,
      category: program.category || program.majorArea || program.major_area || fallbackMajorArea,
      group: program.group || '',
    };
  };

  const getDynamicCourseList = (category = '') => {
    if (!category) return [];
    const entries = Object.entries(dynamicCoursesByCategory || {});
    if (!entries.length) return [];

    const match = entries.find(([name]) => segmentNamesMatch(name, category) || segmentNamesMatch(category, name));
    return match ? match[1] : [];
  };

  const getGroupProgramsKey = (type = '', segment = '', group = '', q = '') =>
    `${type.trim()}::${(selectedCountry || '').trim()}::${segment.trim()}::${group.trim()}::${q.trim().toLowerCase()}`;

  const resetSelectedProgramGroup = useCallback(() => {
    setSelectedProgramGroup('');
    setGroupPrograms([]);
    setGroupProgramSearch('');
    setProgramGroupSearch('');
    setVisibleProgramGroupCount(PROGRAM_GROUP_RENDER_BATCH);
    setGroupProgramsPagination({ page: 1, pages: 1, total: 0 });
  }, []);

  const applyProgramsToSection = useCallback((segmentName = '', programs = []) => {
    const items = programs
      .map(program => normalizeProgramItemForSection(program, segmentName))
      .filter(item => item.title);
    const groups = items.map(item => ({
      name: item.title,
      programs: [item.title],
      items: [{ ...item, group: item.group || item.title }],
    }));

    setProgramSections(prev => prev.map(section => (
      segmentNamesMatch(section.name, segmentName)
        ? {
            ...section,
            programs: items.map(item => item.title),
            items,
            groups,
            loaded: true,
          }
        : section
    )));
    setDynamicCoursesByCategory(prev => ({ ...prev, [segmentName]: items.map(item => item.title) }));
  }, []);

  const fetchProgramsForMajorArea = useCallback(async ({ page = 1, q = '' } = {}) => {
    const segment = (selectedSegment?.name || '').trim();
    if (!programType || !selectedCountry || !segment) return;
    const normalizedQ = q.trim();
    const cacheKey = getGroupProgramsKey(programType, segment, '', normalizedQ);
    const requestKey = `${cacheKey}::${page}`;
    const cachedPrograms = groupProgramsByKey[cacheKey];

    if (page === 1 && cachedPrograms?.length) {
      applyProgramsToSection(segment, cachedPrograms);
      setGroupProgramsPagination(groupProgramPaginationByKeyRef.current[cacheKey] || { page: 1, pages: 1, total: cachedPrograms.length });
      setCourseProgramLoadFailed(prev => ({ ...prev, [segment]: false }));
      return;
    }

    if (groupProgramInFlightRef.current.has(requestKey)) return;
    groupProgramAbortRef.current?.abort?.();
    const controller = new AbortController();
    groupProgramAbortRef.current = controller;
    groupProgramInFlightRef.current.add(requestKey);

    setCourseProgramLoading(true);
    try {
      const res = await axiosInstance.get('/api/student/program-index/programs', {
        signal: controller.signal,
        params: {
          programType,
          degree: programType === 'PG' ? 'master' : 'bachelor',
          country: selectedCountry || '',
          majorArea: segment,
          q: normalizedQ,
          page,
          limit: PROGRAM_SEARCH_LIMIT,
        },
      });
      const apiPrograms = Array.isArray(res.data?.programs)
        ? res.data.programs
        : Array.isArray(res.data?.items)
          ? res.data.items
          : [];
      const pagination = res.data?.pagination || { page, pages: 1, total: apiPrograms.length };
      setGroupProgramsByKey(prev => {
        const nextPrograms = page > 1 ? [...(prev[cacheKey] || []), ...apiPrograms] : apiPrograms;
        applyProgramsToSection(segment, nextPrograms);
        groupProgramPaginationByKeyRef.current[cacheKey] = pagination;
        return { ...prev, [cacheKey]: nextPrograms };
      });
      setGroupProgramsPagination(pagination);
      setCourseProgramLoadFailed(prev => ({ ...prev, [segment]: false }));
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
      if (page === 1) applyProgramsToSection(segment, []);
      setGroupProgramsPagination({ page: 1, pages: 1, total: 0 });
      setCourseProgramLoadFailed(prev => ({ ...prev, [segment]: true }));
    } finally {
      groupProgramInFlightRef.current.delete(requestKey);
      setCourseProgramLoading(false);
    }
  }, [programType, selectedCountry, selectedSegment, groupProgramsByKey, applyProgramsToSection]);

  const fetchProgramsForGroup = useCallback(async ({ group, page = 1, q = '' }) => {
    const segment = (selectedSegment?.name || '').trim();
    const selectedGroup = (group || selectedProgramGroup || '').trim();
    if (!programType || !selectedCountry || !segment || !selectedGroup) return;
    const normalizedQ = q.trim();
    const groupKey = getGroupProgramsKey(programType, segment, selectedGroup, normalizedQ);
    const requestKey = `${groupKey}::${page}`;
    const cachedPrograms = groupProgramsByKey[groupKey];

    if (page === 1 && cachedPrograms?.length) {
      setGroupPrograms(cachedPrograms);
      setGroupProgramsPagination(groupProgramPaginationByKeyRef.current[groupKey] || { page: 1, pages: 1, total: cachedPrograms.length });
      setCourseProgramLoadFailed(prev => ({ ...prev, [`${segment}|${selectedGroup}`]: false }));
      return;
    }

    if (groupProgramInFlightRef.current.has(requestKey)) return;
    groupProgramAbortRef.current?.abort?.();
    const controller = new AbortController();
    groupProgramAbortRef.current = controller;
    groupProgramInFlightRef.current.add(requestKey);

    setCourseProgramLoading(true);
    try {
      const res = await axiosInstance.get('/api/student/program-index/programs', {
        signal: controller.signal,
        params: {
          programType,
          degree: programType === 'PG' ? 'master' : 'bachelor',
          country: selectedCountry || '',
          majorArea: segment,
          group: selectedGroup,
          q: normalizedQ,
          page,
          limit: PROGRAM_SEARCH_LIMIT,
        },
      });
      const apiPrograms = Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data?.data) ? res.data.data : [];
      const pagination = res.data?.pagination || { page, pages: 1, total: apiPrograms.length };
      setGroupProgramsByKey(prev => {
        const nextPrograms = page > 1 ? [...(prev[groupKey] || []), ...apiPrograms] : apiPrograms;
        setGroupPrograms(nextPrograms);
        groupProgramPaginationByKeyRef.current[groupKey] = pagination;
        return { ...prev, [groupKey]: nextPrograms };
      });
      setGroupProgramsPagination(pagination);
      setCourseProgramLoadFailed(prev => ({ ...prev, [`${segment}|${selectedGroup}`]: false }));
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
      setGroupProgramsByKey(prev => {
        const nextPrograms = page > 1 ? (prev[groupKey] || []) : [];
        setGroupPrograms(nextPrograms);
        return { ...prev, [groupKey]: nextPrograms };
      });
      setGroupProgramsPagination({ page: 1, pages: 1, total: 0 });
      setCourseProgramLoadFailed(prev => ({ ...prev, [`${segment}|${selectedGroup}`]: true }));
    } finally {
      groupProgramInFlightRef.current.delete(requestKey);
      setCourseProgramLoading(false);
    }
  }, [programType, selectedCountry, selectedSegment, selectedProgramGroup, groupProgramsByKey]);

  useEffect(() => {
    if (!programType || !selectedCountry || !selectedSegment?.name) return;
    const timer = setTimeout(() => {
      fetchProgramsForMajorArea({ page: 1, q: programGroupSearch });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [programType, selectedCountry, selectedSegment?.name, programGroupSearch, fetchProgramsForMajorArea]);

  useEffect(() => {
    if (!programType || !selectedCountry || !selectedSegment?.name || !selectedProgramGroup) return;
    const timer = setTimeout(() => {
      fetchProgramsForGroup({
        group: selectedProgramGroup,
        page: 1,
        q: groupProgramSearch,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [programType, selectedCountry, selectedSegment, selectedProgramGroup, groupProgramSearch, fetchProgramsForGroup]);

  useEffect(() => {
    resetSelectedProgramGroup();
  }, [selectedSegment?.name, resetSelectedProgramGroup]);

  useEffect(() => {
    setVisibleProgramGroupCount(PROGRAM_GROUP_RENDER_BATCH);
  }, [programGroupSearch]);

  // ── Load existing profile ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!token) { setFetchingProfile(false); return; }
      try {
        setFetchingProfile(true);
        const [profileResult, accountResult] = await Promise.allSettled([
          axiosInstance.get('/api/user/profile'),
          axiosInstance.get('/api/students/me'),
        ]);

        if (accountResult.status === 'rejected' && accountResult.reason?.response?.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const account = accountResult.status === 'fulfilled'
          ? accountResult.value.data?.account || {}
          : {};
        const accountBasicInfo = getAccountBasicInfo(account);

        if (accountResult.status === 'rejected') {
          console.warn('Account fetch error:', accountResult.reason?.response?.status, accountResult.reason?.message);
        }

        if (profileResult.status === 'fulfilled' && profileResult.value.data.success && profileResult.value.data.data) {
          const p = profileResult.value.data.data;
          setBasicInfo(mergeBasicInfo(accountBasicInfo, p.basicInfo || {}));
          setEducation(p.education || { qualification: '', institution: '', field: '', cgpa: '' });
          if (p.programType)        setProgramType(p.programType);
          if (p.selectedSegment)    setSelectedSegment(p.selectedSegment);
          if (p.interestedCourses)  setInterestedCourses(p.interestedCourses.map(course => toCourseInterestObject(course)));
          if (p.selectedUniversities?.length > 0) setSelectedUniversities(p.selectedUniversities);
          if (p.profileImage) setImagePreview(p.profileImage);

          if (p.profileCompleted === true && p.selectedUniversities?.length > 0) {
            const sk = sessionStorage.getItem('sessionKey');
            if (sk) {
  localStorage.setItem(`profileCompleted_${sk}`, 'true');
  localStorage.setItem(`userProfile_${sk}`, JSON.stringify(p));
}
localStorage.setItem('profileCompleted', 'true');
localStorage.setItem('userProfile', JSON.stringify(p));
            const type = userType;
            navigate(type === 'transfer' ? '/transfer/dashboard' : '/firstyear/dashboard');
            return;
          }
        } else {
          setBasicInfo(accountBasicInfo);
          if (profileResult.status === 'rejected' && profileResult.reason?.response?.status === 401) {
            setError('Session expired. Please login again.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
          if (profileResult.status === 'rejected' && profileResult.reason?.response?.status !== 404) {
            console.warn('Profile fetch error:', profileResult.reason?.response?.status, profileResult.reason?.message);
          }
        }
      } catch (e) {
        if (e.response?.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (e.response?.status !== 404) {
          console.warn('Profile fetch error:', e.response?.status, e.message);
        }
      } finally {
        setFetchingProfile(false);
      }
    };
    load();
  }, [token, userEmail, navigate, userType]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!programType) {
      setAvailableCountries([]);
      setSelectedCountry('');
      setCountryError('');
      return;
    }

    let cancelled = false;
    setCountriesLoading(true);
    setCountryError('');

    axiosInstance.get('/api/student-country-universities/countries', {
      params: { programType },
    })
      .then((res) => {
        if (cancelled) return;
        const countries = Array.isArray(res.data?.countries) ? res.data.countries : [];
        setAvailableCountries(countries);
        if (!countries.length) setCountryError('No countries available for selected program type.');
      })
      .catch((error) => {
        if (cancelled) return;
        setAvailableCountries([]);
        setCountryError(error.response?.data?.message || 'Failed to load countries.');
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programType]);

  useEffect(() => {
    if (!programType || !selectedCountry) {
      setProgramSections([]);
      setDynamicCoursesByCategory({});
      setProgramIndexMessage('');
      return;
    }

    let cancelled = false;

    const normalizeApiSections = (sections = []) =>
      sections
        .map(section => {
          const sectionRecord = typeof section === 'string' ? { name: section } : section || {};
          const name = (sectionRecord.name || '').trim();
          const sectionPrograms = typeof section === 'string' ? [] : sectionRecord.programs;
          const sectionItems = typeof section === 'string' ? [] : sectionRecord.items;
          const sectionGroups = typeof section === 'string' ? [] : sectionRecord.groups;
          const rawPrograms = Array.isArray(sectionPrograms) ? sectionPrograms : [];
          const items = Array.isArray(sectionItems)
            ? sectionItems.map(item => normalizeProgramItemForSection(item, name)).filter(item => item.title)
            : rawPrograms.map(program => normalizeProgramItemForSection(program, name)).filter(item => item.title);
          const programs = items.map(item => item.title);
          const groups = Array.isArray(sectionGroups)
            ? sectionGroups
                .map(group => {
                  const groupName = (group.name || '').trim();
                  const rawGroupPrograms = Array.isArray(group.programs) ? group.programs : [];
                  const groupItems = Array.isArray(group.items)
                    ? group.items.map(item => normalizeProgramItemForSection(item, name)).filter(item => item.title)
                    : rawGroupPrograms.map(program => normalizeProgramItemForSection(program, name)).filter(item => item.title);
                  const groupPrograms = groupItems.map(item => item.title);

                  return {
                    name: groupName,
                    programs: groupPrograms,
                    items: groupItems,
                  };
                })
                .filter(group => group.name && group.items.length > 0)
            : items.map(item => ({ name: item.title, programs: [item.title], items: [{ ...item, group: item.group || item.title }] }));

          return {
            id: createSegmentId(programType, name),
            name,
            count: sectionRecord.count || items.length,
            programs,
            items,
            groups,
            loaded: items.length > 0,
          };
        })
        .filter(section => section.name);

    const loadProgramSections = async () => {
      setProgramSectionsLoading(true);
      try {
        const res = await axiosInstance.get('/api/student/program-index/major-areas', {
          params: {
            programType,
            degree: programType === 'PG' ? 'master' : 'bachelor',
            country: selectedCountry,
          },
        });
        if (cancelled) return;
        const apiMajorAreas =
          res.data?.majorAreas ||
          res.data?.sections ||
          res.data?.data ||
          [];
        const apiSections = normalizeApiSections(apiMajorAreas);
        setProgramIndexMessage(
          res.data?.isIndexEmpty || Number(res.data?.indexCount || 0) === 0
            ? 'Program index is empty. Please run rebuild index.'
            : res.data?.message || ''
        );
        setProgramSections(apiSections);
        setDynamicCoursesByCategory(Object.fromEntries(apiSections.map(section => [section.name, section.programs])));
      } catch (_) {
        if (cancelled) return;
        setProgramSections([]);
        setDynamicCoursesByCategory({});
        setProgramIndexMessage('');
      } finally {
        if (!cancelled) setProgramSectionsLoading(false);
      }
    };

    loadProgramSections();

    return () => {
      cancelled = true;
    };
  }, [programType, selectedCountry]);

  const filteredUniversities = useMemo(() => {
    const normalizedSearch = normalizeText(debouncedSearchTerm);
    const baseUniversities = universities
      .filter(Boolean)
      .filter(u => {
        if (interestedCourses.length === 0) return true;
        return Number(u.matchedProgramCount || 0) > 0 &&
          Array.isArray(u.matchedPrograms) &&
          u.matchedPrograms.length > 0;
      });
    if (!normalizedSearch) return baseUniversities;

    return baseUniversities.filter(u => {
      const uniName = getUniversityDisplayName(u);
      const searchableText = normalizeText([
        uniName,
        u.university,
        u.universityName,
        u.INSTNM,
        u.name,
        u.CITY,
        u.city,
        u.STABBR,
        u.state,
        u.country,
        u.COUNTRY,
        getUniversityLocationText(u),
        u.location?.display,
        u.location?.city,
        u.location?.state,
        u.location?.country,
        u._normalizedId,
      ].filter(Boolean).join(' '));
      const normalizedUniName = normalizeText(uniName);
      return searchableText.includes(normalizedSearch) || normalizedSearch.includes(normalizedUniName);
    });
  }, [debouncedSearchTerm, universities, interestedCourses]);

  useEffect(() => {
    setVisibleUniversityCount(UNIVERSITY_RENDER_BATCH);
  }, [debouncedSearchTerm, universities, selectedSegment, interestedCourses, programType]);

  useEffect(() => {
    if (currentUniversityCourses.length > 0) applyCourseFilers();
  }, [courseSearchTerm, courseFilter, currentUniversityCourses]); // eslint-disable-line

  useEffect(() => {
    const t = reqCourseInput.trim().toLowerCase();
    if (!t) { setReqSuggestions([]); setShowReqSuggestions(false); return; }
    const selectedCategory = selectedSegment?.name || '';
    const dynamicPool = getDynamicCourseList(selectedCategory);
    const pool = dynamicPool.length ? dynamicPool : Object.values(dynamicCoursesByCategory || {}).flat();
    const s = pool.filter(c => c.toLowerCase().includes(t) && !reqCourses.includes(c)).slice(0, 6);
    setReqSuggestions(s); setShowReqSuggestions(s.length > 0);
  }, [reqCourseInput, reqCourses, programType, selectedSegment, dynamicCoursesByCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ FIX: course interest suggestions use PG/UG specific list
  useEffect(() => {
    const q = courseInterestInput.trim();
    if (!programType || !selectedCountry || !selectedSegment?.name || q.length < 2) {
      setCourseInterestSuggest([]);
      setCourseInterestLoading(false);
      setShowCourseInterestDdp(false);
      return;
    }

    let cancelled = false;
    setCourseInterestLoading(true);
    setShowCourseInterestDdp(true);
    const timer = setTimeout(async () => {
      courseInterestAbortRef.current?.abort?.();
      const controller = new AbortController();
      courseInterestAbortRef.current = controller;
      try {
        const res = await axiosInstance.get('/api/student/program-index/programs', {
          signal: controller.signal,
          params: {
            programType,
            degree: programType === 'PG' ? 'master' : 'bachelor',
            country: selectedCountry || '',
            majorArea: selectedSegment.name,
            q,
            limit: 20,
          },
        });
        if (cancelled) return;
        const suggestions = Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.data) ? res.data.data : [];
        setCourseInterestSuggest(suggestions);
        setShowCourseInterestDdp(true);
      } catch (e) {
        if (cancelled) return;
        if (e.name === 'CanceledError' || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
        setCourseInterestSuggest([]);
        setShowCourseInterestDdp(true);
      } finally {
        if (!cancelled) setCourseInterestLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      courseInterestAbortRef.current?.abort?.();
    };
  }, [courseInterestInput, programType, selectedCountry, selectedSegment?.name]);

  useEffect(() => {
    return () => {
      clearInterval(bgPollRef.current);
      groupProgramAbortRef.current?.abort?.();
      courseInterestAbortRef.current?.abort?.();
      universitySearchAbortRef.current?.abort?.();
      universityProgramsAbortRef.current?.abort?.();
    };
  }, []);

  // ── When programType changes: reset dependent state ───────────────────────
  const handleProgramTypeSelect = (type) => {
    if (programType === type) return;
    if (programType) {
      const confirmed = window.confirm('Changing program type will remove selected programs and universities. Continue?');
      if (!confirmed) return;
    }
    setProgramType(type);
    setEducation({ qualification: '', institution: '', field: '', cgpa: '' });
    setAvailableCountries([]);
    setSelectedCountry('');
    setCountryError('');
    setSelectedSegment(null);
    setProgramIndexMessage('');
    setMajorAreaSearch('');
    setShowAllMajorAreas(false);
    setInterestedCourses([]);
    setCourseInterestInput('');
    setCourseInterestSuggest([]);
    setShowCourseInterestDdp(false);
    setExpandedCourseCategories({});
    resetSelectedProgramGroup();
    setGroupProgramsByKey({});
    groupProgramPaginationByKeyRef.current = {};
    groupProgramInFlightRef.current.clear();
    groupProgramAbortRef.current?.abort?.();
    courseInterestAbortRef.current?.abort?.();
    universitySearchAbortRef.current?.abort?.();
    universityProgramsAbortRef.current?.abort?.();
    universitySearchInFlightRef.current.clear();
    setProgramSections([]);
    setSelectedUniversities([]);
    setUniversities([]);
    setUniversityCourses({});
    setCurrentUniversity(null);
    setCurrentUniversityCourses([]);
    setFilteredCourses([]);
    setCourseModalNotice('');
    setCourseModalFieldLabel('');
    setUniversityPagination({ page: 1, pages: 1, total: 0 });
    setDynamicCoursesByCategory({});
    setCourseProgramLoadFailed({});
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setVisibleUniversityCount(UNIVERSITY_RENDER_BATCH);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedSegment(null);
    setProgramIndexMessage('');
    setMajorAreaSearch('');
    setShowAllMajorAreas(false);
    setCourseInterestInput('');
    setCourseInterestSuggest([]);
    setShowCourseInterestDdp(false);
    setExpandedCourseCategories({});
    resetSelectedProgramGroup();
    setGroupProgramsByKey({});
    groupProgramPaginationByKeyRef.current = {};
    groupProgramInFlightRef.current.clear();
    groupProgramAbortRef.current?.abort?.();
    courseInterestAbortRef.current?.abort?.();
    universitySearchAbortRef.current?.abort?.();
    universityProgramsAbortRef.current?.abort?.();
    universitySearchInFlightRef.current.clear();
    setUniversities([]);
    setUniversityCourses({});
    setCurrentUniversity(null);
    setCurrentUniversityCourses([]);
    setFilteredCourses([]);
    setCourseModalNotice('');
    setCourseModalFieldLabel('');
    setUniversityPagination({ page: 1, pages: 1, total: 0 });
    setProgramSections([]);
    setDynamicCoursesByCategory({});
    setCourseProgramLoadFailed({});
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setVisibleUniversityCount(UNIVERSITY_RENDER_BATCH);
  };

  // ── fetchUniversities ─────────────────────────────────────────────────────
  const normalizeUniversitySummary = (uni = {}) => {
    const forcedSource = programType === 'PG' ? 'masters' : 'bachelors';
    const locationObj = uni.location && typeof uni.location === 'object' && !Array.isArray(uni.location) ? uni.location : {};
    const flatLocation = typeof uni.location === 'string' ? uni.location.trim() : '';
    const name = getUniversityDisplayName(uni) || 'Unknown University';
    const city = uni.CITY || uni.city || locationObj.city || '';
    const state = uni.STABBR || uni.state || locationObj.state || '';
    const country = uni.country || locationObj.country || uni.COUNTRY || '';
    const displayLocation = locationObj.display || [city, state, country].filter(Boolean).join(', ') || flatLocation || country;
    const norm = {
      ...uni,
      _normalizedId: getSafeUniversityId(uni),
      _source: forcedSource,
      originalDegree: uni.degree || '',
      originalEducationLevel: uni.educationLevel || '',
      degree: uni.degree || (programType === 'PG' ? 'Master' : 'Bachelor'),
      educationLevel: uni.educationLevel || (programType === 'PG' ? 'Postgraduate' : 'Undergraduate'),
      universityType: forcedSource === 'masters' ? 'Master' : 'Bachelor',
      INSTNM: name,
      CITY: city,
      STABBR: state,
      country,
      location: { ...locationObj, city, state, country, display: displayLocation },
      programs: Array.isArray(uni.matchedPrograms) ? uni.matchedPrograms : [],
      matchedPrograms: Array.isArray(uni.matchedPrograms) ? uni.matchedPrograms : [],
      matchedProgramCount: Array.isArray(uni.matchedPrograms)
        ? uni.matchedPrograms.length
        : Number(uni.matchedProgramCount || 0),
      _programCount: uni.stats?.totalPrograms || uni.totalPrograms || 0,
    };
    norm._displayName = getUniversityDisplayName(norm);
    norm._locationText = getUniversityLocationText(norm);
    norm._searchText = normalizeText([
      norm._displayName,
      norm._locationText,
      norm.CITY,
      norm.STABBR,
      norm.country,
      norm.location?.display,
    ].filter(Boolean).join(' '));
    return norm;
  };

  const fetchUniversities = useCallback(async ({ page = 1, append = false } = {}) => {
    if (!token || !programType) return;
    const selectedProgramFilters = interestedCourses
      .map(course => ({
        title: course && typeof course === 'object'
          ? course.value || getCourseInterestTitle(course)
          : getCourseInterestTitle(course),
        majorArea: getCourseInterestMajorArea(course),
        country: getCourseInterestCountry(course),
        programType: getCourseInterestProgramType(course) || programType,
        degree: normalizeCourseDedupeDegree(
          course && typeof course === 'object' ? course.degree || '' : '',
          getCourseInterestProgramType(course) || programType
        ),
        key: getCourseInterestRenderKey(course),
      }))
      .filter(course => course.title);

    if (selectedProgramFilters.length === 0) {
      setUniversities([]);
      setUniversityPagination({ page: 1, pages: 1, total: 0 });
      if (!append) setVisibleUniversityCount(UNIVERSITY_RENDER_BATCH);
      return;
    }
    const groupedCourses = selectedProgramFilters.reduce((acc, course) => {
      const country = course.country || 'all';
      const courseProgramType = course.programType || programType;
      const degree = course.degree || normalizeCourseDedupeDegree('', courseProgramType);
      const groupKey = [country, degree, courseProgramType].join('::');
      if (!acc[groupKey]) {
        acc[groupKey] = {
          country,
          degree,
          programType: courseProgramType,
          courses: [],
        };
      }
      acc[groupKey].courses.push(course);
      return acc;
    }, {});
    console.log('Selected courses grouped by country', groupedCourses);

    const requestKey = [
      programType,
      selectedProgramFilters.map(course => course.key).join(','),
      Object.keys(groupedCourses).sort().join(','),
      page,
      STUDENT_UNIVERSITY_SEARCH_LIMIT,
    ].join('::');

    if (universitySearchInFlightRef.current.has(requestKey)) return;
    universitySearchAbortRef.current?.abort?.();
    const controller = new AbortController();
    universitySearchAbortRef.current = controller;
    universitySearchInFlightRef.current.add(requestKey);

    if (!append) setLoading(true);
    setError('');
    try {
      const responses = await Promise.all(Object.values(groupedCourses).map(({ country, degree, programType: groupProgramType, courses }) => {
        const selectedCourseObjects = courses
          .map(course => ({
            title: course.title || course.value || course.programTitle || '',
            majorArea: course.majorArea || course.major_area || selectedSegment?.name || '',
            country: course.country || selectedCountry || '',
            degree: course.degree || degree,
            programType: course.programType || groupProgramType,
          }))
          .filter(course => course.title);
        const countryMajorAreas = [
          ...new Set(courses.map(course => course.majorArea).filter(Boolean)),
        ].join(',');
        console.log("Sending selected course objects:", selectedCourseObjects);
        console.log('Fetching universities for country', country, selectedCourseObjects.map(course => course.title));

        return axiosInstance.get('/api/student/program-index/universities', {
          signal: controller.signal,
          params: {
            programType: groupProgramType,
            degree,
            country: country === 'all' ? '' : country,
            programsJson: JSON.stringify(selectedCourseObjects),
            majorAreas: countryMajorAreas,
            page,
            limit: STUDENT_UNIVERSITY_SEARCH_LIMIT,
          },
        });
      }));

      if (responses.some(res => !res?.data?.success)) {
        setError('Failed to load universities. Please try again.');
        return;
      }

      const summaries = responses
        .flatMap(res => (
          Array.isArray(res.data?.universities)
            ? res.data.universities
            : Array.isArray(res.data?.data) ? res.data.data : []
        ))
        .map(normalizeUniversitySummary);
      const validUniversities = summaries.filter(u =>
        Number(u.matchedProgramCount || 0) > 0 &&
        Array.isArray(u.matchedPrograms) &&
        u.matchedPrograms.length > 0
      );
      const total = responses.reduce((sum, res) => sum + (res.data?.pagination?.total || 0), 0);
      const maxPages = responses.reduce((max, res) => Math.max(max, res.data?.pagination?.pages || 1), 1);
      setUniversities(prev => {
        const mergedResults = mergeUniversitiesForDisplay(
          append ? [...prev, ...validUniversities] : validUniversities,
          programType
        )
          .filter(u =>
            Number(u.matchedProgramCount || 0) > 0 &&
            Array.isArray(u.matchedPrograms) &&
            u.matchedPrograms.length > 0
          );
        console.log('Merged university results', mergedResults);
        return mergedResults;
      });
      setUniversityPagination({ page, pages: maxPages, total });
      if (!append) setVisibleUniversityCount(UNIVERSITY_RENDER_BATCH);
      if (validUniversities.length === 0 && !append) setError('No universities found for the selected country, field and program.');
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
      if (e.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(e.response?.data?.message || 'Failed to load universities. Please try again.');
      }
    } finally {
      universitySearchInFlightRef.current.delete(requestKey);
      if (!append) setLoading(false);
    }
  }, [token, programType, selectedCountry, navigate, interestedCourses]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 4 || !token || !programType) return;
    if (interestedCourses.length === 0) {
      setUniversities([]);
      setUniversityPagination({ page: 1, pages: 1, total: 0 });
      return;
    }
    fetchUniversities();
  }, [step, token, programType, interestedCourses, fetchUniversities]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const currentKey = interestedCourses.map(getCourseInterestRenderKey).join(',');
    if (previousInterestedCoursesKeyRef.current === null) {
      previousInterestedCoursesKeyRef.current = currentKey;
      return;
    }
    if (previousInterestedCoursesKeyRef.current === currentKey) return;
    previousInterestedCoursesKeyRef.current = currentKey;
    const remainingCountries = new Set(
      interestedCourses
        .map(course => normalizeText(getCourseInterestCountry(course)))
        .filter(Boolean)
    );
    setSelectedUniversities(prev =>
      remainingCountries.size
        ? prev.filter(university => remainingCountries.has(normalizeText(getUniversityCountry(university))))
        : []
    );
    setUniversityCourses({});
    setCurrentUniversity(null);
    setCurrentUniversityCourses([]);
    setFilteredCourses([]);
    setCourseModalNotice('');
    setCourseModalFieldLabel('');
    universityProgramsAbortRef.current?.abort?.();
  }, [interestedCourses]);

  const syncSegmentFromName = (segmentName, force = false) => {
    if (!segmentName || (!force && selectedSegment?.name)) return;
    const match = segments.find(seg => segmentNamesMatch(segmentName, seg.name) || segmentNamesMatch(seg.name, segmentName));
    if (match) setSelectedSegment(match);
  };

  const applyCourseFilers = () => {
    let f = getProgramTypeSafeCourses(currentUniversityCourses, programType);
    if (courseSearchTerm.trim()) {
      const t = courseSearchTerm.toLowerCase();
      f = f.filter(c =>
        (c.title || '').toLowerCase().includes(t) ||
        (c.majorArea || '').toLowerCase().includes(t) ||
        (c.level || '').toLowerCase().includes(t)
      );
    }
    if (courseFilter.level)     f = f.filter(c => (c.level || '').toLowerCase() === courseFilter.level.toLowerCase());
    if (courseFilter.studyMode) f = f.filter(c => (c.studyMode || '').toLowerCase().includes(courseFilter.studyMode.toLowerCase()));
    if (courseFilter.majorArea) f = f.filter(c => (c.majorArea || '').toLowerCase().includes(courseFilter.majorArea.toLowerCase()));
    setFilteredCourses(f);
  };

  const getUniKey = (u) => {
    const degree = normalizeText(u?.degree || u?.originalDegree || u?.educationLevel || u?.originalEducationLevel || u?._source || normalizeDegreeSource(u, ""));
    const id =
      getSafeUniversityId(u) ||
      u?._normalizedId ||
      normalizeText(getUniversityDisplayName(u));
    return `${id}-${degree}`;
  };

  const getCourseBaseId = (course) => {
    const title = course?.title || course?.program_name || course?.name || 'course';
    const degree = course?.degree || '';
    const level = course?.level || course?.educationLevel || '';
    const majorArea = course?.major_area || course?.majorArea || course?.category || '';
    return normalizeText([title, degree, level, majorArea].join('|')) || course?.id || 'course';
  };

  const getCourseSelectionId = (course, universityId) => {
    const uniId = universityId || 'uni';
    const baseId = String(getCourseBaseId(course));
    return baseId.startsWith(`${uniId}-`) ? baseId : `${uniId}-${baseId}`;
  };

  const getCourseCardKey = (course, index, university) => {
    const uniId = getUniKey(university) || university?._id || university?.id || university?.UNITID || university?.universityCode || 'uni';
    const baseId = getCourseBaseId(course);
    const majorArea = course?.major_area || course?.majorArea || '';
    return `${uniId}-${baseId}-${majorArea}-${index}`;
  };

  // ✅ FIX: auto-set qualification AND field based on programType
  useEffect(() => {
    if (programType === 'UG') {
      setEducation(prev => ({
        ...prev,
        qualification: '12th',
        field: prev.field || '',
      }));
    } else if (programType === 'PG') {
      setEducation(prev => ({
        ...prev,
        qualification: 'Bachelor',
        field: prev.field || '',
      }));
    }
  }, [programType]);

  // ── Background poll ───────────────────────────────────────────────────────
  const startBackgroundPoll = useCallback((uniName) => {
    if (bgPollRef.current) return;
    bgPendingName.current = uniName?.toLowerCase() || '';
    bgResolved.current = false;
    const poll = async () => {
      if (bgResolved.current || !token) return;
      try {
        const res = await axiosInstance.get('/api/user/notifications');
        const all = res.data?.notifications || res.data?.data || [];
        const matches = (n) => !bgSeenIds.current.has(n._id) && (!bgPendingName.current || n.message?.toLowerCase().includes(bgPendingName.current));
        const approved = all.find(n => n.type === 'UNIVERSITY_APPROVED' && matches(n));
        const rejected = all.find(n => n.type === 'UNIVERSITY_REJECTED' && matches(n));
        if (approved || rejected) {
          bgResolved.current = true; clearInterval(bgPollRef.current); bgPollRef.current = null;
          const n = approved || rejected; bgSeenIds.current.add(n._id);
          if (approved) {
            const name = uniName || extractNameFromMsg(approved.message);
            setApprovedUniName(name); setSearchTerm(name);
            await fetchUniversities();
            setResultBanner({ type: 'approved', uniName: name });
            showToast(`"${name}" is now available!`, 'success');
          } else {
            const name   = uniName || extractNameFromMsg(rejected.message);
            const reason = extractReasonFromMsg(rejected.message);
            setResultBanner({ type: 'rejected', uniName: name, reason });
            showToast(`Your request for "${name}" was not approved.`, 'warning');
          }
          try { await axiosInstance.patch(`/api/user/notifications/${n._id}/read`, {}); } catch (_) {}
        }
      } catch (_) {}
    };
    poll(); bgPollRef.current = setInterval(poll, 12000);
  }, [token, showToast, fetchUniversities]);

  const extractNameFromMsg   = (msg = "") => msg.match(/"([^"]+)"/)?.[1] || '';
  const extractReasonFromMsg = (msg = "") => msg.match(/[Rr]eason[:\s]+(.+)/)?.[1]?.trim() || null;

  const handlePopupApproved = useCallback(async ({ universityName }) => {
    setShowRequestPopup(false); setPendingRequest(null);
    bgResolved.current = true; clearInterval(bgPollRef.current); bgPollRef.current = null;
    await fetchUniversities(); setApprovedUniName(universityName); setSearchTerm(universityName);
    setResultBanner({ type: 'approved', uniName: universityName });
    showToast(`"${universityName}" is now available!`, 'success');
  }, [showToast, fetchUniversities]);

  const handlePopupRejected = useCallback(({ universityName, reason }) => {
    setShowRequestPopup(false); setPendingRequest(null);
    bgResolved.current = true; clearInterval(bgPollRef.current); bgPollRef.current = null;
    setResultBanner({ type: 'rejected', uniName: universityName, reason });
    showToast(`Your request for "${universityName}" was not approved.`, 'warning');
  }, [showToast]);

  const handlePopupDismiss = useCallback(() => {
    setShowRequestPopup(false);
    if (pendingRequest?.universityName && !bgResolved.current) startBackgroundPoll(pendingRequest.universityName);
  }, [pendingRequest, startBackgroundPoll]);

  // ── Request modal helpers ─────────────────────────────────────────────────
  const openRequestModal = () => {
    setRequestForm({ universityName: searchTerm || '', country: '' });
    setRequestFormErrors({}); setRequestSuccess(false);
    setReqCourses([]); setReqCourseInput(''); setReqSuggestions([]); setShowReqSuggestions(false);
    setShowRequestModal(true); document.body.style.overflow = 'hidden';
  };
  const closeRequestModal = () => {
    setShowRequestModal(false); setRequestForm({ universityName: '', country: '' });
    setRequestFormErrors({}); setRequestSuccess(false); setReqCourses([]); setReqCourseInput('');
    document.body.style.overflow = '';
  };
  const addReqCourse = (name) => {
    const t = name.trim().replace(/,+$/, '');
    if (!t || reqCourses.includes(t)) { setReqCourseInput(''); return; }
    if (reqCourses.length >= 5) { setRequestFormErrors(p => ({ ...p, courses: 'Max 5 courses' })); return; }
    setReqCourses(p => [...p, t]); setReqCourseInput(''); setReqSuggestions([]); setShowReqSuggestions(false);
    setRequestFormErrors(p => ({ ...p, courses: null }));
    setTimeout(() => reqCourseInputRef.current?.focus(), 0);
  };
  const removeReqCourse    = (c) => setReqCourses(p => p.filter(x => x !== c));
  const handleReqCourseKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (reqCourseInput.trim()) addReqCourse(reqCourseInput); }
    else if (e.key === 'Backspace' && !reqCourseInput && reqCourses.length) setReqCourses(p => p.slice(0, -1));
  };
  const validateRequestForm = () => {
    const err = {};
    if (!(requestForm.universityName || '').trim()) err.universityName = 'University name is required';
    if (!(requestForm.country || '').trim())        err.country        = 'Country is required';
    if (!reqCourses.length)                 err.courses        = 'Please add at least one course';
    setRequestFormErrors(err); return !Object.keys(err).length;
  };

  const handleSubmitRequest = async () => {
    if (!validateRequestForm()) return;
    setSubmittingRequest(true);
    try {
      const res = await axiosInstance.post('/api/user/university-request', {
        universityName:    (requestForm.universityName || '').trim(),
        country:           (requestForm.country || '').trim(),
        interestedCourses: reqCourses,
        requestedCourses:  reqCourses,
        programType,
        degree:            programType === 'PG' ? 'master' : 'bachelor',
        selectedCategory:  selectedSegment?.name || '',
        field:             selectedSegment?.name || '',
      });
      if (res?.data?.success) {
        const pending = { universityName: (requestForm.universityName || '').trim(), country: (requestForm.country || '').trim(), courses: [...reqCourses] };
        setRequestSuccess(true);
        setTimeout(() => { closeRequestModal(); setPendingRequest(pending); setShowRequestPopup(true); }, 700);
      } else {
        setRequestFormErrors({ submit: res?.data?.message || 'Failed to submit request.' });
      }
    } catch (e) {
      setRequestFormErrors({ submit: e.response?.data?.message || 'Failed to submit request.' });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ── Course modal helpers ──────────────────────────────────────────────────
  const getModalCountryForUniversity = (university = {}) =>
    getUniversityCountry(university) ||
    university.country ||
    university.COUNTRY ||
    university.location?.country ||
    "";

  const getCoursesForModalCountry = (courses = [], modalCountry = "") => {
    const scopedCourses = courses.filter(course => {
      const courseCountry = getCourseInterestCountry(course);
      return !modalCountry ||
        !courseCountry ||
        normalizeText(courseCountry) === normalizeText(modalCountry);
    });

    return scopedCourses.length ? scopedCourses : courses;
  };

  const getSelectedCoursesForUniversityModal = (uni = {}) => {
    const modalCountry = getModalCountryForUniversity(uni);
    const selectedCountryCourses = getCoursesForModalCountry(interestedCourses, modalCountry);
    const universityMatchedPrograms = Array.isArray(uni?.matchedPrograms) ? uni.matchedPrograms : [];

    if (!selectedCountryCourses.length || !universityMatchedPrograms.length) return [];

    return selectedCountryCourses.filter(selectedCourse =>
      universityMatchedPrograms.some(program => {
        const programTitle = program.title || program.name || program.program_name || program.programName || '';
        return strictProgramTitleMatchFrontend(programTitle, getCourseInterestTitle(selectedCourse));
      })
    );
  };

  const getCourseModalFieldLabel = (matchedCourses = []) => {
    const modalMajorAreas = [
      ...new Set(matchedCourses.map(getCourseInterestMajorArea).map(area => area.trim()).filter(Boolean)),
    ];

    if (matchedCourses.length === 1) return modalMajorAreas[0] || '';
    if (matchedCourses.length > 1 && modalMajorAreas.length === 1) return modalMajorAreas[0];
    if (matchedCourses.length > 1) return 'selected matched courses';
    return '';
  };

  const fetchUniversityPrograms = async (uni, { showAll = false } = {}) => {
    const key        = getUniKey(uni);
    const universityDisplayKey = getUniversityDisplayMergeKey(uni);
    const modalCountry = getModalCountryForUniversity(uni);
    const degreeParam = programType === 'PG' ? 'master' : 'bachelor';
    const countryScopedInterests = getCoursesForModalCountry(interestedCourses, modalCountry);
    const selectedCourse = countryScopedInterests[0] || interestedCourses[0] || {};
    const selectedProgramCountry = getCourseInterestCountry(selectedCourse);
    const resolvedCountry =
      modalCountry ||
      selectedProgramCountry ||
      selectedCourse?.country ||
      selectedCourse?.selectedCountry ||
      selectedCountry ||
      uni?.country ||
      uni?.COUNTRY ||
      uni?.location?.country ||
      getCountryFromLocation(uni?.location) ||
      "";
    const selectedProgramTitles = countryScopedInterests
      .map(course => {
        if (course && typeof course === 'object') {
          return String(course.value || getCourseInterestTitle(course)).trim();
        }
        return String(getCourseInterestTitle(course)).trim();
      })
      .filter(Boolean);
    const selectedMajorAreas = getCourseInterestMajorAreas(countryScopedInterests);
    const selectedProgramsParam = selectedProgramTitles.join('|');
    const selectedMajorAreasParam = selectedMajorAreas.join(',');
    const selectedSegmentParam = selectedProgramsParam ? selectedMajorAreasParam : selectedMajorAreasParam;
    const matchOnly = !showAll;
    if (matchOnly && interestedCourses.length && !countryScopedInterests.length) return [];
    if (matchOnly && Array.isArray(uni?.matchedPrograms) && uni.matchedPrograms.length) {
      const indexedMatches = dedupeModalCourses(
        getProgramTypeSafeCourses(uni.matchedPrograms, programType),
        programType
      );
      console.log("Modal endpoint source: ProgramSearchIndex card matchedPrograms");
      console.log("lookupId:", getSafeUniversityId(uni));
      console.log("country:", resolvedCountry);
      console.log("selectedPairs:", countryScopedInterests.map(course => ({
        title: getCourseInterestTitle(course),
        majorArea: getCourseInterestMajorArea(course),
      })));
      console.log("matchedPrograms count:", indexedMatches.length);
      return indexedMatches;
    }

    const cacheKey = [
      key,
      normalizeText(resolvedCountry) || 'no-country',
      normalizeText(selectedSegmentParam) || 'no-segment',
      normalizeText(selectedProgramsParam) || 'no-programs',
      normalizeText(selectedMajorAreasParam) || 'no-major-areas',
      showAll ? 'all' : 'matched',
    ].join('-');
    if (showAll && universityCourses[cacheKey]?.length) return universityCourses[cacheKey];

    const lookupId = getSafeUniversityId(uni);
    if (!lookupId) {
      console.error("Missing university id:", uni);
      setError("Unable to open this university because ID is missing.");
      setTimeout(() => setError(''), 3000);
      return [];
    }
    const requestKey = [
      lookupId,
      degreeParam,
      resolvedCountry,
      selectedSegmentParam,
      selectedProgramsParam,
      showAll ? 'all' : 'matched',
    ].join('-');

    setLoadingUniversityPrograms(true);
    if (matchOnly) {
      setCurrentUniversityCourses([]);
      setFilteredCourses([]);
      setCourseModalNotice('');
    }
    universityProgramsAbortRef.current?.abort?.();
    const controller = new AbortController();
    universityProgramsAbortRef.current = controller;
    latestUniversityProgramsRequestKeyRef.current = requestKey;
    try {
      console.log("MODAL resolvedCountry:", resolvedCountry);
      console.log("Opening course modal:", uni);
      console.log("Selected country:", selectedCountry);
      console.log("Programs query:", selectedProgramTitles);
      console.log("showAll:", showAll);
      const selectedPairs = countryScopedInterests.map(course => ({
        title: getCourseInterestTitle(course),
        majorArea: getCourseInterestMajorArea(course),
      })).filter(pair => pair.title);
      const res = await axiosInstance.get(`/api/student/program-index/university/${lookupId}/programs`, {
        signal: controller.signal,
        params: {
          programType,
          degree: degreeParam,
          country: resolvedCountry || undefined,
          segment: selectedSegmentParam,
          majorArea: selectedSegmentParam,
          programsJson: JSON.stringify(selectedPairs),
          majorAreasJson: JSON.stringify(selectedMajorAreas),
          showAll,
          matchOnly,
        },
      });
      if (latestUniversityProgramsRequestKeyRef.current !== requestKey) return null;
      const programs = showAll
        ? Array.isArray(res.data?.programs)
          ? res.data.programs
          : []
        : Array.isArray(res.data?.matchedPrograms)
          ? res.data.matchedPrograms
          : [];
      const courses = dedupeModalCourses(getProgramTypeSafeCourses(programs, programType), programType);
      setUniversityCourses(prev => ({ ...prev, [cacheKey]: courses }));
      setUniversities(prev => prev.map(item => {
        if (getUniversityDisplayMergeKey(item) !== universityDisplayKey) return item;
        if (showAll) return { ...item, _programCount: Math.max(item._programCount || 0, courses.length) };
        return {
          ...item,
          programs: courses,
          matchedPrograms: matchOnly ? courses : item.matchedPrograms,
          matchedProgramCount: matchOnly ? courses.length : item.matchedProgramCount,
          _programCount: Math.max(item._programCount || 0, courses.length),
        };
      }));
      return courses;
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError' || e.code === 'ERR_CANCELED') return null;
      setError(e.response?.data?.message || 'Failed to load courses for this university.');
      setTimeout(() => setError(''), 2200);
      return [];
    } finally {
      if (latestUniversityProgramsRequestKeyRef.current === requestKey) {
        setLoadingUniversityPrograms(false);
      }
    }
  };

  const openCourseModal = async (uni) => {
    const key        = getUniKey(uni);
    const fresh      = uni;
    const universityId = getSafeUniversityId(fresh);
    const modalCountry = getModalCountryForUniversity(fresh);
    const modalCoursesForThisCountry = getCoursesForModalCountry(interestedCourses, modalCountry);

    console.log("Opening university:", fresh);
    console.log("Resolved university id:", universityId);
    console.log("Modal country:", modalCountry);
    console.log("Courses sent to modal:", modalCoursesForThisCountry);
    console.log("Matched programs:", fresh.matchedPrograms);

    if (!universityId) {
      console.error("Missing university id:", fresh);
      setError("Unable to open this university because ID is missing.");
      setTimeout(() => setError(''), 3000);
      return;
    }
    const modalMatchedCourses = getSelectedCoursesForUniversityModal(fresh);
    const selectedProgramsParam = getCourseInterestTitles(modalMatchedCourses).join(',');
    const modalFieldLabel = getCourseModalFieldLabel(modalMatchedCourses);

    setCurrentUniversity(fresh);
    setCurrentUniversityCourses([]);
    setFilteredCourses([]);
    setCourseModalNotice('');
    setCourseModalFieldLabel(modalFieldLabel);
    setCourseModalShowingAll(false);
    setCourseSearchTerm(''); setCourseFilter({ level: '', studyMode: '', majorArea: '' });
    setTempSelectedCourses([]);
    setShowCourseModal(true); document.body.style.overflow = 'hidden';

    const fetchedCourses = await fetchUniversityPrograms(fresh);
    if (!Array.isArray(fetchedCourses)) return;
    const interestGuardedCourses = fetchedCourses;
    const allCourses = getProgramTypeSafeCourses(
      interestGuardedCourses,
      programType
    );
    if (!allCourses.length) {
      setCurrentUniversityCourses([]);
      setFilteredCourses([]);
      setCourseModalNotice(selectedProgramsParam
        ? 'No matching course found for this selected program in this university.'
        : ''
      );
      setCourseSearchTerm(''); setCourseFilter({ level: '', studyMode: '', majorArea: '' });
      setTempSelectedCourses([]);
      return;
    }

    const finalCourses = dedupeModalCourses(getProgramTypeSafeCourses(allCourses, programType), programType);
    const notice = '';

    setCurrentUniversityCourses(finalCourses);
    setFilteredCourses(finalCourses);
    setCourseModalNotice(notice);
    setCourseSearchTerm(''); setCourseFilter({ level: '', studyMode: '', majorArea: '' });
    const existing = selectedUniversities.find(u => getUniKey(u) === key);
    setTempSelectedCourses([...(existing?.selectedCourses || [])]);
    setShowCourseModal(true); document.body.style.overflow = 'hidden';
  };

  const handleOpenUniversityCourses = (university) => {
    openCourseModal(university);
  };

  const showAllProgramsForCurrentUniversity = async () => {
    if (!currentUniversity) return;
    const courses = await fetchUniversityPrograms(currentUniversity, { showAll: true });
    if (!Array.isArray(courses)) return;
    const safeCourses = dedupeModalCourses(getProgramTypeSafeCourses(courses, programType), programType);
    setCurrentUniversityCourses(safeCourses);
    setFilteredCourses(safeCourses);
    setCourseModalNotice('');
    setCourseModalFieldLabel('');
    setCourseModalShowingAll(true);
    setCourseSearchTerm('');
    setCourseFilter({ level: '', studyMode: '', majorArea: '' });
  };

  const showMatchedProgramsForCurrentUniversity = async () => {
    if (!currentUniversity) return;
    const courses = await fetchUniversityPrograms(currentUniversity, { showAll: false });
    if (!Array.isArray(courses)) return;
    const safeCourses = dedupeModalCourses(getProgramTypeSafeCourses(courses, programType), programType);
    const modalMatchedCourses = getSelectedCoursesForUniversityModal(currentUniversity);
    setCurrentUniversityCourses(safeCourses);
    setFilteredCourses(safeCourses);
    setCourseModalNotice('');
    setCourseModalFieldLabel(getCourseModalFieldLabel(modalMatchedCourses));
    setCourseModalShowingAll(false);
    setCourseSearchTerm('');
    setCourseFilter({ level: '', studyMode: '', majorArea: '' });
  };

  const closeCourseModal = () => {
    setShowCourseModal(false); setCurrentUniversity(null); setTempSelectedCourses([]);
    setCourseModalNotice('');
    setCourseModalFieldLabel('');
    setCourseModalShowingAll(false);
    setCourseSearchTerm(''); setCourseFilter({ level: '', studyMode: '', majorArea: '' });
    setCurrentUniversityCourses([]);
    setFilteredCourses([]);
    universityProgramsAbortRef.current?.abort?.();
    latestUniversityProgramsRequestKeyRef.current = '';
    document.body.style.overflow = '';
  };

  const toggleTempCourse = (course) => {
    const universityId = getUniKey(currentUniversity);
    const courseId = getCourseSelectionId(course, universityId);
    setTempSelectedCourses(prev => {
      const sel = prev.some(c => getCourseSelectionId(c, universityId) === courseId);
      if (sel) return prev.filter(c => getCourseSelectionId(c, universityId) !== courseId);
      if (prev.length < 1) return [...prev, course];
      setError('Max 1 course per university'); setTimeout(() => setError(''), 2000);
      return prev;
    });
  };

  const saveCourseSelection = () => {
    if (!currentUniversity) return;
    if (tempSelectedCourses.length !== 1) {
      setError('Please select exactly 1 course');
      setTimeout(() => setError(''), 2000);
      return;
    }
    const key = getUniKey(currentUniversity);
    const uniWithCourses = {
      ...currentUniversity,
      selectedCourses: tempSelectedCourses.map(c => {
        const normalizedCourse = {
          ...c,
          id: getCourseSelectionId(c, key),
        };
        return {
          id: normalizedCourse.id, title: normalizedCourse.title || normalizedCourse.name || normalizedCourse.program_name || 'Course',
          name: normalizedCourse.name || normalizedCourse.title || normalizedCourse.program_name || 'Course',
          program_name: normalizedCourse.program_name || normalizedCourse.title || normalizedCourse.name || '',
          majorArea: normalizedCourse.majorArea || normalizedCourse.major_area || '',
          category: normalizedCourse.category || normalizeCategoryName(normalizedCourse.majorArea || normalizedCourse.major_area || '', normalizedCourse.title),
          level: normalizedCourse.level,
          degree: normalizedCourse.degree,
          educationLevel: normalizedCourse.educationLevel,
          studyMode: normalizedCourse.studyMode,
          duration: normalizedCourse.duration,
          locations: normalizedCourse.locations,
          description: normalizedCourse.description,
        };
      }),
    };
    setSelectedUniversities(prev =>
      prev.some(u => getUniKey(u) === key)
        ? prev.map(u => getUniKey(u) === key ? uniWithCourses : u)
        : prev.length < 2 ? [...prev, uniWithCourses] : prev
    );
    setShowCourseModal(false);
    setCurrentUniversity(null);
    setCourseModalNotice('');
    setCourseModalFieldLabel('');
    setTempSelectedCourses([]);
    setCourseSearchTerm('');
    setCourseFilter({ level: '', studyMode: '', majorArea: '' });
    setCurrentUniversityCourses([]);
    setFilteredCourses([]);
    document.body.style.overflow = '';
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!basicInfo.fullName)    e.fullName    = 'Full name is required';
    if (!basicInfo.mobile)      e.mobile      = 'Mobile is required';
    if (!basicInfo.dob)         e.dob         = 'Date of birth is required';
    if (!basicInfo.gender)      e.gender      = 'Gender is required';
    if (!basicInfo.nationality) e.nationality = 'Nationality is required';
    if (!basicInfo.residence)   e.residence   = 'Country of residence is required';
    if (basicInfo.mobile && !/^[0-9+\-\s()]{10,15}$/.test(basicInfo.mobile)) e.mobile = 'Enter a valid mobile number';
    setValidationErrors(e);
    if (e.selectedSegment) {
      setError(e.selectedSegment);
      setTimeout(() => setError(''), 3000);
      setTimeout(() => segmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return false;
    }
    return !Object.keys(e).length;
  };
  const validateStep2 = () => {
    if (!programType) { setError('Please select PG or UG to continue'); setTimeout(() => setError(''), 3000); return false; }
    return true;
  };
  const validateStep3 = () => {
    const e = {};
    if (!selectedCountry) e.selectedCountry = 'Please select a country first.';
    if (!selectedSegment?.name) e.selectedSegment = 'Please select what field you are interested in';
    if (interestedCourses.length === 0) e.interestedCourses = 'Please select at least one program.';
    if (!education.institution)   e.institution   = 'Institution is required';
    if (!education.cgpa) {
      e.cgpa = 'Percentage / CGPA is required';
    } else if (!isValidPercentageCgpa(education.cgpa)) {
      e.cgpa = 'Enter a valid Percentage / CGPA between 0 and 100';
    }
    // ✅ FIX: qualification is derived from programType on submit
    setValidationErrors(e);
    if (e.selectedCountry || e.selectedSegment || e.interestedCourses) {
      setError(e.selectedCountry || e.selectedSegment || e.interestedCourses);
      setTimeout(() => setError(''), 3000);
      setTimeout(() => segmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return false;
    }
    return !Object.keys(e).length;
  };
  const validateStep4 = () => {
    if (selectedUniversities.length !== 2) {
      setError('Please select 2 universities'); setTimeout(() => setError(''), 3000); return false;
    }
    for (const u of selectedUniversities) {
      if ((u.selectedCourses || []).length !== 1) {
        setError(`Please select exactly one course for ${getUniversityDisplayName(u) || 'this university'}`);
        setTimeout(() => setError(''), 3000); return false;
      }
    }
    return true;
  };

  const isStep1Valid = () => basicInfo.fullName && basicInfo.mobile && basicInfo.dob && basicInfo.gender && basicInfo.nationality && basicInfo.residence;
  const isStep2Valid = () => !!programType;
  const isStep3Valid = () => !!(
    selectedCountry &&
    selectedSegment?.name &&
    interestedCourses.length > 0 &&
    education.institution &&
    isValidPercentageCgpa(education.cgpa)
  );
  const isStep4Valid = () => selectedUniversities.length === 2 && selectedUniversities.every(u => (u.selectedCourses || []).length === 1);

  const navigateToDashboard = () => navigate(userType === 'transfer' ? '/transfer/dashboard' : '/firstyear/dashboard');

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    setProfileImage(file);
    const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file);
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !token) return;
    try { await axiosInstance.patch('/api/user/profile/image', { profileImage: imagePreview }); } catch (_) {}
  };

  // ── handleSubmitProfile ───────────────────────────────────────────────────
  const handleSubmitProfile = async () => {
    if (!token) { setError('You must be logged in.'); return; }
    if (!validateStep3()) { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!validateStep4()) return;
    setSaving(true); setError('');
    try {
      if (profileImage) await uploadProfileImage();

      const eligibleProgram = programType === 'UG' ? 'Bachelor' : 'Master';
      const derivedSegment = selectedSegment;
      // ✅ FIX: always send field — even if empty string, never undefined
      const fixedEducation  = {
        ...education,
        field:         derivedSegment?.name || '',
        qualification: programType === 'UG' ? '12th' : 'Bachelor',
      };

const payload = {
  basicInfo,
  education:            fixedEducation,
  programType,
  eligibleProgram,
  programStream:        programType,
  selectedSegment:      derivedSegment,
  segment:              derivedSegment?.name || null,
  interestedCourses:    sanitizeInterestedCourses(interestedCourses),
  selectedUniversities: sanitizeSelectedUniversities(selectedUniversities),
  profileCompleted:     true,
  completedAt:          new Date().toISOString(),
};
      console.log('Profile payload size KB:', Math.round(JSON.stringify(payload).length / 1024));

      if (JSON.stringify(payload).length > 500000) {
        setError('Profile data too large. Reduce course selections.'); setSaving(false); return;
      }

      const res = await axiosInstance.post('/api/user/profile', payload);

      if (res.data.success) {
        const sk = sessionStorage.getItem('sessionKey');
        if (sk) {
          localStorage.setItem(`userProfile_${sk}`, JSON.stringify(payload));
          localStorage.setItem(`profileCompleted_${sk}`, 'true');
        } else {
          localStorage.setItem('userProfile', JSON.stringify(payload));
          localStorage.setItem('profileCompleted', 'true');
        }
        window.dispatchEvent(new CustomEvent('collegesUpdated'));
        showToast('Profile submitted! Redirecting...', 'success');
        setTimeout(navigateToDashboard, 1500);
      } else {
        console.error('Profile save failed response:', res.data);
        setError(res.data.message || 'Failed to save profile.');
      }
    } catch (e) {
      console.error('Profile submit error:', e.response || e);
      let msg = 'Failed to save profile.';
      if (e.response?.status === 401) { msg = 'Session expired.'; setTimeout(() => navigate('/login'), 2000); }
      else if (e.response?.status === 400) msg = e.response.data.errors?.join(', ') || e.response.data.message || msg;
      else if (e.response?.data?.message) msg = e.response.data.message;
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleSaveProgress = (next) => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && next === 5 && !validateStep4()) return;
    if (next === 4) setSelectedUniversities([]);
    setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitials     = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'UN';
  const getUserInitials = () => basicInfo.fullName
    ? basicInfo.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : (userEmail?.[0]?.toUpperCase() || 'U');

  const getLevelColor = (l = '') => {
    const s = l.toLowerCase();
    if (s.includes('bachelor') || s.includes('undergraduate')) return '#4CAF50';
    if (s.includes('master')   || s.includes('graduate') || s.includes('mba')) return '#FF9800';
    if (s.includes('phd')      || s.includes('doctorate')) return '#F44336';
    if (s.includes('diploma'))     return '#9C27B0';
    if (s.includes('certificate')) return '#00BCD4';
    return '#757575';
  };
  const getStudyModeColor = (m = '') => {
    const s = m.toLowerCase();
    if (s.includes('online'))                           return '#2196F3';
    if (s.includes('campus'))                           return '#FFC107';
    if (s.includes('hybrid') || s.includes('blended')) return '#9C27B0';
    if (s.includes('distance'))                         return '#00BCD4';
    return '#757575';
  };
  const getSourceLabel = (u) => {
    if (u._source === 'bachelors') return "Bachelor's";
    if (u._source === 'masters')   return "Master's";
    return null;
  };

  const visibleUniversities = useMemo(
    () => filteredUniversities.slice(0, visibleUniversityCount),
    [filteredUniversities, visibleUniversityCount]
  );

  const segments = useMemo(() => (programType ? programSections : []), [programType, programSections]);
  const normalizedMajorAreaSearch = normalizeText(majorAreaSearch);

  const sortedMajorAreas = useMemo(() => {
    const areas = segments || [];
    const selectedName = selectedSegment?.name || "";

    return [...areas].sort((a, b) => {
      const aName = a.name || a.majorArea || a;
      const bName = b.name || b.majorArea || b;

      if (aName === selectedName) return -1;
      if (bName === selectedName) return 1;

      if (normalizedMajorAreaSearch) {
        const aMatch = normalizeText(aName).includes(normalizedMajorAreaSearch);
        const bMatch = normalizeText(bName).includes(normalizedMajorAreaSearch);
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
      }

      return aName.localeCompare(bName);
    });
  }, [segments, selectedSegment, normalizedMajorAreaSearch]);

  const filteredMajorAreas = useMemo(() => {
    if (!normalizedMajorAreaSearch) return sortedMajorAreas;
    return sortedMajorAreas.filter(area => {
      const name = area.name || area.majorArea || area;
      return normalizeText(name).includes(normalizedMajorAreaSearch);
    });
  }, [sortedMajorAreas, normalizedMajorAreaSearch]);

  const visibleMajorAreas = useMemo(() => {
    if (normalizedMajorAreaSearch || showAllMajorAreas) return filteredMajorAreas;

    const selectedName = selectedSegment?.name || "";
    const firstTen = filteredMajorAreas.slice(0, 10);

    if (selectedName && !firstTen.some(area => (area.name || area.majorArea || area) === selectedName)) {
      const selectedArea = filteredMajorAreas.find(area => (area.name || area.majorArea || area) === selectedName);
      return selectedArea ? [selectedArea, ...firstTen].slice(0, 10) : firstTen;
    }

    return firstTen;
  }, [filteredMajorAreas, normalizedMajorAreaSearch, showAllMajorAreas, selectedSegment]);

  const visibleUniversityFilterAreas = useMemo(() => {
    if (selectedSegment?.name) return [selectedSegment];
    return visibleMajorAreas;
  }, [selectedSegment, visibleMajorAreas]);

  const clearUniversityMajorAreaFilter = useCallback(() => {
    setSelectedSegment(null);
    setEducation(prev => ({ ...prev, field: '' }));
    setMajorAreaSearch('');
    setShowAllMajorAreas(false);
    setCourseInterestInput('');
    setCourseInterestSuggest([]);
    setShowCourseInterestDdp(false);
    courseInterestAbortRef.current?.abort?.();
    resetSelectedProgramGroup();
  }, [resetSelectedProgramGroup]);

  const hasMoreUniversityPages = universityPagination.page < universityPagination.pages;
  const handleLoadMoreUniversities = () => {
    if (visibleUniversityCount < filteredUniversities.length) {
      setVisibleUniversityCount(c => c + UNIVERSITY_RENDER_BATCH);
      return;
    }
    if (hasMoreUniversityPages && !loading) {
      fetchUniversities({ page: universityPagination.page + 1, append: true });
      setVisibleUniversityCount(c => c + UNIVERSITY_RENDER_BATCH);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="profile-wrapper">
        <div className="loading-screen">
          <div className="loading-spinner-large" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const STEPS = [
    { num: 1, label: 'Basic Info'   },
    { num: 2, label: 'Study Level'  },
    { num: 3, label: 'Academics'    },
    { num: 4, label: 'Universities' },
    { num: 5, label: 'Review'       },
  ];

  const visibleCourseCategory = selectedSegment?.name || '';
  const selectedProgramSection = visibleCourseCategory
    ? segments.find(section => segmentNamesMatch(section.name, visibleCourseCategory) || segmentNamesMatch(visibleCourseCategory, section.name))
    : null;
  const programGroups = selectedProgramSection?.groups || [];
  const programGroupSearchQuery = programGroupSearch.trim();
  const filteredProgramGroups = programGroupSearchQuery
    ? programGroups
        .filter(group => {
          const searchable = [
            group.name,
            visibleCourseCategory,
            ...(group.programs || []),
            ...((group.items || []).map(item => [
              item.title,
              item.name,
              item.program_name,
              item.programName,
              item.degree,
              item.level,
              item.educationLevel,
              item.majorArea,
              item.major_area,
              item.category,
              item.normalizedTitle,
            ].filter(Boolean).join(' '))),
          ].filter(Boolean).join(' ');

          return degreeAwareTextMatches(searchable, programGroupSearchQuery);
        })
        .sort((left, right) => {
          const toRankableGroup = group => ({
            title: group.name,
            degree: (group.items || []).map(item => item.degree).filter(Boolean).join(' '),
            searchText: [
              group.name,
              ...(group.programs || []),
              ...((group.items || []).map(item => [
                item.title,
                item.name,
                item.program_name,
                item.programName,
                item.degree,
                item.level,
                item.educationLevel,
                item.majorArea,
                item.major_area,
                item.category,
                item.normalizedTitle,
              ].filter(Boolean).join(' '))),
            ].filter(Boolean).join(' '),
          });

          return compareByRelevance(toRankableGroup(left), toRankableGroup(right), programGroupSearchQuery);
        })
    : programGroups;
  const visibleProgramGroups = programGroupSearchQuery
    ? filteredProgramGroups
    : filteredProgramGroups.slice(0, visibleProgramGroupCount);
  const hasMoreProgramGroups = !programGroupSearchQuery && visibleProgramGroupCount < filteredProgramGroups.length;
  const sectionPrograms = selectedProgramSection?.items || [];
  const visibleCoursePoolEntries = [];
  const selectedGroupProgramsKey = visibleCourseCategory && selectedProgramGroup
    ? getGroupProgramsKey(programType, visibleCourseCategory, selectedProgramGroup)
    : '';
  const selectedProgramGroupData = selectedProgramGroup
    ? programGroups.find(group => segmentNamesMatch(group.name, selectedProgramGroup) || segmentNamesMatch(selectedProgramGroup, group.name))
    : null;
  const sectionGroupPrograms = selectedProgramGroupData?.items || [];
  const fetchedGroupPrograms = selectedGroupProgramsKey
    ? (groupProgramsByKey[selectedGroupProgramsKey] || groupPrograms)
    : groupPrograms;
  const selectedGroupPrograms = sectionGroupPrograms.length ? sectionGroupPrograms : fetchedGroupPrograms;
  const selectedGroupLoadFailed = sectionGroupPrograms.length
    ? false
    : visibleCourseCategory && selectedProgramGroup
      ? courseProgramLoadFailed[`${visibleCourseCategory}|${selectedProgramGroup}`]
      : false;
  const dedupedGroupPrograms = dedupeProgramsForDisplay(selectedGroupPrograms);
  const groupProgramSearchQuery = groupProgramSearch.trim();
  const filteredGroupPrograms = groupProgramSearchQuery
    ? dedupedGroupPrograms
        .filter(course => {
          const searchable = [
            course.value,
            course.label,
            course.key,
            course.degree,
            course.level,
            course.searchText,
            selectedProgramGroup,
            visibleCourseCategory,
          ].filter(Boolean).join(' ');
          return degreeAwareTextMatches(searchable, groupProgramSearchQuery);
        })
        .sort((left, right) => compareByRelevance(
          { title: left.value, degree: left.degree, searchText: left.searchText },
          { title: right.value, degree: right.degree, searchText: right.searchText },
          groupProgramSearchQuery
        ))
    : dedupedGroupPrograms;
  const dedupedCourseInterestSuggest = dedupeProgramsForDisplay(courseInterestSuggest);
  const groupedCourseInterestSuggest = dedupedCourseInterestSuggest.reduce((groups, suggestion) => {
    const groupLabel = suggestion.majorArea || suggestion.group || 'Other Programs';
    if (!groups[groupLabel]) groups[groupLabel] = [];
    groups[groupLabel].push(suggestion);
    return groups;
  }, {});

  const accentBg    = programType === 'PG' ? '#ede9fe' : '#dcfce7';
  const accentColor = programType === 'PG' ? '#5b21b6' : '#15803d';
  const accentBorder= programType === 'PG' ? '#6366f1' : '#10b981';
  const accentHl    = programType === 'PG' ? '#6366f1' : '#10b981';
  const chipActiveClass = programType === 'PG' ? 'selected-pg' : 'selected-ug';

  return (
    <div className="profile-wrapper">

      {showRequestPopup && (
        <UniversityRequestPopup token={token} pendingRequest={pendingRequest}
          onApproved={handlePopupApproved} onRejected={handlePopupRejected} onDismiss={handlePopupDismiss} />
      )}

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}><span>{toast.message}</span></div>
      )}

      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-animation">
            <div className="checkmark-circle">
              <div className="userprofile-checkmark" />
            </div>
          </div>
        </div>
      )}

      <div className="userprofile-profile-header">
        <div className="header-container">
          <div className="header-logo-wrapper">
            <img src={EdutechLogo} alt="Edutech Logo" className="header-logo-img" />
          </div>
          <div className="header-title-section">
            <h1 className="header-title">Complete Your Profile</h1>
            <p className="header-email">{basicInfo.email || userEmail}</p>
          </div>
        </div>
      </div>

      <div className="userprofile-profile-content">

        {error && (
          <div className="error-message">
            <span>{error}</span>
            {(error.includes('connect') || error.includes('load')) && (
              <button className="retry-btn" onClick={() => fetchUniversities()}>Retry</button>
            )}
          </div>
        )}

        {resultBanner && (
          <div className={`urp-result-banner urp-banner-${resultBanner.type}`}>
            <div className="urp-banner-text">
              {resultBanner.type === 'approved'
                ? <><strong>"{resultBanner.uniName}"</strong> was approved and is now in your list! Search for it below.</>
                : <><strong>"{resultBanner.uniName}"</strong> request was not approved.{resultBanner.reason ? ` Reason: ${resultBanner.reason}` : ''} Please select from available universities.</>
              }
            </div>
            <button className="urp-banner-close" onClick={() => setResultBanner(null)}>x</button>
          </div>
        )}

        {/* Progress bar */}
        <div className="userprofile-progress-container">
          <div className="progress-steps-horizontal">
            {STEPS.map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{step > num ? '✓' : num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: Basic Info ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Personal Information</h2></div>
            <div className="profile-photo-upload-section">
              <div className="profile-photo-avatar">
                {imagePreview
                  ? <img src={imagePreview} alt="Profile" className="profile-photo-preview" />
                  : <div className="profile-photo-placeholder">{getUserInitials()}</div>
                }
                <label htmlFor="profile-photo-input-step1" className="profile-photo-edit-btn" title="Change photo">+</label>
                <input type="file" id="profile-photo-input-step1" accept="image/*" onChange={handleImageUpload} className="profile-photo-input" />
              </div>
              <div className="profile-photo-info">
                <span className="profile-photo-label">Profile Photo</span>
                <span className="profile-photo-hint">JPG, PNG or GIF - Max 5 MB</span>
                <label htmlFor="profile-photo-input-step1" className="profile-photo-upload-btn">
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
              </div>
            </div>
            <div className="form-fields">
              {[
                { label: 'Full Name',            key: 'fullName',    type: 'text', placeholder: ''                      },
                { label: 'Mobile Number',        key: 'mobile',      type: 'tel',  placeholder: ''                      },
                { label: 'Date of Birth',        key: 'dob',         type: 'date', placeholder: ''                      },
                { label: 'Nationality',          key: 'nationality', type: 'text', placeholder: 'e.g., Indian, American'},
                { label: 'Country of Residence', key: 'residence',   type: 'text', placeholder: 'e.g., India, USA, UK' },
              ].map(({ label, key, type, placeholder }) => (
                <div className="form-row" key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={placeholder} value={basicInfo[key]}
                    onChange={e => { setBasicInfo({ ...basicInfo, [key]: e.target.value }); if (validationErrors[key]) setValidationErrors({ ...validationErrors, [key]: null }); }}
                    className={validationErrors[key] ? 'error' : ''} />
                  {validationErrors[key] && <span className="field-error">{validationErrors[key]}</span>}
                </div>
              ))}
              <div className="form-row">
                <label>Email ID</label>
                <input type="email" value={basicInfo.email} disabled className="disabled-input" />
                <span className="email-note">Auto-filled from your account</span>
              </div>
              <div className="form-row">
                <label>Gender</label>
                <UserProfileSelect
                  id="profile-gender"
                  value={basicInfo.gender}
                  placeholder="Select Gender"
                  options={['Male', 'Female', 'Other', 'Prefer not to say']}
                  onChange={value => {
                    setBasicInfo({ ...basicInfo, gender: value });
                    if (validationErrors.gender) setValidationErrors({ ...validationErrors, gender: null });
                  }}
                  className={validationErrors.gender ? 'error' : ''}
                />
                {validationErrors.gender && <span className="field-error">{validationErrors.gender}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="continue-btn" onClick={() => handleSaveProgress(2)} disabled={!isStep1Valid()}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PG / UG Selection ───────────────────────────────────── */}
        {step === 2 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Select Study Level</h2>
              <p>Are you looking for Postgraduate (PG) or Undergraduate (UG) programs?</p>
            </div>
            <div className="branch-step-wrapper">
              <p className="branch-step-label">Choose the level of study you want to pursue</p>
              <div className="branch-cards-row">
                <div className={`branch-card ug-card${programType === 'UG' ? ' selected' : ''}`} onClick={() => handleProgramTypeSelect('UG')}>
                  {programType === 'UG' && <span className="branch-selected-indicator" />}
                  <div className="branch-card-title">UG</div>
                  <div className="branch-card-subtitle">Undergraduate programs<br />Bachelor's &middot; Diploma</div>
                  <span className="branch-card-tag ug-tag">Undergraduate</span>
                </div>
                <div className={`branch-card${programType === 'PG' ? ' selected' : ''}`} onClick={() => handleProgramTypeSelect('PG')}>
                  {programType === 'PG' && <span className="branch-selected-indicator" />}
                  <div className="branch-card-title">PG</div>
                  <div className="branch-card-subtitle">Postgraduate programs<br />Master's &middot; MBA &middot; PhD</div>
                  <span className="branch-card-tag pg-tag">Postgraduate</span>
                </div>
              </div>
              {programType && (
                <div className="branch-info-box">
                  {programType === 'PG'
                    ? <>You'll see <strong>Postgraduate universities</strong> — Master's, MBA and PhD programs based on your background.</>
                    : <>You'll see <strong>Undergraduate universities</strong> — Bachelor's degree programs suited to your qualification.</>
                  }
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(1)}>Back</button>
              <button className="continue-btn" onClick={() => handleSaveProgress(3)} disabled={!isStep2Valid()}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Academic Details ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>Education Background</h2>
              <p>Tell us about your {programType === 'PG' ? 'postgraduate' : 'undergraduate'} background</p>
            </div>

            {/* ✅ Program type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: accentBg, color: accentColor, borderRadius: 999,
                padding: '4px 14px', fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${accentBorder}`,
              }}>
                {programType === 'PG' ? '🎓 Postgraduate (PG)' : '📚 Undergraduate (UG)'}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {programType === 'PG' ? 'Showing Master\'s / MBA courses' : 'Showing Bachelor\'s courses'}
              </span>
            </div>

            <div className="form-fields">

              {/* Qualification — read-only, derived from programType */}
              <div className="form-row">
                <label>Highest Qualification</label>
                <input
                  type="text"
                  value={programType === 'PG' ? "Bachelor's Degree" : "12th / High School"}
                  disabled
                  className="disabled-input"
                />
                <span className="email-note">Based on your study level selection</span>
              </div>

              <div className="form-row">
                <label>Country</label>
                <UserProfileSelect
                  id="profile-country"
                  value={selectedCountry}
                  onChange={handleCountrySelect}
                  placeholder={countriesLoading ? 'Loading countries...' : 'Select country'}
                  options={availableCountries}
                  disabled={countriesLoading}
                  searchable
                />
                {countryError && (
                  <span className="email-note">{countryError}</span>
                )}
                {validationErrors.selectedCountry && <span className="field-error">{validationErrors.selectedCountry}</span>}
              </div>

              {/* Segment chips — keyed to programType */}
              {!selectedCountry ? (
                <div className="segment-section" ref={segmentSectionRef}>
                  <span className="segment-section-label">What field are you interested in?</span>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Please select a country first to view available fields.
                  </div>
                </div>
              ) : segments.length > 0 ? (
                <div className="segment-section" ref={segmentSectionRef}>
                  <span className="segment-section-label">
                    What field are you interested in?
                    <span style={{ fontWeight: 700, color: '#ef4444', marginLeft: 6, fontSize: 12 }}>*</span>
                  </span>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <input
                      type="text"
                      value={majorAreaSearch}
                      placeholder="Search field / major area..."
                      autoComplete="off"
                      onChange={e => setMajorAreaSearch(e.target.value)}
                      style={{
                        width: '100%',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 8,
                        padding: majorAreaSearch ? '9px 34px 9px 10px' : '9px 10px',
                        fontSize: 13,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                    {majorAreaSearch && (
                      <button
                        type="button"
                        aria-label="Clear major area search"
                        onClick={() => setMajorAreaSearch('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: 16,
                          lineHeight: 1,
                          padding: 2,
                        }}
                      >
                        x
                      </button>
                    )}
                  </div>
                  <div className="segment-chips-row">
                    {visibleMajorAreas.map(seg => {
                      const isActive = selectedSegment?.id === seg.id || segmentNamesMatch(selectedSegment?.name || '', seg.name);
                      const activeClass = isActive ? (programType === 'PG' ? 'active-pg' : 'active-ug') : '';
                      return (
                        <button key={seg.id} className={`segment-chip ${activeClass}`}
                          onClick={() => {
                            setSelectedSegment(isActive ? null : seg);
                            setEducation(prev => ({ ...prev, field: isActive ? '' : seg.name }));
                            setCourseInterestInput('');
                            setCourseInterestSuggest([]);
                            setShowCourseInterestDdp(false);
                            courseInterestAbortRef.current?.abort?.();
                            setExpandedCourseCategories({});
                            resetSelectedProgramGroup();
                          }}>
                          {seg.name}{isActive && ' ✕'}
                        </button>
                      );
                    })}
                    {!normalizedMajorAreaSearch && filteredMajorAreas.length > 10 && (
                      <button
                        type="button"
                        className="segment-chip"
                        onClick={() => setShowAllMajorAreas(prev => !prev)}
                      >
                        {showAllMajorAreas ? 'Show less' : 'Show more fields'}
                      </button>
                    )}
                  </div>
                  {normalizedMajorAreaSearch && visibleMajorAreas.length === 0 && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                      No matching major areas found.
                    </div>
                  )}
                  {selectedSegment && (
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                      Selected: <strong style={{ color: accentColor }}>{selectedSegment.name}</strong>
                    </p>
                  )}
                  {validationErrors.selectedSegment && (
                    <span className="field-error">{validationErrors.selectedSegment}</span>
                  )}
                </div>
              ) : (
                <div className="segment-section" ref={segmentSectionRef}>
                  <span className="segment-section-label">What field are you interested in?</span>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {programSectionsLoading
                      ? 'Loading major areas from database...'
                      : programIndexMessage || 'No programs found in database for this selection.'}
                  </div>
                </div>
              )}

              {/* ✅ FIX: Course Interest — category grid filtered by PG or UG */}
              {selectedCountry && selectedSegment?.name ? (
              <div className="form-row course-interest-row">
                <label>
                  Courses of Interest
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>(optional · up to 5)</span>
                </label>

                {/* Selected tags */}
                {interestedCourses.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {interestedCourses.map((course, i) => {
                      const courseLabel = getCourseInterestLabel(course);
                      return (
                      <span key={getCourseInterestRenderKey(course) || i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: accentBg, color: accentColor,
                        borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      }}>
                        {courseLabel}
                        <button type="button"
                          onClick={() => setInterestedCourses(prev => prev.filter(item => getCourseInterestRenderKey(item) !== getCourseInterestRenderKey(course)))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1, color: 'inherit', opacity: 0.7, fontSize: 13 }}
                          aria-label={`Remove ${courseLabel}`}>x</button>
                      </span>
                    );
                    })}
                  </div>
                )}

                {/* ✅ FIX: Category grid — shows PG or UG courses based on programType */}
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  Selected Major Area: <strong style={{ color: accentColor }}>{visibleCourseCategory || 'Choose a field above'}</strong>
                </div>

                {interestedCourses.length < 5 && (
                  <div className="course-category-grid">
                    {!visibleCourseCategory && (
                      <div className="course-category-block">
                        <div className="course-category-title">Choose a major area</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                          Select a field above to see program groups.
                        </div>
                      </div>
                    )}

                    {visibleCourseCategory && !selectedProgramGroup && (
                      <div className="course-category-block">
                        <div className="course-category-title" title={visibleCourseCategory}>Choose program group</div>
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                          <input
                            type="text"
                            value={programGroupSearch}
                            placeholder="Search program group or degree..."
                            autoComplete="off"
                            onChange={e => setProgramGroupSearch(e.target.value)}
                            style={{
                              width: '100%',
                              border: '1.5px solid #e2e8f0',
                              borderRadius: 8,
                              padding: programGroupSearch ? '8px 34px 8px 10px' : '8px 10px',
                              fontSize: 13,
                              color: '#1e293b',
                              outline: 'none',
                            }}
                          />
                          {programGroupSearch && (
                            <button
                              type="button"
                              aria-label="Clear program group search"
                              onClick={() => setProgramGroupSearch('')}
                              style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: 'transparent',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: 16,
                                lineHeight: 1,
                                padding: 2,
                              }}
                            >
                              x
                            </button>
                          )}
                        </div>
                        {programGroupSearchQuery && (
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                            Showing {filteredProgramGroups.length} results for "{programGroupSearchQuery}"
                          </div>
                        )}
                        <div className="course-quick-chips">
                          {visibleProgramGroups.map(group => (
                            <button
                              key={group.name}
                              type="button"
                              className="course-quick-chip"
                              title={group.name}
                              onClick={() => {
                                setSelectedProgramGroup(group.name);
                                groupProgramAbortRef.current?.abort?.();
                                setCourseInterestInput('');
                                setGroupProgramSearch('');
                                setGroupPrograms(group.items || []);
                                if (group.items?.length) {
                                  const groupKey = getGroupProgramsKey(programType, visibleCourseCategory, group.name, '');
                                  groupProgramPaginationByKeyRef.current[groupKey] = { page: 1, pages: 1, total: group.items.length };
                                  setGroupProgramsByKey(prev => ({ ...prev, [groupKey]: group.items }));
                                }
                                setGroupProgramsPagination({ page: 1, pages: 1, total: group.items?.length || 0 });
                              }}
                            >
                              {group.name}
                            </button>
                          ))}
                          {hasMoreProgramGroups && (
                            <button
                              type="button"
                              className="course-quick-chip course-more-chip"
                              onClick={() => setVisibleProgramGroupCount(count => count + PROGRAM_GROUP_RENDER_BATCH)}
                            >
                              Show more
                            </button>
                          )}
                        </div>
                        {courseProgramLoading && programGroups.length === 0 && (
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            Loading programs from database...
                          </div>
                        )}
                        {!courseProgramLoading && programGroups.length === 0 && (
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            {programIndexMessage || 'No programs found in database for this selection.'}
                          </div>
                        )}
                        {programGroups.length > 0 && filteredProgramGroups.length === 0 && (
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            No matching program groups found. Try another keyword.
                          </div>
                        )}
                        {false && sectionPrograms.length > 0 && (
                          <>
                            <div className="course-category-title" title={visibleCourseCategory} style={{ marginTop: 14 }}>
                              All {visibleCourseCategory} programs
                            </div>
                            <div className="course-quick-chips">
                              {dedupeProgramsForDisplay(sectionPrograms).map(course => {
                                const nextCourse = toCourseInterestObject(course, visibleCourseCategory, { country: selectedCountry, programType });
                                const nextCourseKey = getCourseInterestRenderKey(nextCourse);
                                const isSelected = interestedCourses.some(selected => getCourseInterestRenderKey(selected) === nextCourseKey);
                                return (
                                  <button
                                    key={course.key}
                                    type="button"
                                    className={`course-quick-chip ${isSelected ? chipActiveClass : ''}`}
                                    title={course.value}
                                    disabled={!isSelected && interestedCourses.length >= 5}
                                    onClick={() => {
                                      if (!isSelected && interestedCourses.length < 5) {
                                        setInterestedCourses(prev => (
                                          prev.some(c => getCourseInterestRenderKey(c) === nextCourseKey) ? prev : [...prev, nextCourse]
                                        ));
                                        syncSegmentFromName(visibleCourseCategory);
                                      }
                                    }}
                                  >
                                    {isSelected ? <><FaCheck aria-hidden="true" /> {course.label}</> : course.label}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {visibleCourseCategory && selectedProgramGroup && (
                      <div className="course-category-block">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                          <div className="course-category-title" title={selectedProgramGroup} style={{ marginBottom: 0 }}>
                            {selectedProgramGroup} programs
                          </div>
                          <input
                            type="text"
                            value={groupProgramSearch}
                            placeholder={`Search ${selectedProgramGroup} programs...`}
                            autoComplete="off"
                            onChange={e => setGroupProgramSearch(e.target.value)}
                            style={{
                              width: 240,
                              maxWidth: '100%',
                              border: '1.5px solid #e2e8f0',
                              borderRadius: 8,
                              padding: '7px 10px',
                              fontSize: 13,
                              color: '#1e293b',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="course-quick-chip course-more-chip"
                          style={{ marginBottom: 8 }}
                          onClick={() => {
                            resetSelectedProgramGroup();
                            setCourseInterestInput('');
                          }}
                        >
                          Back to groups
                        </button>

                        {courseProgramLoading && selectedGroupPrograms.length === 0 ? (
                          <div style={{ fontSize: 13, color: '#64748b' }}>Loading {selectedProgramGroup} programs...</div>
                        ) : selectedGroupLoadFailed ? (
                          <div style={{ fontSize: 13, color: '#64748b' }}>Could not load programs. Try again.</div>
                        ) : filteredGroupPrograms.length > 0 ? (
                          <div className="course-quick-chips">
                            {filteredGroupPrograms.map(course => {
                              const nextCourse = toCourseInterestObject(course, visibleCourseCategory, { country: selectedCountry, programType });
                              const nextCourseKey = getCourseInterestRenderKey(nextCourse);
                              const isSelected = interestedCourses.some(selected => getCourseInterestRenderKey(selected) === nextCourseKey);
                              const displayLabel = course.degree ? `${course.label} — ${course.degree}` : course.label;
                              const tooltipLabel = [course.value, course.degree, course.level].filter(Boolean).join(' — ');
                              return (
                                <button
                                  key={course.renderKey || course.key}
                                  type="button"
                                  className={`course-quick-chip ${isSelected ? chipActiveClass : ''}`}
                                  title={tooltipLabel}
                                  disabled={!isSelected && interestedCourses.length >= 5}
                                  onClick={() => {
                                    if (!isSelected && interestedCourses.length < 5) {
                                      setInterestedCourses(prev => (
                                        prev.some(c => getCourseInterestRenderKey(c) === nextCourseKey) ? prev : [...prev, nextCourse]
                                      ));
                                      syncSegmentFromName(visibleCourseCategory);
                                    }
                                  }}
                                >
                                  {isSelected ? `✓ ${displayLabel}` : displayLabel}
                                </button>
                              );
                            })}
                            {!sectionGroupPrograms.length && groupProgramsPagination.page < groupProgramsPagination.pages && (
                              <button
                                type="button"
                                className="course-quick-chip course-more-chip"
                                disabled={courseProgramLoading}
                                onClick={() => fetchProgramsForGroup({
                                  group: selectedProgramGroup,
                                  page: groupProgramsPagination.page + 1,
                                  q: groupProgramSearch,
                                })}
                              >
                                {courseProgramLoading ? 'Loading...' : 'Load more'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            {groupProgramSearch.trim()
                              ? 'No matching programs found. Try another keyword.'
                              : programIndexMessage || 'No programs found in database for this selection.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {false && interestedCourses.length < 5 && (
                  <div className="course-category-grid">
                    {courseProgramLoading && visibleCourseCategory && !visibleCoursePoolEntries.length && (
                      <div className="course-category-block">
                        <div className="course-category-title" title={visibleCourseCategory}>{visibleCourseCategory}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Loading programs from database...</div>
                      </div>
                    )}
                    {!courseProgramLoading && visibleCourseCategory && !visibleCoursePoolEntries.length && (
                      <div className="course-category-block">
                        <div className="course-category-title" title={visibleCourseCategory}>{visibleCourseCategory}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                          Type at least 2 letters to search all programs from database.
                        </div>
                      </div>
                    )}
                    {visibleCoursePoolEntries.map(([categoryName, courses]) => {
                      const isExpanded = !!expandedCourseCategories[categoryName];
                      const visibleCourses = isExpanded
                        ? courses
                        : courses.slice(0, COURSE_CHIP_PREVIEW_LIMIT);
                      const hiddenCount = Math.max(0, courses.length - COURSE_CHIP_PREVIEW_LIMIT);

                      return (
                        <div key={categoryName} className="course-category-block">
                          <div className="course-category-title" title={categoryName}>{categoryName}</div>
                          <div className="course-quick-chips">
                            {visibleCourses.map(course => {
                              const nextCourse = toCourseInterestObject(course, categoryName, { country: selectedCountry, programType });
                              const nextCourseKey = getCourseInterestRenderKey(nextCourse);
                              const isSelected = interestedCourses.some(selected => getCourseInterestRenderKey(selected) === nextCourseKey);
                              return (
                                <button
                                  key={course}
                                  type="button"
                                  className={`course-quick-chip ${isSelected ? chipActiveClass : ''}`}
                                  title={course}
                                  disabled={!isSelected && interestedCourses.length >= 5}
                                  onClick={() => {
                                    if (!isSelected && interestedCourses.length < 5) {
                                      setInterestedCourses(prev => (
                                        prev.some(c => getCourseInterestRenderKey(c) === nextCourseKey) ? prev : [...prev, nextCourse]
                                      ));
                                      syncSegmentFromName(categoryName);
                                    }
                                  }}
                                >
                                  {isSelected ? `✓ ${course}` : course}
                                </button>
                              );
                            })}
                            {hiddenCount > 0 && (
                              <button
                                type="button"
                                className="course-quick-chip course-more-chip"
                                onClick={() =>
                                  setExpandedCourseCategories(prev => ({
                                    ...prev,
                                    [categoryName]: !isExpanded,
                                  }))
                                }
                              >
                                {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Also keep text input for custom entries */}
                <div style={{ position: 'relative', marginTop: 10 }}>
                  <div
                    style={{
                      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                      minHeight: 44, border: `1.5px solid ${accentBorder}`,
                      borderRadius: 10, padding: '6px 10px', background: '#fff', cursor: 'text',
                    }}
                    onClick={() => courseInterestInputRef.current?.focus()}
                  >
                    {interestedCourses.length < 5 ? (
                      <input
                        ref={courseInterestInputRef}
                        type="text"
                        value={courseInterestInput}
                        placeholder="Search programs from database..."
                        autoComplete="off"
                        style={{ flex: 1, minWidth: 140, border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent', padding: '2px 0' }}
                        onChange={e => setCourseInterestInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                          }
                        }}
                        onFocus={() => { if (courseInterestSuggest.length) setShowCourseInterestDdp(true); }}
                        onBlur={() => setTimeout(() => setShowCourseInterestDdp(false), 150)}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Max 5 courses selected</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                    Type at least 2 letters to search all programs from database.
                  </span>
                  {showCourseInterestDdp && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,.10)', overflow: 'hidden', marginTop: 4,
                    }}>
                      {courseInterestLoading ? (
                        <div style={{ padding: '9px 14px', fontSize: 13, color: '#64748b' }}>
                          Searching programs...
                        </div>
                      ) : dedupedCourseInterestSuggest.length > 0 ? Object.entries(groupedCourseInterestSuggest).map(([groupName, suggestions]) => (
                        <div key={groupName}>
                          <div style={{
                            padding: '7px 14px 5px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748b',
                            background: '#f8fafc',
                            textTransform: 'uppercase',
                            letterSpacing: '.4px',
                          }}>
                            {groupName}
                          </div>
                          {suggestions.map((suggestion, i) => {
                            const suggestionLabel = suggestion.degree ? `${suggestion.label} — ${suggestion.degree}` : suggestion.label;
                            const t = courseInterestInput.trim().toLowerCase();
                            const idx = suggestionLabel.toLowerCase().indexOf(t);
                            return (
                              <button key={`${groupName}-${suggestion.renderKey || suggestion.key || i}`} type="button"
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'none', fontSize: 13, color: '#1e293b', cursor: 'pointer' }}
                                onMouseOver={e => { e.currentTarget.style.background = accentBg; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'none'; }}
                                onMouseDown={() => {
                                  const nextCourse = toCourseInterestObject(suggestion, groupName, { country: selectedCountry, programType });
                                  const nextCourseKey = getCourseInterestRenderKey(nextCourse);
                                  setInterestedCourses(prev => (
                                    prev.some(c => getCourseInterestRenderKey(c) === nextCourseKey) || prev.length >= 5 ? prev : [...prev, nextCourse]
                                  ));
                                  syncSegmentFromName(suggestion.majorArea || '');
                                  setCourseInterestInput(''); setCourseInterestSuggest([]); setShowCourseInterestDdp(false);
                                  setTimeout(() => courseInterestInputRef.current?.focus(), 0);
                                }}>
                                {idx === -1 ? suggestionLabel : (
                                  <>{suggestionLabel.slice(0, idx)}<strong style={{ color: accentHl }}>{suggestionLabel.slice(idx, idx + t.length)}</strong>{suggestionLabel.slice(idx + t.length)}</>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )) : (
                        <div style={{ padding: '9px 14px', fontSize: 13, color: '#64748b' }}>
                          {programIndexMessage || 'No programs found in database for this selection.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              ) : selectedCountry ? (
                <div className="form-row course-interest-row">
                  <label>Courses of Interest</label>
                  <div className="segment-section" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      Select a field first to view available programs.
                    </div>
                  </div>
                  {validationErrors.interestedCourses && (
                    <span className="field-error">{validationErrors.interestedCourses}</span>
                  )}
                </div>
              ) : null}
              {selectedCountry && selectedSegment?.name && validationErrors.interestedCourses && (
                <span className="field-error">{validationErrors.interestedCourses}</span>
              )}

              {/* Institution */}
              <div className="form-row">
                <label>University / School Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Enter institution name" value={education.institution}
                  onChange={e => { setEducation({ ...education, institution: e.target.value }); if (validationErrors.institution) setValidationErrors({ ...validationErrors, institution: null }); }}
                  className={validationErrors.institution ? 'error' : ''} />
                {validationErrors.institution && <span className="field-error">{validationErrors.institution}</span>}
              </div>

              {/* CGPA */}
              <div className="form-row">
                <label>Percentage / CGPA <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Enter percentage or CGPA" value={education.cgpa}
                  inputMode="decimal"
                  pattern="^[0-9]+(\.[0-9]{1,2})?$"
                  onChange={e => { setEducation({ ...education, cgpa: sanitizePercentageCgpa(e.target.value) }); if (validationErrors.cgpa) setValidationErrors({ ...validationErrors, cgpa: null }); }}
                  className={validationErrors.cgpa ? 'error' : ''} />
                {validationErrors.cgpa && <span className="field-error">{validationErrors.cgpa}</span>}
              </div>

            </div>
            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(2)}>Back</button>
              <button className="continue-btn" onClick={() => handleSaveProgress(4)} disabled={!isStep3Valid()}>
                Show Universities
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Universities (unchanged) ────────────────────────────── */}
        {step === 4 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header">
              <h2>{programType === 'PG' ? 'Postgraduate' : 'Undergraduate'} Universities</h2>
              <p>
                <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: accentBg, color: accentColor }}>
                  {programType}
                </span>
              </p>
              <div className="selection-instruction">
                <span className="instruction-icon">i</span>
                <strong>Please choose exactly 2 universities</strong>
                <span> and select 1 course for each university.</span>
              </div>
            </div>

            {interestedCourses.length > 0 ? (
              <div className="segment-section">
                <span className="segment-section-label">Selected programs</span>
                <div className="segment-chips-row">
                  {interestedCourses.map((course, index) => {
                    const title = getCourseInterestTitle(course);
                    const label = getCourseInterestLabel(course);
                    return (
                      <span
                        key={getCourseInterestRenderKey(course) || `${title}-${index}`}
                        className={`segment-chip ${programType === 'PG' ? 'active-pg' : 'active-ug'}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : visibleUniversityFilterAreas.length > 0 && (
              <div className="segment-section">
                <span className="segment-section-label">
                  Filter by Segment {selectedSegment && <span style={{ color: accentColor }}>— {selectedSegment.name}</span>}
                </span>
                <div className="segment-chips-row">
                  {selectedSegment?.name && (
                    <button
                      key={selectedSegment.id || selectedSegment.name}
                      type="button"
                      className={`segment-chip ${programType === 'PG' ? 'active-pg' : 'active-ug'}`}
                      onClick={clearUniversityMajorAreaFilter}
                      aria-label={`Clear ${selectedSegment.name} filter`}
                    >
                      {selectedSegment.name} x
                    </button>
                  )}
                  {!selectedSegment?.name && visibleUniversityFilterAreas.map(seg => {
                    const isActive = selectedSegment?.id === seg.id || segmentNamesMatch(selectedSegment?.name || '', seg.name);
                    const activeClass = isActive ? (programType === 'PG' ? 'active-pg' : 'active-ug') : '';
                    if (isActive) {
                      return (
                        <button
                          key={seg.id || seg.name}
                          type="button"
                          className={`segment-chip ${activeClass}`}
                          onClick={clearUniversityMajorAreaFilter}
                          aria-label={`Clear ${seg.name} filter`}
                        >
                          {seg.name} x
                        </button>
                      );
                    }
                    return (
                      <button key={seg.id || seg.name} type="button" className={`segment-chip ${activeClass}`}
                        onClick={() => {
                          setSelectedSegment(seg);
                          setEducation(prev => ({ ...prev, field: seg.name }));
                          resetSelectedProgramGroup();
                        }}>
                        {seg.name}{isActive && ' ✕'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="university-controls">
              <div className="search-wrapper">
                <span className="search-icon">&#128269;</span>
                <input type="text" className="search-input" placeholder="Search universities by name, city, country..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <button className="search-clear-btn" onClick={() => { setSearchTerm(''); setApprovedUniName(null); }}>x</button>
                )}
              </div>
              <div className="selection-counter"><span className="counter-number">{selectedUniversities.length}</span>/2</div>
            </div>

            <div className="request-university-banner">
              <div className="request-banner-content">
                <div className="request-banner-text">
                  <strong>Can't find your university?</strong>
                  <p>Can't find your university? Submit a request and our team will review it.</p>
                </div>
                <button type="button" className="request-university-btn" onClick={openRequestModal}>
                  + Request University
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading universities...</p>
                <button className="retry-small-btn" onClick={() => fetchUniversities()}>Retry</button>
              </div>
            ) : (
              <>
                <div className="universities-grid">
                  {filteredUniversities.length > 0 ? visibleUniversities.map(uni => {
                    const key        = getUniKey(uni);
                    const universityId = getSafeUniversityId(uni);
                    const isSel      = selectedUniversities.some(u => getUniKey(u) === key);
                    const displayCourseCount = interestedCourses.length > 0
                      ? (uni.matchedProgramCount || 0)
                      : (uni.stats?.totalPrograms || uni._programCount || 0);
                    const courseLabel = interestedCourses.length > 0
                      ? `${displayCourseCount} matched ${displayCourseCount === 1 ? 'course' : 'courses'}`
                      : `${displayCourseCount} courses`;
                    const isDirect   = displayCourseCount === 0;
                    const selUni     = selectedUniversities.find(u => getUniKey(u) === key);
                    const selCourses = selUni?.selectedCourses || [];
                    const srcLabel   = getSourceLabel(uni);
                    const displayName = getUniversityDisplayName(uni);
                    const isHighlighted = approvedUniName && displayName.toLowerCase().includes(approvedUniName.toLowerCase());

                    return (
                      <div key={getUniversityDisplayMergeKey(uni) || key || universityId} className="university-card-wrapper">
                        <div
                          className={`university-card ${isSel ? 'selected' : ''} ${isDirect ? 'direct-apply' : ''} ${isHighlighted ? 'urp-highlight-card' : ''}`}
                          onClick={() => handleOpenUniversityCourses(uni)}
                        >
                          {isHighlighted && <div className="urp-new-badge">Just Added</div>}
                          <div className="university-logo">{getInitials(displayName)}</div>
                          <div className="university-details">
                            <h4>{displayName || 'Unknown University'}</h4>
                            <p className="uni-location">
                              {getUniversityLocationText(uni) || 'Location N/A'}
                            </p>
                            <div className="uni-badges">
                              {displayCourseCount > 0 && <span className="program-badge">{courseLabel}</span>}
                              {isDirect    && <span className="direct-apply-badge">Direct Apply</span>}
                              {srcLabel    && <span className="source-label-badge">{srcLabel}</span>}
                            </div>
                          </div>
                          {isSel && <span className="check-mark">&#10003;</span>}
                        </div>
                        {isSel && !isDirect && selCourses.length > 0 && (
                          <div className="selected-courses-preview">
                            <span className="preview-label">Selected:</span>
                            <div className="preview-courses">
                              {selCourses.map((c, i) => (
                                <span key={i} className="preview-course-tag">{c.title || c.name || c.program_name || 'Course'}</span>
                              ))}
                            </div>
                            <button className="edit-courses-btn" onClick={e => { e.stopPropagation(); handleOpenUniversityCourses(uni); }}>Edit</button>
                          </div>
                        )}
                        {isSel && !isDirect && selCourses.length === 0 && (
                          <div className="selected-courses-preview warning">
                            <span className="preview-label">No courses selected</span>
                            <button className="edit-courses-btn" onClick={e => { e.stopPropagation(); handleOpenUniversityCourses(uni); }}>Select</button>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="no-results">
                      <p>
                        {interestedCourses.length === 0
                          ? 'Select at least one program to load matching universities.'
                          : 'No universities found for the selected country, field and program.'}
                      </p>
                      <div className="no-results-actions">
                        {searchTerm && <button className="retry-btn" onClick={() => setSearchTerm('')}>Clear Search</button>}
                      </div>
                    </div>
                  )}
                </div>

                {(filteredUniversities.length > visibleUniversityCount || hasMoreUniversityPages) && (
                  <div className="no-results-actions" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="retry-btn"
                      onClick={handleLoadMoreUniversities}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load more universities'}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(3)}>Back</button>
              <button className="continue-btn" onClick={() => handleSaveProgress(5)} disabled={!isStep4Valid()}>Continue</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Review ──────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="form-card userprofile-fade-in">
            <div className="card-header"><h2>Review Your Profile</h2><p>Verify everything before submitting</p></div>

            <div className="review-section">
              <h3>Personal Information</h3>
              <div className="review-grid">
                {[
                  ['Full Name',     basicInfo.fullName   ],
                  ['Email',         basicInfo.email      ],
                  ['Mobile',        basicInfo.mobile     ],
                  ['Date of Birth', formatDisplayDate(basicInfo.dob)],
                  ['Gender',        basicInfo.gender     ],
                  ['Nationality',   basicInfo.nationality],
                  ['Residence',     basicInfo.residence  ],
                ].map(([l, v]) => (
                  <p key={l}><strong>{l}:</strong> {v || 'Not provided'}</p>
                ))}
              </div>
            </div>

            <div className="review-section">
              <h3>Academic Details</h3>
              <div className="review-grid">
                {[
                  ['Study Level',    programType === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)'],
                  ['Qualification',  education.qualification],
                  ['Institution',    education.institution  ],
                  ['Interested Field', selectedSegment?.name || 'Not provided' ],
                  ['CGPA / Grade',   education.cgpa         ],
                ].map(([l, v]) => (
                  <p key={l}><strong>{l}:</strong> {v || 'Not provided'}</p>
                ))}
                {interestedCourses.length > 0 && (
                  <p><strong>Courses of Interest:</strong> {interestedCourses.map(getCourseInterestLabel).join(', ')}</p>
                )}
              </div>
            </div>

            <div className="review-section">
              <h3>Selected Universities</h3>
              <div className="universities-list">
                {selectedUniversities.length > 0 ? selectedUniversities.map((uni, i) => {
                  const courses  = uni.selectedCourses || [];
                  const isDirect = false;
                  const city    = uni.CITY   || uni.city  || uni.location?.city  || '';
                  const state   = uni.STABBR || uni.state || uni.location?.state || '';
                  const country = uni.location?.country || uni.country || uni.COUNTRY || 'USA';
                  const locStr  = [city, state, country].filter(Boolean).join(', ');
                  const website = uni.WEBADDR || uni.website || uni.contact?.website || '';
                  return (
                    <div key={getUniKey(uni) || i} className="review-university-item">
                      <p className="review-university-name">
                        <strong>{i + 1}. {uni.INSTNM || uni.universityName || uni.name || 'Unknown'}</strong>
                        {isDirect && <span className="direct-apply-tag">Direct Apply</span>}
                        {uni._source === 'bachelors' && <span className="source-tag bachelors-tag">Bachelor's</span>}
                        {uni._source === 'masters'   && <span className="source-tag masters-tag">Master's</span>}
                      </p>
                      <div className="review-uni-details">
                        {locStr  && <p className="review-detail-item"><span className="review-detail-label">Location:</span><span>{locStr}</span></p>}
                        {website && <p className="review-detail-item"><span className="review-detail-label">Website:</span><a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">{website}</a></p>}
                      </div>
                      {isDirect && <div className="direct-apply-review-note">Direct application — no course pre-selection required.</div>}
                      {!isDirect && courses.length > 0 && (
                        <div className="review-courses-list">
                          <p className="courses-label">Selected Courses ({courses.length}):</p>
                          <ul>{courses.map((c, ci) => (
                            <li key={ci}>
                              {c.title || c.name || c.program_name || 'Course'}
                              {c.level     && <span className="course-level"> &middot; {c.level}</span>}
                              {c.studyMode && <span className="course-mode"> &middot; {c.studyMode}</span>}
                              {c.duration  && <span className="course-duration"> &middot; {c.duration}</span>}
                            </li>
                          ))}</ul>
                        </div>
                      )}
                      {!isDirect && !courses.length && <p className="warning-text">No courses selected</p>}
                    </div>
                  );
                }) : <p>No universities selected</p>}
              </div>
            </div>

            <div className="form-actions">
              <button className="back-btn" onClick={() => setStep(4)}>Back</button>
              <button className="submit-btn" onClick={handleSubmitProfile} disabled={saving || !isStep4Valid()}>
                {saving ? 'Submitting...' : 'Submit Profile'}
              </button>
            </div>
          </div>
        )}

        <div className="bottom-progress">
          <div className="progress-steps-horizontal">
            {STEPS.map(({ num, label }) => (
              <div key={num} className={`step-horizontal ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                <span className="step-number-horizontal">{step > num ? '✓' : num}</span>
                <span className="step-label-horizontal">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Course Selection Modal (unchanged) ──────────────────────────── */}
      {showCourseModal && currentUniversity && (
        <div className="modal-overlay" onClick={closeCourseModal}>
          <div className="modal-content course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Courses — {getUniversityDisplayName(currentUniversity)}</h3>
              <button className="modal-close-btn" onClick={closeCourseModal}>x</button>
            </div>
            <div className="modal-body">
              <p className="course-selection-info">Select 1 course</p>
              {courseModalFieldLabel && (
                <p className="course-segment-note">
                  {courseModalFieldLabel === 'selected matched courses'
                    ? 'Showing selected matched courses'
                    : <>Showing courses for <strong>{courseModalFieldLabel}</strong></>}
                </p>
              )}
              {courseModalNotice && (
                <div className="course-modal-notice">
                  {courseModalNotice}
                </div>
              )}
              {interestedCourses.length > 0 && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={courseModalShowingAll ? showMatchedProgramsForCurrentUniversity : showAllProgramsForCurrentUniversity}
                  disabled={loadingUniversityPrograms}
                  style={{ marginBottom: 12 }}
                >
                  {loadingUniversityPrograms
                    ? 'Loading...'
                    : courseModalShowingAll
                      ? 'Back to matched courses'
                      : 'Show all programs from this university'}
                </button>
              )}
              <div className="selected-count">Selected: {tempSelectedCourses.length}/1</div>
              <div className="course-search-section">
                <div className="course-search-wrapper">
                  <input type="text" className="course-search-input" placeholder="Search courses..."
                    value={courseSearchTerm} onChange={e => setCourseSearchTerm(e.target.value)} />
                  {courseSearchTerm && <button className="clear-search-btn" onClick={() => setCourseSearchTerm('')}>x</button>}
                </div>
              </div>
              {filteredCourses.length > 0 ? (
                <div className="courses-grid">
                  {filteredCourses.map((c, i) => {
                    const universityId = getUniKey(currentUniversity);
                    const courseId = getCourseSelectionId(c, universityId);
                    const isSel = tempSelectedCourses.some(x => getCourseSelectionId(x, universityId) === courseId);
                    const name  = c.title || c.name || c.program_name || 'Course';
                    return (
                      <div key={getCourseCardKey(c, i, currentUniversity)} className={`course-card ${isSel ? 'selected' : ''}`} onClick={() => toggleTempCourse(c)}>
                        <h4 className="course-title">{name}</h4>
                        <div className="course-badges">
                          {c.level     && <span className="course-level-badge" style={{ backgroundColor: getLevelColor(c.level) }}>{c.level}</span>}
                          {c.studyMode && <span className="course-mode-badge"  style={{ backgroundColor: getStudyModeColor(c.studyMode) }}>{c.studyMode}</span>}
                        </div>
                        {c.duration  && <span className="course-duration">{c.duration}</span>}
                        {c.majorArea && <span className="course-major">{c.majorArea}</span>}
                        {isSel && <span className="course-selected-check">Selected</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-courses">
                  <p>
                    {interestedCourses.length > 0
                      ? 'No matching course found for this selected program in this university.'
                      : 'No courses found.'}
                  </p>
                  {courseSearchTerm && <button className="clear-filters-btn" onClick={() => setCourseSearchTerm('')}>Clear Search</button>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeCourseModal}>Cancel</button>
              <button className="save-btn" onClick={saveCourseSelection} disabled={tempSelectedCourses.length !== 1}>
                Save ({tempSelectedCourses.length}/1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request University Modal (unchanged) ────────────────────────── */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content request-university-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request a University</h3>
              <button className="modal-close-btn" onClick={closeRequestModal}>x</button>
            </div>
            {requestSuccess ? (
              <div className="request-success-state">
                <div className="request-success-icon">&#10003;</div>
                <h4>Submitted! Opening status window...</h4>
              </div>
            ) : (
              <div className="modal-body">
                <p className="request-modal-desc">Can't find your university? Fill in the details and our team will review and add it.</p>
                {requestFormErrors.submit && <div className="request-submit-error">{requestFormErrors.submit}</div>}
                <div className="form-fields">
                  <div className="form-row">
                    <label>University Name <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., Harvard University" value={requestForm.universityName || ''}
                      onChange={e => { setRequestForm({ ...requestForm, universityName: e.target.value }); if (requestFormErrors.universityName) setRequestFormErrors({ ...requestFormErrors, universityName: null }); }}
                      className={requestFormErrors.universityName ? 'error' : ''} />
                    {requestFormErrors.universityName && <span className="field-error">{requestFormErrors.universityName}</span>}
                  </div>
                  <div className="form-row">
                    <label>Country <span className="required-star">*</span></label>
                    <input type="text" placeholder="e.g., United States" value={requestForm.country || ''}
                      onChange={e => { setRequestForm({ ...requestForm, country: e.target.value }); if (requestFormErrors.country) setRequestFormErrors({ ...requestFormErrors, country: null }); }}
                      className={requestFormErrors.country ? 'error' : ''} />
                    {requestFormErrors.country && <span className="field-error">{requestFormErrors.country}</span>}
                  </div>
                  <div className="form-row" style={{ position: 'relative' }}>
                    <label>Courses of Interest <span className="required-star">*</span><span className="optional-label"> — up to 5</span></label>
                    <div className={`course-tag-input-wrapper${requestFormErrors.courses ? ' error-border' : ''}`}>
                      {reqCourses.map((c, i) => (
                        <span key={i} className="course-tag">{c}<button type="button" className="course-tag-remove" onClick={() => removeReqCourse(c)}>x</button></span>
                      ))}
                      {reqCourses.length < 5 && (
                        <input ref={reqCourseInputRef} type="text" className="course-tag-input"
                          placeholder={reqCourses.length === 0 ? 'Type a course and press Enter...' : 'Add another...'}
                          value={reqCourseInput} onChange={e => setReqCourseInput(e.target.value)}
                          onKeyDown={handleReqCourseKey}
                          onFocus={() => { if (reqSuggestions.length) setShowReqSuggestions(true); }}
                          onBlur={() => setTimeout(() => setShowReqSuggestions(false), 150)}
                          autoComplete="off" />
                      )}
                    </div>
                    <span className="course-tag-hint">Press Enter or , to add &middot; Backspace to remove</span>
                    {showReqSuggestions && reqSuggestions.length > 0 && (
                      <div className="course-suggestions-dropdown">
                        {reqSuggestions.map((s, i) => (
                          <button key={i} type="button" className="course-suggestion-item" onMouseDown={() => addReqCourse(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                    {requestFormErrors.courses && <span className="field-error">{requestFormErrors.courses}</span>}
                  </div>
                </div>
                <div className="request-info-note">
                  <p>A status popup will appear so you can track the admin's response in real time.</p>
                </div>
              </div>
            )}
            {!requestSuccess && (
              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeRequestModal} disabled={submittingRequest}>Cancel</button>
                <button className="save-btn" onClick={handleSubmitRequest} disabled={submittingRequest}>
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
