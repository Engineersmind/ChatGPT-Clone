import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // only needed if backend uses cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // make sure you store JWT here after login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API functions
export const registerUser = (payload) => apiClient.post('/api/auth/register', payload);
export const loginUser = (payload) => apiClient.post('/api/auth/login', payload);
export const logoutUser = () => apiClient.post('/api/auth/logout');
export const updateUserPlan = (pro) => apiClient.patch('/api/auth/plan', { pro: pro ? 1 : 0 });
export const resetPassword = ({ email, password, token }) =>
  apiClient.put('/api/auth/password', { email, password, token });

export default apiClient;
