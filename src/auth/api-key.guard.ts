import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const headerApiKey =
      (req.headers['x-api-key'] as string | undefined) ??
      (req.headers['x_api_key'] as string | undefined);

    const auth =
      (req.headers['authorization'] as string | undefined) ?? undefined;
    const bearer = auth?.toLowerCase().startsWith('bearer ')
      ? auth.slice(7)
      : undefined;

    const provided = normalize(headerApiKey ?? bearer ?? '');
    const expected = normalize(process.env.API_KEY ?? '');

    if (!expected) throw new UnauthorizedException('API key not configured');
    if (!provided) throw new UnauthorizedException('Invalid API key');

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length)
      throw new UnauthorizedException('Invalid API key');
    if (!timingSafeEqual(a, b))
      throw new UnauthorizedException('Invalid API key');

    return true;
  }
}
