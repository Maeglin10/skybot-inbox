// src/agents/agents.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
    requestId?: string;
    messageId?: string;
  }) {
    const { conversationId, agentKey, inputText, messageId } = params;

    // GUARD: évite les Prisma ValidationError "id: undefined"
    if (!conversationId) {
      throw new NotFoundException('conversationId missing');
    }
    if (!messageId) {
      throw new NotFoundException('messageId missing');
    }

    const startedAt = Date.now();
    const requestId =
      params.requestId ??
      `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    let routingLogId: string | null = null;

    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { inbox: true, contact: true },
      });
      if (!conversation) throw new NotFoundException('Conversation not found');

      // (optionnel mais utile) check message belongs to conversation
      const msg = await this.prisma.message.findFirst({
        where: { id: messageId, conversationId },
        select: { id: true },
      });
      if (!msg) {
        throw new NotFoundException(
          `Message not found for conversationId=${conversationId}`,
        );
      }

      const url = this.config.get<string>('N8N_MASTER_ROUTER_URL');
      const secret = this.config.get<string>('N8N_MASTER_ROUTER_SECRET');
      if (!url)
        throw new InternalServerErrorException('N8N_MASTER_ROUTER_URL missing');
      if (!secret)
        throw new InternalServerErrorException(
          'N8N_MASTER_ROUTER_SECRET missing',
        );

      // Multi-tenant resolve
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

      // Routing log (best-effort)
      try {
        const log = await this.prisma.routingLog.upsert({
          where: { requestId },
          create: {
            requestId,
            account: { connect: { id: accountId } },
            clientKey: cfg.clientKey,
            agentKey: effectiveAgentKey,
            channel,
            externalAccountId,
            conversationId: conversation.id,
            status: RoutingStatus.RECEIVED,
            source: 'api:/agents/trigger',
          },
          update: {
            // optionnel: rafraîchir certains champs si re-trigger
            agentKey: effectiveAgentKey,
            status: RoutingStatus.RECEIVED,
            conversationId: conversation.id,
          },
        });
        routingLogId = log.id;
      } catch (e: any) {
        this.logger.error(
          `routingLog.create failed req=${requestId}: ${e?.message ?? String(e)}`,
        );
      }

      const payload = {
        requestId,
        agentKey: effectiveAgentKey,
        client: { clientKey: cfg.clientKey, name: cfg.name ?? null },
        event: {
          conversationId: conversation.id,
          messageId,
          channel,
          externalAccountId,
        },
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
          `POST n8n url=${url} req=${requestId} client=${cfg.clientKey} conv=${conversation.id} msg=${messageId} agentKey=${effectiveAgentKey}`,
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

        if (!res.ok) {
          if (routingLogId) {
            await this.prisma.routingLog
              .update({
                where: { id: routingLogId },
                data: {
                  status: RoutingStatus.FAILED,
                  latencyMs,
                  error: `n8n failed ${res.status}: ${raw.slice(0, 200)}`,
                },
              })
              .catch(() => undefined);
          }

          throw new InternalServerErrorException(
            `n8n failed ${res.status}: ${raw.slice(0, 500)}`,
          );
        }

        if (routingLogId) {
          await this.prisma.routingLog
            .update({
              where: { id: routingLogId },
              data: { status: RoutingStatus.FORWARDED, latencyMs },
            })
            .catch(() => undefined);
        }

        let data: unknown = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = {};
        }

        // après le JSON.parse
        // Compatible avec les deux formats:
        // - Format skybot-inbox: { replyText: "..." }
        // - Format SkyBot agents: { status: "success", output: { answer: "...", message: "..." } }

        // Type-safe parsing of n8n response
        interface N8nResponse {
          replyText?: string;
          status?: string;
          output?: {
            message?: string;
            answer?: string;
          };
        }

        const parsed: N8nResponse =
          typeof data === 'object' && data !== null
            ? (data as N8nResponse)
            : {};

        let replyText: string | null = null;

        // Format 1: replyText direct (préféré)
        if (typeof parsed.replyText === 'string' && parsed.replyText.trim()) {
          replyText = parsed.replyText.trim();
        }
        // Format 2: SkyBot agents - output.message (Closer, Orders, etc.)
        else if (
          typeof parsed.output?.message === 'string' &&
          parsed.output.message.trim()
        ) {
          replyText = parsed.output.message.trim();
        }
        // Format 3: SkyBot agents - output.answer (Info agent)
        else if (
          typeof parsed.output?.answer === 'string' &&
          parsed.output.answer.trim()
        ) {
          replyText = parsed.output.answer.trim();
        }

        // Log pour debug si aucune réponse trouvée
        if (!replyText && parsed.status === 'success') {
          this.logger.warn(
            `N8N returned success but no replyText found. Keys: ${Object.keys(parsed.output ?? {}).join(', ')}`,
          );
        }

        // anti-spam: si le dernier message est déjà OUT avec même texte dans les 10s, skip
        const last = await this.prisma.message.findFirst({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'desc' },
          select: { direction: true, text: true, createdAt: true },
        });

        if (
          last?.direction === 'OUT' &&
          last?.text === replyText &&
          Date.now() - new Date(last.createdAt).getTime() < 10_000
        ) {
          return { ok: true, data, requestId, deduped: true };
        }

        if (replyText) {
          // message OUT en DB
          await this.prisma.message.create({
            data: {
              conversationId: conversation.id,
              channel: conversation.channel,
              externalId: null,
              direction: 'OUT',
              from: conversation.inbox.externalId ?? null,
              to: conversation.contact.phone,
              text: replyText,
              timestamp: new Date(),
            },
          });

          // update conv activity
          await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastActivityAt: new Date() },
          });
        }

        return { ok: true, data, requestId };
      } catch (e: any) {
        const latencyMs = Date.now() - startedAt;

        if (e?.name === 'AbortError') {
          if (routingLogId) {
            await this.prisma.routingLog
              .update({
                where: { id: routingLogId },
                data: {
                  status: RoutingStatus.FAILED,
                  latencyMs,
                  error: 'timeout',
                },
              })
              .catch(() => undefined);
          }
          throw new InternalServerErrorException('n8n timeout');
        }

        if (routingLogId) {
          await this.prisma.routingLog
            .update({
              where: { id: routingLogId },
              data: {
                status: RoutingStatus.FAILED,
                latencyMs,
                error: (e?.message ?? 'Agent trigger failed').slice(0, 500),
              },
            })
            .catch(() => undefined);
        }

        throw e instanceof InternalServerErrorException
          ? e
          : new InternalServerErrorException(
              e?.message ?? 'Agent trigger failed',
            );
      } finally {
        clearTimeout(timeout);
      }
    } catch (e: any) {
      this.logger.error(`AgentsService.trigger failed req=${requestId}`);
      this.logger.error(e?.stack ?? e?.message ?? String(e));

      throw e instanceof InternalServerErrorException ||
        e instanceof NotFoundException
        ? e
        : new InternalServerErrorException(e?.message ?? 'Internal error');
    }
  }
}
