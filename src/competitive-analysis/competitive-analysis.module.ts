import { Module } from '@nestjs/common';
import { CompetitiveAnalysisController } from './competitive-analysis.controller';
import { CompetitiveAnalysisService } from './competitive-analysis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompetitiveAnalysisController],
  providers: [CompetitiveAnalysisService],
  exports: [CompetitiveAnalysisService],
})
export class CompetitiveAnalysisModule {}
