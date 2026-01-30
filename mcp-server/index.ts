#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const server = new Server(
  {
    name: 'skybot-inbox',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_conversations',
        description: 'Get conversations with contact and last message details',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            limit: { type: 'number', description: 'Max conversations', default: 20 },
            status: { type: 'string', enum: ['OPEN', 'CLOSED', 'PENDING'], description: 'Filter by status' },
          },
        },
      },
      {
        name: 'get_corporate_contacts',
        description: 'Get all corporate contacts',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'get_conversation_messages',
        description: 'Get all messages for a conversation',
        inputSchema: {
          type: 'object',
          properties: {
            conversationId: { type: 'string', description: 'Conversation ID' },
            limit: { type: 'number', description: 'Max messages', default: 50 },
          },
          required: ['conversationId'],
        },
      },
      {
        name: 'get_inboxes',
        description: 'Get all inboxes with connection status',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'get_account_stats',
        description: 'Get comprehensive account statistics',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'search_contacts',
        description: 'Search contacts by name or phone',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'check_webhook_health',
        description: 'Check webhook configuration and recent activity',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'get_recent_messages',
        description: 'Get messages from last N hours (default 24h)',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            hours: { type: 'number', description: 'Hours to look back', default: 24 },
            limit: { type: 'number', description: 'Max messages', default: 50 },
          },
        },
      },
      {
        name: 'get_failed_messages',
        description: 'Get messages that failed to send',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            limit: { type: 'number', description: 'Max messages', default: 20 },
          },
        },
      },
      {
        name: 'get_unread_conversations',
        description: 'Get conversations with unread messages',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'get_contact_by_phone',
        description: 'Find contact by exact phone number',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            phone: { type: 'string', description: 'Phone number to search' },
          },
          required: ['phone'],
        },
      },
      {
        name: 'create_corporate_contact',
        description: 'Add a new corporate contact',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            name: { type: 'string', description: 'Contact name' },
            phone: { type: 'string', description: 'Phone number' },
          },
          required: ['name', 'phone'],
        },
      },
      {
        name: 'update_conversation_status',
        description: 'Change conversation status (OPEN, CLOSED, PENDING)',
        inputSchema: {
          type: 'object',
          properties: {
            conversationId: { type: 'string', description: 'Conversation ID' },
            status: { type: 'string', enum: ['OPEN', 'CLOSED', 'PENDING'], description: 'New status' },
          },
          required: ['conversationId', 'status'],
        },
      },
      {
        name: 'get_message_stats',
        description: 'Get message statistics (sent/received/delivered/read)',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            hours: { type: 'number', description: 'Hours to analyze', default: 24 },
          },
        },
      },
      {
        name: 'get_whatsapp_phone_info',
        description: 'Get WhatsApp phone number configuration',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
    ],
  };
});

