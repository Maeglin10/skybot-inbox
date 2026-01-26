import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async listItems(@CurrentUser() user: any) {
    return this.knowledgeService.listItems(user.accountId);
  }

  @Get('search')
  async searchItems(@CurrentUser() user: any, @Query('q') query: string) {
    return this.knowledgeService.searchItems(user.accountId, query);
  }

  @Post()
  async createItem(@CurrentUser() user: any, @Body() dto: any) {
    return this.knowledgeService.createItem(user.accountId, dto);
  }
}
