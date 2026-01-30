import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from '../api-key.guard';

@Injectable()
export class ApiOrJwtGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    @Inject(ApiKeyGuard) private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // 1. Try JWT first
      // We need to catch potential errors from JwtGuard (e.g. invalid signature)
      // turning them into a "next" signal instead of failing request
      const jwtResult = await this.jwtGuard.canActivate(context);
      if (jwtResult) return true;
    } catch (e) {
      // JWT failed, ignore and try API Key
    }

    try {
      // 2. Try API Key
      const apiKeyResult = await this.apiKeyGuard.canActivate(context);
      if (apiKeyResult) return true;
    } catch (e) {
      // Both failed
      throw new UnauthorizedException('Unauthorized: Require JWT or valid API Key');
    }

    return false;
  }
}
