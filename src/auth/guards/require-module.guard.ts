import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard to enforce module-based access control
 * Checks if tenant has the required module enabled
 */
@Injectable()
export class RequireModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no module specified, allow access
    if (!requiredModule) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.accountId) {
      throw new ForbiddenException(
        'User not authenticated or account not found',
      );
    }

    // Check if tenant has the required module enabled
    const module = await this.prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId: user.accountId,
          moduleKey: requiredModule,
        },
      },
    });

    if (!module || !module.enabled) {
      throw new ForbiddenException(
        `Access denied. Your account does not have access to the '${requiredModule}' module.`,
      );
    }

    return true;
  }
}
