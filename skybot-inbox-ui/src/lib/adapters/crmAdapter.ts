import type { Lead, Feedback, LeadStatus } from '../types/crm';
import { apiGetClient, apiPostClient, apiPatchClient } from '../api.client';

type ListResponse<T> = {
  items: T[];
  total: number;
};

import { apiClientFetch } from '../api.client';

// Get clientKey from environment or use a default for development
const getClientKey = () => {
  return typeof window !== 'undefined'
    ? localStorage.getItem('clientKey') || 'demo-client'
    : 'demo-client';
};

async function apiFetch(path: string, init: RequestInit = {}) {
  // Use apiClientFetch to ensure auth headers are included
  return apiClientFetch(path, {
    ...init,
    headers: {
      ...init.headers,
      'x-client-key': getClientKey(),
    },
  });
}

export async function fetchLeads(status?: LeadStatus | 'ALL'): Promise<ListResponse<Lead>> {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  return apiFetch(`/crm/leads${query}`);
}

export async function fetchLead(id: string): Promise<Lead | null> {
  try {
    return await apiFetch(`/crm/leads/${id}`);
  } catch (error) {
    console.error('Failed to fetch lead:', error);
    return null;
  }
}

export async function fetchFeedbacks(): Promise<ListResponse<Feedback>> {
  return apiFetch('/crm/feedbacks');
}

export async function fetchFeedback(id: string): Promise<Feedback | null> {
  try {
    return await apiFetch(`/crm/feedbacks/${id}`);
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return null;
  }
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  return apiFetch('/crm/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  return apiFetch(`/crm/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id: string): Promise<void> {
  await apiFetch(`/crm/leads/${id}`, {
    method: 'DELETE',
  });
}

export async function createFeedback(data: Partial<Feedback>): Promise<Feedback> {
  return apiFetch('/crm/feedbacks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFeedback(id: string, data: Partial<Feedback>): Promise<Feedback> {
  return apiFetch(`/crm/feedbacks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteFeedback(id: string): Promise<void> {
  await apiFetch(`/crm/feedbacks/${id}`, {
    method: 'DELETE',
  });
}
