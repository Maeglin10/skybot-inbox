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
    version: '1.0.0',
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
        description: 'Get conversations for an account with contact and last message details',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
            limit: { type: 'number', description: 'Maximum number of conversations', default: 20 },
          },
        },
      },
      {
        name: 'get_corporate_contacts',
        description: 'Get all corporate contacts for an account',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'get_conversation_messages',
        description: 'Get all messages for a specific conversation',
        inputSchema: {
          type: 'object',
          properties: {
            conversationId: { type: 'string', description: 'Conversation ID' },
            limit: { type: 'number', description: 'Maximum number of messages', default: 50 },
          },
          required: ['conversationId'],
        },
      },
      {
        name: 'get_inboxes',
        description: 'Get all inboxes for an account',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'Account ID (default: GoodLife)' },
          },
        },
      },
      {
        name: 'get_account_stats',
        description: 'Get comprehensive statistics for an account',
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

        const conversations: any = await prisma.conversation.findMany({
          where: { inbox: { accountId } },
          include: { contact: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        });

        const formatted = conversations.map((c: any) => ({
          id: c.id,
          status: c.status,
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
          content: [
            { type: 'text', text: JSON.stringify({ total: contacts.length, contacts: contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone, createdAt: c.createdAt })) }, null, 2) },
          ],
        };
      }

      case 'get_conversation_messages': {
        const conversationId = args?.conversationId as string;
        const limit = (args?.limit as number) || 50;
        const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'desc' }, take: limit });

        return {
          content: [{ type: 'text', text: JSON.stringify({ total: messages.length, messages: messages.map((m) => ({ id: m.id, text: m.text, direction: m.direction, createdAt: m.createdAt })) }, null, 2) }],
        };
      }

      case 'get_inboxes': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const inboxes: any = await prisma.inbox.findMany({ where: { accountId }, include: { _count: { select: { conversations: true } } } });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ total: inboxes.length, inboxes: inboxes.map((i: any) => ({ id: i.id, name: i.name, channel: i.channel, externalId: i.externalId, conversationCount: i._count.conversations })) }, null, 2),
            },
          ],
        };
      }

      case 'get_account_stats': {
        const accountId = (args?.accountId as string) || DEFAULT_ACCOUNT_ID;
        const [totalContacts, corporateContacts, totalConversations, openConversations, totalMessages, inboxes] = await Promise.all([
          prisma.contact.count({ where: { accountId } }),
          prisma.contact.count({ where: { accountId, isCorporate: true } }),
          prisma.conversation.count({ where: { inbox: { accountId } } }),
          prisma.conversation.count({ where: { inbox: { accountId }, status: 'OPEN' } }),
          prisma.message.count({ where: { conversation: { inbox: { accountId } } } }),
          prisma.inbox.findMany({ where: { accountId } }),
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
                  messages: { total: totalMessages },
                  inboxes: inboxes.map((i) => ({ name: i.name, channel: i.channel })),
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
                  recentActivity: { messagesLastHour: recentMessages.length, messages: recentMessages.map((m: any) => ({ text: m.text?.substring(0, 50), direction: m.direction, contact: m.conversation.contact.name, createdAt: m.createdAt })) },
                },
                null,
                2
              ),
            },
          ],
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
  console.error('SkyBot Inbox MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
