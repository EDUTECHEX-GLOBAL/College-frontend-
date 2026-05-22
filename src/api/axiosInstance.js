// src/api/axiosInstance.js
import axios from 'axios';
import API_BASE_URL from '../config/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// Only log in development
// ─────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';
const devLog  = (...args) => { if (isDev) console.log(...args); };
const devWarn = (...args) => { if (isDev) console.warn(...args); };
const devErr  = (...args) => { if (isDev) console.error(...args); };

// ─────────────────────────────────────────────────────────────
// These endpoints return 404 when no data exists yet (first-time
// students). That is expected — do NOT treat as an error.
// ─────────────────────────────────────────────────────────────
const EXPECTED_404_PATTERNS = [
  '/eqhe',
  '/scores',
  '/personal',
  '/address',
  '/specialneeds',
  '/firsteducation',
  '/documents',
  '/language',
];

const isExpected404 = (url, status) =>
  status === 404 && EXPECTED_404_PATTERNS.some(p => url?.includes(p));

// ─────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────
const getSessionKey = () => sessionStorage.getItem('sessionKey');

export const getActiveToken = () => {
  const key = getSessionKey();
  return key ? localStorage.getItem(`token_${key}`) : null;
};

export const clearAllUserData = () => {
  const key = getSessionKey();
  const fields = [
    'token', 'userData', 'studentType', 'userEmail',
    'profileCompleted', 'userProfile', 'testingActiveSections',
    'gusApplicationData', 'masterApplicationData',
    'selectedCourseForApplication', 'currentSelectedCourse',
    'selectedMasterCourseForApplication', 'masterCourseConfirmed',
  ];

  if (key) {
    fields.forEach(field => localStorage.removeItem(`${field}_${key}`));
  }
  fields.forEach(field => localStorage.removeItem(field));
  sessionStorage.removeItem('sessionKey');
};

// ─────────────────────────────────────────────────────────────
// REQUEST interceptor
// ─────────────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getActiveToken();

    devLog(`🔍 [${config.method?.toUpperCase()}] ${config.url}`);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      devLog('   ✅ Token attached');
    } else {
      devWarn('   ⚠️ No token — request may fail auth');
    }

    if (['put', 'post'].includes(config.method)) {
      devLog('   📦 Body:', config.data);
    }

    return config;
  },
  (error) => {
    devErr('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// RESPONSE interceptor
// ─────────────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    devLog(`✅ [${response.status}] ${response.config.url}`);
    return response;
  },
  (error) => {
    const url     = error.config?.url;
    const method  = error.config?.method?.toUpperCase();
    const status  = error.response?.status;
    const message = error.response?.data?.message;

    // ✅ Silently pass through expected 404s — component handles them
    if (isExpected404(url, status)) {
      devLog(`ℹ️ [404] No data yet for ${url} — first-time student, skipping`);
      return Promise.reject(error);
    }

    // Log everything else (dev only)
    devErr(`❌ [${status ?? 'NET'}] ${method} ${url}`);
    devErr(`   💬 ${message}`);
    devErr(`   📦`, error.response?.data);

    // ── Auth endpoints: never redirect on failure ──
    const isAuthEndpoint = ['/login', '/register', '/signin', '/signup']
      .some(p => url?.includes(p));

    if (isAuthEndpoint) return Promise.reject(error);

    // ── 401: clear session & redirect ──
    if (status === 401) {
      devErr('🔑 401 — clearing tab session & redirecting');
      clearAllUserData();
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/sign-in') && !currentPath.includes('/login')) {
        window.location.href = '/sign-in';
      }
    }

    // ── 500 hint ──
    if (status === 500) {
      devErr('💡 500 — check backend server logs');
    }

    // ── Timeout ──
    if (error.code === 'ECONNABORTED') {
      devErr('⏱️ Request timed out — is the backend running?');
    }

    // ── Network error ──
    if (error.message === 'Network Error') {
      devErr('🌐 Network error — cannot reach:', axiosInstance.defaults.baseURL);
    }

    return Promise.reject(error);
  }
);

devLog('🌐 Axios ready →', axiosInstance.defaults.baseURL);

export default axiosInstance;
