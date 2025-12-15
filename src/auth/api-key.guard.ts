import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const headerApiKey =
      req.header('x-api-key') ??
      req.header('X-API-KEY') ??
      req.header('authorization') ??
      req.header('Authorization');

    const provided = (headerApiKey ?? '').replace(/^Bearer\s+/i, '').trim();
    const expected = (process.env.API_KEY ?? '').trim();

    if (!expected) {
      throw new UnauthorizedException('API_KEY missing on server');
    }
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
