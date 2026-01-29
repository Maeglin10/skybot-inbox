import { Controller, Post, Get, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { CompetitiveAnalysisService } from './competitive-analysis.service';
import { AnalyzeCompetitorsDto } from './dto/analyze-competitors.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('competitive-analysis')
export class CompetitiveAnalysisController {
  private readonly logger = new Logger(CompetitiveAnalysisController.name);

  constructor(
    private readonly competitiveAnalysisService: CompetitiveAnalysisService,
  ) {}

  @Post()
  async analyzeCompetitors(
    @CurrentUser() user: any,
    @Body() dto: AnalyzeCompetitorsDto,
  ) {
    this.logger.log(
      `POST /competitive-analysis - accountId=${user.accountId} niche=${dto.businessNiche}`,
    );

    return this.competitiveAnalysisService.analyzeCompetitors(user.accountId, dto);
  }

  @Get()
  async listAnalyses(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(`GET /competitive-analysis - accountId=${user.accountId}`);

    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.competitiveAnalysisService.listAnalyses(
      user.accountId,
      limitNum,
      offsetNum,
    );
  }

  @Get(':id')
  async getAnalysis(@CurrentUser() user: any, @Param('id') id: string) {
    this.logger.log(
      `GET /competitive-analysis/${id} - accountId=${user.accountId}`,
    );

    return this.competitiveAnalysisService.getAnalysis(user.accountId, id);
  }

  @Delete(':id')
  async deleteAnalysis(@CurrentUser() user: any, @Param('id') id: string) {
    this.logger.log(
      `DELETE /competitive-analysis/${id} - accountId=${user.accountId}`,
    );

    return this.competitiveAnalysisService.deleteAnalysis(user.accountId, id);
  }
}
