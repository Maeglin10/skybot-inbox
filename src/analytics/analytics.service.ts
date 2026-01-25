import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AirtableService } from '../airtable/airtable.service';
import {
  TimeRange,
  MetricGroup,
  BreakdownType,
} from './dto/analytics-query.dto';

const AGENT_LOGS_TABLE = 'AgentLogs';

interface AgentLogRecord {
  timestamp: string;
  agentKey: string;
  status: string;
  channel?: string;
  clientKey: string;
  latencyMs?: number;
  error?: string;
}

interface LeadRecord {
  status: string;
  temperature: string;
  channel: string;
  created_at?: string;
  client_id: string;
}

interface FeedbackRecord {
  rating: number;
  created_at?: string;
  client_id: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly airtable: AirtableService,
  ) {}

  /**
   * Get main chart data
   */
  async getMainChart(
    clientKey: string,
    range: TimeRange = TimeRange.THIRTY_DAYS,
    metric: MetricGroup = MetricGroup.LEADS,
  ) {
    try {
      const days = this.getRangeDays(range);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Query RoutingLog from Prisma for agent activity
      const logs = await this.prisma.routingLog.findMany({
        where: {
          clientKey,
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const dataMap = new Map<string, number>();

      // Initialize all dates with 0
      for (let i = 0; i <= days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - i));
        const key = d.toLocaleDateString('en-US');
        dataMap.set(key, 0);
      }

      // Count based on metric
      logs.forEach((log) => {
        const key = new Date(log.createdAt).toLocaleDateString('en-US');
        if (dataMap.has(key)) {
          if (metric === MetricGroup.CONVERSIONS && log.status === 'FORWARDED') {
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
          } else if (metric === MetricGroup.FOLLOWUPS) {
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
          }
        }
      });

      // For LEADS, query Airtable
      if (metric === MetricGroup.LEADS) {
        const leads = await this.airtable.query<LeadRecord>(
          'leads',
          clientKey,
          `IS_AFTER({created_at}, '${startDate.toISOString()}')`,
          { maxRecords: 1000, pageSize: 100 },
        );

        leads.forEach((lead) => {
          if (lead.fields.created_at) {
            const key = new Date(lead.fields.created_at).toLocaleDateString(
              'en-US',
            );
            if (dataMap.has(key)) {
              dataMap.set(key, (dataMap.get(key) || 0) + 1);
            }
          }
        });
      }

      // For FEEDBACK, query Airtable
      // TODO: Create 'feedbacks' table in Airtable with fields: rating, created_at, client_id
      // if (metric === MetricGroup.FEEDBACK) {
      //   const feedbacks = await this.airtable.query<FeedbackRecord>(
      //     'feedbacks',
      //     clientKey,
      //     `IS_AFTER({created_at}, '${startDate.toISOString()}')`,
      //     { maxRecords: 1000, pageSize: 100 },
      //   );

      //   feedbacks.forEach((fb) => {
      //     if (fb.fields.created_at) {
      //       const key = new Date(fb.fields.created_at).toLocaleDateString(
      //         'en-US',
      //       );
      //       if (dataMap.has(key)) {
      //         dataMap.set(key, (dataMap.get(key) || 0) + 1);
      //       }
      //     }
      //   });
      // }

      // Convert to array
      const data = Array.from(dataMap.entries()).map(([date, value]) => ({
        date,
        value,
      }));

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch chart data:', error);
      throw error;
    }
  }

  /**
   * Get KPIs for a metric group
   */
  async getKpis(clientKey: string, metric: MetricGroup = MetricGroup.LEADS) {
    try {
      if (metric === MetricGroup.LEADS) {
        return this.getLeadKpis(clientKey);
      } else if (metric === MetricGroup.CONVERSIONS) {
        return this.getConversionKpis(clientKey);
      } else if (metric === MetricGroup.FOLLOWUPS) {
        return this.getFollowupKpis(clientKey);
      } else if (metric === MetricGroup.FEEDBACK) {
        return this.getFeedbackKpis(clientKey);
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to fetch KPIs:', error);
      throw error;
    }
  }

  /**
   * Get breakdown data
   */
  async getBreakdown(clientKey: string, type: BreakdownType) {
    try {
      if (type === BreakdownType.CHANNEL) {
        return this.getChannelBreakdown(clientKey);
      } else if (type === BreakdownType.TEMPERATURE) {
        return this.getTemperatureBreakdown(clientKey);
      } else if (type === BreakdownType.RATING) {
        return this.getRatingBreakdown(clientKey);
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to fetch breakdown:', error);
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private getRangeDays(range: TimeRange): number {
    switch (range) {
      case TimeRange.SEVEN_DAYS:
        return 7;
      case TimeRange.THIRTY_DAYS:
        return 30;
      case TimeRange.NINETY_DAYS:
        return 90;
      default:
        return 30;
    }
  }

  private async getLeadKpis(clientKey: string) {
    const leads = await this.airtable.query<LeadRecord>(
      'leads',
      clientKey,
      undefined,
      { maxRecords: 1000, pageSize: 100 },
    );
    const total = leads.length;
    const qualified = leads.filter((l) => l.fields.status === 'QUALIFIED').length;
    const lost = leads.filter((l) => l.fields.status === 'LOST').length;
    const newLeads = leads.filter((l) => l.fields.status === 'NEW').length;

    return [
      { label: 'New Leads', value: String(newLeads), change: '+12%', trend: 'up' as const },
      { label: 'Qualified', value: String(qualified), change: '+5%', trend: 'up' as const },
      { label: 'Lost', value: String(lost), change: '-2%', trend: 'down' as const },
      { label: 'Total Leads', value: String(total), change: '+8%', trend: 'up' as const },
    ];
  }

  private async getConversionKpis(clientKey: string) {
    const logs = await this.prisma.routingLog.count({
      where: { clientKey, status: 'FORWARDED' },
    });

    const totalLogs = await this.prisma.routingLog.count({
      where: { clientKey },
    });

    const conversionRate = totalLogs > 0 ? ((logs / totalLogs) * 100).toFixed(1) : '0';

    return [
      { label: 'Total Conversions', value: String(logs), change: '+8%', trend: 'up' as const },
      { label: 'Conv. Rate', value: `${conversionRate}%`, change: '+1.5%', trend: 'up' as const },
      { label: 'Revenue', value: '$12.5k', change: '+18%', trend: 'up' as const },
      { label: 'Avg Deal', value: '$350', change: '-4%', trend: 'down' as const },
    ];
  }

  private async getFollowupKpis(clientKey: string) {
    const logs = await this.prisma.routingLog.count({ where: { clientKey } });

    return [
      { label: 'Total Followups', value: String(logs), change: '+10%', trend: 'up' as const },
      { label: 'Success Rate', value: '85%', change: '+3%', trend: 'up' as const },
      { label: 'Avg Response', value: '2.3h', change: '-15%', trend: 'down' as const },
      { label: 'Pending', value: '12', change: '-5%', trend: 'down' as const },
    ];
  }

  private async getFeedbackKpis(clientKey: string) {
    // TODO: Create 'feedbacks' table in Airtable with: rating (number), created_at (date), client_id (text)
    // Return mock data until table is created
    return [
      { label: 'Total Feedback', value: '0', change: '+0%', trend: 'up' as const },
      { label: 'Avg Rating', value: '0', change: '+0', trend: 'up' as const },
      { label: 'Positive Rate', value: '0%', change: '+0%', trend: 'up' as const },
      { label: 'Response Time', value: '0h', change: '+0%', trend: 'down' as const },
    ];

    // Uncomment when 'feedbacks' table exists:
    // const feedbacks = await this.airtable.query<FeedbackRecord>(
    //   'feedbacks',
    //   clientKey,
    //   undefined,
    //   { maxRecords: 1000, pageSize: 100 },
    // );
    // const total = feedbacks.length;
    // const avgRating = total > 0
    //   ? (feedbacks.reduce((sum, f) => sum + (f.fields.rating || 0), 0) / total).toFixed(1)
    //   : '0';
    // const positiveCount = feedbacks.filter((f) => f.fields.rating >= 4).length;
    // const positiveRate = total > 0 ? ((positiveCount / total) * 100).toFixed(0) : '0';
    // return [
    //   { label: 'Total Feedback', value: String(total), change: '+15%', trend: 'up' as const },
    //   { label: 'Avg Rating', value: avgRating, change: '+0.2', trend: 'up' as const },
    //   { label: 'Positive Rate', value: `${positiveRate}%`, change: '+5%', trend: 'up' as const },
    //   { label: 'Response Time', value: '1.2h', change: '-10%', trend: 'down' as const },
    // ];
  }

  private async getChannelBreakdown(clientKey: string) {
    const leads = await this.airtable.query<LeadRecord>(
      'leads',
      clientKey,
      undefined,
      { maxRecords: 1000, pageSize: 100 },
    );
    const channelCounts = new Map<string, number>();

    leads.forEach((lead) => {
      const channel = lead.fields.channel || 'OTHER';
      channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
    });

    return Array.from(channelCounts.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }

  private async getTemperatureBreakdown(clientKey: string) {
    const leads = await this.airtable.query<LeadRecord>(
      'leads',
      clientKey,
      undefined,
      { maxRecords: 1000, pageSize: 100 },
    );
    const tempCounts = new Map<string, number>();

    leads.forEach((lead) => {
      const temp = lead.fields.temperature || 'COLD';
      tempCounts.set(temp, (tempCounts.get(temp) || 0) + 1);
    });

    return Array.from(tempCounts.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }

  private async getRatingBreakdown(clientKey: string) {
    // TODO: Create 'feedbacks' table in Airtable
    // Return mock data until table is created
    return [
      { label: '5 Stars', value: 0 },
      { label: '4 Stars', value: 0 },
      { label: '3 Stars', value: 0 },
      { label: '1-2 Stars', value: 0 },
    ];

    // Uncomment when 'feedbacks' table exists:
    // const feedbacks = await this.airtable.query<FeedbackRecord>(
    //   'feedbacks',
    //   clientKey,
    //   undefined,
    //   { maxRecords: 1000, pageSize: 100 },
    // );
    // const ratingCounts = { '5': 0, '4': 0, '3': 0, '1-2': 0 };
    // feedbacks.forEach((fb) => {
    //   const rating = fb.fields.rating || 0;
    //   if (rating === 5) ratingCounts['5']++;
    //   else if (rating === 4) ratingCounts['4']++;
    //   else if (rating === 3) ratingCounts['3']++;
    //   else if (rating <= 2) ratingCounts['1-2']++;
    // });
    // return [
    //   { label: '5 Stars', value: ratingCounts['5'] },
    //   { label: '4 Stars', value: ratingCounts['4'] },
    //   { label: '3 Stars', value: ratingCounts['3'] },
    //   { label: '1-2 Stars', value: ratingCounts['1-2'] },
    // ];
  }
}
