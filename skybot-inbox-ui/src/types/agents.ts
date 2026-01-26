
export interface Agent {
  id: string;
  externalId: string;
  name: string;
  type: AgentType;
  category: AgentCategory;
  description?: string;
  status: AgentStatus;
  version: string;
  isActive: boolean;
  lastExecutedAt?: Date;
  executionCount: number;
  errorCount: number;
  avgResponseTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentType =
  | 'SALES'
  | 'SUPPORT'
  | 'ANALYTICS'
  | 'MARKETING'
  | 'HR'
  | 'FINANCE'
  | 'LEGAL'
  | 'OPERATIONS'
  | 'DEVOPS'
  | 'CONTENT'
  | 'INTERNAL'
  | 'CUSTOM';

export type AgentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DEPLOYING'
  | 'ERROR'
  | 'MAINTENANCE';

export type AgentCategory = 'CORE' | 'SPECIALIZED' | 'TEMPLATE';

export interface AgentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AgentType;
  version: string;
  iconUrl?: string;
  screenshots: string[];
  useCases: string[];
  isPremium: boolean;
  pricing?: number;
  installCount: number;
  avgRating?: number;
}
