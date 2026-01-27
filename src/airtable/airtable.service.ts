import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Airtable from 'airtable';

@Injectable()
export class AirtableService implements OnModuleInit {
  private readonly logger = new Logger(AirtableService.name);
  private base: Airtable.Base | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('AIRTABLE_API_KEY');
    const baseId = this.config.get<string>('AIRTABLE_BASE_ID');

    if (!apiKey || !baseId) {
      this.logger.warn(
        'AIRTABLE_API_KEY or AIRTABLE_BASE_ID not configured. Airtable features disabled.',
      );
      return;
    }

    try {
      Airtable.configure({ apiKey });
      this.base = Airtable.base(baseId);
      this.logger.log('Airtable configured successfully');
    } catch (error) {
      this.logger.error('Failed to configure Airtable:', error);
    }
  }

  getBase(): Airtable.Base {
    if (!this.base) {
      throw new Error(
        'Airtable not configured. Check AIRTABLE_API_KEY and AIRTABLE_BASE_ID.',
      );
    }
    return this.base;
  }

  /**
   * Generic query helper with clientKey filtering
   */
  async query<T>(
    tableName: string,
    clientKey: string,
    filterFormula?: string,
    options?: {
      sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
      maxRecords?: number;
      pageSize?: number;
    },
  ): Promise<Array<{ id: string; fields: T }>> {
    const base = this.getBase();
    const table = base(tableName);

    // Use different client field names based on table
    const clientFieldMap: Record<string, string> = {
      leads: 'client_id',
      feedbacks: 'client_id',
      Notifications: '', // Notifications table has no client field
      clients_config: 'client_id',
    };

    const clientFieldName = clientFieldMap[tableName] || 'clientKey';

    // Combine clientKey filter with additional filters (skip if no client field)
    let combinedFilter = filterFormula;
    if (clientFieldName) {
      const clientFilter = `{${clientFieldName}} = '${clientKey}'`;
      combinedFilter = filterFormula
        ? `AND(${clientFilter}, ${filterFormula})`
        : clientFilter;
    }

    const records: Array<{ id: string; fields: T }> = [];

    // Build select options, only including defined values
    // Airtable SDK requires these to be numbers, not undefined
    const selectOptions: Record<string, unknown> = {
      filterByFormula: combinedFilter,
    };

    if (options?.sort) {
      selectOptions.sort = options.sort;
    }
    if (typeof options?.maxRecords === 'number') {
      selectOptions.maxRecords = options.maxRecords;
    }
    if (typeof options?.pageSize === 'number') {
      selectOptions.pageSize = options.pageSize;
    }

    await table.select(selectOptions).eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach((record) => {
        records.push({
          id: record.id,
          fields: record.fields as T,
        });
      });
      fetchNextPage();
    });

    return records;
  }

  /**
   * Get a single record by ID
   */
  async findById<T>(tableName: string, recordId: string): Promise<T | null> {
    try {
      const base = this.getBase();
      const record = await base(tableName).find(recordId);
      return record.fields as T;
    } catch (error) {
      this.logger.error(`Failed to find record ${recordId}:`, error);
      return null;
    }
  }

  /**
   * Create a record
   */
  async create<T>(
    tableName: string,
    fields: Record<string, unknown>,
  ): Promise<{ id: string; fields: T }> {
    const base = this.getBase();
    const record: any = await base(tableName).create(fields as any);
    return {
      id: record.id,
      fields: record.fields as T,
    };
  }

  /**
   * Update a record
   */
  async update<T>(
    tableName: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<{ id: string; fields: T }> {
    const base = this.getBase();
    const record: any = await base(tableName).update(recordId, fields as any);
    return {
      id: record.id,
      fields: record.fields as T,
    };
  }

  /**
   * Delete a record
   */
  async delete(tableName: string, recordId: string): Promise<void> {
    const base = this.getBase();
    await base(tableName).destroy(recordId);
  }
}
