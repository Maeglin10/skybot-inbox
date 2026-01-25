import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, userId?: string, metadata?: any, request?: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata,
        ipAddress: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      },
    });
  }
}
