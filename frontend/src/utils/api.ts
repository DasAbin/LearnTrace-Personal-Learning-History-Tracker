import axios from 'axios';
import type { AuthResponse, User, LearningEntry, DashboardSummary } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: async (data: { firstName: string; lastName: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const entriesAPI = {
  create: async (data: FormData): Promise<LearningEntry> => {
    const response = await api.post('/entries', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getAll: async (filters?: {
    domain?: string;
    platform?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<LearningEntry[]> => {
    const response = await api.get('/entries', { params: filters });
    return response.data;
  },
  getById: async (id: string): Promise<LearningEntry> => {
    const response = await api.get(`/entries/${id}`);
    return response.data;
  },
  update: async (id: string, data: FormData): Promise<LearningEntry> => {
    const response = await api.put(`/entries/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/entries/${id}`);
  },
};

export const analyticsAPI = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },
  getDomainDistribution: async (): Promise<Record<string, number>> => {
    const response = await api.get('/analytics/domain-distribution');
    return response.data;
  },
  getYearlyTrend: async (): Promise<Record<string, number>> => {
    const response = await api.get('/analytics/yearly-trend');
    return response.data;
  },
  getPlatformUsage: async (): Promise<Record<string, number>> => {
    const response = await api.get('/analytics/platform-usage');
    return response.data;
  },
  getSkillsFrequency: async (): Promise<Record<string, number>> => {
    const response = await api.get('/analytics/skills-frequency');
    return response.data;
  },
  getHeatmap: async (): Promise<Record<string, { count: number; hours: number }>> => {
    const response = await api.get('/analytics/heatmap');
    return response.data;
  },
};

export default api;
