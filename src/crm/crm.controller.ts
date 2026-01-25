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
  Request,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('crm')
@UseGuards(CombinedAuthGuard)
export class CrmController {
  private readonly logger = new Logger(CrmController.name);

  constructor(private readonly crmService: CrmService) {}

  private getClientKey(req: any, headerClientKey?: string): string {
    return req.user?.clientKey || headerClientKey;
  }

  // ==================== LEADS ====================

  @Get('leads')
  async listLeads(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Query() query: ListLeadsDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`GET /crm/leads clientKey=${clientKey}`);
    return this.crmService.findAllLeads(clientKey, query.status);
  }

  @Get('leads/:id')
  async getLead(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`GET /crm/leads/${id} clientKey=${clientKey}`);
    return this.crmService.findOneLead(clientKey, id);
  }

  @Post('leads')
  async createLead(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Body() dto: CreateLeadDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`POST /crm/leads clientKey=${clientKey}`);
    return this.crmService.createLead(clientKey, dto);
  }

  @Patch('leads/:id')
  async updateLead(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`PATCH /crm/leads/${id} clientKey=${clientKey}`);
    return this.crmService.updateLead(clientKey, id, dto);
  }

  @Delete('leads/:id')
  async deleteLead(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`DELETE /crm/leads/${id} clientKey=${clientKey}`);
    return this.crmService.deleteLead(clientKey, id);
  }

  // ==================== FEEDBACKS ====================

  @Get('feedbacks')
  async listFeedbacks(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`GET /crm/feedbacks clientKey=${clientKey}`);
    return this.crmService.findAllFeedbacks(clientKey);
  }

  @Get('feedbacks/:id')
  async getFeedback(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`GET /crm/feedbacks/${id} clientKey=${clientKey}`);
    return this.crmService.findOneFeedback(clientKey, id);
  }

  @Post('feedbacks')
  async createFeedback(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`POST /crm/feedbacks clientKey=${clientKey}`);
    return this.crmService.createFeedback(clientKey, dto);
  }

  @Patch('feedbacks/:id')
  async updateFeedback(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`PATCH /crm/feedbacks/${id} clientKey=${clientKey}`);
    return this.crmService.updateFeedback(clientKey, id, dto);
  }

  @Delete('feedbacks/:id')
  async deleteFeedback(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`DELETE /crm/feedbacks/${id} clientKey=${clientKey}`);
    return this.crmService.deleteFeedback(clientKey, id);
  }
}
