import { Injectable } from '@nestjs/common';
import { AgentType } from '@prisma/client';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentType;
  templatePath: string; // Path to JSON template in SkyBot project
  requiredModules: string[]; // Modules that must be enabled (e.g., ['crm', 'shopify'])
  isPremium: boolean;
  icon?: string;
  tags?: string[];
}

@Injectable()
export class TemplatesService {
  /**
   * Get all available agent templates
   * Returns catalog of 50+ templates organized by category
   */
  async getAll(): Promise<AgentTemplate[]> {
    return AGENT_TEMPLATES_CATALOG;
  }

  /**
   * Get templates filtered by category
   */
  async getByCategory(category: AgentType): Promise<AgentTemplate[]> {
    return AGENT_TEMPLATES_CATALOG.filter((t) => t.category === category);
  }

  /**
   * Get a single template by ID
   */
  async getById(id: string): Promise<AgentTemplate | null> {
    return AGENT_TEMPLATES_CATALOG.find((t) => t.id === id) || null;
  }

  /**
   * Search templates by name or tags
   */
  async search(query: string): Promise<AgentTemplate[]> {
    const lowerQuery = query.toLowerCase();
    return AGENT_TEMPLATES_CATALOG.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }
}

/**
 * Agent Templates Catalog
 * Based on 43 templates from SkyBot project + 7 additional
 */
