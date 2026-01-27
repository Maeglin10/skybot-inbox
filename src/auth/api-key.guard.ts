import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys/api-keys.service';
import { timingSafeEqual } from 'crypto';

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
 * API Key Guard - Phase 5 Enhanced
 *
 * Supports two authentication methods:
 * 1. Database-backed API keys (Phase 5) - sk_accountId_randomHex
 * 2. Legacy environment variable API key (backward compatibility)
 *
 * Headers supported:
 * - x-api-key: {apiKey}
 * - Authorization: Bearer {apiKey}
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(ApiKeysService)
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Extract API key from headers
    const headerApiKey =
      (req.headers['x-api-key'] as string | undefined) ??
      (req.headers['x_api_key'] as string | undefined);

    const auth =
      (req.headers['authorization'] as string | undefined) ?? undefined;
    const bearer = auth?.toLowerCase().startsWith('bearer ')
      ? auth.slice(7)
      : undefined;

    const provided = normalize(headerApiKey ?? bearer ?? '');

    if (!provided) {
      throw new UnauthorizedException('API key required');
    }

    // Phase 5: Check database-backed API keys first (new format: sk_*)
    if (provided.startsWith('sk_')) {
      const result = await this.apiKeysService.validateApiKey(provided);

      if (!result) {
        throw new UnauthorizedException('Invalid or expired API key');
      }

      // Attach account information to request for use in controllers
      req.accountId = result.accountId;
      req.account = result.account;
      req.apiKeyId = result.keyId;

      return true;
    }

    // Legacy: Fall back to environment variable check for backward compatibility
    const expected = normalize(process.env.API_KEY ?? '');

    if (!expected) {
      throw new UnauthorizedException('API key not configured');
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (!timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Legacy API key authenticated - no account attached
    return true;
  }
}
