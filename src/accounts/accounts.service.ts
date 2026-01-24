import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import {
  CreateAccountDto,
  AccountRole,
  AccountStatus,
} from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as crypto from 'crypto';

const ACCOUNTS_TABLE = 'UserAccounts';

interface AccountRecord {
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  notes?: string;
  avatarUrl?: string;
  passwordHash?: string;
  clientKey: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AccountRole;
  status: AccountStatus;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(private readonly airtable: AirtableService) {}

  async findAll(
    clientKey: string,
    role?: AccountRole,
    status?: AccountStatus,
  ): Promise<{ items: AccountItem[]; total: number }> {
    try {
      let filterFormula = '';

      if (role && status) {
        filterFormula = `AND({role} = '${role}', {status} = '${status}')`;
      } else if (role) {
        filterFormula = `{role} = '${role}'`;
      } else if (status) {
        filterFormula = `{status} = '${status}'`;
      }

      const records = await this.airtable.query<AccountRecord>(
        ACCOUNTS_TABLE,
        clientKey,
        filterFormula || undefined,
        {
          sort: [{ field: 'createdAt', direction: 'desc' }],
        },
      );

      return {
        items: records.map((r) => this.mapRecordToAccount(r)),
        total: records.length,
      };
    } catch (error) {
      this.logger.error('Failed to fetch accounts:', error);
      throw error;
    }
  }

  async findOne(clientKey: string, id: string): Promise<AccountItem> {
    try {
      const records = await this.airtable.query<AccountRecord>(
        ACCOUNTS_TABLE,
        clientKey,
        `RECORD_ID() = '${id}'`,
      );

      if (records.length === 0) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      return this.mapRecordToAccount(records[0]);
    } catch (error) {
      this.logger.error(`Failed to fetch account ${id}:`, error);
      throw error;
    }
  }

  async findByEmail(clientKey: string, email: string): Promise<AccountItem | null> {
    try {
      const records = await this.airtable.query<AccountRecord>(
        ACCOUNTS_TABLE,
        clientKey,
        `{email} = '${email}'`,
      );

      if (records.length === 0) {
        return null;
      }

      return this.mapRecordToAccount(records[0]);
    } catch (error) {
      this.logger.error(`Failed to fetch account by email ${email}:`, error);
      throw error;
    }
  }

  async create(clientKey: string, dto: CreateAccountDto): Promise<AccountItem> {
    try {
      // Check if email already exists
      const existing = await this.findByEmail(clientKey, dto.email);
      if (existing) {
        throw new ConflictException(`Account with email ${dto.email} already exists`);
      }

      const now = new Date().toISOString();
      const record = await this.airtable.create<AccountRecord>(ACCOUNTS_TABLE, {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        status: dto.status || AccountStatus.ACTIVE,
        notes: dto.notes,
        avatarUrl: dto.avatarUrl,
        clientKey,
        createdAt: now,
        updatedAt: now,
      });

      return this.mapRecordToAccount(record);
    } catch (error) {
      this.logger.error('Failed to create account:', error);
      throw error;
    }
  }

  async update(
    clientKey: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<AccountItem> {
    try {
      // Verify account exists and belongs to client
      await this.findOne(clientKey, id);

      // If updating email, check for duplicates
      if (dto.email) {
        const existing = await this.findByEmail(clientKey, dto.email);
        if (existing && existing.id !== id) {
          throw new ConflictException(`Account with email ${dto.email} already exists`);
        }
      }

      const updateFields: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (dto.name !== undefined) updateFields.name = dto.name;
      if (dto.email !== undefined) updateFields.email = dto.email;
      if (dto.phone !== undefined) updateFields.phone = dto.phone;
      if (dto.role !== undefined) updateFields.role = dto.role;
      if (dto.status !== undefined) updateFields.status = dto.status;
      if (dto.notes !== undefined) updateFields.notes = dto.notes;
      if (dto.avatarUrl !== undefined) updateFields.avatarUrl = dto.avatarUrl;

      const record = await this.airtable.update<AccountRecord>(
        ACCOUNTS_TABLE,
        id,
        updateFields,
      );

      return this.mapRecordToAccount(record);
    } catch (error) {
      this.logger.error(`Failed to update account ${id}:`, error);
      throw error;
    }
  }

  async delete(clientKey: string, id: string): Promise<{ success: boolean }> {
    try {
      // Verify account exists and belongs to client
      await this.findOne(clientKey, id);

      await this.airtable.delete(ACCOUNTS_TABLE, id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete account ${id}:`, error);
      throw error;
    }
  }

  async suspend(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { status: AccountStatus.SUSPENDED });
  }

  async activate(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { status: AccountStatus.ACTIVE });
  }

  async promoteToAdmin(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { role: AccountRole.ADMIN });
  }

  async demoteToUser(clientKey: string, id: string): Promise<AccountItem> {
    return this.update(clientKey, id, { role: AccountRole.USER });
  }

  async changePassword(
    clientKey: string,
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate passwords match
      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException('New password and confirmation do not match');
      }

      // Verify account exists
      const records = await this.airtable.query<AccountRecord>(
        ACCOUNTS_TABLE,
        clientKey,
        `RECORD_ID() = '${id}'`,
      );

      if (records.length === 0) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      const account = records[0];

      // Verify current password (if passwordHash exists)
      if (account.fields.passwordHash) {
        const currentHash = this.hashPassword(dto.currentPassword);
        if (currentHash !== account.fields.passwordHash) {
          throw new UnauthorizedException('Current password is incorrect');
        }
      }

      // Hash new password and update
      const newPasswordHash = this.hashPassword(dto.newPassword);

      await this.airtable.update<AccountRecord>(ACCOUNTS_TABLE, id, {
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      });

      this.logger.log(`Password changed successfully for account ${id}`);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error(`Failed to change password for account ${id}:`, error);
      throw error;
    }
  }

  async setInitialPassword(
    clientKey: string,
    id: string,
    password: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.findOne(clientKey, id);

      const passwordHash = this.hashPassword(password);

      await this.airtable.update<AccountRecord>(ACCOUNTS_TABLE, id, {
        passwordHash,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to set initial password for account ${id}:`, error);
      throw error;
    }
  }

  async verifyPassword(clientKey: string, email: string, password: string): Promise<AccountItem | null> {
    try {
      const records = await this.airtable.query<AccountRecord>(
        ACCOUNTS_TABLE,
        clientKey,
        `{email} = '${email}'`,
      );

      if (records.length === 0) {
        return null;
      }

      const account = records[0];
      const passwordHash = this.hashPassword(password);

      if (account.fields.passwordHash !== passwordHash) {
        return null;
      }

      return this.mapRecordToAccount(account);
    } catch (error) {
      this.logger.error(`Failed to verify password for ${email}:`, error);
      return null;
    }
  }

  private hashPassword(password: string): string {
    // Simple SHA-256 hash - in production, use bcrypt or argon2
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private mapRecordToAccount(record: { id: string; fields: AccountRecord }): AccountItem {
    return {
      id: record.id,
      name: record.fields.name,
      email: record.fields.email,
      phone: record.fields.phone,
      role: record.fields.role as AccountRole,
      status: record.fields.status as AccountStatus,
      notes: record.fields.notes,
      avatarUrl: record.fields.avatarUrl,
      createdAt: record.fields.createdAt || new Date().toISOString(),
      updatedAt: record.fields.updatedAt,
    };
  }
}
