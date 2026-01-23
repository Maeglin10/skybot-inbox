import { mockDelay, type MockListResponse } from '../api.mock';
import type { Lead, Feedback, LeadStatus, Temperature } from '../types/crm';

const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Sarah Connor',
    company: 'SkyNet Corp',
    email: 'sarah@skynet.com',
    phone: '+1 555 000 1111',
    status: 'NEW',
    temperature: 'HOT',
    channel: 'WHATSAPP',
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tags: ['urgent', 'enterprise']
  },
  {
    id: 'lead-2',
    name: 'John Doe',
    company: 'Acme Inc.',
    status: 'CONTACTED',
    temperature: 'WARM',
    channel: 'EMAIL',
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    tags: ['referral']
  },
  {
    id: 'lead-3',
    name: 'Jane Smith',
    company: 'Tech Solutions',
    status: 'QUALIFIED',
    temperature: 'HOT',
    channel: 'INSTAGRAM',
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    tags: []
  },
  {
    id: 'lead-4',
    name: 'Mike Myers',
    status: 'LOST',
    temperature: 'COLD',
    channel: 'OTHER',
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(),
    tags: ['price-too-high']
  },
  {
    id: 'lead-5',
    name: 'Ellen Ripley',
    company: 'Weyland-Yutani',
    status: 'WON',
    temperature: 'HOT',
    channel: 'EMAIL',
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 150).toISOString(),
    tags: ['vip']
  }
];

const MOCK_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-1',
    customerName: 'Sarah Connor',
    rating: 5,
    snippet: 'Great service, very fast response time.',
    fullText: 'I really appreciated how quickly the bot forwarded me to a human agent when I asked. The transition was seamless.',
    channel: 'WHATSAPP',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    linkedLeadId: 'lead-1'
  },
  {
    id: 'fb-2',
    customerName: 'John Doe',
    rating: 3,
    snippet: 'Bot was a bit repetitive.',
    fullText: 'The AI kept asking me for my order number even though I had already provided it in the previous message.',
    channel: 'EMAIL',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    linkedLeadId: 'lead-2'
  },
  {
    id: 'fb-3',
    customerName: 'Anonymous User',
    rating: 4,
    snippet: 'Overall good experience.',
    fullText: 'Easy to use, handled my return request efficiently.',
    channel: 'INSTAGRAM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

export async function fetchLeads(status?: LeadStatus | 'ALL'): Promise<MockListResponse<Lead>> {
  await mockDelay(500);
  let items = [...MOCK_LEADS];
  if (status && status !== 'ALL') {
    items = items.filter(l => l.status === status);
  }
  return { items, total: items.length };
}

export async function fetchLead(id: string): Promise<Lead | null> {
  await mockDelay(300);
  return MOCK_LEADS.find(l => l.id === id) || null;
}

export async function fetchFeedbacks(): Promise<MockListResponse<Feedback>> {
  await mockDelay(500);
  return { items: [...MOCK_FEEDBACKS], total: MOCK_FEEDBACKS.length };
}

export async function fetchFeedback(id: string): Promise<Feedback | null> {
  await mockDelay(300);
  return MOCK_FEEDBACKS.find(f => f.id === id) || null;
}
