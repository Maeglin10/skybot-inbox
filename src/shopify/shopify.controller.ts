import { Controller, Get } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Get('products')
  async getProducts(@CurrentUser() user: any) {
    return this.shopifyService.getProducts(user.accountId);
  }

  @Get('abandoned-carts')
  async getAbandonedCarts(@CurrentUser() user: any) {
    return this.shopifyService.getAbandonedCarts(user.accountId);
  }
}
