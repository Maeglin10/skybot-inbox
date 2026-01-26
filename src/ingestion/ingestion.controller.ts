import { Controller, Get, Post, Body } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get('jobs')
  async listJobs(@CurrentUser() user: any) {
    return this.ingestionService.listJobs(user.accountId);
  }

  @Post('jobs')
  async createJob(@CurrentUser() user: any, @Body() dto: any) {
    return this.ingestionService.createJob(user.accountId, dto.type, dto.source);
  }
}
