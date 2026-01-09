// src/agents/agents.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { RoutingStatus } from '@prisma/client';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly clients: ClientsService,
  ) {}

  async trigger(params: {
    conversationId: string;
    agentKey: string;
    inputText?: string;
  }) {
    const { conversationId, agentKey, inputText } = params;

    const startedAt = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { inbox: true, contact: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const url = this.config.get<string>('N8N_MASTER_ROUTER_URL');
    const secret = this.config.get<string>('N8N_MASTER_ROUTER_SECRET');
    if (!url)
      throw new InternalServerErrorException('N8N_MASTER_ROUTER_URL missing');
    if (!secret)
      throw new InternalServerErrorException(
        'N8N_MASTER_ROUTER_SECRET missing',
      );

    // multi-tenant resolve
    const accountId = conversation.inbox.accountId;
    const channel = conversation.channel;
    const externalAccountId = conversation.inbox.externalId;

    const cfg = await this.clients.resolveClient({
      accountId,
      channel,
      externalAccountId,
    });

    const allowedAgentsRaw = cfg.allowedAgents as unknown;
    const allowedAgents =
      Array.isArray(allowedAgentsRaw) &&
      allowedAgentsRaw.every((x) => typeof x === 'string')
        ? (allowedAgentsRaw as string[])
        : [];

    const effectiveAgentKey = allowedAgents.includes(agentKey)
      ? agentKey
      : (cfg.defaultAgentKey ?? 'master-router');

    // routing log (ACCOUNT RELATION REQUIRED)
    const log = await this.prisma.routingLog.create({
      data: {
        requestId,
        account: { connect: { id: accountId } }, // <-- fix TS2322
        clientKey: cfg.clientKey,
        agentKey: effectiveAgentKey,
        channel,
        externalAccountId,
        conversationId: conversation.id,
        status: RoutingStatus.RECEIVED,
        source: 'api:/agents/trigger',
      },
    });

    const payload = {
      requestId,
      agentKey: effectiveAgentKey,
      client: { clientKey: cfg.clientKey, name: cfg.name ?? null },
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
      input: { text: inputText ?? null },
      ts: new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      this.logger.log(
        `POST n8n url=${url} req=${requestId} client=${cfg.clientKey} conv=${conversation.id} agentKey=${effectiveAgentKey}`,
      );

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-secret': secret,
          'x-request-id': requestId,
          'x-client-key': cfg.clientKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const raw = await res.text().catch(() => '');
      const latencyMs = Date.now() - startedAt;

      this.logger.log(
        `n8n req=${requestId} status=${res.status} body_len=${raw.length} latencyMs=${latencyMs}`,
      );

      if (!res.ok) {
        await this.prisma.routingLog.update({
          where: { id: log.id },
          data: {
            status: RoutingStatus.FAILED,
            latencyMs,
            error: `n8n failed ${res.status}`,
          },
        });

        throw new InternalServerErrorException(
          `n8n failed ${res.status}: ${raw.slice(0, 500)}`,
        );
      }

      await this.prisma.routingLog.update({
        where: { id: log.id },
        data: {
          status: RoutingStatus.FORWARDED,
          latencyMs,
        },
      });

      let data: unknown = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      return { ok: true, data, requestId };
    } catch (e: any) {
      const latencyMs = Date.now() - startedAt;

      if (e?.name === 'AbortError') {
        this.logger.error(`n8n timeout req=${requestId}`);
        await this.prisma.routingLog
          .update({
            where: { requestId },
            data: { status: RoutingStatus.FAILED, latencyMs, error: 'timeout' },
          })
          .catch(() => undefined);
        throw new InternalServerErrorException('n8n timeout');
      }

      this.logger.error(
        `agent trigger failed req=${requestId}: ${e?.message ?? String(e)}`,
      );

      await this.prisma.routingLog
        .update({
          where: { requestId },
          data: {
            status: RoutingStatus.FAILED,
            latencyMs,
            error: (e?.message ?? 'Agent trigger failed').slice(0, 500),
          },
        })
        .catch(() => undefined);

      throw e instanceof InternalServerErrorException
        ? e
        : new InternalServerErrorException(
            e?.message ?? 'Agent trigger failed',
          );
    } finally {
      clearTimeout(timeout);
    }
  }
}
