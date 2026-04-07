import axios from 'axios';
import type { AuthResponse, User, LearningEntry, DashboardSummary } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '') + '/api/v1';

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
    // Axios v1: config.headers may be undefined, a plain object, or an AxiosHeaders instance.
    // Prefer using `.set()` when available to ensure the header is actually sent.
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${token}`,
      } as any;
    }
  }
  return config;
});

// Handle 401 errors with automatic token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url: string = originalRequest.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/refresh');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { token, refreshToken: newRefreshToken } = await authAPI.refresh(refreshToken);
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
  resendVerification: async (): Promise<{ message: string; token: string }> => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },
  refresh: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    // Use raw axios or a separate instance to avoid interceptor loops if refresh itself fails
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
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
    return response.data.data || response.data;
  },
  getPage: async (filters: any, cursor?: string, limit = 20): Promise<{ data: LearningEntry[], nextCursor: string | null }> => {
    const response = await api.get('/entries', { params: { ...filters, cursor, limit } });
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

export const userAPI = {
  exportData: async (format: 'json' | 'csv'): Promise<void> => {
    const response = await api.get('/users/export', {
      params: { format },
      responseType: 'blob',
    });
    
    // Create a temporary link element to trigger the download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `learntrace-export-${date}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
