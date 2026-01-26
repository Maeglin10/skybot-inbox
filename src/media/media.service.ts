import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async listMedia(tenantId: string) {
    return this.prisma.media.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async uploadUrl(tenantId: string) {
    // TODO: Generate S3/R2 presigned upload URL
    return { message: 'Upload URL generation - S3/R2 integration needed', tenantId };
  }
}
