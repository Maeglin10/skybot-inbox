import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopifyService {
  constructor(private prisma: PrismaService) {}

  async getProducts(tenantId: string) {
    return { message: 'Shopify products - API integration needed', tenantId };
  }

  async getAbandonedCarts(tenantId: string) {
    return { message: 'Shopify abandoned carts - API integration needed', tenantId };
  }
}
