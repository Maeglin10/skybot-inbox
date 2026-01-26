import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngestionService {
  constructor(private prisma: PrismaService) {}

  async listJobs(tenantId: string) {
    return this.prisma.ingestionJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async createJob(tenantId: string, type: string, source?: string) {
    return this.prisma.ingestionJob.create({
      data: { tenantId, type, source, status: 'PENDING' },
    });
  }
}
