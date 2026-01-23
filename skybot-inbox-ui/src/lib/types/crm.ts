export type Temperature = 'HOT' | 'WARM' | 'COLD';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
export type Channel = 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM' | 'OTHER';

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  temperature: Temperature;
  channel: Channel;
  lastInteractionAt: string;
  assignedTo?: string;
  createdAt: string;
  tags: string[];
}

export interface Feedback {
  id: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1-5
  snippet: string;
  fullText: string;
  channel: Channel;
  createdAt: string;
  linkedLeadId?: string;
}
