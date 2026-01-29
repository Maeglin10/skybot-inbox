import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CorporateNumbersService {
  constructor(private prisma: PrismaService) {}

  /**
   * SECURITY FIX: Now requires accountId parameter for multi-tenancy
   */
  async listNumbers(accountId: string) {
    return this.prisma.corporateNumber.findMany({
      where: { tenantId: accountId }, // CRITICAL: Filter by account
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * SECURITY FIX: Now requires accountId parameter for multi-tenancy
   */
  async addNumber(accountId: string, dto: any) {
    return this.prisma.corporateNumber.create({
      data: { tenantId: accountId, ...dto }, // CRITICAL: Associate with account
    });
  }

  /**
   * CRITICAL P0 FIX: Check if phone is corporate within specific account
   * Previously this had NO tenant filtering - allowed cross-account data leaks
   */
  async checkIfCorporate(accountId: string, phone: string) {
    return this.prisma.corporateNumber.findFirst({
      where: {
        phone,
        tenantId: accountId, // CRITICAL: Filter by account to prevent cross-account data leaks
      },
    });
  }
}
