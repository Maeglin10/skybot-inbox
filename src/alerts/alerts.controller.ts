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
import { AlertsService } from './alerts.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { ListAlertsDto } from './dto/list-alerts.dto';
import { AssignAlertDto } from './dto/assign-alert.dto';

@Controller('alerts')
@UseGuards(ApiKeyGuard)
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async list(
    @Headers('x-client-key') clientKey: string,
    @Query() query: ListAlertsDto,
  ) {
    this.logger.log(`GET /alerts clientKey=${clientKey}`);
    return this.alertsService.findAll(clientKey, query.status, query.type);
  }

  @Get(':id')
  async getOne(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`GET /alerts/${id} clientKey=${clientKey}`);
    return this.alertsService.findOne(clientKey, id);
  }

  @Post()
  async create(
    @Headers('x-client-key') clientKey: string,
    @Body() dto: CreateAlertDto,
  ) {
    this.logger.log(`POST /alerts clientKey=${clientKey}`);
    return this.alertsService.create(clientKey, dto);
  }

  @Patch(':id')
  async update(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    this.logger.log(`PATCH /alerts/${id} clientKey=${clientKey}`);
    return this.alertsService.update(clientKey, id, dto);
  }

  @Delete(':id')
  async delete(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`DELETE /alerts/${id} clientKey=${clientKey}`);
    return this.alertsService.delete(clientKey, id);
  }

  @Post(':id/resolve')
  async resolve(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`POST /alerts/${id}/resolve clientKey=${clientKey}`);
    return this.alertsService.resolve(clientKey, id);
  }

  @Post(':id/assign')
  async assign(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
    @Body() dto: AssignAlertDto,
  ) {
    this.logger.log(`POST /alerts/${id}/assign clientKey=${clientKey}`);
    return this.alertsService.assign(clientKey, id, dto);
  }
}
