import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CorporateNumbersService {
  constructor(private prisma: PrismaService) {}

  async listNumbers(tenantId: string) {
    return this.prisma.corporateNumber.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addNumber(tenantId: string, dto: any) {
    return this.prisma.corporateNumber.create({
      data: { tenantId, ...dto },
    });
  }

  async checkIfCorporate(phone: string) {
    return this.prisma.corporateNumber.findFirst({ where: { phone } });
  }
}
