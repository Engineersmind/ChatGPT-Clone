import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = (payload) => apiClient.post('/api/auth/register', payload);
export const loginUser = (payload) => apiClient.post('/api/auth/login', payload);
export const logoutUser = () => apiClient.post('/api/auth/logout');
export const updateUserPlan = (pro) => apiClient.patch('/api/auth/plan', { pro: pro ? 1 : 0 });
export const resetPassword = ({ email, password, token }) =>
  apiClient.put('/api/auth/password', { email, password, token });

export default apiClient;
