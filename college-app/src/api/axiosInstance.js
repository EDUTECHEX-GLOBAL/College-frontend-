// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// ✅ Helper function to clear ALL old user data
const clearAllUserData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('studentType');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('profileCompleted');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('testingActiveSections');
};

// ✅ Request interceptor - always reads FRESH token on every request
// All 100+ files automatically get correct user's token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // ✅ always fresh

    console.log('🔍 Axios Request Interceptor:');
    console.log('   📝 Method:', config.method.toUpperCase());
    console.log('   📝 URL:', config.url);
    console.log('   📝 Full URL:', config.baseURL + config.url);
    console.log('   🔑 Token:', token ? 'Present ✅' : 'Missing ❌');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('   ✅ Authorization header added');
      console.log('   📦 Token preview:', token.substring(0, 30) + '...');
    } else {
      console.warn('   ⚠️ No token found in localStorage');
      console.warn('   ⚠️ This request will fail if authentication is required');
    }

    if (config.method === 'put' || config.method === 'post') {
      console.log('   📦 Request body:', config.data);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response Successful:');
    console.log('   📝 URL:', response.config.url);
    console.log('   📊 Status:', response.status);
    console.log('   ✅ Success:', response.data.success);

    if (response.config.method === 'get') {
      console.log('   📥 Data received:', Object.keys(response.data).join(', '));
    } else if (response.config.method === 'put' || response.config.method === 'post') {
      console.log('   💾 Save successful');
    }

    return response;
  },
  (error) => {
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const status = error.response?.status;
    const message = error.response?.data?.message;

    console.error('❌ Response Error:');
    console.error('   📝 Method:', method);
    console.error('   📝 URL:', url);
    console.error('   📊 Status:', status);
    console.error('   💬 Message:', message);
    console.error('   📦 Error Data:', error.response?.data);

    if (
      url?.includes('/login') ||
      url?.includes('/register') ||
      url?.includes('/signin') ||
      url?.includes('/signup')
    ) {
      console.log('🔐 Auth endpoint failed - not clearing token');
      return Promise.reject(error);
    }

    if (status === 401) {
      console.error('❌ 401 Unauthorized - Token is invalid or expired');

      if (message?.includes('token') || message?.includes('authorization')) {
        console.error('🔑 Token issue detected:', message);
      }

      const currentPath = window.location.pathname;
      if (!currentPath.includes('/sign-in') && !currentPath.includes('/login')) {
        console.log('🧹 Clearing ALL user data from localStorage');
        clearAllUserData(); // ✅ clears everything
        console.log('🔄 Redirecting to sign-in page');
        window.location.href = '/sign-in';
      }
    }

    if (status === 404) {
      console.error('❌ 404 Not Found:', url);
      console.error('   💡 Check if the backend route is registered in server.js');
    }

    if (status === 500) {
      console.error('❌ 500 Server Error on endpoint:', url);
      console.error('   💡 Check backend server logs for detailed error');
    }

    if (status === 400) {
      console.error('❌ 400 Bad Request:', message);
      console.error('   💡 Check request payload format');
    }

    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request Timeout');
      console.error('   💡 Check if backend server is running');
    }

    if (error.message === 'Network Error') {
      console.error('❌ Network Error - Cannot connect to server');
      console.error('   💡 Check if backend server is running on:', axiosInstance.defaults.baseURL);
    }

    return Promise.reject(error);
  }
);

// ✅ Export clearAllUserData so SignIn.js and FirstYearAccount.js can use it
export { clearAllUserData };

console.log('🌐 Axios Instance Configured:');
console.log('   Base URL:', axiosInstance.defaults.baseURL);
console.log('   Timeout:', axiosInstance.defaults.timeout + 'ms');

export default axiosInstance;