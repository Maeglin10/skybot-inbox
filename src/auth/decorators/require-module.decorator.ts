import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MODULE_KEY = 'requireModule';

/**
 * Decorator to restrict endpoint access to tenants with specific modules enabled
 * @param moduleKey - The module key to check (e.g., 'inbox', 'crm', 'analytics', 'shopify')
 * @example
 * @RequireModule('shopify')
 * @Get('products')
 * async getProducts() {}
 */
export const RequireModule = (moduleKey: string) =>
  SetMetadata(REQUIRE_MODULE_KEY, moduleKey);
