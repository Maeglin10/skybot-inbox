import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific user roles
 * @param roles - Array of UserRole enums
 * @example
 * @Roles(UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN)
 * @Get('admin-only')
 * async adminEndpoint() {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
