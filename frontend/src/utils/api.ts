import axios from 'axios';
import type { AuthResponse, User, LearningEntry, DashboardSummary, ClassInfo, StudentSummary, StudentDetail, CollegeOverview, VacRefundRequest } from '../types';

/** Base backend origin without trailing slash */
export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
const API_URL = BACKEND_URL + '/api/v1';

/** Build full certificate URL */
export const getCertificateUrl = (certPath: string | null | undefined): string | null => {
  if (!certPath) return null;
  if (certPath.startsWith('http')) {
    // Fix existing Cloudinary PDF URLs that may have been uploaded with wrong resource_type.
    if (certPath.includes('res.cloudinary.com') && certPath.toLowerCase().endsWith('.pdf')) {
      return certPath.replace('/image/upload/', '/raw/upload/');
    }
    return certPath;
  }
  return `${BACKEND_URL}${certPath}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${token}` } as any;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
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
      if (isAuthEndpoint) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return api(originalRequest); })
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
  signup: async (data: {
    firstName: string; lastName: string; email: string; password: string;
    role?: string; gender?: string; collegeName?: string; department?: string;
    className?: string; rollNumber?: string;
    yearOfStudy?: string; assignedClass?: string;
  }): Promise<AuthResponse> => {
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
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
  refresh: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  sendVerification: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/send-verification');
    return response.data;
  },
};

export const entriesAPI = {
  create: async (data: FormData): Promise<LearningEntry> => {
    const response = await api.post('/entries', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  getAll: async (filters?: { domain?: string; platform?: string; startDate?: string; endDate?: string; search?: string }): Promise<LearningEntry[]> => {
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
    const response = await api.put(`/entries/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/entries/${id}`);
  },
  extractCertificate: async (file: File): Promise<{
    extracted: {
      title?: string;
      platform?: string;
      description?: string;
      skills?: string[];
      domain?: string;
    } | null;
    reason?: string;
  }> => {
    const formData = new FormData();
    formData.append('certificate', file);
    const response = await api.post('/entries/extract-certificate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
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

export const adminAPI = {
  getOverview: async (): Promise<CollegeOverview> => {
    const response = await api.get('/admin/overview');
    return response.data;
  },
  getClasses: async (): Promise<ClassInfo[]> => {
    const response = await api.get('/admin/classes');
    return response.data;
  },
  getStudentsByClass: async (className: string): Promise<StudentSummary[]> => {
    const response = await api.get(`/admin/classes/${encodeURIComponent(className)}/students`);
    return response.data;
  },
  getStudentDetail: async (studentId: string): Promise<StudentDetail> => {
    const response = await api.get(`/admin/students/${studentId}`);
    return response.data;
  },
};

export const userAPI = {
  exportData: async (format: 'json' | 'csv'): Promise<void> => {
    const response = await api.get('/users/export', { params: { format }, responseType: 'blob' });
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
  deleteProfile: async (): Promise<void> => {
    await api.delete('/users/profile');
  },
};
export const vacAPI = {
  // Student
  submitRequest: async (data: FormData): Promise<VacRefundRequest> => {
    const response = await api.post('/vac/requests', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getMyRequests: async (): Promise<VacRefundRequest[]> => {
    const response = await api.get('/vac/my-requests');
    return response.data;
  },

  // VAC Incharge
  getPendingRequests: async (): Promise<VacRefundRequest[]> => {
    const response = await api.get('/vac/pending');
    return response.data;
  },
  getCompletedRequests: async (): Promise<VacRefundRequest[]> => {
    const response = await api.get('/vac/completed');
    return response.data;
  },
  approveRequest: async (id: string): Promise<VacRefundRequest> => {
    const response = await api.patch(`/vac/requests/${id}/approve`);
    return response.data;
  },
  rejectRequest: async (id: string, rejectionReason: string): Promise<VacRefundRequest> => {
    const response = await api.patch(`/vac/requests/${id}/reject`, { rejectionReason });
    return response.data;
  },
};

export default api;
