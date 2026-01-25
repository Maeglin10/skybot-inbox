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
import { AlertsService } from './alerts.service';
import { CombinedAuthGuard } from '../auth/combined-auth.guard';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { ListAlertsDto } from './dto/list-alerts.dto';
import { AssignAlertDto } from './dto/assign-alert.dto';

@Controller('alerts')
@UseGuards(CombinedAuthGuard)
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(private readonly alertsService: AlertsService) {}

  private getClientKey(req: any, headerClientKey?: string): string {
    return req.user?.clientKey || headerClientKey;
  }

  @Get()
  async list(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Query() query: ListAlertsDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`GET /alerts clientKey=${clientKey}`);
    return this.alertsService.findAll(clientKey, query.status, query.type);
  }

  @Get(':id')
  async getOne(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`GET /alerts/${id} clientKey=${clientKey}`);
    return this.alertsService.findOne(clientKey, id);
  }

  @Post()
  async create(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Body() dto: CreateAlertDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`POST /alerts clientKey=${clientKey}`);
    return this.alertsService.create(clientKey, dto);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`PATCH /alerts/${id} clientKey=${clientKey}`);
    return this.alertsService.update(clientKey, id, dto);
  }

  @Delete(':id')
  async delete(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`DELETE /alerts/${id} clientKey=${clientKey}`);
    return this.alertsService.delete(clientKey, id);
  }

  @Post(':id/resolve')
  async resolve(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`POST /alerts/${id}/resolve clientKey=${clientKey}`);
    return this.alertsService.resolve(clientKey, id);
  }

  @Post(':id/assign')
  async assign(
    @Request() req: any,
    @Headers('x-client-key') headerClientKey: string,
    @Param('id') id: string,
    @Body() dto: AssignAlertDto,
  ) {
    const clientKey = this.getClientKey(req, headerClientKey);
    this.logger.log(`POST /alerts/${id}/assign clientKey=${clientKey}`);
    return this.alertsService.assign(clientKey, id, dto);
  }
}
