import axios from 'axios';

const apiBaseUrl = import.meta.env.PROD 
  ? 'https://conductor.bitworkspace.kr'
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Automatically add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { apiBaseUrl };
