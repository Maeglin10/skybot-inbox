// src/auth/api-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    console.log('ENV API_KEY =', process.env.API_KEY);
    console.log('HEADER x-api-key =', req.headers['x-api-key']);

    const apiKey = req.header('x-api-key');
    const expected = this.config.get<string>('API_KEY');

    if (!expected) throw new UnauthorizedException('API_KEY missing in env');
    if (!apiKey || apiKey !== expected)
      throw new UnauthorizedException('Invalid API key');

    return true;
  }
}
