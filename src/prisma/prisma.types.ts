/**
 * Local type definitions for Prisma enums and models
 * This file allows the code to compile without generating Prisma client
 * In production, these types will match the actual Prisma generated types
 */

// User/Account enums
export type UserRole = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

// Preferences enums
export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type Language = 'EN' | 'FR' | 'ES';

// CRM enums
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
export type Temperature = 'HOT' | 'WARM' | 'COLD';
export type FeedbackType = 'COMPLAINT' | 'SUGGESTION' | 'PRAISE' | 'QUESTION' | 'GENERAL';
export type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// Alert enums
export type AlertType = 'PAYMENT' | 'HANDOFF' | 'SYSTEM' | 'CUSTOM';
export type AlertStatus = 'OPEN' | 'PENDING' | 'RESOLVED';
export type AlertPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// Channel enum
export type Channel = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'EMAIL' | 'WEB';
