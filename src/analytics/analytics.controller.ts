import {
  Controller,
  Get,
  Query,
  Headers,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import {
  AnalyticsQueryDto,
  BreakdownQueryDto,
  TimeRange,
  MetricGroup,
} from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(ApiKeyGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('chart')
  async getChart(
    @Headers('x-client-key') clientKey: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(
      `GET /analytics/chart clientKey=${clientKey} range=${query.range} metric=${query.metric}`,
    );
    return this.analyticsService.getMainChart(
      clientKey,
      query.range || TimeRange.THIRTY_DAYS,
      query.metric || MetricGroup.LEADS,
    );
  }

  @Get('kpis')
  async getKpis(
    @Headers('x-client-key') clientKey: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(
      `GET /analytics/kpis clientKey=${clientKey} metric=${query.metric}`,
    );
    return this.analyticsService.getKpis(
      clientKey,
      query.metric || MetricGroup.LEADS,
    );
  }

  @Get('breakdown')
  async getBreakdown(
    @Headers('x-client-key') clientKey: string,
    @Query() query: BreakdownQueryDto,
  ) {
    this.logger.log(
      `GET /analytics/breakdown clientKey=${clientKey} type=${query.type}`,
    );
    return this.analyticsService.getBreakdown(clientKey, query.type);
  }
}
