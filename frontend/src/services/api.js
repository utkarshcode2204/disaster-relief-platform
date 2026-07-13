import axios from 'axios';

const api = axios.create({
  baseURL: 'https://disaster-relief-backend-oale.onrender.com/api',
});

// Attach JWT token automatically if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;