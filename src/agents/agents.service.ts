import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async trigger(params: {
    conversationId: string;
    agentKey: string;
    inputText?: string;
  }) {
    const { conversationId, agentKey, inputText } = params;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { inbox: true, contact: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const url = this.config.get<string>('N8N_AGENT_TRIGGER_URL');
    if (!url) throw new Error('N8N_AGENT_TRIGGER_URL missing');

    const payload = {
      agentKey,
      conversation: {
        id: conversation.id,
        channel: conversation.channel,
        inbox: {
          id: conversation.inbox.id,
          externalId: conversation.inbox.externalId,
          channel: conversation.inbox.channel,
        },
        contact: {
          id: conversation.contact.id,
          phone: conversation.contact.phone,
          name: conversation.contact.name,
        },
      },
      input: {
        text: inputText ?? null,
      },
      ts: new Date().toISOString(),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`n8n trigger failed: ${res.status} ${text}`);
    }

    const data = await res.json().catch(() => ({}));
    return { ok: true, jobId: data?.jobId ?? null };
  }
}
