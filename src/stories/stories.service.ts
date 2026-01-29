import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(accountId: string, dto: CreateStoryDto) {
    const story = await this.prisma.story.create({
      data: {
        accountId,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        caption: dto.caption,
        link: dto.link,
        phoneNumberId: dto.phoneNumberId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    // Si pas de schedule, publier immédiatement
    if (!dto.scheduledAt) {
      await this.publish(story.id);
    }

    return story;
  }

  async findAll(accountId: string) {
    return this.prisma.story.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, accountId: string) {
    const story = await this.prisma.story.findFirst({
      where: { id, accountId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    return story;
  }

  async delete(id: string, accountId: string) {
    const story = await this.findOne(id, accountId);
    await this.prisma.story.delete({ where: { id: story.id } });
    return { message: 'Story deleted' };
  }

  async publish(id: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    try {
      // Update status to publishing
      await this.prisma.story.update({
        where: { id },
        data: { status: 'PUBLISHING' },
      });

      // Call WhatsApp API to post story
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
      }

      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${story.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'status',
          type: story.mediaType.startsWith('image') ? 'image' : 'video',
          [story.mediaType.startsWith('image') ? 'image' : 'video']: {
            link: story.mediaUrl,
            caption: story.caption,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Update story with success
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Stories expire after 24h

      await this.prisma.story.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          expiresAt,
          externalId: response.data.messages?.[0]?.id,
        },
      });

      this.logger.log(`Story ${id} published successfully`);
      return { success: true, externalId: response.data.messages?.[0]?.id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.prisma.story.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });

      this.logger.error(`Failed to publish story ${id}: ${errorMessage}`);
      throw error;
    }
  }

  // Cron job to publish scheduled stories
  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledStories() {
    const now = new Date();
    const scheduled = await this.prisma.story.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
    });

    for (const story of scheduled) {
      try {
        await this.publish(story.id);
      } catch (error) {
        this.logger.error(`Failed to publish scheduled story ${story.id}`);
      }
    }
  }

  // Cron job to mark expired stories
  @Cron(CronExpression.EVERY_HOUR)
  async markExpiredStories() {
    const now = new Date();
    await this.prisma.story.updateMany({
      where: {
        status: 'PUBLISHED',
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });
  }
}
