// api/axiosInstance.js
import axios from 'axios';

// ✅ Detect environment
const isProduction = process.env.NODE_ENV === 'production';

// ✅ Set base URL properly
const BASE_URL = isProduction
  ? 'https://college-backend-render-1.onrender.com' // 🔥 Your Render backend
  : 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 20000, // increased for Render cold starts
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// ===================== REQUEST INTERCEPTOR =====================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    console.log('🔍 Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      hasToken: !!token,
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ===================== RESPONSE INTERCEPTOR =====================
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      url: response.config.url,
      status: response.status,
    });

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.message;

    console.error('❌ API Error:', {
      url,
      status,
      message,
    });

    // 🔐 Skip auth endpoints
    if (
      url?.includes('/login') ||
      url?.includes('/register') ||
      url?.includes('/signin') ||
      url?.includes('/signup')
    ) {
      return Promise.reject(error);
    }

    // 🔑 Handle Unauthorized
    if (status === 401) {
      console.warn('🔑 Unauthorized → clearing session');

      localStorage.removeItem('token');
      localStorage.removeItem('userData');

      if (!window.location.pathname.includes('/sign-in')) {
        window.location.href = '/sign-in';
      }
    }

    // 🌐 Network Error (Render cold start / server down)
    if (error.message === 'Network Error') {
      console.error('🌐 Cannot connect to backend');
      console.error('👉 Check:', axiosInstance.defaults.baseURL);
    }

    // ⏳ Timeout (Render cold start)
    if (error.code === 'ECONNABORTED') {
      console.error('⏳ Request timeout (Render cold start)');
    }

    return Promise.reject(error);
  }
);

// ===================== DEBUG LOG =====================
console.log('🌐 Axios Config:');
console.log('👉 Base URL:', axiosInstance.defaults.baseURL);
console.log('👉 Mode:', isProduction ? 'Production' : 'Development');

export default axiosInstance;
//fixingthe codes
