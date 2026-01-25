// Re-export Prisma types for use in services
export { PrismaService } from './prisma.service';

// Type definitions that match Prisma enums
export type Channel = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'EMAIL' | 'WEB';
export type MessageDirection = 'IN' | 'OUT';
export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type ClientStatus = 'ACTIVE' | 'SUSPENDED';
export type RoutingStatus = 'RECEIVED' | 'FORWARDED' | 'FAILED';
export type UserRole = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type Language = 'EN' | 'FR' | 'ES';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
export type Temperature = 'HOT' | 'WARM' | 'COLD';
export type FeedbackType = 'COMPLAINT' | 'SUGGESTION' | 'PRAISE' | 'QUESTION' | 'GENERAL';
export type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type AlertType = 'PAYMENT' | 'HANDOFF' | 'SYSTEM' | 'CUSTOM';
export type AlertStatus = 'OPEN' | 'PENDING' | 'RESOLVED';
export type AlertPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// Enum objects for runtime use
export const Channel = {
  WHATSAPP: 'WHATSAPP' as const,
  INSTAGRAM: 'INSTAGRAM' as const,
  FACEBOOK: 'FACEBOOK' as const,
  EMAIL: 'EMAIL' as const,
  WEB: 'WEB' as const,
};

export const MessageDirection = {
  IN: 'IN' as const,
  OUT: 'OUT' as const,
};

export const ConversationStatus = {
  OPEN: 'OPEN' as const,
  PENDING: 'PENDING' as const,
  CLOSED: 'CLOSED' as const,
};

export const ClientStatus = {
  ACTIVE: 'ACTIVE' as const,
  SUSPENDED: 'SUSPENDED' as const,
};

export const RoutingStatus = {
  RECEIVED: 'RECEIVED' as const,
  FORWARDED: 'FORWARDED' as const,
  FAILED: 'FAILED' as const,
};
