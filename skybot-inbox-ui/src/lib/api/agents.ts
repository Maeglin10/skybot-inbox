
import axios from 'axios';

// API Client Instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  // Simple token retrieval for demonstration
  // Adjust based on your Auth provider (e.g. NextAuth session)
  // For now, assume localStorage or cookies if needed, or rely on cookie-based auth
  let token = '';
  if (typeof window !== 'undefined') {
     token = localStorage.getItem('token') || '';
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = apiClient; // Export for custom calls if needed

// Agents API
export const agentsApi = {
  getAll: (filters?: any) =>
    apiClient.get('/api/agents', { params: filters }), // Prefixed /api assuming Next.js routes

  getOne: (id: string) =>
    apiClient.get(`/api/agents/${id}`),

  createFromTemplate: (data: { templateSlug: string; config?: any }) =>
    apiClient.post('/api/agents/from-template', data),

  toggleStatus: (id: string) =>
    apiClient.put(`/api/agents/${id}/toggle`),

  getStats: (id: string, period?: string) =>
    apiClient.get(`/api/agents/${id}/stats`, { params: { period } }),

  delete: (id: string) =>
    apiClient.delete(`/api/agents/${id}`),
};

// Templates API
export const templatesApi = {
  getAll: (filters?: any) =>
    apiClient.get('/api/templates', { params: filters }),

  getBySlug: (slug: string) =>
    apiClient.get(`/api/templates/${slug}`),
};

// Analytics API
export const analyticsApi = {
  getOverview: () =>
    apiClient.get('/api/analytics/agents/overview'),

  getPerformance: (id: string, period: string) =>
    apiClient.get(`/api/analytics/agents/${id}/performance`, {
      params: { period },
    }),

  getCosts: () =>
    apiClient.get('/api/analytics/costs'),
};
