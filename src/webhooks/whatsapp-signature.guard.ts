import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest>();

    if (process.env.NODE_ENV !== 'production') return true;

    const signatureHeader = (req.header('x-hub-signature-256') ?? '').trim();
    if (!signatureHeader) throw new UnauthorizedException('Missing signature');

    const secret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!secret) throw new UnauthorizedException('Missing app secret');

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new UnauthorizedException('Missing raw body');
    }

    const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
