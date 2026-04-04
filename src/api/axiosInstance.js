// api/axiosInstance.js
import axios from 'axios';

// Create the Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', // ✅ Added fallback
  timeout: 15000, // ✅ Increased timeout for testing data (was 10000)
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json', // ✅ Added Content-Type
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
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
    
    // Log request body for PUT/POST requests
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

// Response interceptor to handle errors
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

    // Do not clear token on auth endpoints - let them fail normally
    if (
      url?.includes('/login') ||
      url?.includes('/register') ||
      url?.includes('/signin') ||
      url?.includes('/signup')
    ) {
      console.log('🔐 Auth endpoint failed - not clearing token');
      return Promise.reject(error);
    }

    // For protected routes with 401 - clear storage and redirect
    if (status === 401) {
      console.error('❌ 401 Unauthorized - Token is invalid or expired');
      
      // Check if error is due to missing/invalid token
      if (message?.includes('token') || message?.includes('authorization')) {
        console.error('🔑 Token issue detected:', message);
      }
      
      // Only redirect if not already on sign-in page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/sign-in') && !currentPath.includes('/login')) {
        console.log('🧹 Clearing credentials from localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('studentType');
        localStorage.removeItem('testingActiveSections'); // ✅ Added testing sections cleanup
        
        console.log('🔄 Redirecting to sign-in page');
        window.location.href = '/sign-in';
      }
    }

    // Handle 404 errors
    if (status === 404) {
      console.error('❌ 404 Not Found - Endpoint does not exist:', url);
      console.error('   💡 Check if the backend route is registered in server.js');
      console.error('   💡 Verify the URL path is correct');
    }

    // Handle 500 errors
    if (status === 500) {
      console.error('❌ 500 Server Error on endpoint:', url);
      console.error('   💡 Check backend server logs for detailed error');
      console.error('   💡 Verify database connection is working');
    }

    // Handle 400 errors (Bad Request)
    if (status === 400) {
      console.error('❌ 400 Bad Request:', message);
      console.error('   💡 Check request payload format');
      console.error('   💡 Verify required fields are present');
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request Timeout - Server took too long to respond');
      console.error('   💡 Check if backend server is running');
      console.error('   💡 Verify baseURL is correct:', axiosInstance.defaults.baseURL);
    }

    if (error.message === 'Network Error') {
      console.error('❌ Network Error - Cannot connect to server');
      console.error('   💡 Check if backend server is running on:', axiosInstance.defaults.baseURL);
      console.error('   💡 Verify CORS settings on backend');
      console.error('   💡 Check firewall or antivirus blocking connection');
    }

    return Promise.reject(error);
  }
);

// ✅ Log base URL on load
console.log('🌐 Axios Instance Configured:');
console.log('   Base URL:', axiosInstance.defaults.baseURL);
console.log('   Timeout:', axiosInstance.defaults.timeout + 'ms');

export default axiosInstance;
