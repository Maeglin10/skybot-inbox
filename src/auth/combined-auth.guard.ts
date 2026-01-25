import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

function normalize(v: string): string {
  const s = (v ?? '').trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Combined auth guard that accepts either:
 * 1. JWT Bearer token (for frontend authentication)
 * 2. API Key via x-api-key header or Bearer token (for backend/service authentication)
 */
@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const clientKey = req.headers['x-client-key'] as string | undefined;

    // Try JWT auth first if we have a Bearer token
    if (auth?.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7);

      // Try to verify as JWT
      try {
        const payload = this.jwtService.verify(token);

        // JWT token - attach user to request
        const user = await (this.prisma as any).userAccount.findUnique({
          where: { id: payload.sub },
        });

        if (!user || user.status !== 'ACTIVE') {
          throw new UnauthorizedException('User not found or inactive');
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.email.split('@')[0],
          role: user.role,
          clientKey: payload.clientKey,
          accountId: payload.accountId,
        };

        return true;
      } catch (jwtError) {
        // Not a valid JWT, try as API key
        if (this.validateApiKey(token)) {
          return true;
        }
      }
    }

    // Try API key authentication
    if (apiKeyHeader && this.validateApiKey(apiKeyHeader)) {
      return true;
    }

    // If we have a client key but no auth, fail
    if (clientKey && !auth && !apiKeyHeader) {
      throw new UnauthorizedException('Authentication required');
    }

    throw new UnauthorizedException('Invalid authentication');
  }

  private validateApiKey(provided: string): boolean {
    const normalizedProvided = normalize(provided);
    const expected = normalize(process.env.API_KEY ?? '');

    if (!expected) {
      return false;
    }

    if (!normalizedProvided) {
      return false;
    }

    const a = Buffer.from(normalizedProvided);
    const b = Buffer.from(expected);

    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  }
}
