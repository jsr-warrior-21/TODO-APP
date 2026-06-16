import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if not already on login/register page
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const register = (userData) => api.post('/users/register', userData);

// User endpoints
export const getAllUsers = () => api.get('/users/');
export const getUser = (userId) => api.get(`/users/${userId}`);

// Task endpoints
export const getAllTasks = () => api.get('/get');
export const createTask = (taskData) => api.post('/create', taskData);
export const updateTask = (taskId, taskData) => api.put(`/update/${taskId}`, taskData);
export const deleteTask = (taskId) => api.delete(`/delete/${taskId}`);
export const markImportant = (taskId) => api.patch(`/${taskId}/important`);
export const getOverdueTasks = () => api.get('/overdue');
export const getImportantTasks = () => api.get('/important');

export default api;