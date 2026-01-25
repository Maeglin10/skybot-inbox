import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('crm')
@Public()
@UseGuards(ApiKeyGuard)
export class CrmController {
  private readonly logger = new Logger(CrmController.name);

  constructor(private readonly crmService: CrmService) {}

  // ==================== LEADS ====================

  @Get('leads')
  async listLeads(
    @Headers('x-client-key') clientKey: string,
    @Query() query: ListLeadsDto,
  ) {
    this.logger.log(`GET /crm/leads clientKey=${clientKey}`);
    return this.crmService.findAllLeads(clientKey, query.status);
  }

  @Get('leads/:id')
  async getLead(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`GET /crm/leads/${id} clientKey=${clientKey}`);
    return this.crmService.findOneLead(clientKey, id);
  }

  @Post('leads')
  async createLead(
    @Headers('x-client-key') clientKey: string,
    @Body() dto: CreateLeadDto,
  ) {
    this.logger.log(`POST /crm/leads clientKey=${clientKey}`);
    return this.crmService.createLead(clientKey, dto);
  }

  @Patch('leads/:id')
  async updateLead(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    this.logger.log(`PATCH /crm/leads/${id} clientKey=${clientKey}`);
    return this.crmService.updateLead(clientKey, id, dto);
  }

  @Delete('leads/:id')
  async deleteLead(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`DELETE /crm/leads/${id} clientKey=${clientKey}`);
    return this.crmService.deleteLead(clientKey, id);
  }

  // ==================== FEEDBACKS ====================

  @Get('feedbacks')
  async listFeedbacks(@Headers('x-client-key') clientKey: string) {
    this.logger.log(`GET /crm/feedbacks clientKey=${clientKey}`);
    return this.crmService.findAllFeedbacks(clientKey);
  }

  @Get('feedbacks/:id')
  async getFeedback(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`GET /crm/feedbacks/${id} clientKey=${clientKey}`);
    return this.crmService.findOneFeedback(clientKey, id);
  }

  @Post('feedbacks')
  async createFeedback(
    @Headers('x-client-key') clientKey: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    this.logger.log(`POST /crm/feedbacks clientKey=${clientKey}`);
    return this.crmService.createFeedback(clientKey, dto);
  }

  @Patch('feedbacks/:id')
  async updateFeedback(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    this.logger.log(`PATCH /crm/feedbacks/${id} clientKey=${clientKey}`);
    return this.crmService.updateFeedback(clientKey, id, dto);
  }

  @Delete('feedbacks/:id')
  async deleteFeedback(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`DELETE /crm/feedbacks/${id} clientKey=${clientKey}`);
    return this.crmService.deleteFeedback(clientKey, id);
  }
}