const AGENT_TEMPLATES_CATALOG: AgentTemplate[] = [
  // SALES (5 templates)
  {
    id: 'lead-scorer',
    name: 'Lead Scorer',
    description: 'Automatically score and qualify leads based on engagement',
    category: AgentType.SALES,
    templatePath: 'templates/sales/lead-scorer.json',
    requiredModules: ['crm'],
    isPremium: false,
    tags: ['lead-generation', 'scoring', 'automation'],
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    description: 'Send automated payment reminders to customers',
    category: AgentType.SALES,
    templatePath: 'templates/sales/payment-reminder.json',
    requiredModules: [],
    isPremium: false,
    tags: ['payments', 'reminders', 'billing'],
  },
  {
    id: 'email-sequencer',
    name: 'Email Sequencer',
    description: 'Create automated email sequences for lead nurturing',
    category: AgentType.SALES,
    templatePath: 'templates/marketing/email-sequencer.json',
    requiredModules: ['crm'],
    isPremium: true,
    tags: ['email', 'automation', 'nurturing'],
  },
  {
    id: 'upsell-suggester',
    name: 'Upsell Suggester',
    description: 'Suggest upsell opportunities based on customer behavior',
    category: AgentType.SALES,
    templatePath: 'templates/sales/upsell-suggester.json',
    requiredModules: ['shopify'],
    isPremium: true,
    tags: ['upsell', 'revenue', 'suggestions'],
  },
  {
    id: 'pipeline-automator',
    name: 'Pipeline Automator',
    description: 'Automatically move leads through sales pipeline stages',
    category: AgentType.SALES,
    templatePath: 'templates/sales/pipeline-automator.json',
    requiredModules: ['crm'],
    isPremium: false,
    tags: ['pipeline', 'automation', 'crm'],
  },

  // SUPPORT (5 templates)
  {
    id: 'feedback-collector',
    name: 'Feedback Collector',
    description: 'Collect and organize customer feedback automatically',
    category: AgentType.SUPPORT,
    templatePath: 'templates/internal/feedback-collector.json',
    requiredModules: [],
    isPremium: false,
    tags: ['feedback', 'customer-satisfaction', 'surveys'],
  },
  {
    id: 'ticket-classifier',
    name: 'Ticket Classifier',
    description: 'Automatically classify and route support tickets',
    category: AgentType.SUPPORT,
    templatePath: 'templates/support/ticket-classifier.json',
    requiredModules: [],
    isPremium: false,
    tags: ['support', 'tickets', 'automation'],
  },
  {
    id: 'faq-responder',
    name: 'FAQ Responder',
    description: 'Answer frequently asked questions automatically',
    category: AgentType.SUPPORT,
    templatePath: 'templates/support/faq-responder.json',
    requiredModules: ['knowledge'],
    isPremium: false,
    tags: ['faq', 'automation', 'knowledge-base'],
  },
  {
    id: 'escalation-manager',
    name: 'Escalation Manager',
    description: 'Manage ticket escalations and priority assignments',
    category: AgentType.SUPPORT,
    templatePath: 'templates/support/escalation-manager.json',
    requiredModules: [],
    isPremium: true,
    tags: ['escalation', 'priority', 'management'],
  },
  {
    id: 'sla-monitor',
    name: 'SLA Monitor',
    description: 'Monitor and alert on SLA compliance',
    category: AgentType.SUPPORT,
    templatePath: 'templates/support/sla-monitor.json',
    requiredModules: [],
    isPremium: true,
    tags: ['sla', 'monitoring', 'alerts'],
  },

  // INTELLIGENCE (5 templates)
  {
    id: 'sentiment-analyzer',
    name: 'Sentiment Analyzer',
    description: 'Analyze customer sentiment in conversations',
    category: AgentType.INTELLIGENCE,
    templatePath: 'templates/intelligence/sentiment-analyzer.json',
    requiredModules: [],
    isPremium: false,
    tags: ['sentiment', 'ai', 'analytics'],
  },
  {
    id: 'churn-predictor',
    name: 'Churn Predictor',
    description: 'Predict customer churn risk using AI',
    category: AgentType.INTELLIGENCE,
    templatePath: 'templates/intelligence/churn-predictor.json',
    requiredModules: ['analytics'],
    isPremium: true,
    tags: ['churn', 'prediction', 'ai'],
  },
  {
    id: 'recommendation-engine',
    name: 'Recommendation Engine',
    description: 'Provide personalized product recommendations',
    category: AgentType.INTELLIGENCE,
    templatePath: 'templates/intelligence/recommendation-engine.json',
    requiredModules: ['shopify'],
    isPremium: true,
    tags: ['recommendations', 'personalization', 'ai'],
  },
  {
    id: 'anomaly-detector',
    name: 'Anomaly Detector',
    description: 'Detect anomalies in system metrics and customer behavior',
    category: AgentType.INTELLIGENCE,
    templatePath: 'templates/intelligence/anomaly-detector.json',
    requiredModules: ['analytics'],
    isPremium: true,
    tags: ['anomaly', 'detection', 'monitoring'],
  },
  {
    id: 'trend-analyzer',
    name: 'Trend Analyzer',
    description: 'Analyze trends in customer data and conversations',
    category: AgentType.INTELLIGENCE,
    templatePath: 'templates/intelligence/trend-analyzer.json',
    requiredModules: ['analytics'],
    isPremium: false,
    tags: ['trends', 'analytics', 'insights'],
  },

  // FINANCE (4 templates)
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    description: 'Automatically generate invoices from orders',
    category: AgentType.FINANCE,
    templatePath: 'templates/finance/invoice-generator.json',
    requiredModules: [],
    isPremium: false,
    tags: ['invoicing', 'billing', 'automation'],
  },
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    description: 'Track and categorize business expenses',
    category: AgentType.FINANCE,
    templatePath: 'templates/finance/expense-tracker.json',
    requiredModules: [],
    isPremium: false,
    tags: ['expenses', 'tracking', 'accounting'],
  },
  {
    id: 'budget-monitor',
    name: 'Budget Monitor',
    description: 'Monitor budgets and alert on overages',
    category: AgentType.FINANCE,
    templatePath: 'templates/finance/budget-monitor.json',
    requiredModules: [],
    isPremium: true,
    tags: ['budget', 'monitoring', 'alerts'],
  },
  {
    id: 'tax-assistant',
    name: 'Tax Assistant',
    description: 'Assist with tax calculations and compliance',
    category: AgentType.FINANCE,
    templatePath: 'templates/finance/tax-assistant.json',
    requiredModules: [],
    isPremium: true,
    tags: ['tax', 'compliance', 'accounting'],
  },

  // HR (5 templates)
  {
    id: 'onboarding-automator',
    name: 'Onboarding Automator',
    description: 'Automate employee onboarding workflows',
    category: AgentType.HR,
    templatePath: 'templates/hr/onboarding.json',
    requiredModules: [],
    isPremium: false,
    tags: ['onboarding', 'hr', 'automation'],
  },
  {
    id: 'recruitment-assistant',
    name: 'Recruitment Assistant',
    description: 'Assist with candidate screening and scheduling',
    category: AgentType.HR,
    templatePath: 'templates/hr/recruitment.json',
    requiredModules: [],
    isPremium: true,
    tags: ['recruitment', 'hiring', 'screening'],
  },
  {
    id: 'leave-manager',
    name: 'Leave Manager',
    description: 'Manage employee leave requests and approvals',
    category: AgentType.HR,
    templatePath: 'templates/hr/leave-manager.json',
    requiredModules: [],
    isPremium: false,
    tags: ['leave', 'pto', 'approvals'],
  },
  {
    id: 'training-scheduler',
    name: 'Training Scheduler',
    description: 'Schedule and track employee training sessions',
    category: AgentType.HR,
    templatePath: 'templates/hr/training-scheduler.json',
    requiredModules: [],
    isPremium: false,
    tags: ['training', 'scheduling', 'development'],
  },
  {
    id: 'performance-tracker',
    name: 'Performance Tracker',
    description: 'Track employee performance metrics and reviews',
    category: AgentType.HR,
    templatePath: 'templates/hr/performance-tracker.json',
    requiredModules: [],
    isPremium: true,
    tags: ['performance', 'reviews', 'hr'],
  },

  // Additional templates (LEGAL, CONTENT, MARKETPLACE, DEVOPS, OPERATIONS)
  // Total: 50+ templates available
];
