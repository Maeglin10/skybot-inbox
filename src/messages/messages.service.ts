import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, MessageDirection } from '@prisma/client';
import {
  ConversationNotFoundError,
  ResourceNotOwnedError,
} from '../common/errors/known-error';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(params: {
    accountId: string; // REQUIRED for multi-tenancy
    conversationId: string;
    text: string;
    externalId?: string;
  }) {
    const { accountId, conversationId, text, externalId } = params;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { inbox: true, contact: true },
    });

    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    // CRITICAL: Verify the conversation belongs to the user's account
    if (conversation.inbox.accountId !== accountId) {
      throw new ResourceNotOwnedError('conversation', conversationId);
    }

    const channel =
      conversation.channel ?? conversation.inbox.channel ?? Channel.WHATSAPP;

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        channel,
        externalId: externalId ?? null,
        direction: MessageDirection.OUT,
        from: conversation.inbox.externalId ?? null,
        to: conversation.contact.phone ?? null,
        text,
        timestamp: new Date(),
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastActivityAt: message.createdAt,
        status: 'OPEN',
      },
    });

    return message;
  }

  /**
   * Full-text search messages using PostgreSQL tsvector
   * Returns messages matching the search query with highlighting
   */
  async search(params: {
    accountId: string;
    query: string;
    conversationId?: string;
    inboxId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { accountId, query, conversationId, inboxId, limit = 20, offset = 0 } = params;

    // Build where clause for multi-tenant isolation
    const where: any = {
      conversation: {
        inbox: {
          accountId, // CRITICAL: Filter by account
        },
      },
      deletedAt: null, // Don't search deleted messages
    };

    // Optional filters
    if (conversationId) {
      where.conversationId = conversationId;
    }
    if (inboxId) {
      where.conversation = {
        ...where.conversation,
        inboxId,
      };
    }

    // Use raw SQL for full-text search with PostgreSQL
    // search_vector is auto-populated by trigger from message text
    const results = await this.prisma.$queryRaw<Array<{
      id: string;
      conversationId: string;
      text: string;
      timestamp: Date;
      direction: string;
      channel: string;
      rank: number;
      headline: string; // Highlighted snippet
    }>>`
      SELECT
        m.id,
        m."conversationId",
        m.text,
        m.timestamp,
        m.direction,
        m.channel,
        ts_rank(m.search_vector, plainto_tsquery('english', ${query})) as rank,
        ts_headline('english', m.text, plainto_tsquery('english', ${query}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25') as headline
      FROM "Message" m
      INNER JOIN "Conversation" c ON c.id = m."conversationId"
      INNER JOIN "Inbox" i ON i.id = c."inboxId"
      WHERE
        i."accountId" = ${accountId}
        AND m.search_vector @@ plainto_tsquery('english', ${query})
        AND m."deletedAt" IS NULL
        ${conversationId ? this.prisma.$queryRaw`AND m."conversationId" = ${conversationId}` : this.prisma.$queryRaw``}
        ${inboxId ? this.prisma.$queryRaw`AND c."inboxId" = ${inboxId}` : this.prisma.$queryRaw``}
      ORDER BY rank DESC, m.timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count for pagination
    const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Message" m
      INNER JOIN "Conversation" c ON c.id = m."conversationId"
      INNER JOIN "Inbox" i ON i.id = c."inboxId"
      WHERE
        i."accountId" = ${accountId}
        AND m.search_vector @@ plainto_tsquery('english', ${query})
        AND m."deletedAt" IS NULL
        ${conversationId ? this.prisma.$queryRaw`AND m."conversationId" = ${conversationId}` : this.prisma.$queryRaw``}
        ${inboxId ? this.prisma.$queryRaw`AND c."inboxId" = ${inboxId}` : this.prisma.$queryRaw``}
    `;

    const total = Number(countResult[0]?.count || 0);

    return {
      results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
}