const DEFAULT_ACCOUNT_ID = 'cmkzhanqv0000xa449jf09ear';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_conversations': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const limit = (args?.limit as number) || 20;
        const statusFilter = args?.status as any;

        const conversations: any = await prisma.conversation.findMany({
          where: {
            inbox: { accountId },
            ...(statusFilter && { status: statusFilter }),
          },
          include: { contact: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        });

        const formatted = conversations.map((c: any) => ({
          id: c.id,
          status: c.status,
          unreadCount: c.unreadCount,
          messageCount: c.messageCount,
          contact: { name: c.contact.name, phone: c.contact.phone, isCorporate: c.contact.isCorporate },
          lastMessage: c.messages[0] ? { text: c.messages[0].text, direction: c.messages[0].direction, createdAt: c.messages[0].createdAt } : null,
          updatedAt: c.updatedAt,
        }));

        return { content: [{ type: 'text', text: JSON.stringify({ total: formatted.length, conversations: formatted }, null, 2) }] };
      }

      case 'get_corporate_contacts': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const contacts = await prisma.contact.findMany({
          where: { accountId, isCorporate: true },
          orderBy: { createdAt: 'desc' },
        });

        return {
          content: [{ type: 'text', text: JSON.stringify({ total: contacts.length, contacts: contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone, createdAt: c.createdAt })) }, null, 2) }],
        };
      }

      case 'get_conversation_messages': {
        const conversationId = args?.conversationId as string;
        const limit = (args?.limit as number) || 50;
        const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'desc' }, take: limit });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ total: messages.length, messages: messages.map((m) => ({ id: m.id, text: m.text, direction: m.direction, status: m.status, timestamp: m.timestamp, createdAt: m.createdAt })) }, null, 2),
            },
          ],
        };
      }

      case 'get_inboxes': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const inboxes: any = await prisma.inbox.findMany({ where: { accountId }, include: { _count: { select: { conversations: true } } } });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { total: inboxes.length, inboxes: inboxes.map((i: any) => ({ id: i.id, name: i.name, channel: i.channel, externalId: i.externalId, conversationCount: i._count.conversations, createdAt: i.createdAt })) },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_account_stats': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const [totalContacts, corporateContacts, totalConversations, openConversations, totalMessages, inboxes, recentMessages] = await Promise.all([
          prisma.contact.count({ where: { accountId } }),
          prisma.contact.count({ where: { accountId, isCorporate: true } }),
          prisma.conversation.count({ where: { inbox: { accountId } } }),
          prisma.conversation.count({ where: { inbox: { accountId }, status: 'OPEN' } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } } } }),
          prisma.inbox.findMany({ where: { accountId } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  accountId,
                  contacts: { total: totalContacts, corporate: corporateContacts },
                  conversations: { total: totalConversations, open: openConversations },
                  messages: { total: totalMessages, last24h: recentMessages },
                  inboxes: inboxes.map((i) => ({ name: i.name, channel: i.channel, externalId: i.externalId })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'search_contacts': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const query = args?.query as string;
        const contacts = await prisma.contact.findMany({
          where: { accountId, OR: [{ name: { contains: query, mode: 'insensitive' } }, { phone: { contains: query } }] },
          take: 20,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify({ total: contacts.length, query, contacts: contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone, isCorporate: c.isCorporate })) }, null, 2) }],
        };
      }

      case 'check_webhook_health': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentMessages: any = await prisma.message.findMany({
          where: { conversation: { inbox: { accountId } }, createdAt: { gte: oneHourAgo } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { conversation: { include: { contact: true } } },
        });

        const inboxes = await prisma.inbox.findMany({ where: { accountId } });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  inboxes: inboxes.map((i) => ({ name: i.name, channel: i.channel, externalId: i.externalId })),
                  recentActivity: {
                    messagesLastHour: recentMessages.length,
                    messages: recentMessages.map((m: any) => ({ text: m.text?.substring(0, 50), direction: m.direction, contact: m.conversation.contact.name, createdAt: m.createdAt })),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_recent_messages': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const hours = (args?.hours as number) || 24;
        const limit = (args?.limit as number) || 50;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const messages: any = await prisma.message.findMany({
          where: { conversation: { inbox: { accountId } }, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { conversation: { include: { contact: true } } },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: messages.length,
                  hours,
                  messages: messages.map((m: any) => ({ text: m.text, direction: m.direction, status: m.status, contact: m.conversation.contact.name, phone: m.conversation.contact.phone, createdAt: m.createdAt })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_failed_messages': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const limit = (args?.limit as number) || 20;

        const messages: any = await prisma.message.findMany({
          where: { conversation: { inbox: { accountId } }, status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { conversation: { include: { contact: true } } },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: messages.length,
                  messages: messages.map((m: any) => ({ text: m.text, direction: m.direction, failedReason: m.failedReason, contact: m.conversation.contact.name, phone: m.conversation.contact.phone, createdAt: m.createdAt })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_unread_conversations': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;

        const conversations: any = await prisma.conversation.findMany({
          where: { inbox: { accountId }, unreadCount: { gt: 0 } },
          include: { contact: true },
          orderBy: { updatedAt: 'desc' },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { total: conversations.length, conversations: conversations.map((c: any) => ({ id: c.id, contact: c.contact.name, phone: c.contact.phone, unreadCount: c.unreadCount, updatedAt: c.updatedAt })) },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_contact_by_phone': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const phone = args?.phone as string;

        const contact = await prisma.contact.findFirst({
          where: { accountId, phone },
          include: { conversations: { orderBy: { updatedAt: 'desc' }, take: 1 } },
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(contact ? { found: true, contact: { id: contact.id, name: contact.name, phone: contact.phone, isCorporate: contact.isCorporate, conversationCount: contact.conversations.length } } : { found: false }, null, 2) }],
        };
      }

      case 'create_corporate_contact': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const name = args?.name as string;
        const phone = args?.phone as string;

        const inbox = await prisma.inbox.findFirst({ where: { accountId } });
        if (!inbox) throw new Error('No inbox found for account');

        const existing = await prisma.contact.findFirst({ where: { inboxId: inbox.id, phone } });
        if (existing) {
          await prisma.contact.update({ where: { id: existing.id }, data: { isCorporate: true, name } });
          return { content: [{ type: 'text', text: JSON.stringify({ success: true, action: 'updated', contact: { id: existing.id, name, phone } }, null, 2) }] };
        }

        const contact = await prisma.contact.create({
          data: { accountId, inboxId: inbox.id, name, phone, isCorporate: true },
        });

        return { content: [{ type: 'text', text: JSON.stringify({ success: true, action: 'created', contact: { id: contact.id, name, phone } }, null, 2) }] };
      }

      case 'update_conversation_status': {
        const conversationId = args?.conversationId as string;
        const status = args?.status as any;

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status },
        });

        return { content: [{ type: 'text', text: JSON.stringify({ success: true, conversationId, newStatus: status }, null, 2) }] };
      }

      case 'get_message_stats': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const hours = (args?.hours as number) || 24;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [total, incoming, outgoing, delivered, read, failed] = await Promise.all([
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: since } } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: since }, direction: 'INCOMING' as any } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: since }, direction: 'OUTGOING' as any } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: since }, deliveredAt: { not: null } } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: since }, readAt: { not: null } } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } }, createdAt: { gte: since }, status: 'FAILED' as any } }),
        ]);

        return {
          content: [{ type: 'text', text: JSON.stringify({ hours, total, incoming, outgoing, delivered, read, failed, deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) + '%' : 'N/A' }, null, 2) }],
        };
      }

      case 'get_whatsapp_phone_info': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;

        const inbox = await prisma.inbox.findFirst({ where: { accountId, channel: 'WHATSAPP' } });

        if (!inbox) {
          return { content: [{ type: 'text', text: JSON.stringify({ found: false, message: 'No WhatsApp inbox found' }, null, 2) }] };
        }

        const conversationCount = await prisma.conversation.count({ where: { inboxId: inbox.id } });
        const messageCount = await prisma.message.count({ where: { conversation: { inboxId: inbox.id } } });

        return {
          content: [{ type: 'text', text: JSON.stringify({ found: true, inbox: { name: inbox.name, externalId: inbox.externalId, conversationCount, messageCount, createdAt: inbox.createdAt } }, null, 2) }],
        };
      }

      default:
        throw new Error('Unknown tool: ' + name);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: JSON.stringify({ error: errorMessage }, null, 2) }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SkyBot Inbox MCP Server v2.0 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
