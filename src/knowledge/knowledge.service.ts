import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async listItems(tenantId: string) {
    return this.prisma.knowledgeItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createItem(tenantId: string, dto: any) {
    return this.prisma.knowledgeItem.create({
      data: { tenantId, ...dto },
    });
  }

  async searchItems(tenantId: string, query: string) {
    return this.prisma.knowledgeItem.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }
}
